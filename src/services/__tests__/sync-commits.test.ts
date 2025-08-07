/**
 * コミット同期サービスのテスト
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { commitsRepository, syncLogsRepository } from "@/database/repositories";
import { gitLabApiClient } from "@/lib/gitlab_client";
import {
	type buildGitLabCommit,
	buildGitLabCommits,
	createProject,
	createSyncLog,
} from "@/lib/testing/factories";
import { withTransaction } from "@/lib/testing/transaction";
import { SyncCommitsService } from "../sync-commits";

/**
 * コミット配列からページネーションされたジェネレータを作成するヘルパー関数
 */
function createMockCommitGenerator(
	commits: ReturnType<typeof buildGitLabCommit>[],
) {
	return async function* () {
		for (const commit of commits) {
			yield [commit];
		}
	};
}

// GitLab APIクライアントのみモック
vi.mock("@/lib/gitlab_client", () => ({
	gitLabApiClient: {
		getCommits: vi.fn(),
	},
}));

const mockGitlabClient = vi.mocked(gitLabApiClient);

describe("SyncCommitsService", () => {
	let service: SyncCommitsService;

	beforeEach(() => {
		vi.clearAllMocks();
		service = new SyncCommitsService();
	});

	describe("syncCommits", () => {
		it("プロジェクトが存在しない場合は何もしない", async () => {
			await withTransaction(async () => {
				// プロジェクトが存在しない状態でテスト実行
				await expect(service.syncCommits()).resolves.not.toThrow();
			});
		});

		it("前回の実行ログがない場合、GitLab上のすべてのコミットを取得し記録する", async () => {
			await withTransaction(async () => {
				// 実物のデータベースにテストプロジェクトを作成
				const project = await createProject();

				// GitLab APIからのレスポンスをモック（2ページ分のコミット）
				const commits = buildGitLabCommits(2);

				const mockGenerator = createMockCommitGenerator(commits);
				mockGitlabClient.getCommits.mockReturnValue(mockGenerator());

				await service.syncCommits();

				// sinceパラメータなしで呼ばれることを確認（全件取得）
				expect(mockGitlabClient.getCommits).toHaveBeenCalledWith(
					String(project.gitlab_id),
					expect.objectContaining({
						ref_name: "main",
						with_stats: true,
						per_page: 100,
						// sinceは未指定
					}),
				);

				// データベースにコミットが記録されていることを確認
				const savedCommits = await commitsRepository.findByProject(project.id);
				expect(savedCommits.length).toBe(2);

				// 同期ログが記録されていることを確認
				const syncLogs = await syncLogsRepository.find({
					project_id: project.id,
					sync_type: "commits",
				});
				expect(syncLogs.length).toBe(1);
				expect(syncLogs[0].last_item_date).toEqual(
					new Date(commits[commits.length - 1].authored_date),
				);
			});
		});

		it("前回の実行ログがある場合、コミットの差分同期をする", async () => {
			await withTransaction(async () => {
				// 実物のデータベースにテストデータを作成
				const project = await createProject();

				// 前回の同期ログを作成（ファクトリが生成する日付より過去に設定）
				const syncDate = new Date("2024-12-31T23:59:59Z");
				await createSyncLog({
					project_id: project.id,
					sync_type: "commits",
					last_item_date: syncDate,
				});

				// 差分コミットを作成
				const commits = buildGitLabCommits(1);

				const mockGenerator = createMockCommitGenerator(commits);
				mockGitlabClient.getCommits.mockReturnValue(mockGenerator());

				await service.syncCommits();

				// sinceパラメータ付きで呼ばれることを確認（差分取得）
				expect(mockGitlabClient.getCommits).toHaveBeenCalledWith(
					String(project.gitlab_id),
					expect.objectContaining({
						ref_name: "main",
						since: syncDate.toISOString(),
						with_stats: true,
						per_page: 100,
					}),
				);

				// データベースにコミットが記録されていることを確認
				const savedCommits = await commitsRepository.findByProject(project.id);
				expect(savedCommits.length).toBe(1);

				// 同期ログが記録されていることを確認
				const syncLogs = await syncLogsRepository.find({
					project_id: project.id,
					sync_type: "commits",
				});
				expect(syncLogs.length).toBe(2); // 既存1件 + 新規1件
				// 最新のsync_logのlast_item_dateを確認
				const latestSyncLog = syncLogs.sort((a, b) => b.id - a.id)[0];
				expect(latestSyncLog.last_item_date).toEqual(
					new Date(commits[commits.length - 1].authored_date),
				);
			});
		});

		it("ページネーションが発生する場合、複数ページのコミットを順次取得する", async () => {
			await withTransaction(async () => {
				// 実物のデータベースにテストプロジェクトを作成
				const project = await createProject();

				// 複数ページ分のコミットデータを作成（5ページ分）
				const commits = buildGitLabCommits(5);

				const mockGenerator = createMockCommitGenerator(commits);
				mockGitlabClient.getCommits.mockReturnValue(mockGenerator());

				await service.syncCommits();

				// GitLab APIが呼ばれたことを確認
				expect(mockGitlabClient.getCommits).toHaveBeenCalledWith(
					String(project.gitlab_id),
					expect.objectContaining({
						ref_name: "main",
						with_stats: true,
						per_page: 100,
					}),
				);

				// データベースにすべてのコミットが記録されていることを確認
				const savedCommits = await commitsRepository.findByProject(project.id);
				expect(savedCommits.length).toBe(5);

				// 同期ログが記録されていることを確認
				const syncLogs = await syncLogsRepository.find({
					project_id: project.id,
					sync_type: "commits",
				});
				expect(syncLogs.length).toBe(1);
				expect(syncLogs[0].last_item_date).toEqual(
					new Date(commits[commits.length - 1].authored_date),
				);
			});
		});

		it("BATCH_SIZE分のページを処理後にSyncLogが記録される", async () => {
			await withTransaction(async () => {
				// 実物のデータベースにテストプロジェクトを作成
				const project = await createProject();

				// BATCH_SIZE（10）+ 1分のコミットデータを作成
				const commits = buildGitLabCommits(11);

				// 1回目：10コミット（BATCH_SIZE分）
				const firstBatch = createMockCommitGenerator(commits.slice(0, 10));
				mockGitlabClient.getCommits.mockReturnValueOnce(firstBatch());

				// 2回目：残り1コミット
				const secondBatch = createMockCommitGenerator(commits.slice(10));
				mockGitlabClient.getCommits.mockReturnValueOnce(secondBatch());

				await service.syncCommits();

				// GitLab APIが呼ばれたことを確認
				expect(mockGitlabClient.getCommits).toHaveBeenCalledWith(
					String(project.gitlab_id),
					expect.objectContaining({
						ref_name: "main",
						with_stats: true,
						per_page: 100,
					}),
				);

				// データベースにコミットが記録されていることを確認
				const savedCommits = await commitsRepository.findByProject(project.id);
				expect(savedCommits.length).toBe(11);

				// 11ページ分を処理した後、SyncLogが途中保存されることを確認
				const projectSyncLogs = await syncLogsRepository.find({
					project_id: project.id,
					sync_type: "commits",
				});

				// BATCH_SIZE（10）到達時の途中保存 + 最終保存で2件のSyncLogがあることを確認
				expect(projectSyncLogs.length).toBe(2);
				// 最新のSyncLogが最後のコミットの日付になっていることを確認
				const latestSyncLog = projectSyncLogs.sort((a, b) => b.id - a.id)[0];
				expect(latestSyncLog.last_item_date).toEqual(
					new Date(commits[commits.length - 1].authored_date),
				);
			});
		});

		it("エラーが発生したプロジェクトはスキップされる", async () => {
			await withTransaction(async () => {
				// 実物のデータベースにテストプロジェクトを作成
				await createProject();

				// GitLab APIでエラーが発生するように設定
				mockGitlabClient.getCommits.mockImplementation(() => {
					throw new Error("GitLab API Error");
				});

				// エラーが発生しても全体の処理は継続される
				await expect(service.syncCommits()).resolves.not.toThrow();
			});
		});
	});
});

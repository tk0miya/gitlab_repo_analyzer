/**
 * コミット同期サービス
 * GitLabプロジェクトのコミット情報を取得してデータベースに保存
 */

import { setTimeout } from "node:timers/promises";
import { transaction } from "@/database/connection";
import type { Project } from "@/database/index";
import {
	commitsRepository,
	projectsRepository,
	syncLogsRepository,
} from "@/database/repositories";
import type { NewCommit } from "@/database/schema/commits";
import { SYNC_TYPES } from "@/database/schema/sync-logs";
import { gitLabApiClient } from "@/lib/gitlab_client";
import type { GitLabCommit } from "@/lib/gitlab_client/types/commit";

/**
 * バッチサイズ定数
 * 中間保存の間隔（API呼び出し回数）
 */
const BATCH_SIZE = 10;

/**
 * コミット同期サービス
 */
export class SyncCommitsService {
	/**
	 * 全プロジェクトのコミット同期を実行
	 */
	async syncCommits(): Promise<void> {
		// プロジェクト一覧を取得
		const projects = await projectsRepository.findAll();

		// 各プロジェクトのコミット同期を実行
		for (const project of projects) {
			try {
				await this.syncProjectCommits(project);
			} catch (error) {
				// エラーはログに記録して継続
				const errorMessage = String(error);
				console.error(
					`プロジェクト "${project.name}" でエラー: ${errorMessage}`,
				);
			}
		}
	}

	/**
	 * 単一プロジェクトのコミット同期
	 * トランザクションごとにcommitsGeneratorを作り直し、バッチサイズ分処理してSyncLogを記録
	 */
	private async syncProjectCommits(project: Project): Promise<void> {
		// 最新の同期ログを取得（差分同期の基準日時を決定）
		const latestSyncLog = await syncLogsRepository.findLatest(
			project.id,
			SYNC_TYPES.COMMITS,
		);
		let sinceDate = latestSyncLog?.last_item_date;

		let hasMoreData = true;
		while (hasMoreData) {
			await transaction(async () => {
				const result = await this.processBatchInTransaction(project, sinceDate);
				hasMoreData = result.hasMoreData;
				sinceDate = result.sinceDate;
			});
		}
	}

	/**
	 * バッチ処理を実行（トランザクション内で呼び出される）
	 * @param project プロジェクト情報
	 * @param sinceDate 差分同期の基準日時
	 * @returns 継続処理が必要かどうかと次回の基準日時
	 */
	private async processBatchInTransaction(
		project: Project,
		sinceDate?: Date,
	): Promise<{ hasMoreData: boolean; sinceDate?: Date }> {
		// GitLab APIでコミット一覧を取得（新しいジェネレータを作成）
		const commitsGenerator = gitLabApiClient.getCommits(
			project.gitlab_id.toString(),
			{
				ref_name: project.default_branch,
				since: sinceDate?.toISOString(),
				with_stats: true,
				per_page: 100,
			},
		);

		let processedPages = 0;
		let lastItemDate = new Date(0); // 1970-01-01

		// BATCH_SIZE分のページを処理
		for await (const gitlabCommits of commitsGenerator) {
			processedPages++;

			// 1ページ分のコミットを保存
			const commits = await this.saveCommits(project.id, gitlabCommits);

			// 最新のコミット日時を更新
			lastItemDate = commits.reduce(
				(latest, commit) =>
					commit.author_date > latest ? commit.author_date : latest,
				lastItemDate,
			);

			// レート制限を避けるため少し待機（GitLab API呼び出し間隔調整）
			await setTimeout(200);

			// BATCH_SIZE分処理したら中断
			if (processedPages >= BATCH_SIZE) {
				break;
			}
		}

		// データがある場合はSyncLogを記録し、継続処理を示す
		if (processedPages > 0) {
			await syncLogsRepository.create({
				project_id: project.id,
				sync_type: SYNC_TYPES.COMMITS,
				last_item_date: lastItemDate,
			});
			return { hasMoreData: true, sinceDate: lastItemDate }; // 継続処理
		}

		return { hasMoreData: false, sinceDate }; // 処理完了
	}

	/**
	 * GitLabコミット配列をデータベースに保存
	 */
	private async saveCommits(
		projectId: number,
		gitlabCommits: GitLabCommit[],
	): Promise<NewCommit[]> {
		if (gitlabCommits.length === 0) return [];

		try {
			// GitLabコミットをDBスキーマに変換
			const commits = gitlabCommits.map((gitlabCommit) =>
				this.convertGitLabCommitToDbCommit(projectId, gitlabCommit),
			);

			// 存在チェック
			const shas = commits.map((c) => c.sha).filter(Boolean) as string[];
			const existingCommits = await commitsRepository.findAllBySha(shas);
			const existingShaSet = new Set(existingCommits.map((c) => c.sha));

			// 存在しないコミットのみをフィルタリング
			const newCommits = commits.filter(
				(c) => c.sha && !existingShaSet.has(c.sha),
			);

			if (newCommits.length > 0) {
				await commitsRepository.bulkInsert(newCommits);
			}

			// 保存されたコミット（新規 + 既存）を返す
			return commits;
		} catch (error) {
			console.error("コミット保存中にエラーが発生:", error);
			throw error;
		}
	}

	/**
	 * GitLabコミットをデータベーススキーマに変換
	 */
	private convertGitLabCommitToDbCommit(
		projectId: number,
		gitlabCommit: GitLabCommit,
	): NewCommit {
		return {
			project_id: projectId,
			sha: gitlabCommit.id,
			message: gitlabCommit.message,
			author_name: gitlabCommit.author_name,
			author_email: gitlabCommit.author_email,
			author_date: new Date(gitlabCommit.authored_date),
			additions: gitlabCommit.stats?.additions ?? null,
			deletions: gitlabCommit.stats?.deletions ?? null,
		};
	}
}

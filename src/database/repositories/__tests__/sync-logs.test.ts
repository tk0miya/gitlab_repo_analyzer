import { afterAll, describe, expect, it } from "vitest";
import { closeConnection } from "@/database/connection";
import { syncLogsRepository } from "@/database/repositories";
import {
	SYNC_STATUSES,
	SYNC_TYPES,
	type SyncLog,
} from "@/database/schema/sync-logs";
import {
	buildNewSyncLog,
	createProject,
	createSyncLog,
	createSyncLogs,
} from "@/database/testing/factories/index";
import { withTransaction } from "@/database/testing/transaction";

describe("Sync Logs Repository", () => {
	afterAll(async () => {
		await closeConnection();
	});

	// ==================== CREATE操作 ====================

	describe("create", () => {
		it("should create a new sync log", async () => {
			await withTransaction(async () => {
				// テスト用プロジェクトを作成
				const project = await createProject();

				const syncLogData = buildNewSyncLog({
					project_id: project.id,
					sync_type: SYNC_TYPES.PROJECTS,
					status: SYNC_STATUSES.RUNNING,
					started_at: new Date(),
				});

				const syncLog = await syncLogsRepository.create(syncLogData);

				expect(syncLog).toBeDefined();
				expect(syncLog.id).toBeDefined();
				expect(syncLog.project_id).toBe(project.id);
				expect(syncLog.sync_type).toBe(SYNC_TYPES.PROJECTS);
				expect(syncLog.status).toBe(SYNC_STATUSES.RUNNING);
				expect(syncLog.started_at).toBeDefined();
				expect(syncLog.completed_at).toBeNull();
				expect(syncLog.records_processed).toBeNull();
				expect(syncLog.records_added).toBeNull();
				expect(syncLog.error_message).toBeNull();
				expect(syncLog.created_at).toBeDefined();
			});
		});

		it("should create sync log for commits type", async () => {
			await withTransaction(async () => {
				// テスト用プロジェクトを作成
				const project = await createProject();

				const syncLogData = buildNewSyncLog({
					project_id: project.id,
					sync_type: SYNC_TYPES.COMMITS,
					status: SYNC_STATUSES.RUNNING,
					started_at: new Date(),
				});

				const syncLog = await syncLogsRepository.create(syncLogData);

				expect(syncLog.sync_type).toBe(SYNC_TYPES.COMMITS);
				expect(syncLog.status).toBe(SYNC_STATUSES.RUNNING);
			});
		});

		it("should throw error when project does not exist", async () => {
			await withTransaction(async () => {
				const syncLogData = buildNewSyncLog({
					project_id: 999999, // 存在しないプロジェクトID
					status: SYNC_STATUSES.RUNNING,
					started_at: new Date(),
				});

				await expect(syncLogsRepository.create(syncLogData)).rejects.toThrow();
			});
		});
	});

	// ==================== READ操作 ====================

	describe("findById", () => {
		it("should find sync log by ID", async () => {
			await withTransaction(async () => {
				// テスト用プロジェクトと同期ログを作成
				const project = await createProject();
				const syncLog = await createSyncLog({ project_id: project.id });

				const found = await syncLogsRepository.findById(syncLog.id);

				expect(found).toBeDefined();
				expect(found?.id).toBe(syncLog.id);
				expect(found?.project_id).toBe(syncLog.project_id);
				expect(found?.sync_type).toBe(syncLog.sync_type);
			});
		});

		it("should return null for non-existent ID", async () => {
			await withTransaction(async () => {
				const found = await syncLogsRepository.findById(999999);
				expect(found).toBeNull();
			});
		});
	});

	describe("find", () => {
		it("should return all sync logs when no filters are provided", async () => {
			await withTransaction(async () => {
				// テスト用プロジェクトを作成
				const project = await createProject();

				// 複数の同期ログを作成
				await createSyncLogs(3, {
					project_id: project.id,
					status: SYNC_STATUSES.RUNNING,
					started_at: new Date(),
				});

				const logs = await syncLogsRepository.find();

				expect(Array.isArray(logs)).toBe(true);
				expect(logs.length).toBeGreaterThanOrEqual(3);

				// started_at降順でソートされているかチェック
				for (let i = 1; i < logs.length; i++) {
					expect(logs[i].started_at <= logs[i - 1].started_at).toBe(true);
				}
			});
		});

		it("should filter by project_id", async () => {
			await withTransaction(async () => {
				// 2つのテスト用プロジェクトを作成
				const project1 = await createProject();
				const project2 = await createProject();

				// 各プロジェクトで同期ログを作成
				const syncLogData1 = buildNewSyncLog({
					project_id: project1.id,
					status: SYNC_STATUSES.RUNNING,
					started_at: new Date(),
				});
				const syncLogData2 = buildNewSyncLog({
					project_id: project2.id,
					status: SYNC_STATUSES.RUNNING,
					started_at: new Date(),
				});
				await syncLogsRepository.create(syncLogData1);
				await syncLogsRepository.create(syncLogData2);

				const logs = await syncLogsRepository.find({
					project_id: project1.id,
				});

				expect(logs.length).toBeGreaterThanOrEqual(1);
				for (const log of logs) {
					expect(log.project_id).toBe(project1.id);
				}
			});
		});

		it("should filter by sync_type", async () => {
			await withTransaction(async () => {
				// テスト用プロジェクトを作成
				const project = await createProject();

				// 異なるタイプの同期ログを作成
				const projectsData = buildNewSyncLog({
					project_id: project.id,
					sync_type: SYNC_TYPES.PROJECTS,
					status: SYNC_STATUSES.RUNNING,
					started_at: new Date(),
				});
				const commitsData = buildNewSyncLog({
					project_id: project.id,
					sync_type: SYNC_TYPES.COMMITS,
					status: SYNC_STATUSES.RUNNING,
					started_at: new Date(),
				});
				await syncLogsRepository.create(projectsData);
				await syncLogsRepository.create(commitsData);

				const projectsLogs = await syncLogsRepository.find({
					sync_type: SYNC_TYPES.PROJECTS,
				});
				const commitsLogs = await syncLogsRepository.find({
					sync_type: SYNC_TYPES.COMMITS,
				});

				expect(projectsLogs.length).toBeGreaterThanOrEqual(1);
				expect(commitsLogs.length).toBeGreaterThanOrEqual(1);

				for (const log of projectsLogs) {
					expect(log.sync_type).toBe(SYNC_TYPES.PROJECTS);
				}
				for (const log of commitsLogs) {
					expect(log.sync_type).toBe(SYNC_TYPES.COMMITS);
				}
			});
		});

		it("should filter by status", async () => {
			await withTransaction(async () => {
				// テスト用プロジェクトを作成
				const project = await createProject();

				// 同期ログを作成して完了させる
				const syncLogData = buildNewSyncLog({
					project_id: project.id,
					status: SYNC_STATUSES.RUNNING,
					started_at: new Date(),
				});
				const started = await syncLogsRepository.create(syncLogData);
				const completeParams = {
					records_processed: 100,
					records_added: 50,
				};
				await syncLogsRepository.completeSync(started.id, completeParams);

				const completedLogs = await syncLogsRepository.find({
					status: SYNC_STATUSES.COMPLETED,
				});

				expect(completedLogs.length).toBeGreaterThanOrEqual(1);
				for (const log of completedLogs) {
					expect(log.status).toBe(SYNC_STATUSES.COMPLETED);
				}
			});
		});

		it("should respect limit and offset parameters", async () => {
			await withTransaction(async () => {
				// テスト用プロジェクトを作成
				const project = await createProject();

				// 複数の同期ログを作成
				await createSyncLogs(5, {
					project_id: project.id,
					status: SYNC_STATUSES.RUNNING,
					started_at: new Date(),
				});

				const firstPage = await syncLogsRepository.find({
					project_id: project.id,
					limit: 2,
					offset: 0,
				});
				const secondPage = await syncLogsRepository.find({
					project_id: project.id,
					limit: 2,
					offset: 2,
				});

				expect(firstPage.length).toBeLessThanOrEqual(2);
				expect(secondPage.length).toBeLessThanOrEqual(2);

				// 異なるページであることを確認
				if (firstPage.length > 0 && secondPage.length > 0) {
					expect(firstPage[0].id).not.toBe(secondPage[0].id);
				}
			});
		});
	});

	describe("findByProject", () => {
		it("should return sync logs for a specific project", async () => {
			await withTransaction(async () => {
				// テスト用プロジェクトを作成
				const project = await createProject();

				// 同期ログを作成
				const syncLogData = buildNewSyncLog({
					project_id: project.id,
					status: SYNC_STATUSES.RUNNING,
					started_at: new Date(),
				});
				await syncLogsRepository.create(syncLogData);

				const logs = await syncLogsRepository.findByProject(project.id);

				expect(Array.isArray(logs)).toBe(true);
				expect(logs.length).toBeGreaterThanOrEqual(1);
				for (const log of logs) {
					expect(log.project_id).toBe(project.id);
				}
			});
		});

		it("should respect limit and offset parameters", async () => {
			await withTransaction(async () => {
				// テスト用プロジェクトを作成
				const project = await createProject();

				// 複数の同期ログを作成
				await createSyncLogs(5, {
					project_id: project.id,
					status: SYNC_STATUSES.RUNNING,
					started_at: new Date(),
				});

				const limitedLogs = await syncLogsRepository.findByProject(
					project.id,
					2,
					0,
				);

				expect(limitedLogs.length).toBeLessThanOrEqual(2);
			});
		});
	});

	describe("findLatest", () => {
		it("should return the most recent sync log for a project", async () => {
			await withTransaction(async () => {
				// テスト用プロジェクトを作成
				const project = await createProject();

				// 複数の同期ログを作成（時間をずらして）
				let lastStarted: SyncLog | undefined;
				for (let i = 0; i < 3; i++) {
					const syncLogData = buildNewSyncLog({
						project_id: project.id,
						status: SYNC_STATUSES.RUNNING,
						started_at: new Date(),
					});
					lastStarted = await syncLogsRepository.create(syncLogData);
					// 少し待って次のログの開始時間をずらす
					await new Promise((resolve) => setTimeout(resolve, 10));
				}

				const latest = await syncLogsRepository.findLatest(project.id);

				expect(latest).toBeDefined();
				expect(latest?.project_id).toBe(project.id);
				expect(latest?.id).toBe(lastStarted?.id);
			});
		});

		it("should filter by sync_type when provided", async () => {
			await withTransaction(async () => {
				// テスト用プロジェクトを作成
				const project = await createProject();

				// 異なるタイプの同期ログを作成
				const projectsParams = buildNewSyncLog({
					project_id: project.id,
					sync_type: SYNC_TYPES.PROJECTS,
					status: SYNC_STATUSES.RUNNING,
					started_at: new Date(),
				});
				const commitsParams = buildNewSyncLog({
					project_id: project.id,
					sync_type: SYNC_TYPES.COMMITS,
					status: SYNC_STATUSES.RUNNING,
					started_at: new Date(),
				});
				await syncLogsRepository.create(projectsParams);
				await new Promise((resolve) => setTimeout(resolve, 10)); // 時間をずらす
				await syncLogsRepository.create(commitsParams);

				const latestProjects = await syncLogsRepository.findLatest(
					project.id,
					SYNC_TYPES.PROJECTS,
				);
				const latestCommits = await syncLogsRepository.findLatest(
					project.id,
					SYNC_TYPES.COMMITS,
				);

				expect(latestProjects?.sync_type).toBe(SYNC_TYPES.PROJECTS);
				expect(latestCommits?.sync_type).toBe(SYNC_TYPES.COMMITS);
			});
		});

		it("should return null when no sync logs exist", async () => {
			await withTransaction(async () => {
				// テスト用プロジェクトを作成（同期ログは作成しない）
				const project = await createProject();

				const latest = await syncLogsRepository.findLatest(project.id);

				expect(latest).toBeNull();
			});
		});
	});

	describe("count", () => {
		it("should return total count of sync logs", async () => {
			await withTransaction(async () => {
				// テスト用プロジェクトを作成
				const project = await createProject();

				const initialCount = await syncLogsRepository.count();

				// 同期ログを作成
				const syncLogData = buildNewSyncLog({
					project_id: project.id,
					status: SYNC_STATUSES.RUNNING,
					started_at: new Date(),
				});
				await syncLogsRepository.create(syncLogData);

				const newCount = await syncLogsRepository.count();
				expect(newCount).toBe(initialCount + 1);
			});
		});

		it("should filter count by project_id", async () => {
			await withTransaction(async () => {
				// 2つのテスト用プロジェクトを作成
				const project1 = await createProject();
				const project2 = await createProject();

				const initialCount1 = await syncLogsRepository.count({
					project_id: project1.id,
				});

				// プロジェクト1の同期ログを作成
				const syncLogData1 = buildNewSyncLog({
					project_id: project1.id,
					status: SYNC_STATUSES.RUNNING,
					started_at: new Date(),
				});
				await syncLogsRepository.create(syncLogData1);

				// プロジェクト2の同期ログを作成
				const syncLogData2 = buildNewSyncLog({
					project_id: project2.id,
					status: SYNC_STATUSES.RUNNING,
					started_at: new Date(),
				});
				await syncLogsRepository.create(syncLogData2);

				const newCount1 = await syncLogsRepository.count({
					project_id: project1.id,
				});
				const count2 = await syncLogsRepository.count({
					project_id: project2.id,
				});

				expect(newCount1).toBe(initialCount1 + 1);
				expect(count2).toBeGreaterThanOrEqual(1);
			});
		});

		it("should filter count by sync_type", async () => {
			await withTransaction(async () => {
				// テスト用プロジェクトを作成
				const project = await createProject();

				const initialProjectsCount = await syncLogsRepository.count({
					sync_type: SYNC_TYPES.PROJECTS,
				});

				// projects同期ログを作成
				const projectsParams = buildNewSyncLog({
					project_id: project.id,
					sync_type: SYNC_TYPES.PROJECTS,
					status: SYNC_STATUSES.RUNNING,
					started_at: new Date(),
				});
				await syncLogsRepository.create(projectsParams);

				const newProjectsCount = await syncLogsRepository.count({
					sync_type: SYNC_TYPES.PROJECTS,
				});

				expect(newProjectsCount).toBe(initialProjectsCount + 1);
			});
		});

		it("should filter count by status", async () => {
			await withTransaction(async () => {
				// テスト用プロジェクトを作成
				const project = await createProject();

				const initialRunningCount = await syncLogsRepository.count({
					status: SYNC_STATUSES.RUNNING,
				});

				// running状態の同期ログを作成
				const syncLogData = buildNewSyncLog({
					project_id: project.id,
					status: SYNC_STATUSES.RUNNING,
					started_at: new Date(),
				});
				await syncLogsRepository.create(syncLogData);

				const newRunningCount = await syncLogsRepository.count({
					status: SYNC_STATUSES.RUNNING,
				});

				expect(newRunningCount).toBe(initialRunningCount + 1);
			});
		});
	});

	// ==================== UPDATE操作 ====================

	describe("update", () => {
		it("should update existing sync log", async () => {
			await withTransaction(async () => {
				// テスト用プロジェクトと同期ログを作成
				const project = await createProject();
				const syncLog = await createSyncLog({ project_id: project.id });

				const updateData = {
					status: SYNC_STATUSES.COMPLETED,
					completed_at: new Date(),
					records_processed: 150,
					records_added: 75,
				};

				const updated = await syncLogsRepository.update(syncLog.id, updateData);

				expect(updated).toBeDefined();
				expect(updated?.id).toBe(syncLog.id);
				expect(updated?.status).toBe(SYNC_STATUSES.COMPLETED);
				expect(updated?.completed_at).toEqual(updateData.completed_at);
				expect(updated?.records_processed).toBe(updateData.records_processed);
				expect(updated?.records_added).toBe(updateData.records_added);
				expect(updated?.project_id).toBe(syncLog.project_id); // 変更されていない
			});
		});

		it("should return null for non-existent sync log", async () => {
			await withTransaction(async () => {
				const updated = await syncLogsRepository.update(999999, {
					status: SYNC_STATUSES.COMPLETED,
				});
				expect(updated).toBeNull();
			});
		});
	});

	describe("completeSync", () => {
		it("should complete sync with processing statistics", async () => {
			await withTransaction(async () => {
				// テスト用プロジェクトと同期ログを作成
				const project = await createProject();
				const syncLog = await createSyncLog({ project_id: project.id });

				const completeParams = {
					records_processed: 200,
					records_added: 100,
				};

				const completed = await syncLogsRepository.completeSync(
					syncLog.id,
					completeParams,
				);

				expect(completed).toBeDefined();
				expect(completed?.id).toBe(syncLog.id);
				expect(completed?.status).toBe(SYNC_STATUSES.COMPLETED);
				expect(completed?.completed_at).toBeDefined();
				expect(completed?.records_processed).toBe(200);
				expect(completed?.records_added).toBe(100);
				expect(completed?.error_message).toBeNull();
			});
		});

		it("should complete sync with default parameters", async () => {
			await withTransaction(async () => {
				// テスト用プロジェクトと同期ログを作成
				const project = await createProject();
				const syncLog = await createSyncLog({ project_id: project.id });

				const completed = await syncLogsRepository.completeSync(syncLog.id);

				expect(completed).toBeDefined();
				expect(completed?.status).toBe(SYNC_STATUSES.COMPLETED);
				expect(completed?.completed_at).toBeDefined();
				expect(completed?.records_processed).toBeNull();
				expect(completed?.records_added).toBeNull();
			});
		});

		it("should return null for non-existent sync log", async () => {
			await withTransaction(async () => {
				const completed = await syncLogsRepository.completeSync(999999);
				expect(completed).toBeNull();
			});
		});
	});

	describe("failSync", () => {
		it("should fail sync with error message", async () => {
			await withTransaction(async () => {
				// テスト用プロジェクトと同期ログを作成
				const project = await createProject();
				const syncLog = await createSyncLog({ project_id: project.id });

				const failParams = {
					error_message: "カスタムエラーメッセージ",
				};

				const failed = await syncLogsRepository.failSync(
					syncLog.id,
					failParams,
				);

				expect(failed).toBeDefined();
				expect(failed?.id).toBe(syncLog.id);
				expect(failed?.status).toBe(SYNC_STATUSES.FAILED);
				expect(failed?.completed_at).toBeDefined();
				expect(failed?.error_message).toBe("カスタムエラーメッセージ");
			});
		});

		it("should return null for non-existent sync log", async () => {
			await withTransaction(async () => {
				const failParams = {
					error_message: "テスト用エラーメッセージ",
				};
				const failed = await syncLogsRepository.failSync(999999, failParams);
				expect(failed).toBeNull();
			});
		});
	});
});

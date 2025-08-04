import { afterAll, describe, expect, it } from "vitest";
import { closeConnection } from "@/database/connection";
import { syncLogsRepository } from "@/database/repositories";
import { SYNC_TYPES } from "@/database/schema/sync-logs";
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
				});

				const syncLog = await syncLogsRepository.create(syncLogData);

				expect(syncLog).toBeDefined();
				expect(syncLog.id).toBeDefined();
				expect(syncLog.project_id).toBe(project.id);
				expect(syncLog.sync_type).toBe(SYNC_TYPES.PROJECTS);
				expect(syncLog.last_item_date).toBeDefined();
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
				});

				const syncLog = await syncLogsRepository.create(syncLogData);

				expect(syncLog.sync_type).toBe(SYNC_TYPES.COMMITS);
			});
		});

		it("should throw error when project does not exist", async () => {
			await withTransaction(async () => {
				const syncLogData = buildNewSyncLog({
					project_id: 999999, // 存在しないプロジェクトID
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
				await createSyncLogs(3, { project_id: project.id });

				const logs = await syncLogsRepository.find();

				expect(Array.isArray(logs)).toBe(true);
				expect(logs.length).toBeGreaterThanOrEqual(3);

				// created_at降順でソートされているかチェック
				for (let i = 1; i < logs.length; i++) {
					expect(logs[i].created_at <= logs[i - 1].created_at).toBe(true);
				}
			});
		});

		it("should filter by project_id", async () => {
			await withTransaction(async () => {
				// 2つのテスト用プロジェクトを作成
				const project1 = await createProject();
				const project2 = await createProject();

				// 各プロジェクトで同期ログを作成
				await createSyncLog({ project_id: project1.id });
				await createSyncLog({ project_id: project2.id });

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
				await createSyncLog({
					project_id: project.id,
					sync_type: SYNC_TYPES.PROJECTS,
				});
				await createSyncLog({
					project_id: project.id,
					sync_type: SYNC_TYPES.COMMITS,
				});

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

		it("should respect limit and offset parameters", async () => {
			await withTransaction(async () => {
				// テスト用プロジェクトを作成
				const project = await createProject();

				// 複数の同期ログを作成
				await createSyncLogs(5, { project_id: project.id });

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
				await createSyncLog({ project_id: project.id });

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
				await createSyncLogs(5, { project_id: project.id });

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

				// created_atをずらしながら3つの同期ログを作成
				const baseDate = new Date();
				const createdLogs = await Promise.all([
					createSyncLog({
						project_id: project.id,
						created_at: new Date(baseDate.getTime()),
					}),
					createSyncLog({
						project_id: project.id,
						created_at: new Date(baseDate.getTime() + 10),
					}),
					createSyncLog({
						project_id: project.id,
						created_at: new Date(baseDate.getTime() + 20),
					}),
				]);

				const latest = await syncLogsRepository.findLatest(project.id);

				expect(latest).toBeDefined();
				expect(latest?.project_id).toBe(project.id);

				// 最後に作成されたログ（最新のcreated_at）と比較
				expect(latest?.id).toBe(createdLogs[2].id);
			});
		});

		it("should filter by sync_type when provided", async () => {
			await withTransaction(async () => {
				// テスト用プロジェクトを作成
				const project = await createProject();

				// 異なるタイプの同期ログを作成
				await createSyncLog({
					project_id: project.id,
					sync_type: SYNC_TYPES.PROJECTS,
				});
				await createSyncLog({
					project_id: project.id,
					sync_type: SYNC_TYPES.COMMITS,
				});

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
				await createSyncLog({ project_id: project.id });

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
				await createSyncLog({ project_id: project1.id });

				// プロジェクト2の同期ログを作成
				await createSyncLog({ project_id: project2.id });

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
				await createSyncLog({
					project_id: project.id,
					sync_type: SYNC_TYPES.PROJECTS,
				});

				const newProjectsCount = await syncLogsRepository.count({
					sync_type: SYNC_TYPES.PROJECTS,
				});

				expect(newProjectsCount).toBe(initialProjectsCount + 1);
			});
		});
	});
});

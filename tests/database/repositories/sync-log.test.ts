import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { beforeEach, describe, expect, it } from "vitest";
import { ProjectRepository } from "../../../src/database/repositories/project.js";
import { SyncLogRepository } from "../../../src/database/repositories/sync-log.js";
import type * as schema from "../../../src/database/schema.js";
import {
	cleanupTestDatabase,
	createTestProject,
	createTestSyncLog,
	setupTestDatabase,
} from "../setup.js";

describe("SyncLogRepository", () => {
	let db: NodePgDatabase<typeof schema>;
	let syncLogRepo: SyncLogRepository;
	let projectRepo: ProjectRepository;
	let testProject: schema.Project;

	beforeEach(async () => {
		db = await setupTestDatabase();
		syncLogRepo = new SyncLogRepository(db);
		projectRepo = new ProjectRepository(db);

		// テスト用プロジェクトの作成
		testProject = await projectRepo.create(createTestProject());
	});

	describe("作成操作", () => {
		it("同期ログを作成できること", async () => {
			const newSyncLog = createTestSyncLog(testProject.id);
			const created = await syncLogRepo.create(newSyncLog);

			expect(created).toBeDefined();
			expect(created.id).toBeGreaterThan(0);
			expect(created.projectId).toBe(testProject.id);
			expect(created.syncType).toBe(newSyncLog.syncType);
			expect(created.status).toBe(newSyncLog.status);
			expect(created.startedAt).toEqual(newSyncLog.startedAt);
			expect(created.completedAt).toEqual(newSyncLog.completedAt);
			expect(created.durationSeconds).toBe(newSyncLog.durationSeconds);
			expect(created.recordsProcessed).toBe(newSyncLog.recordsProcessed);
			expect(created.recordsAdded).toBe(newSyncLog.recordsAdded);
			expect(created.recordsUpdated).toBe(newSyncLog.recordsUpdated);
			expect(created.lastCommitSha).toBe(newSyncLog.lastCommitSha);
			expect(created.lastCommitDate).toEqual(newSyncLog.lastCommitDate);
			expect(created.createdAt).toBeDefined();
		});

		it("実行中ステータスで同期ログを作成できること", async () => {
			const newSyncLog = createTestSyncLog(testProject.id, {
				status: "running",
				completedAt: undefined,
				durationSeconds: undefined,
			});
			const created = await syncLogRepo.create(newSyncLog);

			expect(created.status).toBe("running");
			expect(created.completedAt).toBeNull();
			expect(created.durationSeconds).toBeNull();
		});

		it("失敗ステータスで同期ログを作成できること", async () => {
			const errorMessage = "同期処理でエラーが発生しました";
			const newSyncLog = createTestSyncLog(testProject.id, {
				status: "failed",
				errorMessage,
			});
			const created = await syncLogRepo.create(newSyncLog);

			expect(created.status).toBe("failed");
			expect(created.errorMessage).toBe(errorMessage);
		});
	});

	describe("更新操作", () => {
		it("同期ログを更新できること", async () => {
			const newSyncLog = createTestSyncLog(testProject.id, {
				status: "running",
				completedAt: undefined,
				durationSeconds: undefined,
			});
			const created = await syncLogRepo.create(newSyncLog);

			const updateData = {
				status: "completed" as const,
				completedAt: new Date(),
				durationSeconds: 60,
				recordsProcessed: 200,
				recordsAdded: 100,
				recordsUpdated: 100,
			};

			const updated = await syncLogRepo.update(created.id, updateData);

			expect(updated).toBeDefined();
			expect(updated?.status).toBe(updateData.status);
			expect(updated?.completedAt).toEqual(updateData.completedAt);
			expect(updated?.durationSeconds).toBe(updateData.durationSeconds);
			expect(updated?.recordsProcessed).toBe(updateData.recordsProcessed);
			expect(updated?.recordsAdded).toBe(updateData.recordsAdded);
			expect(updated?.recordsUpdated).toBe(updateData.recordsUpdated);
		});

		it("存在しないIDで更新した場合nullを返すこと", async () => {
			const result = await syncLogRepo.update(99999, { status: "completed" });
			expect(result).toBeNull();
		});
	});

	describe("削除操作", () => {
		it("同期ログを削除できること", async () => {
			const newSyncLog = createTestSyncLog(testProject.id);
			const created = await syncLogRepo.create(newSyncLog);

			const deleted = await syncLogRepo.delete(created.id);
			expect(deleted).toBe(true);

			const found = await syncLogRepo.findById(created.id);
			expect(found).toBeNull();
		});

		it("存在しないIDで削除した場合falseを返すこと", async () => {
			const result = await syncLogRepo.delete(99999);
			expect(result).toBe(false);
		});
	});

	describe("検索操作", () => {
		it("IDで同期ログを検索できること", async () => {
			const newSyncLog = createTestSyncLog(testProject.id);
			const created = await syncLogRepo.create(newSyncLog);

			const found = await syncLogRepo.findById(created.id);
			expect(found).toBeDefined();
			expect(found?.id).toBe(created.id);
			expect(found?.syncType).toBe(created.syncType);
		});

		it("プロジェクトIDで同期ログを検索できること", async () => {
			await syncLogRepo.create(createTestSyncLog(testProject.id));
			await syncLogRepo.create(createTestSyncLog(testProject.id));

			const logs = await syncLogRepo.findByProjectId(testProject.id);
			expect(logs).toHaveLength(2);
			logs.forEach((log) => {
				expect(log.projectId).toBe(testProject.id);
			});
		});

		it("プロジェクトIDでページネーション検索できること", async () => {
			const date1 = new Date("2024-01-01");
			const date2 = new Date("2024-01-02");
			const date3 = new Date("2024-01-03");

			await syncLogRepo.create(
				createTestSyncLog(testProject.id, { startedAt: date1 }),
			);
			await syncLogRepo.create(
				createTestSyncLog(testProject.id, { startedAt: date2 }),
			);
			await syncLogRepo.create(
				createTestSyncLog(testProject.id, { startedAt: date3 }),
			);

			const firstPage = await syncLogRepo.findByProjectId(testProject.id, {
				limit: 2,
				offset: 0,
				orderBy: "started_at",
				order: "asc",
			});
			expect(firstPage).toHaveLength(2);
			expect(firstPage[0].startedAt).toEqual(date1);
			expect(firstPage[1].startedAt).toEqual(date2);

			const secondPage = await syncLogRepo.findByProjectId(testProject.id, {
				limit: 2,
				offset: 2,
				orderBy: "started_at",
				order: "asc",
			});
			expect(secondPage).toHaveLength(1);
			expect(secondPage[0].startedAt).toEqual(date3);
		});

		it("ステータスで同期ログを検索できること", async () => {
			await syncLogRepo.create(
				createTestSyncLog(testProject.id, { status: "completed" }),
			);
			await syncLogRepo.create(
				createTestSyncLog(testProject.id, { status: "failed" }),
			);
			await syncLogRepo.create(
				createTestSyncLog(testProject.id, { status: "running" }),
			);

			const completedLogs = await syncLogRepo.findByStatus("completed");
			expect(completedLogs).toHaveLength(1);
			expect(completedLogs[0].status).toBe("completed");

			const failedLogs = await syncLogRepo.findByStatus("failed");
			expect(failedLogs).toHaveLength(1);
			expect(failedLogs[0].status).toBe("failed");
		});

		it("失敗した同期ログを検索できること", async () => {
			await syncLogRepo.create(
				createTestSyncLog(testProject.id, { status: "completed" }),
			);
			await syncLogRepo.create(
				createTestSyncLog(testProject.id, {
					status: "failed",
					errorMessage: "エラーメッセージ",
				}),
			);

			const failedLogs = await syncLogRepo.findFailed();
			expect(failedLogs).toHaveLength(1);
			expect(failedLogs[0].status).toBe("failed");
			expect(failedLogs[0].errorMessage).toBe("エラーメッセージ");
		});

		it("実行中の同期ログを検索できること", async () => {
			await syncLogRepo.create(
				createTestSyncLog(testProject.id, { status: "completed" }),
			);
			await syncLogRepo.create(
				createTestSyncLog(testProject.id, {
					status: "running",
					completedAt: undefined,
				}),
			);

			const runningLogs = await syncLogRepo.findRunning();
			expect(runningLogs).toHaveLength(1);
			expect(runningLogs[0].status).toBe("running");
			expect(runningLogs[0].completedAt).toBeNull();
		});
	});

	describe("統計操作", () => {
		beforeEach(async () => {
			// テストデータの作成
			await syncLogRepo.create(
				createTestSyncLog(testProject.id, { status: "completed" }),
			);
			await syncLogRepo.create(
				createTestSyncLog(testProject.id, { status: "failed" }),
			);
			await syncLogRepo.create(
				createTestSyncLog(testProject.id, { status: "running" }),
			);
		});

		it("プロジェクト別同期ログ数をカウントできること", async () => {
			const count = await syncLogRepo.count(testProject.id);
			expect(count).toBe(3);
		});

		it("全体の同期ログ数をカウントできること", async () => {
			const count = await syncLogRepo.count();
			expect(count).toBe(3);
		});

		it("ステータス別同期ログ数をカウントできること", async () => {
			const completedCount = await syncLogRepo.countByStatus("completed");
			expect(completedCount).toBe(1);

			const failedCount = await syncLogRepo.countByStatus("failed");
			expect(failedCount).toBe(1);

			const runningCount = await syncLogRepo.countByStatus("running");
			expect(runningCount).toBe(1);
		});

		it("最新の同期ログを取得できること", async () => {
			const latestDate = new Date("2024-12-31");
			const latestLog = createTestSyncLog(testProject.id, {
				startedAt: latestDate,
				syncType: "full",
			});
			await syncLogRepo.create(latestLog);

			const latest = await syncLogRepo.getLatest(testProject.id);
			expect(latest).toBeDefined();
			expect(latest?.syncType).toBe("full");
			expect(latest?.startedAt).toEqual(latestDate);
		});

		it("同期ログが存在しないプロジェクトで最新取得した場合nullを返すこと", async () => {
			const emptyProject = await projectRepo.create(createTestProject());
			const latest = await syncLogRepo.getLatest(emptyProject.id);
			expect(latest).toBeNull();
		});

		it("同期統計を取得できること", async () => {
			const stats = await syncLogRepo.getStats();
			expect(stats).toBeDefined();
			expect(stats.total).toBe(3);
			expect(stats.completed).toBe(1);
			expect(stats.failed).toBe(1);
			expect(stats.running).toBe(1);
			expect(stats.pending).toBe(0);
		});

		it("プロジェクト別同期統計を取得できること", async () => {
			const stats = await syncLogRepo.getStatsByProject(testProject.id);
			expect(stats).toBeDefined();
			expect(stats.total).toBe(3);
			expect(stats.completed).toBe(1);
			expect(stats.failed).toBe(1);
			expect(stats.running).toBe(1);
			expect(stats.pending).toBe(0);
		});

		it("平均同期時間を取得できること", async () => {
			// 完了した同期ログのみ追加
			await syncLogRepo.create(
				createTestSyncLog(testProject.id, {
					status: "completed",
					durationSeconds: 30,
				}),
			);
			await syncLogRepo.create(
				createTestSyncLog(testProject.id, {
					status: "completed",
					durationSeconds: 60,
				}),
			);

			const avgDuration = await syncLogRepo.getAverageDuration(testProject.id);
			expect(avgDuration).toBe(45); // (30 + 60) / 2
		});

		it("完了した同期ログがない場合平均時間は0を返すこと", async () => {
			const emptyProject = await projectRepo.create(createTestProject());
			const avgDuration = await syncLogRepo.getAverageDuration(emptyProject.id);
			expect(avgDuration).toBe(0);
		});
	});

	describe("トランザクション操作", () => {
		it("withTransactionで新しいインスタンスを作成できること", async () => {
			const txRepo = syncLogRepo.withTransaction(db);
			expect(txRepo).toBeInstanceOf(SyncLogRepository);
			expect(txRepo).not.toBe(syncLogRepo);
		});

		it("トランザクション内で操作が実行できること", async () => {
			await db.transaction(async (tx) => {
				const txRepo = syncLogRepo.withTransaction(tx);
				const newSyncLog = createTestSyncLog(testProject.id);
				const created = await txRepo.create(newSyncLog);

				expect(created).toBeDefined();
				expect(created.id).toBeGreaterThan(0);
			});
		});
	});

	afterAll(async () => {
		await cleanupTestDatabase();
	});
});

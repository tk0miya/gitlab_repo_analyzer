import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
	cleanupTestDatabase,
	initializeTestDatabase,
} from "./__tests__/setup.js";
import { Repositories } from "./repositories/index.js";

describe("Database Integration", () => {
	beforeAll(async () => {
		await initializeTestDatabase();
	});

	afterAll(async () => {
		await cleanupTestDatabase();
	});

	describe("Repositories", () => {
		it("Repositoriesクラスが正しく初期化されること", async () => {
			const repos = await Repositories.create();

			expect(repos).toBeDefined();
			expect(repos.projects).toBeDefined();
			expect(repos.commits).toBeDefined();
			expect(repos.syncLogs).toBeDefined();
		});

		describe("Transaction handling", () => {
			it("withTransactionで新しいインスタンスを作成できること", async () => {
				const repos = await Repositories.create();
				const db = await initializeTestDatabase();

				const txRepos = repos.withTransaction(db);
				expect(txRepos).toBeInstanceOf(Repositories);
				expect(txRepos).not.toBe(repos);
				expect(txRepos.projects).not.toBe(repos.projects);
				expect(txRepos.commits).not.toBe(repos.commits);
				expect(txRepos.syncLogs).not.toBe(repos.syncLogs);
			});

			it("トランザクション内での操作が正しく動作すること", async () => {
				const repos = await Repositories.create();
				const testProject = {
					gitlabId: 12345,
					name: "Transaction Test Project",
					description: "テスト用のプロジェクト",
					webUrl: "https://gitlab.com/test/transaction",
					defaultBranch: "main",
					visibility: "public" as const,
					gitlabCreatedAt: new Date(),
					gitlabUpdatedAt: new Date(),
				};

				let projectId: number | undefined;

				// トランザクション内で作成・取得をテスト
				await repos.db.transaction(async (tx) => {
					const txRepos = repos.withTransaction(tx);

					// 1. トランザクション内で作成
					const project = await txRepos.projects.create(testProject);
					expect(project.id).toBeGreaterThan(0);
					projectId = project.id;

					// 2. 同じトランザクション内で取得可能
					const retrieved = await txRepos.projects.findById(project.id);
					expect(retrieved).toBeDefined();
					expect(retrieved?.name).toBe(testProject.name);
				});

				// 3. トランザクション完了後も取得可能
				if (projectId) {
					const project = await repos.projects.findById(projectId);
					expect(project).toBeDefined();
					expect(project?.name).toBe(testProject.name);
				}
			});

			it("ロールバック時に変更が取り消されること", async () => {
				const repos = await Repositories.create();
				const testProject = {
					gitlabId: 67890,
					name: "Rollback Test Project",
					description: "ロールバックテスト用のプロジェクト",
					webUrl: "https://gitlab.com/test/rollback",
					defaultBranch: "main",
					visibility: "public" as const,
					gitlabCreatedAt: new Date(),
					gitlabUpdatedAt: new Date(),
				};

				let projectId: number | undefined;

				try {
					await repos.db.transaction(async (tx) => {
						const txRepos = repos.withTransaction(tx);
						const project = await txRepos.projects.create(testProject);
						projectId = project.id;

						// トランザクション内では取得可能
						const retrieved = await txRepos.projects.findById(project.id);
						expect(retrieved).toBeDefined();

						// 意図的にエラーを発生させてロールバック
						throw new Error("Test rollback");
					});
				} catch (error) {
					expect(error).toBeInstanceOf(Error);
					expect((error as Error).message).toBe("Test rollback");
				}

				// ロールバック後、データが存在しないことを確認
				if (projectId) {
					const project = await repos.projects.findById(projectId);
					expect(project).toBeNull();
				}
			});

			it("複数リポジトリでのトランザクション整合性", async () => {
				const repos = await Repositories.create();
				const testProject = {
					gitlabId: 99999,
					name: "Multi Repository Test",
					description: "複数リポジトリテスト用のプロジェクト",
					webUrl: "https://gitlab.com/test/multi",
					defaultBranch: "main",
					visibility: "public" as const,
					gitlabCreatedAt: new Date(),
					gitlabUpdatedAt: new Date(),
				};

				let projectId: number | undefined;
				let syncLogId: number | undefined;

				try {
					await repos.db.transaction(async (tx) => {
						const txRepos = repos.withTransaction(tx);

						// 1. プロジェクト作成
						const project = await txRepos.projects.create(testProject);
						projectId = project.id;

						// 2. 同期ログ作成（プロジェクトに依存）
						const syncLog = await txRepos.syncLogs.create({
							projectId: project.id,
							syncType: "full",
							status: "running",
							startedAt: new Date(),
							durationSeconds: 0,
							recordsProcessed: 0,
							recordsAdded: 0,
							recordsUpdated: 0,
							lastCommitSha: null,
							lastCommitDate: null,
						});
						syncLogId = syncLog.id;

						// 意図的にエラーを発生させて両方をロールバック
						throw new Error("Multi repository rollback test");
					});
				} catch (error) {
					expect(error).toBeInstanceOf(Error);
				}

				// 両方のレコードがロールバックされていることを確認
				if (projectId) {
					const project = await repos.projects.findById(projectId);
					expect(project).toBeNull();
				}
				if (syncLogId) {
					const syncLog = await repos.syncLogs.findById(syncLogId);
					expect(syncLog).toBeNull();
				}
			});
		});
	});
});

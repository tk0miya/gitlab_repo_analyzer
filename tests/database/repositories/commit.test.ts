import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { beforeEach, describe, expect, it } from "vitest";
import { CommitRepository } from "../../../src/database/repositories/commit.js";
import { ProjectRepository } from "../../../src/database/repositories/project.js";
import type * as schema from "../../../src/database/schema.js";
import {
	cleanupTestDatabase,
	createTestCommit,
	createTestProject,
	setupTestDatabase,
} from "../setup.js";

describe("CommitRepository", () => {
	let db: NodePgDatabase<typeof schema>;
	let commitRepo: CommitRepository;
	let projectRepo: ProjectRepository;
	let testProject: schema.Project;

	beforeEach(async () => {
		db = await setupTestDatabase();
		commitRepo = new CommitRepository(db);
		projectRepo = new ProjectRepository(db);

		// テスト用プロジェクトの作成
		testProject = await projectRepo.create(createTestProject());
	});

	describe("作成操作", () => {
		it("コミットを作成できること", async () => {
			const newCommit = createTestCommit(testProject.id);
			const created = await commitRepo.create(newCommit);

			expect(created).toBeDefined();
			expect(created.id).toBeGreaterThan(0);
			expect(created.projectId).toBe(testProject.id);
			expect(created.sha).toBe(newCommit.sha);
			expect(created.message).toBe(newCommit.message);
			expect(created.authorName).toBe(newCommit.authorName);
			expect(created.authorEmail).toBe(newCommit.authorEmail);
			expect(created.authorDate).toEqual(newCommit.authorDate);
			expect(created.createdAt).toBeDefined();
		});

		it("同じプロジェクトで同じSHAのコミットを作成できないこと", async () => {
			const sha = "duplicate-sha-123";
			const commit1 = createTestCommit(testProject.id, { sha });
			const commit2 = createTestCommit(testProject.id, { sha });

			await commitRepo.create(commit1);
			await expect(commitRepo.create(commit2)).rejects.toThrow();
		});
	});

	describe("一括作成操作", () => {
		it("複数のコミットを一括作成できること", async () => {
			const commits = [
				createTestCommit(testProject.id),
				createTestCommit(testProject.id),
				createTestCommit(testProject.id),
			];

			const created = await commitRepo.bulkCreate(commits);
			expect(created).toHaveLength(3);

			for (let i = 0; i < created.length; i++) {
				expect(created[i].projectId).toBe(testProject.id);
				expect(created[i].sha).toBe(commits[i].sha);
				expect(created[i].message).toBe(commits[i].message);
			}
		});

		it("空の配列で一括作成を実行できること", async () => {
			const created = await commitRepo.bulkCreate([]);
			expect(created).toHaveLength(0);
		});
	});

	describe("更新操作", () => {
		it("コミットを更新できること", async () => {
			const newCommit = createTestCommit(testProject.id);
			const created = await commitRepo.create(newCommit);

			const updateData = {
				message: "Updated commit message",
				additions: 20,
				deletions: 10,
			};

			const updated = await commitRepo.update(created.id, updateData);

			expect(updated).toBeDefined();
			expect(updated?.message).toBe(updateData.message);
			expect(updated?.additions).toBe(updateData.additions);
			expect(updated?.deletions).toBe(updateData.deletions);
		});

		it("存在しないIDで更新した場合nullを返すこと", async () => {
			const result = await commitRepo.update(99999, { message: "Test" });
			expect(result).toBeNull();
		});
	});

	describe("削除操作", () => {
		it("コミットを削除できること", async () => {
			const newCommit = createTestCommit(testProject.id);
			const created = await commitRepo.create(newCommit);

			const deleted = await commitRepo.delete(created.id);
			expect(deleted).toBe(true);

			const found = await commitRepo.findById(created.id);
			expect(found).toBeNull();
		});

		it("存在しないIDで削除した場合falseを返すこと", async () => {
			const result = await commitRepo.delete(99999);
			expect(result).toBe(false);
		});
	});

	describe("検索操作", () => {
		it("IDでコミットを検索できること", async () => {
			const newCommit = createTestCommit(testProject.id);
			const created = await commitRepo.create(newCommit);

			const found = await commitRepo.findById(created.id);
			expect(found).toBeDefined();
			expect(found?.id).toBe(created.id);
			expect(found?.sha).toBe(created.sha);
		});

		it("プロジェクトIDでコミットを検索できること", async () => {
			await commitRepo.create(createTestCommit(testProject.id));
			await commitRepo.create(createTestCommit(testProject.id));

			const commits = await commitRepo.findByProjectId(testProject.id);
			expect(commits).toHaveLength(2);
			commits.forEach((commit) => {
				expect(commit.projectId).toBe(testProject.id);
			});
		});

		it("作者のメールアドレスでコミットを検索できること", async () => {
			const authorEmail = "author@example.com";
			await commitRepo.create(
				createTestCommit(testProject.id, { authorEmail }),
			);
			await commitRepo.create(
				createTestCommit(testProject.id, { authorEmail }),
			);
			await commitRepo.create(
				createTestCommit(testProject.id, { authorEmail: "other@example.com" }),
			);

			const commits = await commitRepo.findByAuthorEmail(authorEmail);
			expect(commits).toHaveLength(2);
			commits.forEach((commit) => {
				expect(commit.authorEmail).toBe(authorEmail);
			});
		});

		it("作者のメールアドレスでプロジェクト指定検索できること", async () => {
			const authorEmail = "author@example.com";
			await commitRepo.create(
				createTestCommit(testProject.id, { authorEmail }),
			);

			const commits = await commitRepo.findByAuthorEmail(authorEmail, {
				projectId: testProject.id,
			});
			expect(commits).toHaveLength(1);
			expect(commits[0].authorEmail).toBe(authorEmail);
			expect(commits[0].projectId).toBe(testProject.id);
		});

		it("日付範囲でコミットを検索できること", async () => {
			const startDate = new Date("2024-01-01");
			const endDate = new Date("2024-12-31");
			const withinRange = new Date("2024-06-15");
			const outsideRange = new Date("2025-01-01");

			await commitRepo.create(
				createTestCommit(testProject.id, { authorDate: withinRange }),
			);
			await commitRepo.create(
				createTestCommit(testProject.id, { authorDate: outsideRange }),
			);

			const commits = await commitRepo.findByDateRange(
				testProject.id,
				startDate,
				endDate,
			);
			expect(commits).toHaveLength(1);
			expect(commits[0].authorDate).toEqual(withinRange);
		});
	});

	describe("一覧取得操作", () => {
		beforeEach(async () => {
			// テストデータの作成
			const date1 = new Date("2024-01-01");
			const date2 = new Date("2024-01-02");
			const date3 = new Date("2024-01-03");

			await commitRepo.create(
				createTestCommit(testProject.id, {
					authorDate: date1,
					message: "First commit",
				}),
			);
			await commitRepo.create(
				createTestCommit(testProject.id, {
					authorDate: date2,
					message: "Second commit",
				}),
			);
			await commitRepo.create(
				createTestCommit(testProject.id, {
					authorDate: date3,
					message: "Third commit",
				}),
			);
		});

		it("プロジェクトIDでソートして取得できること", async () => {
			const commits = await commitRepo.findByProjectId(testProject.id, {
				orderBy: "author_date",
				order: "asc",
			});
			expect(commits).toHaveLength(3);
			expect(commits[0].message).toBe("First commit");
			expect(commits[1].message).toBe("Second commit");
			expect(commits[2].message).toBe("Third commit");
		});

		it("ページネーションで取得できること", async () => {
			const firstPage = await commitRepo.findByProjectId(testProject.id, {
				limit: 2,
				offset: 0,
				orderBy: "author_date",
				order: "asc",
			});
			expect(firstPage).toHaveLength(2);
			expect(firstPage[0].message).toBe("First commit");
			expect(firstPage[1].message).toBe("Second commit");

			const secondPage = await commitRepo.findByProjectId(testProject.id, {
				limit: 2,
				offset: 2,
				orderBy: "author_date",
				order: "asc",
			});
			expect(secondPage).toHaveLength(1);
			expect(secondPage[0].message).toBe("Third commit");
		});
	});

	describe("統計操作", () => {
		beforeEach(async () => {
			// テストデータの作成
			await commitRepo.create(createTestCommit(testProject.id));
			await commitRepo.create(createTestCommit(testProject.id));
			await commitRepo.create(createTestCommit(testProject.id));
		});

		it("コミット数をカウントできること", async () => {
			const count = await commitRepo.count(testProject.id);
			expect(count).toBe(3);
		});

		it("全体のコミット数をカウントできること", async () => {
			const count = await commitRepo.count();
			expect(count).toBe(3);
		});

		it("コミットの存在確認ができること", async () => {
			const newCommit = createTestCommit(testProject.id);
			await commitRepo.create(newCommit);

			const exists = await commitRepo.exists(testProject.id, newCommit.sha);
			expect(exists).toBe(true);

			const notExists = await commitRepo.exists(
				testProject.id,
				"nonexistent-sha",
			);
			expect(notExists).toBe(false);
		});

		it("最新のコミットを取得できること", async () => {
			const latestDate = new Date("2024-12-31");
			const latestCommit = createTestCommit(testProject.id, {
				authorDate: latestDate,
				message: "Latest commit",
			});
			await commitRepo.create(latestCommit);

			const latest = await commitRepo.getLatest(testProject.id);
			expect(latest).toBeDefined();
			expect(latest?.message).toBe("Latest commit");
			expect(latest?.authorDate).toEqual(latestDate);
		});

		it("コミットが存在しないプロジェクトで最新取得した場合nullを返すこと", async () => {
			const emptyProject = await projectRepo.create(createTestProject());
			const latest = await commitRepo.getLatest(emptyProject.id);
			expect(latest).toBeNull();
		});
	});

	describe("トランザクション操作", () => {
		it("withTransactionで新しいインスタンスを作成できること", async () => {
			const txRepo = commitRepo.withTransaction(db);
			expect(txRepo).toBeInstanceOf(CommitRepository);
			expect(txRepo).not.toBe(commitRepo);
		});

		it("トランザクション内で操作が実行できること", async () => {
			await db.transaction(async (tx) => {
				const txRepo = commitRepo.withTransaction(tx);
				const newCommit = createTestCommit(testProject.id);
				const created = await txRepo.create(newCommit);

				expect(created).toBeDefined();
				expect(created.id).toBeGreaterThan(0);
			});
		});
	});

	afterAll(async () => {
		await cleanupTestDatabase();
	});
});

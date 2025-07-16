import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { beforeEach, describe, expect, it } from "vitest";
import { ProjectRepository } from "../../../src/database/repositories/project.js";
import type * as schema from "../../../src/database/schema.js";
import {
	cleanupTestDatabase,
	createTestProject,
	setupTestDatabase,
} from "../setup.js";

describe("ProjectRepository", () => {
	let db: NodePgDatabase<typeof schema>;
	let projectRepo: ProjectRepository;

	beforeEach(async () => {
		db = await setupTestDatabase();
		projectRepo = new ProjectRepository(db);
	});

	describe("作成操作", () => {
		it("プロジェクトを作成できること", async () => {
			const newProject = createTestProject();
			const created = await projectRepo.create(newProject);

			expect(created).toBeDefined();
			expect(created.id).toBeGreaterThan(0);
			expect(created.name).toBe(newProject.name);
			expect(created.gitlabId).toBe(newProject.gitlabId);
			expect(created.description).toBe(newProject.description);
			expect(created.webUrl).toBe(newProject.webUrl);
			expect(created.defaultBranch).toBe(newProject.defaultBranch);
			expect(created.visibility).toBe(newProject.visibility);
			expect(created.createdAt).toBeDefined();
			expect(created.updatedAt).toBeDefined();
		});

		it("同じgitlabIdで複数のプロジェクトを作成できないこと", async () => {
			const gitlabId = 12345;
			const project1 = createTestProject({ gitlabId });
			const project2 = createTestProject({ gitlabId });

			await projectRepo.create(project1);
			await expect(projectRepo.create(project2)).rejects.toThrow();
		});
	});

	describe("更新操作", () => {
		it("プロジェクトを更新できること", async () => {
			const newProject = createTestProject();
			const created = await projectRepo.create(newProject);

			const updateData = {
				name: "Updated Project Name",
				description: "Updated description",
			};

			const updated = await projectRepo.update(created.id, updateData);

			expect(updated).toBeDefined();
			expect(updated?.name).toBe(updateData.name);
			expect(updated?.description).toBe(updateData.description);
			expect(updated?.updatedAt).not.toEqual(created.updatedAt);
		});

		it("存在しないIDで更新した場合nullを返すこと", async () => {
			const result = await projectRepo.update(99999, { name: "Test" });
			expect(result).toBeNull();
		});
	});

	describe("削除操作", () => {
		it("プロジェクトを削除できること", async () => {
			const newProject = createTestProject();
			const created = await projectRepo.create(newProject);

			const deleted = await projectRepo.delete(created.id);
			expect(deleted).toBe(true);

			const found = await projectRepo.findById(created.id);
			expect(found).toBeNull();
		});

		it("存在しないIDで削除した場合falseを返すこと", async () => {
			const result = await projectRepo.delete(99999);
			expect(result).toBe(false);
		});
	});

	describe("検索操作", () => {
		it("IDでプロジェクトを検索できること", async () => {
			const newProject = createTestProject();
			const created = await projectRepo.create(newProject);

			const found = await projectRepo.findById(created.id);
			expect(found).toBeDefined();
			expect(found?.id).toBe(created.id);
			expect(found?.name).toBe(created.name);
		});

		it("存在しないIDで検索した場合nullを返すこと", async () => {
			const result = await projectRepo.findById(99999);
			expect(result).toBeNull();
		});

		it("GitLab IDでプロジェクトを検索できること", async () => {
			const gitlabId = 54321;
			const newProject = createTestProject({ gitlabId });
			const created = await projectRepo.create(newProject);

			const found = await projectRepo.findByGitlabId(gitlabId);
			expect(found).toBeDefined();
			expect(found?.gitlabId).toBe(gitlabId);
			expect(found?.name).toBe(created.name);
		});

		it("プロジェクト名でプロジェクトを検索できること", async () => {
			const name = "Unique Project Name";
			const newProject = createTestProject({ name });
			const created = await projectRepo.create(newProject);

			const found = await projectRepo.findByName(name);
			expect(found).toBeDefined();
			expect(found?.name).toBe(name);
			expect(found?.id).toBe(created.id);
		});
	});

	describe("一覧取得操作", () => {
		beforeEach(async () => {
			// テストデータの作成
			await projectRepo.create(createTestProject({ name: "Project A" }));
			await projectRepo.create(createTestProject({ name: "Project B" }));
			await projectRepo.create(createTestProject({ name: "Project C" }));
		});

		it("全プロジェクトを取得できること", async () => {
			const projects = await projectRepo.findAll();
			expect(projects).toHaveLength(3);
		});

		it("プロジェクト名でソートできること（昇順）", async () => {
			const projects = await projectRepo.findAll({
				orderBy: "name",
				order: "asc",
			});
			expect(projects).toHaveLength(3);
			expect(projects[0].name).toBe("Project A");
			expect(projects[1].name).toBe("Project B");
			expect(projects[2].name).toBe("Project C");
		});

		it("プロジェクト名でソートできること（降順）", async () => {
			const projects = await projectRepo.findAll({
				orderBy: "name",
				order: "desc",
			});
			expect(projects).toHaveLength(3);
			expect(projects[0].name).toBe("Project C");
			expect(projects[1].name).toBe("Project B");
			expect(projects[2].name).toBe("Project A");
		});

		it("作成日でソートできること", async () => {
			const projects = await projectRepo.findAll({
				orderBy: "created_at",
				order: "desc",
			});
			expect(projects).toHaveLength(3);
			// 最新のものが最初に来る
			expect(projects[0].createdAt?.getTime()).toBeGreaterThanOrEqual(
				projects[1].createdAt?.getTime(),
			);
		});

		it("更新日でソートできること", async () => {
			const projects = await projectRepo.findAll({
				orderBy: "updated_at",
				order: "asc",
			});
			expect(projects).toHaveLength(3);
			// 古いものが最初に来る
			expect(projects[0].updatedAt?.getTime()).toBeLessThanOrEqual(
				projects[1].updatedAt?.getTime(),
			);
		});
	});

	describe("存在確認操作", () => {
		it("存在するgitlabIdで正しくtrueを返すこと", async () => {
			const gitlabId = 98765;
			const newProject = createTestProject({ gitlabId });
			await projectRepo.create(newProject);

			const exists = await projectRepo.exists(gitlabId);
			expect(exists).toBe(true);
		});

		it("存在しないgitlabIdで正しくfalseを返すこと", async () => {
			const exists = await projectRepo.exists(99999);
			expect(exists).toBe(false);
		});
	});

	describe("トランザクション操作", () => {
		it("withTransactionで新しいインスタンスを作成できること", async () => {
			const txRepo = projectRepo.withTransaction(db);
			expect(txRepo).toBeInstanceOf(ProjectRepository);
			expect(txRepo).not.toBe(projectRepo);
		});

		it("トランザクション内で操作が実行できること", async () => {
			await db.transaction(async (tx) => {
				const txRepo = projectRepo.withTransaction(tx);
				const newProject = createTestProject();
				const created = await txRepo.create(newProject);

				expect(created).toBeDefined();
				expect(created.id).toBeGreaterThan(0);
			});
		});
	});

	afterAll(async () => {
		await cleanupTestDatabase();
	});
});

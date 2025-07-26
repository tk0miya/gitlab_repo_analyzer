import { afterAll, describe, expect, it } from "vitest";
import { createProjectData } from "@/database/__tests__/factories/index.js";
import { closeConnection } from "@/database/connection.js";
import { ProjectsRepository } from "@/database/index.js";
import type { NewProject } from "@/database/schema/projects.js";
import { withTransaction } from "@/database/testing/transaction.js";

describe("Projects Repository", () => {
	afterAll(async () => {
		await closeConnection();
	});

	describe("create", () => {
		it("should create a new project", async () => {
			await withTransaction(async (tx) => {
				const projectsRepository = new ProjectsRepository(tx);
				const testProject = createProjectData();
				const created = await projectsRepository.create(testProject);

				expect(created).toBeDefined();
				expect(created.id).toBeDefined();
				expect(created.gitlab_id).toBe(testProject.gitlab_id);
				expect(created.name).toBe(testProject.name);
				expect(created.description).toBe(testProject.description);
				expect(created.web_url).toBe(testProject.web_url);
				expect(created.default_branch).toBe(testProject.default_branch);
				expect(created.visibility).toBe(testProject.visibility);
				expect(created.created_at).toBeDefined();
				expect(created.gitlab_created_at).toEqual(
					testProject.gitlab_created_at,
				);
			});
		});

		it("should throw error when creation fails", async () => {
			await withTransaction(async (tx) => {
				const projectsRepository = new ProjectsRepository(tx);
				// 必須フィールドが欠如したデータで失敗をテスト
				const validData = createProjectData();
				const invalidProject = { ...validData };
				// biome-ignore lint/suspicious/noExplicitAny: テスト用途での型回避のため必要
				delete (invalidProject as any).name;

				await expect(
					projectsRepository.create(invalidProject),
				).rejects.toThrow();
			});
		});

		it("should handle duplicate GitLab ID", async () => {
			await withTransaction(async (tx) => {
				const projectsRepository = new ProjectsRepository(tx);
				const testProject = createProjectData();
				// 最初のプロジェクトを作成
				const _created = await projectsRepository.create(testProject);

				// 同じGitLab IDで別のプロジェクトを作成しようとしてエラーになることを確認
				await expect(projectsRepository.create(testProject)).rejects.toThrow();
			});
		});
	});

	describe("findById", () => {
		it("should find project by internal ID", async () => {
			await withTransaction(async (tx) => {
				const projectsRepository = new ProjectsRepository(tx);
				const testProject = createProjectData();
				// テストデータを作成
				const created = await projectsRepository.create(testProject);

				const found = await projectsRepository.findById(created.id);

				expect(found).toBeDefined();
				expect(found?.id).toBe(created.id);
				expect(found?.gitlab_id).toBe(testProject.gitlab_id);
			});
		});

		it("should return null for non-existent ID", async () => {
			await withTransaction(async (tx) => {
				const projectsRepository = new ProjectsRepository(tx);
				const found = await projectsRepository.findById(999999);
				expect(found).toBeNull();
			});
		});
	});

	describe("findByGitlabId", () => {
		it("should find project by GitLab ID", async () => {
			await withTransaction(async (tx) => {
				const projectsRepository = new ProjectsRepository(tx);
				const testProject = createProjectData();
				// テストデータを作成
				const _created = await projectsRepository.create(testProject);

				const found = await projectsRepository.findByGitlabId(
					testProject.gitlab_id,
				);

				expect(found).toBeDefined();
				expect(found?.gitlab_id).toBe(testProject.gitlab_id);
				expect(found?.name).toBe(testProject.name);
			});
		});

		it("should return null for non-existent GitLab ID", async () => {
			await withTransaction(async (tx) => {
				const projectsRepository = new ProjectsRepository(tx);
				const found = await projectsRepository.findByGitlabId(999999);
				expect(found).toBeNull();
			});
		});
	});

	describe("findAll", () => {
		it("should return all projects with pagination", async () => {
			await withTransaction(async (tx) => {
				const projectsRepository = new ProjectsRepository(tx);
				// テストデータを作成
				const testProject1 = createProjectData();
				const testProject2 = createProjectData();
				const _created1 = await projectsRepository.create(testProject1);
				const _created2 = await projectsRepository.create(testProject2);

				const projects = await projectsRepository.findAll(10, 0);

				expect(Array.isArray(projects)).toBe(true);
				expect(projects.length).toBeGreaterThanOrEqual(2);

				// name昇順でソートされているかチェック
				for (let i = 1; i < projects.length; i++) {
					expect(projects[i].name >= projects[i - 1].name).toBe(true);
				}
			});
		});

		it("should respect limit parameter", async () => {
			await withTransaction(async (tx) => {
				const projectsRepository = new ProjectsRepository(tx);
				const projects = await projectsRepository.findAll(1, 0);

				expect(Array.isArray(projects)).toBe(true);
				expect(projects.length).toBeLessThanOrEqual(1);
			});
		});

		it("should respect offset parameter", async () => {
			await withTransaction(async (tx) => {
				const projectsRepository = new ProjectsRepository(tx);
				// テストデータを作成
				const testProject1 = createProjectData();
				const testProject2 = createProjectData();
				const _created1 = await projectsRepository.create(testProject1);
				const _created2 = await projectsRepository.create(testProject2);

				const firstPage = await projectsRepository.findAll(1, 0);
				const secondPage = await projectsRepository.findAll(1, 1);

				// オフセットが動作していることを確認
				if (firstPage.length > 0 && secondPage.length > 0) {
					expect(firstPage[0].id).not.toBe(secondPage[0].id);
				}
			});
		});
	});

	describe("count", () => {
		it("should return total count of projects", async () => {
			await withTransaction(async (tx) => {
				const projectsRepository = new ProjectsRepository(tx);
				const initialCount = await projectsRepository.count();

				// テストデータを作成
				const testProject = createProjectData();
				const _created = await projectsRepository.create(testProject);

				const newCount = await projectsRepository.count();
				expect(newCount).toBe(initialCount + 1);
			});
		});
	});

	describe("update", () => {
		it("should update existing project", async () => {
			await withTransaction(async (tx) => {
				const projectsRepository = new ProjectsRepository(tx);
				// テストデータを作成
				const testProject = createProjectData();
				const created = await projectsRepository.create(testProject);

				const updateData = {
					name: "updated-project-name",
					description: "Updated description",
				};

				const updated = await projectsRepository.update(created.id, updateData);

				expect(updated).toBeDefined();
				expect(updated?.id).toBe(created.id);
				expect(updated?.name).toBe(updateData.name);
				expect(updated?.description).toBe(updateData.description);
				expect(updated?.gitlab_id).toBe(created.gitlab_id); // 変更されていない
			});
		});

		it("should return null for non-existent project", async () => {
			await withTransaction(async (tx) => {
				const projectsRepository = new ProjectsRepository(tx);
				const updated = await projectsRepository.update(999999, {
					name: "test",
				});
				expect(updated).toBeNull();
			});
		});
	});

	describe("delete", () => {
		it("should delete existing project", async () => {
			await withTransaction(async (tx) => {
				const projectsRepository = new ProjectsRepository(tx);
				// テストデータを作成
				const testProject = createProjectData();
				const created = await projectsRepository.create(testProject);

				const deleted = await projectsRepository.delete(created.id);
				expect(deleted).toBe(true);

				// 削除されたことを確認
				const found = await projectsRepository.findById(created.id);
				expect(found).toBeNull();
			});
		});

		it("should return false for non-existent project", async () => {
			await withTransaction(async (tx) => {
				const projectsRepository = new ProjectsRepository(tx);
				const deleted = await projectsRepository.delete(999999);
				expect(deleted).toBe(false);
			});
		});
	});

	describe("upsert", () => {
		it("should create new project when it doesn't exist", async () => {
			await withTransaction(async (tx) => {
				const projectsRepository = new ProjectsRepository(tx);
				const testProject = createProjectData();
				const upserted = await projectsRepository.upsert(testProject);

				expect(upserted).toBeDefined();
				expect(upserted.gitlab_id).toBe(testProject.gitlab_id);
				expect(upserted.name).toBe(testProject.name);
			});
		});

		it("should update existing project when it exists", async () => {
			await withTransaction(async (tx) => {
				const projectsRepository = new ProjectsRepository(tx);
				// 既存のプロジェクトを作成
				const testProject = createProjectData();
				const created = await projectsRepository.create(testProject);

				const updatedData: NewProject = createProjectData({
					gitlab_id: testProject.gitlab_id,
					name: "updated-via-upsert",
					description: "Updated via upsert",
				});

				const upserted = await projectsRepository.upsert(updatedData);

				expect(upserted.id).toBe(created.id);
				expect(upserted.name).toBe(updatedData.name);
				expect(upserted.description).toBe(updatedData.description);
			});
		});

		it("should throw error when GitLab ID is missing", async () => {
			await withTransaction(async (tx) => {
				const projectsRepository = new ProjectsRepository(tx);
				const validData = createProjectData();
				const invalidData = { ...validData };
				// biome-ignore lint/suspicious/noExplicitAny: テスト用途での型回避のため必要
				delete (invalidData as any).gitlab_id;

				await expect(projectsRepository.upsert(invalidData)).rejects.toThrow(
					"GitLab IDが必要です",
				);
			});
		});
	});
});

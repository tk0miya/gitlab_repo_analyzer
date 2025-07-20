import { afterAll, describe, expect, it } from "vitest";
import { closeConnection } from "../connection.js";
import { CommitsRepository } from "../repositories/commits.js";
import { ProjectsRepository } from "../repositories/projects.js";
import type { NewCommit } from "../schema/commits.js";
import { withTransaction } from "../utils/transaction.js";
import {
	createCommitData,
	createMultipleCommitsData,
	createProjectData,
} from "./factories/index.js";

describe("Commits Repository", () => {
	afterAll(async () => {
		await closeConnection();
	});

	// ==================== CREATE操作 ====================

	describe("create", () => {
		it("should create a new commit", async () => {
			await withTransaction(async (tx) => {
				const projectsRepository = new ProjectsRepository(tx);
				const commitsRepository = new CommitsRepository(tx);

				// テスト用プロジェクトを作成
				const testProject = createProjectData();
				const createdProject = await projectsRepository.create(testProject);

				const testCommit = createCommitData({ project_id: createdProject.id });
				const created = await commitsRepository.create(testCommit);

				expect(created).toBeDefined();
				expect(created.id).toBeDefined();
				expect(created.project_id).toBe(testCommit.project_id);
				expect(created.sha).toBe(testCommit.sha);
				expect(created.message).toBe(testCommit.message);
				expect(created.author_name).toBe(testCommit.author_name);
				expect(created.author_email).toBe(testCommit.author_email);
				expect(created.author_date).toEqual(testCommit.author_date);
				expect(created.additions).toBe(testCommit.additions);
				expect(created.deletions).toBe(testCommit.deletions);
				expect(created.created_at).toBeDefined();
			});
		});

		it("should throw error when creation fails", async () => {
			await withTransaction(async (tx) => {
				const commitsRepository = new CommitsRepository(tx);
				// 無効なプロジェクトIDでコミット作成を試行
				const invalidCommit = createCommitData({ project_id: 999999 });

				await expect(commitsRepository.create(invalidCommit)).rejects.toThrow();
			});
		});

		it("should handle duplicate project_id + sha", async () => {
			await withTransaction(async (tx) => {
				const projectsRepository = new ProjectsRepository(tx);
				const commitsRepository = new CommitsRepository(tx);

				// テスト用プロジェクトを作成
				const testProject = createProjectData();
				const createdProject = await projectsRepository.create(testProject);

				const testCommit = createCommitData({ project_id: createdProject.id });
				// 最初のコミットを作成
				const _created = await commitsRepository.create(testCommit);

				// 同じproject_id + shaで別のコミットを作成しようとしてエラーになることを確認
				await expect(commitsRepository.create(testCommit)).rejects.toThrow();
			});
		});
	});

	describe("bulkInsert", () => {
		it("should insert multiple commits", async () => {
			await withTransaction(async (tx) => {
				const projectsRepository = new ProjectsRepository(tx);
				const commitsRepository = new CommitsRepository(tx);

				// テスト用プロジェクトを作成
				const testProject = createProjectData();
				const createdProject = await projectsRepository.create(testProject);

				const testCommits = createMultipleCommitsData(3, {
					project_id: createdProject.id,
				});

				const created = await commitsRepository.bulkInsert(testCommits);

				expect(created).toHaveLength(3);
				expect(created[0].id).toBeDefined();
				expect(created[1].id).toBeDefined();
				expect(created[2].id).toBeDefined();

				// 各コミットが正しく作成されていることを確認
				for (const commit of created) {
					expect(commit.project_id).toBe(createdProject.id);
					expect(commit.sha).toBeDefined();
					expect(commit.message).toBeDefined();
				}
			});
		});

		it("should handle empty array", async () => {
			await withTransaction(async (tx) => {
				const commitsRepository = new CommitsRepository(tx);
				const created = await commitsRepository.bulkInsert([]);
				expect(created).toHaveLength(0);
			});
		});
	});

	describe("upsertBySha", () => {
		it("should create new commit when it doesn't exist", async () => {
			await withTransaction(async (tx) => {
				const projectsRepository = new ProjectsRepository(tx);
				const commitsRepository = new CommitsRepository(tx);

				// テスト用プロジェクトを作成
				const testProject = createProjectData();
				const createdProject = await projectsRepository.create(testProject);

				const testCommit = createCommitData({ project_id: createdProject.id });
				const upserted = await commitsRepository.upsertBySha(
					createdProject.id,
					testCommit,
				);

				expect(upserted).toBeDefined();
				expect(upserted.project_id).toBe(createdProject.id);
				expect(upserted.sha).toBe(testCommit.sha);
				expect(upserted.message).toBe(testCommit.message);
			});
		});

		it("should update existing commit when it exists", async () => {
			await withTransaction(async (tx) => {
				const projectsRepository = new ProjectsRepository(tx);
				const commitsRepository = new CommitsRepository(tx);

				// テスト用プロジェクトを作成
				const testProject = createProjectData();
				const createdProject = await projectsRepository.create(testProject);

				// 既存のコミットを作成
				const testCommit = createCommitData({ project_id: createdProject.id });
				const created = await commitsRepository.create(testCommit);

				const updatedData: NewCommit = createCommitData({
					project_id: createdProject.id,
					sha: testCommit.sha,
					message: "upsertで更新されたメッセージ",
					author_name: "upsertで更新されたユーザー",
				});

				const upserted = await commitsRepository.upsertBySha(
					createdProject.id,
					updatedData,
				);

				expect(upserted.id).toBe(created.id);
				expect(upserted.message).toBe(updatedData.message);
				expect(upserted.author_name).toBe(updatedData.author_name);
			});
		});

		it("should throw error when SHA is missing", async () => {
			await withTransaction(async (tx) => {
				const commitsRepository = new CommitsRepository(tx);
				const validData = createCommitData();
				const invalidData = { ...validData };
				// biome-ignore lint/suspicious/noExplicitAny: テスト用途での型回避のため必要
				delete (invalidData as any).sha;

				await expect(
					commitsRepository.upsertBySha(1, invalidData),
				).rejects.toThrow("コミットSHAが必要です");
			});
		});
	});

	// ==================== READ操作 ====================

	describe("findById", () => {
		it("should find commit by internal ID", async () => {
			await withTransaction(async (tx) => {
				const projectsRepository = new ProjectsRepository(tx);
				const commitsRepository = new CommitsRepository(tx);

				// テスト用プロジェクトを作成
				const testProject = createProjectData();
				const createdProject = await projectsRepository.create(testProject);

				const testCommit = createCommitData({ project_id: createdProject.id });
				const created = await commitsRepository.create(testCommit);

				const found = await commitsRepository.findById(created.id);

				expect(found).toBeDefined();
				expect(found?.id).toBe(created.id);
				expect(found?.sha).toBe(testCommit.sha);
			});
		});

		it("should return null for non-existent ID", async () => {
			await withTransaction(async (tx) => {
				const commitsRepository = new CommitsRepository(tx);
				const found = await commitsRepository.findById(999999);
				expect(found).toBeNull();
			});
		});
	});

	describe("findBySha", () => {
		it("should find commit by project ID and SHA", async () => {
			await withTransaction(async (tx) => {
				const projectsRepository = new ProjectsRepository(tx);
				const commitsRepository = new CommitsRepository(tx);

				// テスト用プロジェクトを作成
				const testProject = createProjectData();
				const createdProject = await projectsRepository.create(testProject);

				const testCommit = createCommitData({ project_id: createdProject.id });
				const _created = await commitsRepository.create(testCommit);

				const found = await commitsRepository.findBySha(
					createdProject.id,
					testCommit.sha,
				);

				expect(found).toBeDefined();
				expect(found?.project_id).toBe(createdProject.id);
				expect(found?.sha).toBe(testCommit.sha);
			});
		});

		it("should return null for non-existent project ID + SHA", async () => {
			await withTransaction(async (tx) => {
				const commitsRepository = new CommitsRepository(tx);
				const found = await commitsRepository.findBySha(999999, "nonexistent");
				expect(found).toBeNull();
			});
		});
	});

	describe("findByProject", () => {
		it("should return commits for a project with pagination", async () => {
			await withTransaction(async (tx) => {
				const projectsRepository = new ProjectsRepository(tx);
				const commitsRepository = new CommitsRepository(tx);

				// テスト用プロジェクトを作成
				const testProject = createProjectData();
				const createdProject = await projectsRepository.create(testProject);

				// テストコミットを作成
				const testCommits = createMultipleCommitsData(5, {
					project_id: createdProject.id,
				});
				await commitsRepository.bulkInsert(testCommits);

				const commits = await commitsRepository.findByProject(
					createdProject.id,
					10,
					0,
				);

				expect(Array.isArray(commits)).toBe(true);
				expect(commits.length).toBeGreaterThanOrEqual(5);

				// author_date降順でソートされているかチェック
				for (let i = 1; i < commits.length; i++) {
					expect(commits[i].author_date <= commits[i - 1].author_date).toBe(
						true,
					);
				}
			});
		});

		it("should respect limit parameter", async () => {
			await withTransaction(async (tx) => {
				const projectsRepository = new ProjectsRepository(tx);
				const commitsRepository = new CommitsRepository(tx);

				// テスト用プロジェクトを作成
				const testProject = createProjectData();
				const createdProject = await projectsRepository.create(testProject);

				// テストコミットを作成
				const testCommits = createMultipleCommitsData(5, {
					project_id: createdProject.id,
				});
				await commitsRepository.bulkInsert(testCommits);

				const commits = await commitsRepository.findByProject(
					createdProject.id,
					2,
					0,
				);

				expect(Array.isArray(commits)).toBe(true);
				expect(commits.length).toBeLessThanOrEqual(2);
			});
		});

		it("should respect offset parameter", async () => {
			await withTransaction(async (tx) => {
				const projectsRepository = new ProjectsRepository(tx);
				const commitsRepository = new CommitsRepository(tx);

				// テスト用プロジェクトを作成
				const testProject = createProjectData();
				const createdProject = await projectsRepository.create(testProject);

				// テストコミットを作成
				const testCommits = createMultipleCommitsData(5, {
					project_id: createdProject.id,
				});
				await commitsRepository.bulkInsert(testCommits);

				const firstPage = await commitsRepository.findByProject(
					createdProject.id,
					2,
					0,
				);
				const secondPage = await commitsRepository.findByProject(
					createdProject.id,
					2,
					2,
				);

				// オフセットが動作していることを確認
				if (firstPage.length > 0 && secondPage.length > 0) {
					expect(firstPage[0].id).not.toBe(secondPage[0].id);
				}
			});
		});
	});

	describe("findCommitsByAuthor", () => {
		it("should return commits for a specific author", async () => {
			await withTransaction(async (tx) => {
				const projectsRepository = new ProjectsRepository(tx);
				const commitsRepository = new CommitsRepository(tx);

				// テスト用プロジェクトを作成
				const testProject = createProjectData();
				const createdProject = await projectsRepository.create(testProject);

				const authorEmail = "author@example.com";
				const authorName = "テスト作者";

				// 特定作者のコミットを作成
				const authorCommits = createMultipleCommitsData(3, {
					project_id: createdProject.id,
					author_email: authorEmail,
					author_name: authorName,
				});
				await commitsRepository.bulkInsert(authorCommits);

				// 別の作者のコミットも作成
				const otherCommit = createCommitData({
					project_id: createdProject.id,
					author_email: "other@example.com",
					author_name: "別のユーザー",
				});
				await commitsRepository.create(otherCommit);

				const commits = await commitsRepository.findCommitsByAuthor(
					createdProject.id,
					authorEmail,
					10,
					0,
				);

				expect(Array.isArray(commits)).toBe(true);
				expect(commits.length).toBe(3);

				// すべてのコミットが指定した作者のものであることを確認
				for (const commit of commits) {
					expect(commit.author_email).toBe(authorEmail);
					expect(commit.author_name).toBe(authorName);
				}

				// author_date降順でソートされているかチェック
				for (let i = 1; i < commits.length; i++) {
					expect(commits[i].author_date <= commits[i - 1].author_date).toBe(
						true,
					);
				}
			});
		});

		it("should respect limit and offset parameters", async () => {
			await withTransaction(async (tx) => {
				const projectsRepository = new ProjectsRepository(tx);
				const commitsRepository = new CommitsRepository(tx);

				// テスト用プロジェクトを作成
				const testProject = createProjectData();
				const createdProject = await projectsRepository.create(testProject);

				const authorEmail = "author@example.com";

				// 特定作者のコミットを作成
				const authorCommits = createMultipleCommitsData(5, {
					project_id: createdProject.id,
					author_email: authorEmail,
					author_name: "テスト作者",
				});
				await commitsRepository.bulkInsert(authorCommits);

				const firstPage = await commitsRepository.findCommitsByAuthor(
					createdProject.id,
					authorEmail,
					2,
					0,
				);
				const secondPage = await commitsRepository.findCommitsByAuthor(
					createdProject.id,
					authorEmail,
					2,
					2,
				);

				expect(firstPage.length).toBeLessThanOrEqual(2);
				expect(secondPage.length).toBeLessThanOrEqual(2);

				// 異なるページであることを確認
				if (firstPage.length > 0 && secondPage.length > 0) {
					expect(firstPage[0].id).not.toBe(secondPage[0].id);
				}
			});
		});
	});

	describe("countByProject", () => {
		it("should return total count of commits for a project", async () => {
			await withTransaction(async (tx) => {
				const projectsRepository = new ProjectsRepository(tx);
				const commitsRepository = new CommitsRepository(tx);

				// テスト用プロジェクトを作成
				const testProject = createProjectData();
				const createdProject = await projectsRepository.create(testProject);

				const initialCount = await commitsRepository.countByProject(
					createdProject.id,
				);

				// テストコミットを作成
				const testCommits = createMultipleCommitsData(3, {
					project_id: createdProject.id,
				});
				await commitsRepository.bulkInsert(testCommits);

				const newCount = await commitsRepository.countByProject(
					createdProject.id,
				);
				expect(newCount).toBe(initialCount + 3);
			});
		});
	});

	// ==================== UPDATE操作 ====================

	describe("update", () => {
		it("should update existing commit", async () => {
			await withTransaction(async (tx) => {
				const projectsRepository = new ProjectsRepository(tx);
				const commitsRepository = new CommitsRepository(tx);

				// テスト用プロジェクトを作成
				const testProject = createProjectData();
				const createdProject = await projectsRepository.create(testProject);

				const testCommit = createCommitData({ project_id: createdProject.id });
				const created = await commitsRepository.create(testCommit);

				const updateData = {
					message: "更新されたコミットメッセージ",
					author_name: "更新されたユーザー",
					additions: 20,
					deletions: 10,
				};

				const updated = await commitsRepository.update(created.id, updateData);

				expect(updated).toBeDefined();
				expect(updated?.id).toBe(created.id);
				expect(updated?.message).toBe(updateData.message);
				expect(updated?.author_name).toBe(updateData.author_name);
				expect(updated?.additions).toBe(updateData.additions);
				expect(updated?.deletions).toBe(updateData.deletions);
				expect(updated?.sha).toBe(created.sha); // 変更されていない
			});
		});

		it("should return null for non-existent commit", async () => {
			await withTransaction(async (tx) => {
				const commitsRepository = new CommitsRepository(tx);
				const updated = await commitsRepository.update(999999, {
					message: "test",
				});
				expect(updated).toBeNull();
			});
		});
	});

	// ==================== DELETE操作 ====================

	describe("delete", () => {
		it("should delete existing commit", async () => {
			await withTransaction(async (tx) => {
				const projectsRepository = new ProjectsRepository(tx);
				const commitsRepository = new CommitsRepository(tx);

				// テスト用プロジェクトを作成
				const testProject = createProjectData();
				const createdProject = await projectsRepository.create(testProject);

				const testCommit = createCommitData({ project_id: createdProject.id });
				const created = await commitsRepository.create(testCommit);

				const deleted = await commitsRepository.delete(created.id);
				expect(deleted).toBe(true);

				// 削除されたことを確認
				const found = await commitsRepository.findById(created.id);
				expect(found).toBeNull();
			});
		});

		it("should return false for non-existent commit", async () => {
			await withTransaction(async (tx) => {
				const commitsRepository = new CommitsRepository(tx);
				const deleted = await commitsRepository.delete(999999);
				expect(deleted).toBe(false);
			});
		});
	});
});

import { afterAll, describe, expect, it } from "vitest";
import { closeConnection } from "@/database/connection";
import { commitsRepository } from "@/database/repositories";
import type { NewCommit } from "@/database/schema/commits";
import {
	buildNewCommit,
	buildNewCommits,
	createCommit,
	createCommits,
	createProject,
} from "@/database/testing/factories/index";
import { withTransaction } from "@/database/testing/transaction";

describe("Commits Repository", () => {
	afterAll(async () => {
		await closeConnection();
	});

	// ==================== CREATE操作 ====================

	describe("create", () => {
		it("should create a new commit", async () => {
			await withTransaction(async () => {
				// テスト用プロジェクトを作成
				const project = await createProject();

				const testCommit = buildNewCommit({ project_id: project.id });
				const commit = await commitsRepository.create(testCommit);

				expect(commit).toBeDefined();
				expect(commit.id).toBeDefined();
				expect(commit.project_id).toBe(testCommit.project_id);
				expect(commit.sha).toBe(testCommit.sha);
				expect(commit.message).toBe(testCommit.message);
				expect(commit.author_name).toBe(testCommit.author_name);
				expect(commit.author_email).toBe(testCommit.author_email);
				expect(commit.author_date).toEqual(testCommit.author_date);
				expect(commit.additions).toBe(testCommit.additions);
				expect(commit.deletions).toBe(testCommit.deletions);
				expect(commit.created_at).toBeDefined();
			});
		});

		it("should throw error when creation fails", async () => {
			await withTransaction(async () => {
				// 無効なプロジェクトIDでコミット作成を試行
				const invalidCommit = buildNewCommit({ project_id: 999999 });

				await expect(commitsRepository.create(invalidCommit)).rejects.toThrow();
			});
		});

		it("should handle duplicate project_id + sha", async () => {
			await withTransaction(async () => {
				// テスト用プロジェクトを作成
				const project = await createProject();

				const testCommit = buildNewCommit({ project_id: project.id });
				// 最初のコミットを作成
				const _created = await commitsRepository.create(testCommit);

				// 同じproject_id + shaで別のコミットを作成しようとしてエラーになることを確認
				await expect(commitsRepository.create(testCommit)).rejects.toThrow();
			});
		});
	});

	describe("bulkInsert", () => {
		it("should insert multiple commits", async () => {
			await withTransaction(async () => {
				// テスト用プロジェクトを作成
				const project = await createProject();

				const testCommits = buildNewCommits(3, {
					project_id: project.id,
				});

				const commits = await commitsRepository.bulkInsert(testCommits);

				expect(commits).toHaveLength(3);
				expect(commits[0].id).toBeDefined();
				expect(commits[1].id).toBeDefined();
				expect(commits[2].id).toBeDefined();

				// 各コミットが正しく作成されていることを確認
				for (const commit of commits) {
					expect(commit.project_id).toBe(project.id);
					expect(commit.sha).toBeDefined();
					expect(commit.message).toBeDefined();
				}
			});
		});

		it("should handle empty array", async () => {
			await withTransaction(async () => {
				const commits = await commitsRepository.bulkInsert([]);
				expect(commits).toHaveLength(0);
			});
		});
	});

	describe("upsertBySha", () => {
		it("should create new commit when it doesn't exist", async () => {
			await withTransaction(async () => {
				// テスト用プロジェクトを作成
				const project = await createProject();

				const testCommit = buildNewCommit({ project_id: project.id });
				const upserted = await commitsRepository.upsertBySha(
					project.id,
					testCommit,
				);

				expect(upserted).toBeDefined();
				expect(upserted.project_id).toBe(project.id);
				expect(upserted.sha).toBe(testCommit.sha);
				expect(upserted.message).toBe(testCommit.message);
			});
		});

		it("should update existing commit when it exists", async () => {
			await withTransaction(async () => {
				// テスト用プロジェクトを作成
				const project = await createProject();

				// 既存のコミットを作成
				const testCommit = buildNewCommit({ project_id: project.id });
				const commit = await commitsRepository.create(testCommit);

				const updatedData: NewCommit = buildNewCommit({
					project_id: project.id,
					sha: testCommit.sha,
					message: "upsertで更新されたメッセージ",
					author_name: "upsertで更新されたユーザー",
				});

				const upserted = await commitsRepository.upsertBySha(
					project.id,
					updatedData,
				);

				expect(upserted.id).toBe(commit.id);
				expect(upserted.message).toBe(updatedData.message);
				expect(upserted.author_name).toBe(updatedData.author_name);
			});
		});

		it("should throw error when SHA is missing", async () => {
			await withTransaction(async () => {
				const validData = buildNewCommit();
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
			await withTransaction(async () => {
				// テスト用プロジェクトとコミットを作成
				const project = await createProject();
				const commit = await createCommit({ project_id: project.id });

				const found = await commitsRepository.findById(commit.id);

				expect(found).toBeDefined();
				expect(found?.id).toBe(commit.id);
				expect(found?.sha).toBe(commit.sha);
			});
		});

		it("should return null for non-existent ID", async () => {
			await withTransaction(async () => {
				const found = await commitsRepository.findById(999999);
				expect(found).toBeNull();
			});
		});
	});

	describe("findBySha", () => {
		it("should find commit by project ID and SHA", async () => {
			await withTransaction(async () => {
				// テスト用プロジェクトとコミットを作成
				const project = await createProject();
				const commit = await createCommit({ project_id: project.id });

				const found = await commitsRepository.findBySha(
					commit.project_id,
					commit.sha,
				);

				expect(found).toBeDefined();
				expect(found?.project_id).toBe(commit.project_id);
				expect(found?.sha).toBe(commit.sha);
			});
		});

		it("should return null for non-existent project ID + SHA", async () => {
			await withTransaction(async () => {
				const found = await commitsRepository.findBySha(999999, "nonexistent");
				expect(found).toBeNull();
			});
		});
	});

	describe("findByProject", () => {
		it("should return commits for a project with pagination", async () => {
			await withTransaction(async () => {
				// テスト用プロジェクトを作成
				const project = await createProject();

				// テストコミットを作成
				await createCommits(5, {
					project_id: project.id,
				});

				const commits = await commitsRepository.findByProject(
					project.id,
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
			await withTransaction(async () => {
				// テスト用プロジェクトを作成
				const project = await createProject();

				// テストコミットを作成
				await createCommits(5, {
					project_id: project.id,
				});

				const commits = await commitsRepository.findByProject(project.id, 2, 0);

				expect(Array.isArray(commits)).toBe(true);
				expect(commits.length).toBeLessThanOrEqual(2);
			});
		});

		it("should respect offset parameter", async () => {
			await withTransaction(async () => {
				// テスト用プロジェクトを作成
				const project = await createProject();

				// テストコミットを作成
				await createCommits(5, {
					project_id: project.id,
				});

				const firstPage = await commitsRepository.findByProject(
					project.id,
					2,
					0,
				);
				const secondPage = await commitsRepository.findByProject(
					project.id,
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
			await withTransaction(async () => {
				// テスト用プロジェクトを作成
				const project = await createProject();

				const authorEmail = "author@example.com";
				const authorName = "テスト作者";

				// 特定作者のコミットを作成
				await createCommits(3, {
					project_id: project.id,
					author_email: authorEmail,
					author_name: authorName,
				});

				// 別の作者のコミットも作成
				const otherCommit = buildNewCommit({
					project_id: project.id,
					author_email: "other@example.com",
					author_name: "別のユーザー",
				});
				await commitsRepository.create(otherCommit);

				const commits = await commitsRepository.findCommitsByAuthor(
					project.id,
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
			await withTransaction(async () => {
				// テスト用プロジェクトを作成
				const project = await createProject();

				const authorEmail = "author@example.com";

				// 特定作者のコミットを作成
				await createCommits(5, {
					project_id: project.id,
					author_email: authorEmail,
					author_name: "テスト作者",
				});

				const firstPage = await commitsRepository.findCommitsByAuthor(
					project.id,
					authorEmail,
					2,
					0,
				);
				const secondPage = await commitsRepository.findCommitsByAuthor(
					project.id,
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
			await withTransaction(async () => {
				// テスト用プロジェクトを作成
				const project = await createProject();

				const initialCount = await commitsRepository.countByProject(project.id);

				// テストコミットを作成
				await createCommits(3, {
					project_id: project.id,
				});

				const newCount = await commitsRepository.countByProject(project.id);
				expect(newCount).toBe(initialCount + 3);
			});
		});
	});

	// ==================== UPDATE操作 ====================

	describe("update", () => {
		it("should update existing commit", async () => {
			await withTransaction(async () => {
				// テスト用プロジェクトとコミットを作成
				const project = await createProject();
				const commit = await createCommit({ project_id: project.id });

				const updateData = {
					message: "更新されたコミットメッセージ",
					author_name: "更新されたユーザー",
					additions: 20,
					deletions: 10,
				};

				const updated = await commitsRepository.update(commit.id, updateData);

				expect(updated).toBeDefined();
				expect(updated?.id).toBe(commit.id);
				expect(updated?.message).toBe(updateData.message);
				expect(updated?.author_name).toBe(updateData.author_name);
				expect(updated?.additions).toBe(updateData.additions);
				expect(updated?.deletions).toBe(updateData.deletions);
				expect(updated?.sha).toBe(commit.sha); // 変更されていない
			});
		});

		it("should return null for non-existent commit", async () => {
			await withTransaction(async () => {
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
			await withTransaction(async () => {
				// テスト用プロジェクトとコミットを作成
				const project = await createProject();
				const commit = await createCommit({ project_id: project.id });

				const deleted = await commitsRepository.delete(commit.id);
				expect(deleted).toBe(true);

				// 削除されたことを確認
				const found = await commitsRepository.findById(commit.id);
				expect(found).toBeNull();
			});
		});

		it("should return false for non-existent commit", async () => {
			await withTransaction(async () => {
				const deleted = await commitsRepository.delete(999999);
				expect(deleted).toBe(false);
			});
		});
	});
});

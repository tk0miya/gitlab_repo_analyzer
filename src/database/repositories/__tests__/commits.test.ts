import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { commitsRepository } from "@/database/repositories";
import {
	buildNewCommit,
	buildNewCommits,
	createCommit,
	createCommits,
	createProject,
} from "@/lib/testing/factories";
import { withTransaction } from "@/lib/testing/transaction";

describe("Commits Repository", () => {
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
				expect(commit.authored_date).toEqual(testCommit.authored_date);
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

				// authored_date降順でソートされているかチェック
				for (let i = 1; i < commits.length; i++) {
					expect(commits[i].authored_date <= commits[i - 1].authored_date).toBe(
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

	describe("findAllBySha", () => {
		it("should return commits matching given SHAs", async () => {
			await withTransaction(async () => {
				// テスト用プロジェクトを作成
				const project = await createProject();

				// テストコミットを作成
				const commit1 = await createCommit({ project_id: project.id });
				const commit2 = await createCommit({ project_id: project.id });
				const commit3 = await createCommit({ project_id: project.id });

				// SHA配列で検索
				const targetShas = [commit1.sha, commit3.sha];
				const commits = await commitsRepository.findAllBySha(targetShas);

				expect(Array.isArray(commits)).toBe(true);
				expect(commits.length).toBe(2);

				const foundShas = commits.map((c) => c.sha);
				expect(foundShas).toContain(commit1.sha);
				expect(foundShas).toContain(commit3.sha);
				expect(foundShas).not.toContain(commit2.sha);
			});
		});

		it("should return empty array when no SHAs provided", async () => {
			await withTransaction(async () => {
				const commits = await commitsRepository.findAllBySha([]);

				expect(Array.isArray(commits)).toBe(true);
				expect(commits.length).toBe(0);
			});
		});

		it("should return empty array when no matching commits found", async () => {
			await withTransaction(async () => {
				// コミットを作成してDBに存在しないSHAがあることを明確にする
				const project = await createProject();
				// 実際にコミットを作成して、異なるSHAで検索することで
				// コミットが存在するが一致しない場合をテスト
				await createCommit({ project_id: project.id, sha: "existing-sha" });

				const commits = await commitsRepository.findAllBySha([
					"nonexistent-sha-1",
					"nonexistent-sha-2",
				]);

				expect(Array.isArray(commits)).toBe(true);
				expect(commits.length).toBe(0);
			});
		});

		it("should return commits from all projects when searching by SHA", async () => {
			await withTransaction(async () => {
				// 2つのプロジェクトを作成
				const project1 = await createProject();
				const project2 = await createProject();

				// 各プロジェクトにコミットを作成
				const commit1 = await createCommit({ project_id: project1.id });
				const commit2 = await createCommit({ project_id: project2.id });

				// 両方のコミットを検索（プロジェクトに関係なく取得される）
				const commits = await commitsRepository.findAllBySha([
					commit1.sha,
					commit2.sha,
				]);

				expect(Array.isArray(commits)).toBe(true);
				expect(commits.length).toBe(2);

				const foundShas = commits.map((c) => c.sha);
				expect(foundShas).toContain(commit1.sha);
				expect(foundShas).toContain(commit2.sha);
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

	// ==================== 統計操作 ====================

	describe("getMonthlyCommitStats", () => {
		it("should return monthly commit counts for a project", async () => {
			await withTransaction(async () => {
				// テスト用プロジェクトを作成
				const project = await createProject();

				// 異なる月のコミットを作成（1月に3件、2月に2件、3月に1件）
				await createCommit({
					project_id: project.id,
					authored_date: new Date("2024-01-15T10:00:00Z"),
				});
				await createCommit({
					project_id: project.id,
					authored_date: new Date("2024-01-20T10:00:00Z"),
				});
				await createCommit({
					project_id: project.id,
					authored_date: new Date("2024-01-25T10:00:00Z"),
				});
				await createCommit({
					project_id: project.id,
					authored_date: new Date("2024-02-10T10:00:00Z"),
				});
				await createCommit({
					project_id: project.id,
					authored_date: new Date("2024-02-20T10:00:00Z"),
				});
				await createCommit({
					project_id: project.id,
					authored_date: new Date("2024-03-05T10:00:00Z"),
				});

				// 月別コミット数を取得
				const result = await commitsRepository.getMonthlyCommitStats(
					project.id,
				);

				// 結果の検証
				expect(result).toHaveLength(3); // 2024-01, 2024-02, 2024-03

				const janData = result.find((item) => item.period === "2024-01");
				const febData = result.find((item) => item.period === "2024-02");
				const marData = result.find((item) => item.period === "2024-03");

				expect(janData).toBeDefined();
				expect(janData?.count).toBe(3);

				expect(febData).toBeDefined();
				expect(febData?.count).toBe(2);

				expect(marData).toBeDefined();
				expect(marData?.count).toBe(1);
			});
		});

		it("should return empty array for project with no commits", async () => {
			await withTransaction(async () => {
				// コミットのないプロジェクトを作成
				const project = await createProject();

				const result = await commitsRepository.getMonthlyCommitStats(
					project.id,
				);

				expect(result).toEqual([]);
			});
		});

		it("should return empty array for non-existent project", async () => {
			await withTransaction(async () => {
				const result = await commitsRepository.getMonthlyCommitStats(999999);

				expect(result).toEqual([]);
			});
		});

		it("should sort results by month in ascending order", async () => {
			await withTransaction(async () => {
				// テスト用プロジェクトを作成
				const project = await createProject();

				// 時系列が逆順の複数の月のコミットを作成
				await createCommit({
					project_id: project.id,
					authored_date: new Date("2024-03-15T10:00:00Z"),
				});
				await createCommit({
					project_id: project.id,
					authored_date: new Date("2024-01-15T10:00:00Z"),
				});
				await createCommit({
					project_id: project.id,
					authored_date: new Date("2024-02-15T10:00:00Z"),
				});

				const result = await commitsRepository.getMonthlyCommitStats(
					project.id,
				);

				// 月順でソートされていることを確認
				expect(result).toHaveLength(3);
				expect(result[0].period).toBe("2024-01");
				expect(result[1].period).toBe("2024-02");
				expect(result[2].period).toBe("2024-03");
			});
		});
	});

	// ==================== 週別コミット数の取得 ====================

	describe("getWeeklyCommitStats", () => {
		beforeEach(() => {
			// 現在時刻を2024年6月1日に固定（2年前フィルターのテストのため）
			vi.useFakeTimers({ now: new Date("2024-06-01T00:00:00Z") });
		});

		afterEach(() => {
			vi.useRealTimers();
		});

		it("should return weekly commit counts, sort by week, and filter last 2 years", async () => {
			await withTransaction(async () => {
				// テスト用プロジェクトを作成
				const project = await createProject();

				// 固定日時を使用（時系列が逆順で、異なる週のコミット）
				// 2024年第3週（1月15日〜21日）
				await createCommit({
					project_id: project.id,
					authored_date: new Date("2024-01-15T10:00:00Z"),
				});
				// 2024年第1週（1月1日〜7日）
				await createCommit({
					project_id: project.id,
					authored_date: new Date("2024-01-02T10:00:00Z"),
				});
				await createCommit({
					project_id: project.id,
					authored_date: new Date("2024-01-03T10:00:00Z"),
				});
				// 2024年第2週（1月8日〜14日）
				await createCommit({
					project_id: project.id,
					authored_date: new Date("2024-01-08T10:00:00Z"),
				});

				// 3年前のコミット（除外される）
				await createCommit({
					project_id: project.id,
					authored_date: new Date("2021-01-15T10:00:00Z"),
				});

				const result = await commitsRepository.getWeeklyCommitStats(project.id);

				// 結果の検証：2年以内のコミットのみが含まれる
				expect(result).toHaveLength(3); // 3年前のコミットは除外される

				// 週順でソートされていることを確認
				expect(result[0].period).toBe("2024-01");
				expect(result[1].period).toBe("2024-02");
				expect(result[2].period).toBe("2024-03");

				// カウントの確認
				expect(result[0].count).toBe(2); // 第1週: 2件
				expect(result[1].count).toBe(1); // 第2週: 1件
				expect(result[2].count).toBe(1); // 第3週: 1件
			});
		});

		it("should return empty array when no commits exist", async () => {
			await withTransaction(async () => {
				// テスト用プロジェクトを作成（コミットは作成しない）
				const project = await createProject();

				const result = await commitsRepository.getWeeklyCommitStats(project.id);

				expect(result).toEqual([]);
			});
		});

		it("should return empty array for non-existent project", async () => {
			await withTransaction(async () => {
				const result = await commitsRepository.getWeeklyCommitStats(999999);

				expect(result).toEqual([]);
			});
		});
	});
});

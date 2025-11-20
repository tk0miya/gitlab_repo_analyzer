import { describe, expect, it } from "vitest";
import { commitsRepository, projectsRepository } from "@/database/index";
import { buildNewCommit, buildNewProject } from "@/lib/testing/factories";
import { withTransaction } from "@/lib/testing/transaction";

describe("CommitsRepository - getCommitterRanking", () => {
	it("全期間のコミッターランキングを取得できる", async () => {
		await withTransaction(async () => {
			// テスト用プロジェクトを作成
			const project = await projectsRepository.create(
				buildNewProject({
					name: "Test Project",
				}),
			);

			// 異なる作者のコミットを作成
			const now = new Date();

			// ユーザー1: 5コミット
			for (let i = 0; i < 5; i++) {
				await commitsRepository.create(
					buildNewCommit({
						project_id: project.id,
						sha: `user1-commit-${i}`,
						author_name: "User One",
						author_email: "user1@example.com",
						authored_date: new Date(now.getTime() - i * 24 * 60 * 60 * 1000),
					}),
				);
			}

			// ユーザー2: 3コミット
			for (let i = 0; i < 3; i++) {
				await commitsRepository.create(
					buildNewCommit({
						project_id: project.id,
						sha: `user2-commit-${i}`,
						author_name: "User Two",
						author_email: "user2@example.com",
						authored_date: new Date(now.getTime() - i * 24 * 60 * 60 * 1000),
					}),
				);
			}

			// ユーザー3: 1コミット
			await commitsRepository.create(
				buildNewCommit({
					project_id: project.id,
					sha: "user3-commit-1",
					author_name: "User Three",
					author_email: "user3@example.com",
					authored_date: now,
				}),
			);

			// ランキングを取得
			const rankings = await commitsRepository.getCommitterRanking(
				project.id,
				"all",
			);

			// 検証
			expect(rankings).toHaveLength(3);
			expect(rankings[0]).toEqual({
				rank: 1,
				authorName: "User One",
				authorEmail: "user1@example.com",
				commitCount: 5,
			});
			expect(rankings[1]).toEqual({
				rank: 2,
				authorName: "User Two",
				authorEmail: "user2@example.com",
				commitCount: 3,
			});
			expect(rankings[2]).toEqual({
				rank: 3,
				authorName: "User Three",
				authorEmail: "user3@example.com",
				commitCount: 1,
			});
		});
	});

	it("直近1年のコミッターランキングを取得できる", async () => {
		await withTransaction(async () => {
			// テスト用プロジェクトを作成
			const project = await projectsRepository.create(
				buildNewProject({
					name: "Test Project",
				}),
			);

			const now = new Date();
			const twoYearsAgo = new Date(now);
			twoYearsAgo.setFullYear(now.getFullYear() - 2);
			const sixMonthsAgo = new Date(now);
			sixMonthsAgo.setMonth(now.getMonth() - 6);

			// 2年前のコミット（ランキングに含まれない）
			await commitsRepository.create(
				buildNewCommit({
					project_id: project.id,
					sha: "old-commit",
					author_name: "Old User",
					author_email: "old@example.com",
					authored_date: twoYearsAgo,
				}),
			);

			// 6ヶ月前のコミット（ランキングに含まれる）
			await commitsRepository.create(
				buildNewCommit({
					project_id: project.id,
					sha: "recent-commit-1",
					author_name: "Recent User",
					author_email: "recent@example.com",
					authored_date: sixMonthsAgo,
				}),
			);

			// 最近のコミット（ランキングに含まれる）
			await commitsRepository.create(
				buildNewCommit({
					project_id: project.id,
					sha: "recent-commit-2",
					author_name: "Recent User",
					author_email: "recent@example.com",
					authored_date: now,
				}),
			);

			// 1年のランキングを取得
			const rankings = await commitsRepository.getCommitterRanking(
				project.id,
				"year",
			);

			// 検証：古いコミットは含まれない
			expect(rankings).toHaveLength(1);
			expect(rankings[0]).toEqual({
				rank: 1,
				authorName: "Recent User",
				authorEmail: "recent@example.com",
				commitCount: 2,
			});
		});
	});

	it("直近半年のコミッターランキングを取得できる", async () => {
		await withTransaction(async () => {
			// テスト用プロジェクトを作成
			const project = await projectsRepository.create(
				buildNewProject({
					name: "Test Project",
				}),
			);

			const now = new Date();
			const eightMonthsAgo = new Date(now);
			eightMonthsAgo.setMonth(now.getMonth() - 8);
			const threeMonthsAgo = new Date(now);
			threeMonthsAgo.setMonth(now.getMonth() - 3);

			// 8ヶ月前のコミット（ランキングに含まれない）
			await commitsRepository.create(
				buildNewCommit({
					project_id: project.id,
					sha: "old-commit",
					author_name: "Old User",
					author_email: "old@example.com",
					authored_date: eightMonthsAgo,
				}),
			);

			// 3ヶ月前のコミット（ランキングに含まれる）
			for (let i = 0; i < 2; i++) {
				await commitsRepository.create(
					buildNewCommit({
						project_id: project.id,
						sha: `recent-commit-${i}`,
						author_name: "Recent User",
						author_email: "recent@example.com",
						authored_date: threeMonthsAgo,
					}),
				);
			}

			// 半年のランキングを取得
			const rankings = await commitsRepository.getCommitterRanking(
				project.id,
				"halfYear",
			);

			// 検証
			expect(rankings).toHaveLength(1);
			expect(rankings[0].commitCount).toBe(2);
		});
	});

	it("直近1ヶ月のコミッターランキングを取得できる", async () => {
		await withTransaction(async () => {
			// テスト用プロジェクトを作成
			const project = await projectsRepository.create(
				buildNewProject({
					name: "Test Project",
				}),
			);

			const now = new Date();
			const twoMonthsAgo = new Date(now);
			twoMonthsAgo.setMonth(now.getMonth() - 2);
			const twoWeeksAgo = new Date(now);
			twoWeeksAgo.setDate(now.getDate() - 14);

			// 2ヶ月前のコミット（ランキングに含まれない）
			await commitsRepository.create(
				buildNewCommit({
					project_id: project.id,
					sha: "old-commit",
					author_name: "Old User",
					author_email: "old@example.com",
					authored_date: twoMonthsAgo,
				}),
			);

			// 2週間前のコミット（ランキングに含まれる）
			await commitsRepository.create(
				buildNewCommit({
					project_id: project.id,
					sha: "recent-commit",
					author_name: "Recent User",
					author_email: "recent@example.com",
					authored_date: twoWeeksAgo,
				}),
			);

			// 1ヶ月のランキングを取得
			const rankings = await commitsRepository.getCommitterRanking(
				project.id,
				"month",
			);

			// 検証
			expect(rankings).toHaveLength(1);
			expect(rankings[0].authorEmail).toBe("recent@example.com");
		});
	});

	it("上位10名までのランキングを返す", async () => {
		await withTransaction(async () => {
			// テスト用プロジェクトを作成
			const project = await projectsRepository.create(
				buildNewProject({
					name: "Test Project",
				}),
			);

			// 15人の異なるユーザーのコミットを作成
			for (let i = 0; i < 15; i++) {
				const commitCount = 15 - i; // 降順でコミット数を設定
				for (let j = 0; j < commitCount; j++) {
					await commitsRepository.create(
						buildNewCommit({
							project_id: project.id,
							sha: `user${i}-commit-${j}`,
							author_name: `User ${i}`,
							author_email: `user${i}@example.com`,
							authored_date: new Date(),
						}),
					);
				}
			}

			// ランキングを取得
			const rankings = await commitsRepository.getCommitterRanking(
				project.id,
				"all",
				10,
			);

			// 検証：上位10名のみ
			expect(rankings).toHaveLength(10);
			expect(rankings[0].commitCount).toBe(15);
			expect(rankings[9].commitCount).toBe(6);
		});
	});

	it("コミットがない場合は空配列を返す", async () => {
		await withTransaction(async () => {
			// テスト用プロジェクトを作成
			const project = await projectsRepository.create(
				buildNewProject({
					name: "Test Project",
				}),
			);

			const rankings = await commitsRepository.getCommitterRanking(
				project.id,
				"all",
			);
			expect(rankings).toEqual([]);
		});
	});

	it("異なるプロジェクトのコミットは含まれない", async () => {
		await withTransaction(async () => {
			// テスト用プロジェクトを作成
			const project = await projectsRepository.create(
				buildNewProject({
					name: "Test Project",
				}),
			);

			// 別のプロジェクトを作成
			const otherProject = await projectsRepository.create(
				buildNewProject({
					name: "Other Project",
					gitlab_id: 999,
				}),
			);

			// 両方のプロジェクトにコミットを作成
			await commitsRepository.create(
				buildNewCommit({
					project_id: project.id,
					sha: "project1-commit",
					author_name: "User",
					author_email: "user@example.com",
				}),
			);

			await commitsRepository.create(
				buildNewCommit({
					project_id: otherProject.id,
					sha: "project2-commit",
					author_name: "User",
					author_email: "user@example.com",
				}),
			);

			// プロジェクト1のランキングを取得
			const rankings = await commitsRepository.getCommitterRanking(
				project.id,
				"all",
			);

			// 検証：プロジェクト1のコミットのみ
			expect(rankings).toHaveLength(1);
			expect(rankings[0].commitCount).toBe(1);
		});
	});
});

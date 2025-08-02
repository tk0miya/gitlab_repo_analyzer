import { afterAll, describe, expect, it } from "vitest";
import { closeConnection, getDb, transaction } from "@/database/connection";
import { ProjectsRepository } from "@/database/repositories/projects";
import { createProject } from "@/database/testing/factories/index";
import { withTransaction } from "@/database/testing/transaction";

describe("connection.ts", () => {
	afterAll(async () => {
		await closeConnection();
	});

	describe("getDb()", () => {
		it("トランザクション外では通常のデータベース接続を返す", async () => {
			const db = await getDb();
			expect(db).toBeDefined();
			expect(typeof db.select).toBe("function");
		});

		it("トランザクション内では透過的にトランザクションコンテキストを返す", async () => {
			await withTransaction(async () => {
				const repo = new ProjectsRepository();

				await transaction(async () => {
					await createProject({
						name: "Context Test Project",
						gitlab_id: 10005,
					});

					// 同じトランザクション内で検索すると見つかる
					const projects = await repo.findAll();
					const contextProjects = projects.filter(
						(p) => p.name === "Context Test Project",
					);
					expect(contextProjects).toHaveLength(1);
				});
			});
		});

		it("ネストしたトランザクション内でも適切なコンテキストを返す", async () => {
			await withTransaction(async () => {
				const repo = new ProjectsRepository();

				// 外側のトランザクションでデータ作成
				await createProject({
					name: "Outer Context Project",
					gitlab_id: 10006,
				});

				await transaction(async () => {
					// 内側のトランザクションでデータ作成
					await createProject({
						name: "Inner Context Project",
						gitlab_id: 10007,
					});

					// 内側のトランザクションで両方が見える
					const projects = await repo.findAll();
					const testProjects = projects.filter(
						(p) =>
							p.name === "Outer Context Project" ||
							p.name === "Inner Context Project",
					);
					expect(testProjects).toHaveLength(2);
				});
			});
		});
	});

	describe("transaction()", () => {
		it("正常に実行された場合はコミットされる", async () => {
			await withTransaction(async () => {
				const repo = new ProjectsRepository();
				const initialProjects = await repo.findAll();
				const initialCount = initialProjects.length;

				let createdProject: { id: number; name: string } | undefined;
				await transaction(async () => {
					createdProject = await createProject({
						name: "Production Test Project",
						gitlab_id: 10001,
					});
				});

				// transaction完了後にプロジェクトが作成されていることを確認
				const finalProjects = await repo.findAll();
				const persistedProjects = finalProjects.filter(
					(p) => p.name === "Production Test Project",
				);

				expect(persistedProjects).toHaveLength(1);
				expect(createdProject).toBeDefined();
				expect(persistedProjects[0].id).toBe(createdProject?.id);
				expect(finalProjects.length).toBe(initialCount + 1);
			});
		});

		it("エラーが発生した場合は自動的にロールバックされる", async () => {
			let transactionError: Error | null = null;

			try {
				await transaction(async () => {
					await createProject({
						name: "Will be rolled back",
						gitlab_id: 11001,
					});

					throw new Error("Transaction should rollback");
				});
			} catch (error) {
				transactionError = error as Error;
			}

			expect(transactionError?.message).toBe("Transaction should rollback");

			// データがロールバックされていることを確認
			const repo = new ProjectsRepository();
			const allProjects = await repo.findAll();
			const rollbackProjects = allProjects.filter(
				(p) => p.name === "Will be rolled back",
			);
			expect(rollbackProjects).toHaveLength(0);
		});

		it("ネストしたトランザクションでデータベース操作が正しく動作する", async () => {
			await transaction(async () => {
				const repo = new ProjectsRepository();

				const outerProject = await createProject({
					name: "Outer Transaction Project",
					gitlab_id: 12001,
				});

				await transaction(async () => {
					const innerProject = await createProject({
						name: "Inner Transaction Project",
						gitlab_id: 12020,
					});

					// 両方のプロジェクトが見える
					const foundOuter = await repo.findById(outerProject.id);
					const foundInner = await repo.findById(innerProject.id);

					expect(foundOuter?.name).toBe("Outer Transaction Project");
					expect(foundInner?.name).toBe("Inner Transaction Project");
				});

				// 内側のトランザクション終了後も両方見える
				const foundOuter = await repo.findById(outerProject.id);
				expect(foundOuter?.name).toBe("Outer Transaction Project");

				// クリーンアップ - 内側のトランザクションで作成されたプロジェクトも削除
				const allTestProjects = await repo.findAll();
				const createdProjects = allTestProjects.filter(
					(p) =>
						p.name === "Outer Transaction Project" ||
						p.name === "Inner Transaction Project",
				);
				for (const project of createdProjects) {
					await repo.delete(project.id);
				}
			});
		});

		it("ネストしたトランザクションでエラーが発生した場合のロールバック", async () => {
			let outerProjectCreated = false;

			try {
				await transaction(async () => {
					await createProject({
						name: "Outer Before Error",
						gitlab_id: 12004,
					});
					outerProjectCreated = true;

					await transaction(async () => {
						await createProject({
							name: "Inner Before Error",
							gitlab_id: 12005,
						});

						throw new Error("Inner transaction error");
					});
				});
			} catch (error) {
				expect((error as Error).message).toBe("Inner transaction error");
			}

			// エラーにより全体がロールバックされる
			expect(outerProjectCreated).toBe(true);

			// データベースには何も残らない
			const repo = new ProjectsRepository();
			const allProjects = await repo.findAll();
			const errorProjects = allProjects.filter(
				(p) =>
					p.name === "Outer Before Error" || p.name === "Inner Before Error",
			);
			expect(errorProjects).toHaveLength(0);
		});
	});
});

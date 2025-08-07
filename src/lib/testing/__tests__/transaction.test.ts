import { describe, expect, it } from "vitest";
import { transaction } from "@/database/connection";
import { projectsRepository } from "@/database/repositories";
import { createProject } from "@/lib/testing/factories";
import { withTransaction } from "@/lib/testing/transaction";

describe("withTransaction(): テスト用トランザクション", () => {
	it("処理成功時にロールバックが発生すること", async () => {
		let executionReached = false;

		await withTransaction(async () => {
			executionReached = true;
			await createProject({
				name: "Success but rolled back",
				gitlab_id: 11002,
			});
		});

		// 処理は正常に完了している
		expect(executionReached).toBe(true);

		// しかしデータはロールバックされて存在しない（withTransactionの仕様）
		const projects = await projectsRepository.findAll();
		const testProjects = projects.filter(
			(p) => p.name === "Success but rolled back",
		);
		expect(testProjects).toHaveLength(0);
	});

	it("処理失敗時にもロールバックが発生すること、例外がそのまま投げられること", async () => {
		let executionReached = false;
		let caughtError: Error | null = null;

		try {
			await withTransaction(async () => {
				executionReached = true;
				await createProject({
					name: "Error and rolled back",
					gitlab_id: 11003,
				});

				// 意図的にエラーを発生
				throw new Error("Test error in withTransaction");
			});
		} catch (error) {
			caughtError = error as Error;
		}

		// 処理は実行され、例外も正しく投げられている
		expect(executionReached).toBe(true);
		expect(caughtError?.message).toBe("Test error in withTransaction");

		// データはロールバックされて存在しない
		const projects = await projectsRepository.findAll();
		const testProjects = projects.filter(
			(p) => p.name === "Error and rolled back",
		);
		expect(testProjects).toHaveLength(0);
	});

	it("withTransaction内でtransaction()を使用する想定パターン", async () => {
		await withTransaction(async () => {
			// 想定パターン: withTransaction内でtransactionを使用（本番処理の呼び出し）
			await transaction(async () => {
				await createProject({
					name: "Nested Transaction Project",
					gitlab_id: 11004,
				});

				// transaction内で作成されたデータが見える
				const projects = await projectsRepository.findAll();
				const nestedProjects = projects.filter(
					(p) => p.name === "Nested Transaction Project",
				);
				expect(nestedProjects).toHaveLength(1);
			});

			// transaction完了後、withTransactionスコープ内ではデータが見える
			const projects = await projectsRepository.findAll();
			const nestedProjects = projects.filter(
				(p) => p.name === "Nested Transaction Project",
			);
			expect(nestedProjects).toHaveLength(1);
		});

		// withTransaction完了後はデータが存在しない（強制ロールバックされた）
		const projects = await projectsRepository.findAll();
		const nestedProjects = projects.filter(
			(p) => p.name === "Nested Transaction Project",
		);
		expect(nestedProjects).toHaveLength(0);
	});
});

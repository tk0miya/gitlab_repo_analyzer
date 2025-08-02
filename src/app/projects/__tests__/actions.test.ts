import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import { closeConnection } from "@/database/connection";
import { ProjectsRepository } from "@/database/repositories/projects";
import { createProject } from "@/database/testing/factories";
import { withTransaction } from "@/database/testing/transaction";
import { getProjects } from "../actions";

describe("getProjects Server Action", () => {
	afterAll(async () => {
		await closeConnection();
	});

	afterEach(() => {
		// すべてのモックを自動復元
		vi.restoreAllMocks();
	});

	it("プロジェクト一覧を正常に取得できる", async () => {
		await withTransaction(async () => {
			// テストデータを作成
			await createProject({ name: "プロジェクトA" });
			await createProject({ name: "プロジェクトB" });

			// Server Actionを実行
			const result = await getProjects();

			// プロジェクトが取得できることを確認
			expect(result).toHaveLength(2);
			expect(result.map((p) => p.name)).toEqual([
				"プロジェクトA",
				"プロジェクトB",
			]);
		});
	});

	it("データベースエラー時に適切なエラーを投げる", async () => {
		// spyOnを使用してfindAllメソッドをモック
		const findAllSpy = vi
			.spyOn(ProjectsRepository.prototype, "findAll")
			.mockRejectedValue(new Error("Database connection failed"));

		// エラーが適切に投げられることを確認
		await expect(getProjects()).rejects.toThrow(
			"プロジェクト一覧の取得に失敗しました",
		);

		// メソッドが呼び出されたことを確認
		expect(findAllSpy).toHaveBeenCalledOnce();
	});
});

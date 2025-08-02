import { afterAll, describe, expect, it, vi } from "vitest";
import { closeConnection } from "@/database/connection";
import { ProjectsRepository } from "@/database/repositories/projects";
import { createProjectData } from "@/database/testing/factories";
import { withTransaction } from "@/database/testing/transaction";
import { getProjects } from "../actions";

describe("getProjects Server Action", () => {
	afterAll(async () => {
		await closeConnection();
	});

	it("プロジェクト一覧を正常に取得できる", async () => {
		await withTransaction(async () => {
			const projectsRepository = new ProjectsRepository();

			// テストデータを作成
			await projectsRepository.create(
				createProjectData({ name: "プロジェクトA" }),
			);
			await projectsRepository.create(
				createProjectData({ name: "プロジェクトB" }),
			);

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
		// ProjectsRepositoryのfindAllメソッドをモックしてエラーを発生させる
		const originalFindAll = ProjectsRepository.prototype.findAll;
		ProjectsRepository.prototype.findAll = vi
			.fn()
			.mockRejectedValue(new Error("Database connection failed"));

		try {
			// エラーが適切に投げられることを確認
			await expect(getProjects()).rejects.toThrow(
				"プロジェクト一覧の取得に失敗しました",
			);
		} finally {
			// モックを元に戻す
			ProjectsRepository.prototype.findAll = originalFindAll;
		}
	});
});

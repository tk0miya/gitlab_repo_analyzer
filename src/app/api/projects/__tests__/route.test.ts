import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/projects/route";
import { createMultipleRegisteredProjectsData } from "@/database/testing/factories/index";
import type { Project } from "@/types/api";

// モジュールをモック
vi.mock("@/database/index", () => ({
	projectsRepository: {
		findAll: vi.fn(),
	},
}));

// モックを取得
const { projectsRepository } = await import("@/database/index");

describe("/api/projects（App Router）", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("GET /api/projects", () => {
		it("プロジェクト一覧を返す", async () => {
			// ファクトリーでテストデータを準備
			const mockProjects: Project[] = createMultipleRegisteredProjectsData(2, {
				description: "Test description", // 最初のプロジェクトのベース説明
			});

			// 2つ目のプロジェクトはdescriptionをnullに設定
			mockProjects[1] = {
				...mockProjects[1],
				description: null,
				default_branch: "develop",
				visibility: "private",
			};

			vi.mocked(projectsRepository.findAll).mockResolvedValue(mockProjects);

			const response = await GET();

			expect(response.status).toBe(200);

			const responseData = await response.json();
			expect(responseData).toMatchObject({
				success: true,
				timestamp: expect.any(String),
				data: expect.arrayContaining([
					expect.objectContaining({
						id: mockProjects[0].id,
						gitlab_id: mockProjects[0].gitlab_id,
						name: mockProjects[0].name,
						description: mockProjects[0].description,
						web_url: mockProjects[0].web_url,
						default_branch: mockProjects[0].default_branch,
						visibility: mockProjects[0].visibility,
					}),
					expect.objectContaining({
						id: mockProjects[1].id,
						gitlab_id: mockProjects[1].gitlab_id,
						name: mockProjects[1].name,
						description: mockProjects[1].description,
						web_url: mockProjects[1].web_url,
						default_branch: mockProjects[1].default_branch,
						visibility: mockProjects[1].visibility,
					}),
				]),
			});

			// タイムスタンプが有効なISO文字列であることを確認
			expect(() =>
				new Date(responseData.timestamp).toISOString(),
			).not.toThrow();

			// repositoryのfindAllが呼び出されたことを確認
			expect(projectsRepository.findAll).toHaveBeenCalledTimes(1);
			expect(projectsRepository.findAll).toHaveBeenCalledWith();
		});

		it("空のプロジェクト一覧を返す", async () => {
			vi.mocked(projectsRepository.findAll).mockResolvedValue([]);

			const response = await GET();

			expect(response.status).toBe(200);

			const responseData = await response.json();
			expect(responseData).toMatchObject({
				success: true,
				timestamp: expect.any(String),
				data: [],
			});
		});

		it("データベースエラー時に500エラーを返す", async () => {
			const errorMessage = "Database connection error";
			vi.mocked(projectsRepository.findAll).mockRejectedValue(
				new Error(errorMessage),
			);

			const response = await GET();

			expect(response.status).toBe(500);

			const responseData = await response.json();
			expect(responseData).toMatchObject({
				success: false,
				timestamp: expect.any(String),
				error: {
					message: "サーバー内部でエラーが発生しました",
				},
			});
		});
	});
});

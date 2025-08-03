import type { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/projects/[id]/route";
import type { Project } from "@/database/schema/projects";
import { buildProject } from "@/database/testing/factories/index";

// モジュールをモック
vi.mock("@/database/index", () => ({
	projectsRepository: {
		findById: vi.fn(),
	},
}));

// モックを取得
const { projectsRepository } = await import("@/database/index");

describe("/api/projects/[id]（App Router）", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("GET /api/projects/:id", () => {
		it("指定されたIDのプロジェクト詳細を返す", async () => {
			// ファクトリーでテストデータを準備
			const mockProject: Project = buildProject({
				id: 1,
				description: "Test project description",
				default_branch: "main",
				visibility: "public",
			});

			vi.mocked(projectsRepository.findById).mockResolvedValue(mockProject);

			// NextRequestのモック
			const mockRequest = new Request(
				"http://localhost/api/projects/1",
			) as NextRequest;
			const mockParams = { params: { id: "1" } };

			const response = await GET(mockRequest, mockParams);

			expect(response.status).toBe(200);

			const responseData = await response.json();
			expect(responseData).toMatchObject({
				success: true,
				timestamp: expect.any(String),
				data: {
					id: mockProject.id,
					gitlab_id: mockProject.gitlab_id,
					name: mockProject.name,
					description: mockProject.description,
					web_url: mockProject.web_url,
					default_branch: mockProject.default_branch,
					visibility: mockProject.visibility,
					created_at: expect.any(String),
					gitlab_created_at: expect.any(String),
				},
			});

			// タイムスタンプが有効なISO文字列であることを確認
			expect(() =>
				new Date(responseData.timestamp).toISOString(),
			).not.toThrow();

			// repositoryのfindByIdが正しい引数で呼び出されたことを確認
			expect(projectsRepository.findById).toHaveBeenCalledTimes(1);
			expect(projectsRepository.findById).toHaveBeenCalledWith(1);
		});

		it("descriptionがnullのプロジェクト詳細を返す", async () => {
			// ファクトリーでテストデータを準備
			const mockProject: Project = buildProject({
				id: 2,
				description: null,
				default_branch: "develop",
				visibility: "private",
			});

			vi.mocked(projectsRepository.findById).mockResolvedValue(mockProject);

			const mockRequest = new Request(
				"http://localhost/api/projects/2",
			) as NextRequest;
			const mockParams = { params: { id: "2" } };

			const response = await GET(mockRequest, mockParams);

			expect(response.status).toBe(200);

			const responseData = await response.json();
			expect(responseData.data.description).toBeNull();
			expect(responseData.data.visibility).toBe("private");
			expect(responseData.data.default_branch).toBe("develop");
		});

		it("存在しないIDで404エラーを返す", async () => {
			vi.mocked(projectsRepository.findById).mockResolvedValue(null);

			const mockRequest = new Request(
				"http://localhost/api/projects/999999",
			) as NextRequest;
			const mockParams = { params: { id: "999999" } };

			const response = await GET(mockRequest, mockParams);

			expect(response.status).toBe(404);

			const responseData = await response.json();
			expect(responseData).toMatchObject({
				success: false,
				timestamp: expect.any(String),
				error: {
					message: "プロジェクトが見つかりません",
				},
			});

			expect(projectsRepository.findById).toHaveBeenCalledWith(999999);
		});

		it("無効なID（負の数）で400エラーを返す", async () => {
			const mockRequest = new Request(
				"http://localhost/api/projects/-1",
			) as NextRequest;
			const mockParams = { params: { id: "-1" } };

			const response = await GET(mockRequest, mockParams);

			expect(response.status).toBe(400);

			const responseData = await response.json();
			expect(responseData).toMatchObject({
				success: false,
				timestamp: expect.any(String),
				error: {
					message: "IDが無効です",
					details: expect.stringContaining("数値である必要があります"),
				},
			});
		});

		it("データベースエラー時に500エラーを返す", async () => {
			const errorMessage = "Database connection error";
			vi.mocked(projectsRepository.findById).mockRejectedValue(
				new Error(errorMessage),
			);

			const mockRequest = new Request(
				"http://localhost/api/projects/1",
			) as NextRequest;
			const mockParams = { params: { id: "1" } };

			const response = await GET(mockRequest, mockParams);

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

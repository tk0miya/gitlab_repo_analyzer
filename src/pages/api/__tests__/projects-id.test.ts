import type { NextApiRequest, NextApiResponse } from "next";
import { createMocks } from "node-mocks-http";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRegisteredProjectData } from "@/database/__tests__/factories/index";
import type { Project } from "@/types/api";
import handler from "../projects/[id].js";

// モジュールをモック
vi.mock("@/database/index", () => ({
	projectsRepository: {
		findById: vi.fn(),
	},
}));

// モックを取得
const { projectsRepository } = await import("@/database/index");

describe("/api/projects/[id]", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("GET /api/projects/[id]", () => {
		it("指定されたIDのプロジェクト詳細を返す", async () => {
			// ファクトリーでテストデータを準備
			const mockProject: Project = createRegisteredProjectData({
				id: 1,
				name: "Test Project",
				description: "Test description",
				visibility: "public",
			});

			vi.mocked(projectsRepository.findById).mockResolvedValue(mockProject);

			const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
				method: "GET",
				query: { id: "1" },
			});

			await handler(req, res);

			expect(res._getStatusCode()).toBe(200);

			const responseData = JSON.parse(res._getData());
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

		it("存在しないIDの場合404エラーを返す", async () => {
			vi.mocked(projectsRepository.findById).mockResolvedValue(null);

			const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
				method: "GET",
				query: { id: "999" },
			});

			await handler(req, res);

			expect(res._getStatusCode()).toBe(404);

			const responseData = JSON.parse(res._getData());
			expect(responseData).toMatchObject({
				success: false,
				timestamp: expect.any(String),
				error: {
					message: "リソースが見つかりません",
				},
			});

			expect(projectsRepository.findById).toHaveBeenCalledWith(999);
		});

		it("無効なIDの場合400エラーを返す", async () => {
			const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
				method: "GET",
				query: { id: "invalid" },
			});

			await handler(req, res);

			expect(res._getStatusCode()).toBe(400);

			const responseData = JSON.parse(res._getData());
			expect(responseData).toMatchObject({
				success: false,
				timestamp: expect.any(String),
				error: {
					message: "入力内容に不正があります",
					validation_errors: expect.arrayContaining([
						expect.objectContaining({
							field: "",
							message: expect.any(String),
						}),
					]),
				},
			});

			// findByIdは呼び出されないことを確認
			expect(projectsRepository.findById).not.toHaveBeenCalled();
		});

		it("負の数のIDの場合400エラーを返す", async () => {
			const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
				method: "GET",
				query: { id: "-1" },
			});

			await handler(req, res);

			expect(res._getStatusCode()).toBe(400);

			const responseData = JSON.parse(res._getData());
			expect(responseData).toMatchObject({
				success: false,
				timestamp: expect.any(String),
				error: {
					message: "入力内容に不正があります",
					validation_errors: expect.arrayContaining([
						expect.objectContaining({
							field: "",
							message: "IDは数値である必要があります",
						}),
					]),
				},
			});

			expect(projectsRepository.findById).not.toHaveBeenCalled();
		});

		it("0のIDの場合400エラーを返す", async () => {
			const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
				method: "GET",
				query: { id: "0" },
			});

			await handler(req, res);

			expect(res._getStatusCode()).toBe(400);

			const responseData = JSON.parse(res._getData());
			expect(responseData).toMatchObject({
				success: false,
				timestamp: expect.any(String),
				error: {
					message: "入力内容に不正があります",
					validation_errors: expect.arrayContaining([
						expect.objectContaining({
							field: "",
							message: "IDは正の整数である必要があります",
						}),
					]),
				},
			});

			expect(projectsRepository.findById).not.toHaveBeenCalled();
		});

		it("データベースエラー時に500エラーを返す", async () => {
			const errorMessage = "Database connection error";
			vi.mocked(projectsRepository.findById).mockRejectedValue(
				new Error(errorMessage),
			);

			const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
				method: "GET",
				query: { id: "1" },
			});

			await handler(req, res);

			expect(res._getStatusCode()).toBe(500);

			const responseData = JSON.parse(res._getData());
			expect(responseData).toMatchObject({
				success: false,
				timestamp: expect.any(String),
				error: {
					message: "サーバー内部でエラーが発生しました",
				},
			});
		});
	});

	describe("Method not allowed", () => {
		it("非対応HTTPメソッドで405エラーを返す", async () => {
			const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
				method: "POST",
				query: { id: "1" },
			});

			await handler(req, res);

			expect(res._getStatusCode()).toBe(405);
			expect(res._getHeaders()).toHaveProperty("allow", ["GET"]);

			const responseData = JSON.parse(res._getData());
			expect(responseData).toMatchObject({
				success: false,
				timestamp: expect.any(String),
				error: {
					message: "Method not allowed",
				},
			});
		});
	});
});

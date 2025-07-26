import type { NextApiRequest, NextApiResponse } from "next";
import { createMocks } from "node-mocks-http";
import { vi, beforeEach, afterEach } from "vitest";
import handler from "../projects/index.js";
import type { Project } from "../../../src/types/api.js";

// モジュールをモック
vi.mock("../../../src/database/index.js", () => ({
	projectsRepository: {
		findAll: vi.fn(),
	},
}));

// モックを取得
const { projectsRepository } = await import("../../../src/database/index.js");

describe("/api/projects", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("GET リクエストでプロジェクト一覧を返す", async () => {
		// テストデータを準備
		const mockProjects: Project[] = [
			{
				id: 1,
				gitlab_id: 100,
				name: "Test Project 1",
				description: "Test description 1",
				web_url: "https://gitlab.example.com/test/project1",
				default_branch: "main",
				visibility: "public",
				created_at: new Date("2023-01-01T00:00:00Z"),
				gitlab_created_at: new Date("2023-01-01T00:00:00Z"),
			},
			{
				id: 2,
				gitlab_id: 101,
				name: "Test Project 2",
				description: null,
				web_url: "https://gitlab.example.com/test/project2",
				default_branch: "develop",
				visibility: "private",
				created_at: new Date("2023-01-02T00:00:00Z"),
				gitlab_created_at: new Date("2023-01-02T00:00:00Z"),
			},
		];

		vi.mocked(projectsRepository.findAll).mockResolvedValue(mockProjects);

		const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
			method: "GET",
		});

		await handler(req, res);

		expect(res._getStatusCode()).toBe(200);

		const responseData = JSON.parse(res._getData());
		expect(responseData).toMatchObject({
			success: true,
			timestamp: expect.any(String),
			data: expect.arrayContaining([
				expect.objectContaining({
					id: 1,
					gitlab_id: 100,
					name: "Test Project 1",
					description: "Test description 1",
					web_url: "https://gitlab.example.com/test/project1",
					default_branch: "main",
					visibility: "public",
				}),
				expect.objectContaining({
					id: 2,
					gitlab_id: 101,
					name: "Test Project 2",
					description: null,
					web_url: "https://gitlab.example.com/test/project2",
					default_branch: "develop",
					visibility: "private",
				}),
			]),
		});

		// タイムスタンプが有効なISO文字列であることを確認
		expect(() => new Date(responseData.timestamp).toISOString()).not.toThrow();

		// repositoryのfindAllが呼び出されたことを確認
		expect(projectsRepository.findAll).toHaveBeenCalledTimes(1);
		expect(projectsRepository.findAll).toHaveBeenCalledWith();
	});

	it("空のプロジェクト一覧を返す", async () => {
		vi.mocked(projectsRepository.findAll).mockResolvedValue([]);

		const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
			method: "GET",
		});

		await handler(req, res);

		expect(res._getStatusCode()).toBe(200);

		const responseData = JSON.parse(res._getData());
		expect(responseData).toMatchObject({
			success: true,
			timestamp: expect.any(String),
			data: [],
		});
	});

	it("データベースエラー時に500エラーを返す", async () => {
		const errorMessage = "Database connection error";
		vi.mocked(projectsRepository.findAll).mockRejectedValue(new Error(errorMessage));

		const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
			method: "GET",
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

	it("POST リクエストで405エラーを返す", async () => {
		const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
			method: "POST",
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

	it("PUT リクエストで405エラーを返す", async () => {
		const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
			method: "PUT",
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

	it("DELETE リクエストで405エラーを返す", async () => {
		const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
			method: "DELETE",
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
import type { NextApiRequest, NextApiResponse } from "next";
import { createMocks } from "node-mocks-http";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { GitLabProject } from "@/api/types/project";
import { createMultipleRegisteredProjectsData } from "@/database/__tests__/factories/index";
import type { Project } from "@/types/api";
import handler from "../projects/index.js";

// モジュールをモック
vi.mock("@/database/index", () => ({
	projectsRepository: {
		findAll: vi.fn(),
		findByGitlabId: vi.fn(),
		upsert: vi.fn(),
	},
}));

vi.mock("@/api/gitlab-client", () => ({
	GitLabApiClient: vi.fn().mockImplementation(() => ({
		getProject: vi.fn(),
	})),
}));

vi.mock("@/config", () => ({
	loadConfig: vi.fn().mockResolvedValue({
		gitlab: {
			url: "https://gitlab.com",
			token: "test-token",
			timeout: 30000,
		},
		database: {
			host: "localhost",
			port: 5432,
			database: "test_db",
			username: "test_user",
			ssl: false,
		},
	}),
}));

// モックを取得
const { projectsRepository } = await import("@/database/index");
const { GitLabApiClient } = await import("@/api/gitlab-client");
const { loadConfig } = await import("@/config");

describe("/api/projects", () => {
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
			vi.mocked(projectsRepository.findAll).mockRejectedValue(
				new Error(errorMessage),
			);

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
	});

	describe("POST /api/projects", () => {
		let mockGitLabClient: {
			getProject: ReturnType<typeof vi.fn>;
		};

		beforeEach(() => {
			// GitLabApiClientのモックインスタンスを取得
			mockGitLabClient = {
				getProject: vi.fn(),
			};
			vi.mocked(GitLabApiClient).mockImplementation(() => mockGitLabClient as any);

			// loadConfigのモックも確実に設定
			vi.mocked(loadConfig).mockResolvedValue({
				gitlab: {
					url: "https://gitlab.com",
					token: "test-token",
					timeout: 30000,
				},
				database: {
					host: "localhost",
					port: 5432,
					database: "test_db",
					username: "test_user",
					ssl: false,
				},
			});
		});

		it("新しいプロジェクトを正常に作成できる", async () => {
			const requestBody = {
				url: "https://gitlab.com/group/test-project",
				gitlab_project_id: 123,
			};

			const mockGitLabProject: GitLabProject = {
				id: 123,
				name: "test-project",
				description: "Test project description",
				web_url: "https://gitlab.com/group/test-project",
				default_branch: "main",
				visibility: "public",
				created_at: "2023-01-01T00:00:00.000Z",
				path_with_namespace: "group/test-project",
			};

			const mockSavedProject: Project = {
				id: 1,
				gitlab_id: 123,
				name: "test-project",
				description: "Test project description",
				web_url: "https://gitlab.com/group/test-project",
				default_branch: "main",
				visibility: "public",
				created_at: new Date("2023-01-01T10:00:00.000Z"),
				gitlab_created_at: new Date("2023-01-01T00:00:00.000Z"),
			};

			// モックの設定
			vi.mocked(projectsRepository.findByGitlabId).mockResolvedValue(null);
			mockGitLabClient.getProject.mockResolvedValue(mockGitLabProject);
			vi.mocked(projectsRepository.upsert).mockResolvedValue(mockSavedProject);

			const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
				method: "POST",
				body: requestBody,
			});

			await handler(req, res);

			expect(res._getStatusCode()).toBe(201);

			const responseData = JSON.parse(res._getData());
			expect(responseData).toMatchObject({
				success: true,
				timestamp: expect.any(String),
				data: {
					id: 1,
					gitlab_id: 123,
					name: "test-project",
					description: "Test project description",
					web_url: "https://gitlab.com/group/test-project",
					default_branch: "main",
					visibility: "public",
					created_at: expect.any(String),
					gitlab_created_at: expect.any(String),
				},
			});

			// 各メソッドが正しく呼び出されたことを確認
			expect(projectsRepository.findByGitlabId).toHaveBeenCalledWith(123);
			expect(mockGitLabClient.getProject).toHaveBeenCalledWith("123");
			expect(projectsRepository.upsert).toHaveBeenCalledWith({
				gitlab_id: 123,
				name: "test-project",
				description: "Test project description",
				web_url: "https://gitlab.com/group/test-project",
				default_branch: "main",
				visibility: "public",
				gitlab_created_at: new Date("2023-01-01T00:00:00.000Z"),
			});
		});

		it("重複するGitLab プロジェクトIDで409エラーを返す", async () => {
			const requestBody = {
				url: "https://gitlab.com/group/test-project",
				gitlab_project_id: 123,
			};

			const existingProject: Project = {
				id: 1,
				gitlab_id: 123,
				name: "existing-project",
				description: "Existing project",
				web_url: "https://gitlab.com/group/existing-project",
				default_branch: "main",
				visibility: "public",
				created_at: new Date(),
				gitlab_created_at: new Date(),
			};

			vi.mocked(projectsRepository.findByGitlabId).mockResolvedValue(
				existingProject,
			);

			const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
				method: "POST",
				body: requestBody,
			});

			await handler(req, res);

			expect(res._getStatusCode()).toBe(409);

			const responseData = JSON.parse(res._getData());
			expect(responseData).toMatchObject({
				success: false,
				timestamp: expect.any(String),
				error: {
					message: "指定されたGitLab プロジェクトIDは既に登録済みです",
					details: "GitLab ID: 123",
				},
			});

			expect(projectsRepository.findByGitlabId).toHaveBeenCalledWith(123);
			expect(mockGitLabClient.getProject).not.toHaveBeenCalled();
		});

		it("GitLab APIエラー時に503エラーを返す", async () => {
			const requestBody = {
				url: "https://gitlab.com/group/test-project",
				gitlab_project_id: 123,
			};

			vi.mocked(projectsRepository.findByGitlabId).mockResolvedValue(null);
			mockGitLabClient.getProject.mockRejectedValue(
				new Error("GitLab API エラー (404): Project not found"),
			);

			const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
				method: "POST",
				body: requestBody,
			});

			await handler(req, res);

			expect(res._getStatusCode()).toBe(503);

			const responseData = JSON.parse(res._getData());
			expect(responseData).toMatchObject({
				success: false,
				timestamp: expect.any(String),
				error: {
					message: "GitLab APIからプロジェクト情報を取得できませんでした",
					details: "GitLab API エラー (404): Project not found",
				},
			});
		});

		it("URLとGitLab プロジェクトIDが一致しない場合400エラーを返す", async () => {
			const requestBody = {
				url: "https://gitlab.com/group/wrong-project",
				gitlab_project_id: 123,
			};

			const mockGitLabProject: GitLabProject = {
				id: 123,
				name: "test-project",
				description: "Test project description",
				web_url: "https://gitlab.com/group/test-project", // 異なるURL
				default_branch: "main",
				visibility: "public",
				created_at: "2023-01-01T00:00:00.000Z",
				path_with_namespace: "group/test-project",
			};

			vi.mocked(projectsRepository.findByGitlabId).mockResolvedValue(null);
			mockGitLabClient.getProject.mockResolvedValue(mockGitLabProject);

			const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
				method: "POST",
				body: requestBody,
			});

			await handler(req, res);

			expect(res._getStatusCode()).toBe(400);

			const responseData = JSON.parse(res._getData());
			expect(responseData).toMatchObject({
				success: false,
				timestamp: expect.any(String),
				error: {
					message: "指定されたURLとGitLab プロジェクトIDが一致しません",
					details:
						"GitLab API URL: https://gitlab.com/group/test-project, リクエスト URL: https://gitlab.com/group/wrong-project",
				},
			});
		});

		it("無効なリクエストボディで400エラーを返す", async () => {
			const invalidRequestBody = {
				url: "invalid-url", // 無効なURL
				gitlab_project_id: -1, // 無効なプロジェクトID
			};

			const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
				method: "POST",
				body: invalidRequestBody,
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
							field: "url",
							message: expect.any(String),
						}),
						expect.objectContaining({
							field: "gitlab_project_id",
							message: expect.any(String),
						}),
					]),
				},
			});
		});

		it("必須フィールドが不足している場合400エラーを返す", async () => {
			const incompleteRequestBody = {
				url: "https://gitlab.com/group/test-project",
				// gitlab_project_id が不足
			};

			const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
				method: "POST",
				body: incompleteRequestBody,
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
							field: "gitlab_project_id",
							message: expect.any(String),
						}),
					]),
				},
			});
		});
	});

	describe("Method not allowed", () => {
		it("非対応HTTPメソッドで405エラーを返す", async () => {
			const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
				method: "DELETE", // 非対応メソッド
			});

			await handler(req, res);

			expect(res._getStatusCode()).toBe(405);
			expect(res._getHeaders()).toHaveProperty("allow", ["GET", "POST"]);

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

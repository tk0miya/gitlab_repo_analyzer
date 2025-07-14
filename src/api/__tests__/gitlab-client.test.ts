/**
 * GitLab APIクライアント テスト
 */

import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GitLabApiClient } from "../gitlab-client.js";
import type { GitLabProject } from "../types/project.js";
import type { GitLabUser } from "../types/user.js";

// axiosをモック
vi.mock("axios");
const mockedAxios = vi.mocked(axios);

describe("GitLabApiClient", () => {
	const mockConfig = {
		baseUrl: "https://gitlab.example.com",
		token: "test-token",
	};

	const mockAxiosInstance = {
		get: vi.fn(),
		post: vi.fn(),
		put: vi.fn(),
		delete: vi.fn(),
		interceptors: {
			request: { use: vi.fn() },
			response: {
				use: vi.fn().mockImplementation((_onSuccess, onError) => {
					// エラーハンドリングをテストするため、onErrorを保存
					mockAxiosInstance._errorHandler = onError;
				}),
			},
		},
		_errorHandler: null as unknown,
	};

	beforeEach(() => {
		vi.clearAllMocks();
		(mockedAxios.create as ReturnType<typeof vi.fn>).mockReturnValue(
			mockAxiosInstance,
		);
	});

	describe("コンストラクター", () => {
		it("正常な設定でクライアントを作成できる", () => {
			const client = new GitLabApiClient(mockConfig);
			expect(client).toBeInstanceOf(GitLabApiClient);
			expect(mockedAxios.create).toHaveBeenCalledWith({
				baseURL: mockConfig.baseUrl,
				timeout: 10000,
				headers: {
					Authorization: `Bearer ${mockConfig.token}`,
					"Content-Type": "application/json",
					"User-Agent": "gitlab_repo_analyzer/1.0.0",
				},
			});
		});

		it("baseUrlが指定されていない場合はエラーを投げる", () => {
			expect(() => {
				new GitLabApiClient({ baseUrl: "", token: "test-token" });
			}).toThrow(Error);
		});

		it("tokenが指定されていない場合はエラーを投げる", () => {
			expect(() => {
				new GitLabApiClient({
					baseUrl: "https://gitlab.example.com",
					token: "",
				});
			}).toThrow(Error);
		});

		it("無効なbaseURLの場合はエラーを投げる", () => {
			expect(() => {
				new GitLabApiClient({ baseUrl: "invalid-url", token: "test-token" });
			}).toThrow(Error);
		});
	});

	describe("getCurrentUser", () => {
		let client: GitLabApiClient;

		beforeEach(() => {
			client = new GitLabApiClient(mockConfig);
		});

		it("現在のユーザー情報を正常に取得できる", async () => {
			const mockUser: GitLabUser = {
				id: 1,
				username: "testuser",
				name: "Test User",
			};

			mockAxiosInstance.get.mockResolvedValue({ data: mockUser });

			const result = await client.getCurrentUser();

			expect(mockAxiosInstance.get).toHaveBeenCalledWith("/api/v4/user");
			expect(result).toEqual(mockUser);
		});
	});

	describe("getProject", () => {
		let client: GitLabApiClient;

		beforeEach(() => {
			client = new GitLabApiClient(mockConfig);
		});

		it("プロジェクト情報を正常に取得できる", async () => {
			const mockProject: GitLabProject = {
				id: 123,
				description: "Test project",
				name: "test-project",
			};

			mockAxiosInstance.get.mockResolvedValue({ data: mockProject });

			const result = await client.getProject("123");

			expect(mockAxiosInstance.get).toHaveBeenCalledWith(
				"/api/v4/projects/123",
			);
			expect(result).toEqual(mockProject);
		});
	});

	describe("testConnection", () => {
		let client: GitLabApiClient;

		beforeEach(() => {
			client = new GitLabApiClient(mockConfig);
		});

		it("接続成功時にtrueを返す", async () => {
			const mockUser = { id: 1, username: "testuser" } as GitLabUser;
			mockAxiosInstance.get.mockResolvedValue({ data: mockUser });

			const result = await client.testConnection();

			expect(result).toBe(true);
		});

		it("接続失敗時にfalseを返す", async () => {
			mockAxiosInstance.get.mockRejectedValue(new Error("Network error"));

			const result = await client.testConnection();

			expect(result).toBe(false);
		});
	});

	describe("エラーハンドリング", () => {
		let client: GitLabApiClient;

		beforeEach(() => {
			client = new GitLabApiClient(mockConfig);
		});

		it("APIエラー時にErrorを投げる", async () => {
			const expectedError = new Error("API Error");
			mockAxiosInstance.get.mockRejectedValue(expectedError);

			await expect(client.getCurrentUser()).rejects.toThrow(Error);
		});
	});
});

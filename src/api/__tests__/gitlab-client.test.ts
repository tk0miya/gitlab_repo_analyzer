/**
 * GitLab APIクライアント テスト
 */

import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GitLabApiClient } from "@/api/gitlab-client";
import type { GitLabCommit } from "@/api/types/commit";
import type { GitLabProject } from "@/api/types/project";
import type { GitLabUser } from "@/api/types/user";

// axiosをモック
vi.mock("axios");
const mockedAxios = vi.mocked(axios);

// テストヘルパー関数: モックコミットデータを生成
function createMockCommit(overrides: Partial<GitLabCommit> = {}): GitLabCommit {
	const baseCommit: GitLabCommit = {
		id: "commit123",
		short_id: "commit123",
		title: "Test commit",
		message: "Test commit message",
		author_name: "Test Author",
		author_email: "test@example.com",
		authored_date: "2023-01-01T00:00:00.000Z",
		committer_name: "Test Committer",
		committer_email: "test@example.com",
		committed_date: "2023-01-01T00:00:00.000Z",
		web_url: "https://gitlab.example.com/project/commit/commit123",
		parent_ids: ["parent123"],
		created_at: "2023-01-01T00:00:00.000Z",
	};

	return {
		...baseCommit,
		...overrides,
	};
}

// テストヘルパー関数: 複数のモックコミットデータを生成
function createMockCommits(
	count: number,
	baseOverrides: Partial<GitLabCommit> = {},
): GitLabCommit[] {
	return Array.from({ length: count }, (_, index) => {
		const commitIndex = index + 1;
		return createMockCommit({
			id: `commit${commitIndex}`,
			short_id: `commit${commitIndex}`,
			title: `Test commit ${commitIndex}`,
			message: `Test commit message ${commitIndex}`,
			authored_date: `2023-01-0${commitIndex}T00:00:00.000Z`,
			committed_date: `2023-01-0${commitIndex}T00:00:00.000Z`,
			web_url: `https://gitlab.example.com/project/commit/commit${commitIndex}`,
			parent_ids: [`parent${commitIndex}`],
			created_at: `2023-01-0${commitIndex}T00:00:00.000Z`,
			...baseOverrides,
		});
	});
}

describe("GitLabApiClient", () => {
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

	describe("getCurrentUser", () => {
		let client: GitLabApiClient;

		beforeEach(() => {
			client = new GitLabApiClient();
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
			client = new GitLabApiClient();
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
			client = new GitLabApiClient();
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

	describe("getCommits", () => {
		let client: GitLabApiClient;

		beforeEach(() => {
			client = new GitLabApiClient();
		});

		it("プロジェクトのコミット一覧を正常に取得できる（ジェネレータ）", async () => {
			const mockCommits: GitLabCommit[] = [createMockCommit()];

			mockAxiosInstance.get.mockResolvedValue({
				data: mockCommits,
				headers: {
					"x-total": "1",
					"x-page": "1",
					"x-per-page": "20",
					"x-next-page": "",
					"x-prev-page": "",
				},
			});

			const generator = client.getCommits("123");
			const result = await generator.next();

			expect(mockAxiosInstance.get).toHaveBeenCalledWith(
				"/api/v4/projects/123/repository/commits?page=1&per_page=20",
			);
			expect(result.value).toEqual(mockCommits);
			expect(result.done).toBe(false);

			// 次の呼び出しで終了することを確認
			const nextResult = await generator.next();
			expect(nextResult.done).toBe(true);
		});

		it("オプションパラメータを正しく処理する", async () => {
			const mockCommits: GitLabCommit[] = [];

			mockAxiosInstance.get.mockResolvedValue({
				data: mockCommits,
				headers: {
					"x-total": "0",
					"x-page": "2",
					"x-per-page": "50",
					"x-next-page": "",
					"x-prev-page": "",
				},
			});

			const options = {
				ref_name: "main",
				since: "2023-01-01",
				page: 2,
				per_page: 50,
				with_stats: true,
			};

			const generator = client.getCommits("123", options);
			await generator.next();

			expect(mockAxiosInstance.get).toHaveBeenCalledWith(
				"/api/v4/projects/123/repository/commits?ref_name=main&since=2023-01-01&page=2&per_page=50&with_stats=true",
			);
		});

		it("複数ページを順次取得できる", async () => {
			const mockCommitsPage1: GitLabCommit[] = createMockCommits(1);
			const mockCommitsPage2: GitLabCommit[] = createMockCommits(1).map(
				(commit) => ({
					...commit,
					id: "commit2",
					short_id: "commit2",
					title: "Test commit 2",
					message: "Test commit message 2",
					authored_date: "2023-01-02T00:00:00.000Z",
					committed_date: "2023-01-02T00:00:00.000Z",
					web_url: "https://gitlab.example.com/project/commit/commit2",
					parent_ids: ["parent2"],
					created_at: "2023-01-02T00:00:00.000Z",
				}),
			);

			mockAxiosInstance.get
				.mockResolvedValueOnce({
					data: mockCommitsPage1,
					headers: {
						"x-total": "2",
						"x-page": "1",
						"x-per-page": "1",
						"x-next-page": "2",
						"x-prev-page": "",
					},
				})
				.mockResolvedValueOnce({
					data: mockCommitsPage2,
					headers: {
						"x-total": "2",
						"x-page": "2",
						"x-per-page": "1",
						"x-next-page": "",
						"x-prev-page": "1",
					},
				});

			const generator = client.getCommits("123", { per_page: 1 });

			const firstPage = await generator.next();
			expect(firstPage.value).toEqual(mockCommitsPage1);
			expect(firstPage.done).toBe(false);

			const secondPage = await generator.next();
			expect(secondPage.value).toEqual(mockCommitsPage2);
			expect(secondPage.done).toBe(false);

			const endResult = await generator.next();
			expect(endResult.done).toBe(true);

			expect(mockAxiosInstance.get).toHaveBeenCalledTimes(2);
		});
	});

	describe("エラーハンドリング", () => {
		let client: GitLabApiClient;

		beforeEach(() => {
			client = new GitLabApiClient();
		});

		it("APIエラー時にErrorを投げる", async () => {
			const expectedError = new Error("API Error");
			mockAxiosInstance.get.mockRejectedValue(expectedError);

			await expect(client.getCurrentUser()).rejects.toThrow(Error);
		});
	});
});

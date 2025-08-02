import { redirect } from "next/navigation";
import {
	afterAll,
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";
import type { GitLabApiClient as GitLabApiClientType } from "@/api/gitlab-client";
import { GitLabApiClient } from "@/api/gitlab-client";
import { closeConnection } from "@/database/connection";
import { createProject } from "@/database/testing/factories/index";
import { withTransaction } from "@/database/testing/transaction";
import { getProjects, registerProject } from "../actions";

// モック設定
vi.mock("next/navigation", () => ({
	redirect: vi.fn(),
}));

vi.mock("@/api/gitlab-client");

const mockGitLabApiClient = vi.mocked(GitLabApiClient);
const mockRedirect = vi.mocked(redirect);

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
		// projectsRepositoryのfindAllメソッドを直接モック
		const { projectsRepository } = await import("@/database/index");
		const originalFindAll = projectsRepository.findAll;

		// 一時的にエラーを投げるようにモック
		projectsRepository.findAll = vi
			.fn()
			.mockRejectedValue(new Error("Database connection failed"));

		try {
			// エラーが適切に投げられることを確認
			await expect(getProjects()).rejects.toThrow(
				"プロジェクト一覧の取得に失敗しました",
			);
		} finally {
			// 元のメソッドに戻す
			projectsRepository.findAll = originalFindAll;
		}
	});
});

describe("registerProject Server Action", () => {
	afterAll(async () => {
		await closeConnection();
	});

	const mockFormData = (url: string) => {
		const formData = new FormData();
		formData.append("url", url);
		return formData;
	};

	const mockGitLabProject = {
		id: 123,
		name: "test-project",
		description: "Test project description",
		web_url: "https://gitlab.example.com/group/test-project",
		default_branch: "main",
		visibility: "private" as const,
		created_at: "2023-01-01T00:00:00Z",
	};

	beforeEach(() => {
		vi.clearAllMocks();

		// GitLab APIクライアントのモック
		const mockClient: Partial<GitLabApiClientType> = {
			getProject: vi.fn().mockResolvedValue(mockGitLabProject),
		};
		mockGitLabApiClient.mockReturnValue(mockClient as GitLabApiClientType);
	});

	it("should successfully register a new project", async () => {
		await withTransaction(async () => {
			const formData = mockFormData(
				"https://gitlab.example.com/group/test-project",
			);

			// プロジェクト登録を実行
			await registerProject(null, formData);

			// redirectが呼ばれたことを確認
			expect(mockRedirect).toHaveBeenCalledWith("/projects");

			// データベースにプロジェクトが登録されたことを確認
			const { projectsRepository } = await import("@/database/index");
			const projects = await projectsRepository.findAll();

			expect(projects).toHaveLength(1);
			expect(projects[0]).toMatchObject({
				gitlab_id: mockGitLabProject.id,
				name: mockGitLabProject.name,
				description: mockGitLabProject.description,
				web_url: mockGitLabProject.web_url,
				default_branch: mockGitLabProject.default_branch,
				visibility: mockGitLabProject.visibility,
			});
		});
	});

	it("should return error for invalid URL", async () => {
		const formData = mockFormData("invalid-url");

		const result = await registerProject(null, formData);

		expect(result.success).toBe(false);
		expect(result.error).toContain("有効なURL");
	});

	it("should return error for empty URL", async () => {
		const formData = mockFormData("");

		const result = await registerProject(null, formData);

		expect(result.success).toBe(false);
		expect(result.error).toBe("URLは必須です");
	});

	it("should return error for non-GitLab URL", async () => {
		const formData = mockFormData("https://github.com/user/repo");

		const result = await registerProject(null, formData);

		expect(result.success).toBe(false);
		expect(result.error).toBe(
			"GitLabプロジェクトの有効なURLを入力してください",
		);
	});

	it("should return error when project already exists", async () => {
		await withTransaction(async () => {
			// 既存プロジェクトを作成
			await createProject({
				gitlab_id: mockGitLabProject.id,
				name: mockGitLabProject.name,
			});

			const formData = mockFormData(
				"https://gitlab.example.com/group/test-project",
			);

			const result = await registerProject(null, formData);

			expect(result.success).toBe(false);
			expect(result.error).toBe("このプロジェクトは既に登録されています");
		});
	});

	it("should handle GitLab API errors", async () => {
		const mockClient: Partial<GitLabApiClientType> = {
			getProject: vi.fn().mockRejectedValue(new Error("GitLab API error")),
		};
		mockGitLabApiClient.mockReturnValue(mockClient as GitLabApiClientType);

		const formData = mockFormData(
			"https://gitlab.example.com/group/test-project",
		);

		const result = await registerProject(null, formData);

		expect(result.success).toBe(false);
		expect(result.error).toBe("GitLab API error");
	});
});

import { redirect } from "next/navigation";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	GitLabApiClient,
	type GitLabApiClient as GitLabApiClientType,
} from "@/lib/gitlab_client";
import { createCommit, createProject } from "@/lib/testing/factories";
import { withTransaction } from "@/lib/testing/transaction";
import {
	deleteProject,
	getMonthlyCommitCounts,
	getProjectDetail,
	getProjectsWithStats,
	registerProject,
} from "../actions";

// モック設定
vi.mock("next/navigation", () => ({
	redirect: vi.fn(),
}));

vi.mock("@/lib/gitlab_client");

const mockGitLabApiClient = vi.mocked(GitLabApiClient);
const mockRedirect = vi.mocked(redirect);

describe("actions.tsx", () => {
	describe("getProjectsWithStats", () => {
		afterEach(() => {
			// すべてのモックを自動復元
			vi.restoreAllMocks();
		});

		it("統計情報付きプロジェクト一覧を正常に取得できる", async () => {
			await withTransaction(async () => {
				// テストデータを作成
				await createProject({ name: "プロジェクトA" });
				await createProject({ name: "プロジェクトB" });

				// Server Actionを実行
				const result = await getProjectsWithStats();

				// プロジェクトが取得できることを確認（統計情報付き）
				expect(result).toHaveLength(2);
				expect(result.map((p) => p.name)).toEqual([
					"プロジェクトA",
					"プロジェクトB",
				]);
				// 統計情報が含まれていることを確認（値の妥当性チェック）
				expect(result[0].commitCount).toBeGreaterThanOrEqual(0);
				expect(result[0].lastCommitDate).toBeNull(); // 新規作成プロジェクトはまだ同期されていない
			});
		});

		it("データベースエラー時に適切なエラーを投げる", async () => {
			// projectsRepositoryのfindAllWithStatsメソッドを直接モック
			const { projectsRepository } = await import("@/database/index");
			const originalFindAllWithStats = projectsRepository.findAllWithStats;

			// 一時的にエラーを投げるようにモック
			projectsRepository.findAllWithStats = vi
				.fn()
				.mockRejectedValue(new Error("Database connection failed"));

			try {
				// エラーが適切に投げられることを確認
				await expect(getProjectsWithStats()).rejects.toThrow(
					"プロジェクト統計情報の取得に失敗しました",
				);
			} finally {
				// 元のメソッドに戻す
				projectsRepository.findAllWithStats = originalFindAllWithStats;
			}
		});
	});

	describe("registerProject", () => {
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
});

describe("deleteProject Server Action", () => {
	const mockFormData = (projectId: string) => {
		const formData = new FormData();
		formData.append("projectId", projectId);
		return formData;
	};

	it("プロジェクトを正常に削除できる", async () => {
		await withTransaction(async () => {
			// テストプロジェクトを作成
			const project = await createProject({ name: "削除テスト用プロジェクト" });

			const formData = mockFormData(project.id.toString());

			// プロジェクト削除を実行
			const result = await deleteProject(null, formData);

			// 削除が成功することを確認
			expect(result.success).toBe(true);
			expect(result.error).toBeUndefined();

			// データベースからプロジェクトが削除されたことを確認
			const { projectsRepository } = await import("@/database/index");
			const deletedProject = await projectsRepository.findById(project.id);
			expect(deletedProject).toBeNull();
		});
	});

	it("存在しないプロジェクトIDでも成功を返す（冪等性）", async () => {
		const formData = mockFormData("999999");

		const result = await deleteProject(null, formData);

		expect(result.success).toBe(true);
		expect(result.error).toBeUndefined();
	});

	it("無効なプロジェクトIDでエラーを返す", async () => {
		const formData = mockFormData("invalid");

		const result = await deleteProject(null, formData);

		expect(result.success).toBe(false);
		expect(result.error).toBe("無効なプロジェクトIDです");
	});

	it("プロジェクトIDが空文字でエラーを返す", async () => {
		const formData = mockFormData("");

		const result = await deleteProject(null, formData);

		expect(result.success).toBe(false);
		expect(result.error).toBe("プロジェクトIDが指定されていません");
	});

	it("プロジェクトIDが未指定でエラーを返す", async () => {
		const formData = new FormData(); // projectIdを追加しない

		const result = await deleteProject(null, formData);

		expect(result.success).toBe(false);
		expect(result.error).toBe("プロジェクトIDが指定されていません");
	});

	it("データベースエラー時に適切なエラーを返す", async () => {
		await withTransaction(async () => {
			// テストプロジェクトを作成
			const project = await createProject({
				name: "エラーテスト用プロジェクト",
			});

			// projectsRepositoryのdeleteメソッドを一時的にモック
			const { projectsRepository } = await import("@/database/index");
			const originalDelete = projectsRepository.delete;

			projectsRepository.delete = vi
				.fn()
				.mockRejectedValue(new Error("Database error"));

			try {
				const formData = mockFormData(project.id.toString());
				const result = await deleteProject(null, formData);

				expect(result.success).toBe(false);
				expect(result.error).toBe("Database error");
			} finally {
				// 元のメソッドに戻す
				projectsRepository.delete = originalDelete;
			}
		});
	});

	describe("getProjectDetail", () => {
		it("プロジェクト詳細を正常に取得できる", async () => {
			await withTransaction(async () => {
				// テストプロジェクトを作成
				const project = await createProject({
					name: "詳細テスト用プロジェクト",
					description: "テスト用の説明文",
				});

				// プロジェクト詳細を取得
				const result = await getProjectDetail(project.id);

				// プロジェクト詳細が取得できることを確認
				expect(result).toBeDefined();
				expect(result?.id).toBe(project.id);
				expect(result?.name).toBe("詳細テスト用プロジェクト");
				expect(result?.description).toBe("テスト用の説明文");

				// 統計情報が含まれていることを確認
				expect(result?.commitCount).toBeGreaterThanOrEqual(0);
				expect(
					result?.lastCommitDate === null ||
						result?.lastCommitDate instanceof Date,
				).toBe(true);
			});
		});

		it("存在しないプロジェクトIDでnullを返す", async () => {
			await withTransaction(async () => {
				const result = await getProjectDetail(999999);
				expect(result).toBeNull();
			});
		});

		it("データベースエラー時に適切なエラーをスローする", async () => {
			await withTransaction(async () => {
				// projectsRepositoryのfindWithStatsメソッドを一時的にモック
				const { projectsRepository } = await import("@/database/index");
				const originalFindWithStats = projectsRepository.findWithStats;

				projectsRepository.findWithStats = vi
					.fn()
					.mockRejectedValue(new Error("Database connection error"));

				try {
					await expect(getProjectDetail(1)).rejects.toThrow(
						"プロジェクト詳細の取得に失敗しました",
					);
				} finally {
					// 元のメソッドに戻す
					projectsRepository.findWithStats = originalFindWithStats;
				}
			});
		});
	});

	describe("getMonthlyCommitCounts", () => {
		it("月別コミット数を正常に取得できる", async () => {
			await withTransaction(async () => {
				// テストプロジェクトを作成
				const project = await createProject({ name: "コミット統計テスト用" });

				// テストコミットを作成
				await createCommit({
					project_id: project.id,
					authored_date: new Date("2024-01-15T10:00:00Z"),
				});
				await createCommit({
					project_id: project.id,
					authored_date: new Date("2024-02-10T10:00:00Z"),
				});

				// 月別コミット数を取得
				const result = await getMonthlyCommitCounts(project.id);

				// 結果が配列であることを確認
				expect(Array.isArray(result)).toBe(true);
				expect(result.length).toBe(2);

				// データ形式が正しいことを確認
				result.forEach((item) => {
					expect(item).toHaveProperty("month");
					expect(item).toHaveProperty("count");
					expect(typeof item.month).toBe("string");
					expect(typeof item.count).toBe("number");
					expect(item.count).toBeGreaterThanOrEqual(1);
				});

				// 具体的なデータ内容を確認
				expect(result).toEqual([
					{ month: "2024-01", count: 1 },
					{ month: "2024-02", count: 1 },
				]);
			});
		});

		it("データベースエラー時に適切なエラーをスローする", async () => {
			await withTransaction(async () => {
				// commitsRepositoryのgetMonthlyCommitCountsメソッドを一時的にモック
				const { commitsRepository } = await import("@/database/index");
				const originalGetMonthlyCommitCounts =
					commitsRepository.getMonthlyCommitCounts;

				commitsRepository.getMonthlyCommitCounts = vi
					.fn()
					.mockRejectedValue(new Error("Query execution error"));

				try {
					await expect(getMonthlyCommitCounts(1)).rejects.toThrow(
						"月別コミット数の取得に失敗しました",
					);
				} finally {
					// 元のメソッドに戻す
					commitsRepository.getMonthlyCommitCounts =
						originalGetMonthlyCommitCounts;
				}
			});
		});

		it("存在しないプロジェクトでも空配列を返す", async () => {
			await withTransaction(async () => {
				const result = await getMonthlyCommitCounts(999999);
				expect(Array.isArray(result)).toBe(true);
				expect(result.length).toBe(0);
			});
		});
	});
});

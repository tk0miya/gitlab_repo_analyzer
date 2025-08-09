import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildProjectWithStats } from "@/lib/testing/factories";
import ProjectsPage from "../page";

// Server Actionをモック
vi.mock("../actions", () => ({
	getProjectsWithStats: vi.fn(),
	registerProject: vi.fn(),
	deleteProject: vi.fn(),
}));

// モジュールをインポート（モック後にインポート）
import * as actions from "../actions";

describe("ProjectsPage", () => {
	afterEach(() => {
		cleanup();
		vi.clearAllMocks();
	});

	it("プロジェクト一覧ページのヘッダーが正しく表示される", async () => {
		vi.mocked(actions.getProjectsWithStats).mockResolvedValue([]);

		render(<ProjectsPage />);

		await waitFor(() => {
			expect(screen.getByText("プロジェクト一覧")).toBeInTheDocument();
			expect(
				screen.getByText(
					"GitLabから取得したプロジェクトの一覧を表示しています",
				),
			).toBeInTheDocument();
		});
	});

	it("プロジェクトが存在しない場合に空状態メッセージが表示される", async () => {
		vi.mocked(actions.getProjectsWithStats).mockResolvedValue([]);

		render(<ProjectsPage />);

		// ローディング状態が表示される
		expect(screen.getByText("プロジェクトを読み込み中...")).toBeInTheDocument();

		// ローディング完了後、空状態が表示される
		await waitFor(() => {
			expect(
				screen.getByText("プロジェクトが見つかりませんでした"),
			).toBeInTheDocument();
			expect(
				screen.getByText("GitLabからプロジェクトを同期してください"),
			).toBeInTheDocument();
		});

		// 空状態のアイコンが表示されることを確認
		const emptyStateIcon = screen.getByRole("img", {
			name: "プロジェクトなし",
		});
		expect(emptyStateIcon).toBeInTheDocument();
	});

	it("プロジェクトが存在する場合に正しく表示される", async () => {
		// テストデータを作成
		const project = buildProjectWithStats({
			name: "テストプロジェクト",
			description: "プロジェクトの説明",
			gitlab_id: 12345,
			visibility: "private",
			web_url: "https://gitlab.com/test/project",
			commitCount: 25,
			lastCommitDate: new Date("2024-01-15T00:00:00Z"),
		});

		vi.mocked(actions.getProjectsWithStats).mockResolvedValue([project]);

		render(<ProjectsPage />);

		// ローディング状態から表示に切り替わるのを待つ
		await waitFor(() => {
			expect(
				screen.queryByText("プロジェクトを読み込み中..."),
			).not.toBeInTheDocument();
		});

		// プロジェクト情報が表示される
		expect(screen.getByText("テストプロジェクト")).toBeInTheDocument();
		expect(screen.getByText("プロジェクトの説明")).toBeInTheDocument();
		expect(screen.getByText("ID: 12345")).toBeInTheDocument();
		expect(screen.getByText("プライベート")).toBeInTheDocument();

		// 統計情報が表示される
		expect(screen.getByText("コミット数: 25")).toBeInTheDocument();
		expect(screen.getByText("最終更新: 2024/1/15")).toBeInTheDocument();

		// GitLabリンクが正しく設定されている
		const gitlabLink = screen.getByRole("link", { name: /GitLab/i });
		expect(gitlabLink).toHaveAttribute(
			"href",
			"https://gitlab.com/test/project",
		);
		expect(gitlabLink).toHaveAttribute("target", "_blank");
		expect(gitlabLink).toHaveAttribute("rel", "noopener noreferrer");

		// 空状態メッセージが表示されない
		expect(
			screen.queryByText("プロジェクトが見つかりませんでした"),
		).not.toBeInTheDocument();
	});

	it("複数のプロジェクトが表示される", async () => {
		// 複数のテストデータを作成
		const projectA = buildProjectWithStats({ name: "プロジェクトA" });
		const projectB = buildProjectWithStats({ name: "プロジェクトB" });
		const projectC = buildProjectWithStats({ name: "プロジェクトC" });

		vi.mocked(actions.getProjectsWithStats).mockResolvedValue([
			projectA,
			projectB,
			projectC,
		]);

		render(<ProjectsPage />);

		// ローディング完了を待つ
		await waitFor(() => {
			expect(
				screen.queryByText("プロジェクトを読み込み中..."),
			).not.toBeInTheDocument();
		});

		// すべてのプロジェクトが表示される
		expect(screen.getByText("プロジェクトA")).toBeInTheDocument();
		expect(screen.getByText("プロジェクトB")).toBeInTheDocument();
		expect(screen.getByText("プロジェクトC")).toBeInTheDocument();
	});

	it("エラーが発生した場合にエラーメッセージが表示される", async () => {
		vi.mocked(actions.getProjectsWithStats).mockRejectedValue(
			new Error("データ取得エラー"),
		);

		render(<ProjectsPage />);

		// エラーメッセージが表示される
		await waitFor(() => {
			expect(screen.getByText("データ取得エラー")).toBeInTheDocument();
		});
	});
});

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import { closeConnection } from "@/database/connection";
import { createProject } from "@/database/testing/factories";
import { withTransaction } from "@/database/testing/transaction";
import ProjectsPage from "../page";

// Server Actionをモック
vi.mock("../actions", () => ({
	getProjects: vi.fn(),
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

	afterAll(async () => {
		await closeConnection();
	});

	it("プロジェクト一覧ページのヘッダーが正しく表示される", async () => {
		vi.mocked(actions.getProjects).mockResolvedValue([]);

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
		vi.mocked(actions.getProjects).mockResolvedValue([]);

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
		await withTransaction(async () => {
			// テストデータを作成
			const project = await createProject({
				name: "テストプロジェクト",
				description: "プロジェクトの説明",
				gitlab_id: 12345,
				visibility: "private",
				web_url: "https://gitlab.com/test/project",
			});

			vi.mocked(actions.getProjects).mockResolvedValue([project]);

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
	});

	it("複数のプロジェクトが表示される", async () => {
		await withTransaction(async () => {
			// 複数のテストデータを作成
			const projectA = await createProject({ name: "プロジェクトA" });
			const projectB = await createProject({ name: "プロジェクトB" });
			const projectC = await createProject({ name: "プロジェクトC" });

			vi.mocked(actions.getProjects).mockResolvedValue([
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
	});

	it("エラーが発生した場合にエラーメッセージが表示される", async () => {
		vi.mocked(actions.getProjects).mockRejectedValue(
			new Error("データ取得エラー"),
		);

		render(<ProjectsPage />);

		// エラーメッセージが表示される
		await waitFor(() => {
			expect(screen.getByText("データ取得エラー")).toBeInTheDocument();
		});
	});
});

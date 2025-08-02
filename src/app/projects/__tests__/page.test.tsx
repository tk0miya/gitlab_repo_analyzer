import { cleanup, render, screen } from "@testing-library/react";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import { closeConnection } from "@/database/connection";
import { ProjectsRepository } from "@/database/repositories/projects";
import { createProjectData } from "@/database/testing/factories";
import { withTransaction } from "@/database/testing/transaction";
import ProjectsPage from "../page";

describe("ProjectsPage", () => {
	afterEach(() => {
		cleanup();
	});

	afterAll(async () => {
		await closeConnection();
	});

	it("プロジェクト一覧ページのヘッダーが正しく表示される", async () => {
		await withTransaction(async () => {
			render(await ProjectsPage());

			expect(screen.getByText("プロジェクト一覧")).toBeInTheDocument();
			expect(
				screen.getByText(
					"GitLabから取得したプロジェクトの一覧を表示しています",
				),
			).toBeInTheDocument();
		});
	});

	it("プロジェクトが存在しない場合に空状態メッセージが表示される", async () => {
		await withTransaction(async () => {
			render(await ProjectsPage());

			expect(
				screen.getByText("プロジェクトが見つかりませんでした"),
			).toBeInTheDocument();
			expect(
				screen.getByText("GitLabからプロジェクトを同期してください"),
			).toBeInTheDocument();

			// 空状態のアイコンが表示されることを確認
			const emptyStateIcon = screen.getByRole("img", {
				name: "プロジェクトなし",
			});
			expect(emptyStateIcon).toBeInTheDocument();
		});
	});

	it("プロジェクトが存在する場合に正しく表示される", async () => {
		await withTransaction(async () => {
			const projectsRepository = new ProjectsRepository();

			// テストデータを作成
			await projectsRepository.create(
				createProjectData({
					name: "テストプロジェクト",
					description: "プロジェクトの説明",
					gitlab_id: 12345,
					visibility: "private",
					web_url: "https://gitlab.com/test/project",
				}),
			);

			render(await ProjectsPage());

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
			const projectsRepository = new ProjectsRepository();

			// 複数のテストデータを作成
			await projectsRepository.create(
				createProjectData({ name: "プロジェクトA" }),
			);
			await projectsRepository.create(
				createProjectData({ name: "プロジェクトB" }),
			);
			await projectsRepository.create(
				createProjectData({ name: "プロジェクトC" }),
			);

			render(await ProjectsPage());

			// すべてのプロジェクトが表示される
			expect(screen.getByText("プロジェクトA")).toBeInTheDocument();
			expect(screen.getByText("プロジェクトB")).toBeInTheDocument();
			expect(screen.getByText("プロジェクトC")).toBeInTheDocument();
		});
	});
});

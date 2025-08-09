import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { buildProjectWithStats } from "@/lib/testing/factories";
import { ProjectCard } from "../project-card";

const mockProject = buildProjectWithStats({
	id: 1,
	gitlab_id: 123,
	name: "テストプロジェクト",
	description: "これはテスト用のプロジェクト説明です",
	web_url: "https://gitlab.com/test/project",
	default_branch: "main",
	visibility: "public",
	created_at: new Date("2024-01-01T00:00:00Z"),
	gitlab_created_at: new Date("2024-01-01T00:00:00Z"),
	commitCount: 10,
	lastCommitDate: new Date("2024-01-15T00:00:00Z"),
});

describe("ProjectCard Component", () => {
	afterEach(() => {
		cleanup();
	});

	it("should render project card with all basic information", () => {
		render(<ProjectCard project={mockProject} />);

		// 基本プロジェクト情報
		expect(screen.getByText("テストプロジェクト")).toBeInTheDocument();
		expect(
			screen.getByText("これはテスト用のプロジェクト説明です"),
		).toBeInTheDocument();
		expect(screen.getByText("ID: 123")).toBeInTheDocument();
		expect(screen.getByText("パブリック")).toBeInTheDocument();

		// コミット統計情報
		expect(screen.getByText("コミット数: 10")).toBeInTheDocument();
		expect(screen.getByText("最終更新: 2024/1/15")).toBeInTheDocument();

		// GitLab外部リンク
		const gitlabLink = screen.getByRole("link", { name: /GitLab/i });
		expect(gitlabLink).toBeInTheDocument();
		expect(gitlabLink).toHaveAttribute(
			"href",
			"https://gitlab.com/test/project",
		);
		expect(gitlabLink).toHaveAttribute("target", "_blank");
		expect(gitlabLink).toHaveAttribute("rel", "noopener noreferrer");

		// 外部リンクアイコン
		const svgIcon = gitlabLink.querySelector("svg");
		expect(svgIcon).toBeInTheDocument();
	});

	it("should display correct visibility badge for private project", () => {
		const privateProject = buildProjectWithStats({
			visibility: "private",
		});
		render(<ProjectCard project={privateProject} />);

		const badge = screen.getByText("プライベート");
		expect(badge).toBeInTheDocument();
	});

	it("should display correct visibility badge for internal project", () => {
		const internalProject = buildProjectWithStats({
			visibility: "internal",
		});
		render(<ProjectCard project={internalProject} />);

		const badge = screen.getByText("内部");
		expect(badge).toBeInTheDocument();
	});

	it("should handle unknown visibility with fallback", () => {
		const unknownVisibilityProject = buildProjectWithStats({
			visibility: "unknown",
		});
		render(<ProjectCard project={unknownVisibilityProject} />);

		const badge = screen.getByText("unknown");
		expect(badge).toBeInTheDocument();
	});

	it("should handle project without description", () => {
		const projectWithoutDescription = buildProjectWithStats({
			description: null,
		});
		render(<ProjectCard project={projectWithoutDescription} />);

		expect(
			screen.queryByText("これはテスト用のプロジェクト説明です"),
		).not.toBeInTheDocument();
	});

	it("should display '未同期' when last commit date is null", () => {
		const projectWithoutSync = buildProjectWithStats({
			lastCommitDate: null,
		});
		render(<ProjectCard project={projectWithoutSync} />);

		expect(screen.getByText("最終更新: 未同期")).toBeInTheDocument();
	});
});

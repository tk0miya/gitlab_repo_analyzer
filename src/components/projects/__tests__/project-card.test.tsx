import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { Project } from "@/database/schema/projects";
import { ProjectCard } from "../project-card";

const mockProject: Project = {
	id: 1,
	gitlab_id: 123,
	name: "テストプロジェクト",
	description: "これはテスト用のプロジェクト説明です",
	web_url: "https://gitlab.com/test/project",
	default_branch: "main",
	visibility: "public",
	created_at: new Date("2024-01-01T00:00:00Z"),
	gitlab_created_at: new Date("2024-01-01T00:00:00Z"),
};

describe("ProjectCard Component", () => {
	afterEach(() => {
		cleanup();
	});

	it("should render project card with all basic information", () => {
		render(<ProjectCard project={mockProject} />);

		expect(screen.getByText("テストプロジェクト")).toBeInTheDocument();
		expect(
			screen.getByText("これはテスト用のプロジェクト説明です"),
		).toBeInTheDocument();
		expect(screen.getByText("ID: 123")).toBeInTheDocument();
		expect(screen.getByText("パブリック")).toBeInTheDocument();
	});

	it("should render GitLab external link with correct href", () => {
		render(<ProjectCard project={mockProject} />);

		const gitlabLink = screen.getByRole("link", { name: /GitLab/i });
		expect(gitlabLink).toBeInTheDocument();
		expect(gitlabLink).toHaveAttribute(
			"href",
			"https://gitlab.com/test/project",
		);
		expect(gitlabLink).toHaveAttribute("target", "_blank");
		expect(gitlabLink).toHaveAttribute("rel", "noopener noreferrer");
	});

	it("should display correct visibility badge for public project", () => {
		render(<ProjectCard project={mockProject} />);

		const badge = screen.getByText("パブリック");
		expect(badge).toBeInTheDocument();
	});

	it("should display correct visibility badge for private project", () => {
		const privateProject = { ...mockProject, visibility: "private" };
		render(<ProjectCard project={privateProject} />);

		const badge = screen.getByText("プライベート");
		expect(badge).toBeInTheDocument();
	});

	it("should display correct visibility badge for internal project", () => {
		const internalProject = { ...mockProject, visibility: "internal" };
		render(<ProjectCard project={internalProject} />);

		const badge = screen.getByText("内部");
		expect(badge).toBeInTheDocument();
	});

	it("should handle unknown visibility with fallback", () => {
		const unknownVisibilityProject = { ...mockProject, visibility: "unknown" };
		render(<ProjectCard project={unknownVisibilityProject} />);

		const badge = screen.getByText("unknown");
		expect(badge).toBeInTheDocument();
	});

	it("should handle project without description", () => {
		const projectWithoutDescription = { ...mockProject, description: null };
		render(<ProjectCard project={projectWithoutDescription} />);

		expect(screen.getByText("テストプロジェクト")).toBeInTheDocument();
		expect(
			screen.queryByText("これはテスト用のプロジェクト説明です"),
		).not.toBeInTheDocument();
		expect(screen.getByText("ID: 123")).toBeInTheDocument();
	});

	it("should render external link icon", () => {
		render(<ProjectCard project={mockProject} />);

		const svgIcon = screen
			.getByRole("link", { name: /GitLab/i })
			.querySelector("svg");
		expect(svgIcon).toBeInTheDocument();
	});
});

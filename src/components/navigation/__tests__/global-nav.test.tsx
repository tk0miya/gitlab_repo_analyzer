import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { GlobalNav } from "../global-nav";

describe("GlobalNav Component", () => {
	afterEach(() => {
		cleanup();
	});

	it("should render navigation element with correct structure", () => {
		render(<GlobalNav />);

		const nav = screen.getByRole("navigation");
		expect(nav).toBeInTheDocument();
	});

	it("should render brand link with correct text and href", () => {
		render(<GlobalNav />);

		const brandLink = screen.getByRole("link", { name: "GitLab Analyzer" });
		expect(brandLink).toBeInTheDocument();
		expect(brandLink).toHaveAttribute("href", "/");
	});

	it("should render all navigation items with correct links", () => {
		render(<GlobalNav />);

		// ホームリンク
		const homeLink = screen.getByRole("link", { name: "ホーム" });
		expect(homeLink).toBeInTheDocument();
		expect(homeLink).toHaveAttribute("href", "/");

		// プロジェクトリンク
		const projectsLink = screen.getByRole("link", { name: "プロジェクト" });
		expect(projectsLink).toBeInTheDocument();
		expect(projectsLink).toHaveAttribute("href", "/projects");

		// 分析リンク
		const analyticsLink = screen.getByRole("link", { name: "分析" });
		expect(analyticsLink).toBeInTheDocument();
		expect(analyticsLink).toHaveAttribute("href", "/analytics");
	});
});

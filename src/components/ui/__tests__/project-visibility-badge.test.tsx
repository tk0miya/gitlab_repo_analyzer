import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ProjectVisibilityBadge } from "../project-visibility-badge";

afterEach(() => {
	cleanup();
});

describe("ProjectVisibilityBadge", () => {
	it("should render public visibility with icon", () => {
		render(<ProjectVisibilityBadge visibility="public" />);

		const badge = screen.getByText("パブリック").closest("div");
		expect(screen.getByText("パブリック")).toBeInTheDocument();
		expect(badge?.querySelector("svg")).toBeInTheDocument();
	});

	it("should render internal visibility with icon", () => {
		render(<ProjectVisibilityBadge visibility="internal" />);

		const badge = screen.getByText("内部").closest("div");
		expect(screen.getByText("内部")).toBeInTheDocument();
		expect(badge?.querySelector("svg")).toBeInTheDocument();
	});

	it("should render private visibility with icon", () => {
		render(<ProjectVisibilityBadge visibility="private" />);

		const badge = screen.getByText("プライベート").closest("div");
		expect(screen.getByText("プライベート")).toBeInTheDocument();
		expect(badge?.querySelector("svg")).toBeInTheDocument();
	});
});

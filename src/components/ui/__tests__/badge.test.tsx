import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Badge } from "../badge";

describe("Badge Component", () => {
	afterEach(() => {
		cleanup();
	});
	it("should render different variants correctly", () => {
		const { rerender } = render(<Badge variant="default">Default Badge</Badge>);
		let badge = screen.getByText("Default Badge");
		expect(badge).toHaveClass("bg-primary", "text-primary-foreground");

		rerender(<Badge variant="secondary">Secondary Badge</Badge>);
		badge = screen.getByText("Secondary Badge");
		expect(badge).toHaveClass("bg-secondary", "text-secondary-foreground");

		rerender(<Badge variant="destructive">Destructive Badge</Badge>);
		badge = screen.getByText("Destructive Badge");
		expect(badge).toHaveClass("bg-destructive", "text-destructive-foreground");

		rerender(<Badge variant="outline">Outline Badge</Badge>);
		badge = screen.getByText("Outline Badge");
		expect(badge).toHaveClass("text-foreground");
	});

	it("should render with base classes", () => {
		render(<Badge>Test Badge</Badge>);
		const badge = screen.getByText("Test Badge");
		expect(badge).toHaveClass(
			"inline-flex",
			"items-center",
			"rounded-full",
			"border",
			"px-2.5",
			"py-0.5",
			"text-xs",
			"font-semibold",
		);
	});

	it("should apply custom className", () => {
		render(<Badge className="custom-badge">Custom Badge</Badge>);
		const badge = screen.getByText("Custom Badge");
		expect(badge).toHaveClass("custom-badge");
	});

	it("should render with correct text content", () => {
		render(<Badge>Badge Text</Badge>);
		expect(screen.getByText("Badge Text")).toBeInTheDocument();
	});

	it("should render as div element", () => {
		render(<Badge data-testid="badge">Badge</Badge>);
		const badge = screen.getByTestId("badge");
		expect(badge.tagName).toBe("DIV");
	});

	it("should handle multiple children", () => {
		render(
			<Badge>
				<span>Icon</span>
				<span>Text</span>
			</Badge>,
		);
		expect(screen.getByText("Icon")).toBeInTheDocument();
		expect(screen.getByText("Text")).toBeInTheDocument();
	});

	it("should apply default variant when no variant is specified", () => {
		render(<Badge>Default</Badge>);
		const badge = screen.getByText("Default");
		expect(badge).toHaveClass("bg-primary", "text-primary-foreground");
	});

	it("should support custom attributes", () => {
		render(
			<Badge data-testid="custom-badge" aria-label="Status badge">
				Status
			</Badge>,
		);
		const badge = screen.getByTestId("custom-badge");
		expect(badge).toHaveAttribute("aria-label", "Status badge");
	});

	it("should combine custom className with variant classes", () => {
		render(
			<Badge variant="destructive" className="custom-class">
				Custom
			</Badge>,
		);
		const badge = screen.getByText("Custom");
		expect(badge).toHaveClass("bg-destructive", "custom-class");
	});
});

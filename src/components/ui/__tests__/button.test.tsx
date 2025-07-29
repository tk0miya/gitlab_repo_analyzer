import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Button } from "../button";

describe("Button Component", () => {
	afterEach(() => {
		cleanup();
	});

	it("should render different variants correctly", () => {
		const { rerender } = render(<Button variant="default">Default</Button>);
		expect(screen.getByRole("button")).toHaveClass("bg-primary");

		rerender(<Button variant="destructive">Destructive</Button>);
		expect(screen.getByRole("button")).toHaveClass("bg-destructive");

		rerender(<Button variant="outline">Outline</Button>);
		expect(screen.getByRole("button")).toHaveClass("border-input");

		rerender(<Button variant="secondary">Secondary</Button>);
		expect(screen.getByRole("button")).toHaveClass("bg-secondary");

		rerender(<Button variant="ghost">Ghost</Button>);
		expect(screen.getByRole("button")).toHaveClass("hover:bg-accent");

		rerender(<Button variant="link">Link</Button>);
		expect(screen.getByRole("button")).toHaveClass("text-primary");
	});

	it("should render different sizes correctly", () => {
		const { rerender } = render(<Button size="default">Default</Button>);
		expect(screen.getByRole("button")).toHaveClass("h-10");

		rerender(<Button size="sm">Small</Button>);
		expect(screen.getByRole("button")).toHaveClass("h-9");

		rerender(<Button size="lg">Large</Button>);
		expect(screen.getByRole("button")).toHaveClass("h-11");

		rerender(<Button size="icon">Icon</Button>);
		expect(screen.getByRole("button")).toHaveClass("h-10", "w-10");
	});

	it("should apply custom className", () => {
		render(<Button className="custom-class">Button</Button>);
		expect(screen.getByRole("button")).toHaveClass("custom-class");
	});

	it("should handle disabled state", () => {
		render(<Button disabled>Disabled Button</Button>);
		expect(screen.getByRole("button")).toBeDisabled();
		expect(screen.getByRole("button")).toHaveClass("disabled:opacity-50");
	});

	it("should render with correct text content", () => {
		render(<Button>Test Button</Button>);
		expect(screen.getByRole("button")).toHaveTextContent("Test Button");
	});

	it("should handle click events", () => {
		const handleClick = vi.fn();
		render(<Button onClick={handleClick}>Clickable</Button>);

		screen.getByRole("button").click();
		expect(handleClick).toHaveBeenCalledOnce();
	});

	it("should forward ref correctly", () => {
		const ref = React.createRef<HTMLButtonElement>();
		render(<Button ref={ref}>Button with ref</Button>);
		expect(ref.current).toBeInstanceOf(HTMLButtonElement);
	});
});

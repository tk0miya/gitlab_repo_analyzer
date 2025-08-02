import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { Label } from "../label";

describe("Label Component", () => {
	afterEach(() => {
		cleanup();
	});

	it("should render label with text content", () => {
		render(<Label>Test Label</Label>);
		expect(screen.getByText("Test Label")).toBeInTheDocument();
	});

	it("should associate with input via htmlFor", () => {
		render(<Label htmlFor="test-input">Test Label</Label>);
		expect(screen.getByText("Test Label")).toHaveAttribute("for", "test-input");
	});

	it("should focus input when clicked", async () => {
		const user = userEvent.setup();
		render(
			<div>
				<Label htmlFor="clickable-input">Clickable Label</Label>
				<input id="clickable-input" type="text" />
			</div>,
		);

		await user.click(screen.getByText("Clickable Label"));
		expect(screen.getByRole("textbox")).toHaveFocus();
	});
});

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { Input } from "../input";

describe("Input Component", () => {
	afterEach(() => {
		cleanup();
	});

	it("should accept and display text input", async () => {
		const user = userEvent.setup();
		render(<Input placeholder="Enter text" />);

		const input = screen.getByPlaceholderText("Enter text");
		await user.type(input, "test input");

		expect(input).toHaveValue("test input");
	});

	it("should support disabled state", () => {
		render(<Input disabled />);
		expect(screen.getByRole("textbox")).toBeDisabled();
	});

	it("should support different input types", () => {
		render(<Input type="email" />);
		expect(screen.getByRole("textbox")).toHaveAttribute("type", "email");
	});
});

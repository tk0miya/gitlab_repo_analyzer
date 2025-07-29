import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "../card";

describe("Card Component", () => {
	afterEach(() => {
		cleanup();
	});

	it("should render Card with correct base classes", () => {
		render(<Card data-testid="card">Card Content</Card>);
		const card = screen.getByTestId("card");
		expect(card).toHaveClass("rounded-lg", "border", "bg-card", "shadow-sm");
	});

	it("should apply custom className to Card", () => {
		render(
			<Card className="custom-card" data-testid="card">
				Card Content
			</Card>,
		);
		const card = screen.getByTestId("card");
		expect(card).toHaveClass("custom-card");
	});

	it("should render CardHeader with correct classes", () => {
		render(<CardHeader data-testid="card-header">Header Content</CardHeader>);
		const header = screen.getByTestId("card-header");
		expect(header).toHaveClass("flex", "flex-col", "space-y-1.5", "p-6");
		expect(header).toHaveTextContent("Header Content");
	});

	it("should render CardTitle with correct classes and element", () => {
		render(<CardTitle data-testid="card-title">Title Text</CardTitle>);
		const title = screen.getByTestId("card-title");
		expect(title.tagName).toBe("H3");
		expect(title).toHaveClass(
			"text-2xl",
			"font-semibold",
			"leading-none",
			"tracking-tight",
		);
		expect(title).toHaveTextContent("Title Text");
	});

	it("should render CardDescription with correct classes", () => {
		render(
			<CardDescription data-testid="card-description">
				Description Text
			</CardDescription>,
		);
		const description = screen.getByTestId("card-description");
		expect(description.tagName).toBe("P");
		expect(description).toHaveClass("text-sm", "text-muted-foreground");
		expect(description).toHaveTextContent("Description Text");
	});

	it("should render CardContent with correct classes", () => {
		render(<CardContent data-testid="card-content">Content Text</CardContent>);
		const content = screen.getByTestId("card-content");
		expect(content).toHaveClass("p-6", "pt-0");
		expect(content).toHaveTextContent("Content Text");
	});

	it("should render CardFooter with correct classes", () => {
		render(<CardFooter data-testid="card-footer">Footer Content</CardFooter>);
		const footer = screen.getByTestId("card-footer");
		expect(footer).toHaveClass("flex", "items-center", "p-6", "pt-0");
		expect(footer).toHaveTextContent("Footer Content");
	});

	it("should render complete Card structure", () => {
		render(
			<Card>
				<CardHeader>
					<CardTitle>Test Card</CardTitle>
					<CardDescription>Card description</CardDescription>
				</CardHeader>
				<CardContent>
					<p>Card content goes here</p>
				</CardContent>
				<CardFooter>
					<button type="button">Action</button>
				</CardFooter>
			</Card>,
		);

		expect(screen.getByText("Test Card")).toBeInTheDocument();
		expect(screen.getByText("Card description")).toBeInTheDocument();
		expect(screen.getByText("Card content goes here")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Action" })).toBeInTheDocument();
	});

	it("should forward refs correctly", () => {
		const cardRef = React.createRef<HTMLDivElement>();
		const headerRef = React.createRef<HTMLDivElement>();
		const contentRef = React.createRef<HTMLDivElement>();
		const footerRef = React.createRef<HTMLDivElement>();
		const titleRef = React.createRef<HTMLHeadingElement>();
		const descriptionRef = React.createRef<HTMLParagraphElement>();

		render(
			<Card ref={cardRef}>
				<CardHeader ref={headerRef}>
					<CardTitle ref={titleRef}>Title</CardTitle>
					<CardDescription ref={descriptionRef}>Description</CardDescription>
				</CardHeader>
				<CardContent ref={contentRef}>Content</CardContent>
				<CardFooter ref={footerRef}>Footer</CardFooter>
			</Card>,
		);

		expect(cardRef.current).toBeInstanceOf(HTMLDivElement);
		expect(headerRef.current).toBeInstanceOf(HTMLDivElement);
		expect(contentRef.current).toBeInstanceOf(HTMLDivElement);
		expect(footerRef.current).toBeInstanceOf(HTMLDivElement);
		expect(titleRef.current).toBeInstanceOf(HTMLHeadingElement);
		expect(descriptionRef.current).toBeInstanceOf(HTMLParagraphElement);
	});
});

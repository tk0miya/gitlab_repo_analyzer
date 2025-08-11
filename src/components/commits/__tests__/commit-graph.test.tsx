import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { CommitGraph } from "../commit-graph";

// Mock ResizeObserver specifically for Recharts tests
class MockResizeObserver {
	callback: ResizeObserverCallback;

	constructor(callback: ResizeObserverCallback) {
		this.callback = callback;
	}

	observe = vi.fn();
	unobserve = vi.fn();
	disconnect = vi.fn();
}

beforeAll(() => {
	global.ResizeObserver = MockResizeObserver;
	window.ResizeObserver = MockResizeObserver;
});

afterEach(() => {
	cleanup();
});

describe("CommitGraph", () => {
	const mockData = [
		{ period: "2024-01", count: 15, type: "monthly" as const },
		{ period: "2024-02", count: 23, type: "monthly" as const },
		{ period: "2024-03", count: 8, type: "monthly" as const },
	];

	it("should render chart when data is provided", () => {
		render(<CommitGraph data={mockData} period="monthly" />);

		const container = document.querySelector(".recharts-responsive-container");
		expect(container).toBeInTheDocument();
	});

	it("should display no data message when data is empty", () => {
		render(<CommitGraph data={[]} period="monthly" />);

		expect(screen.getByText("コミットデータがありません")).toBeInTheDocument();
	});
});

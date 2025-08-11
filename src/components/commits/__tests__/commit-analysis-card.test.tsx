import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { CommitAnalysisCard } from "../commit-analysis-card";

// ResizeObserverのモック（Rechartsで必要）
class MockResizeObserver {
	observe = vi.fn();
	unobserve = vi.fn();
	disconnect = vi.fn();
}

beforeAll(() => {
	// ResizeObserverをモック
	global.ResizeObserver =
		MockResizeObserver as unknown as typeof ResizeObserver;
});

describe("CommitAnalysisCard", () => {
	afterEach(() => {
		cleanup();
	});

	const mockMonthlyData = [
		{ period: "2024-01", count: 10, type: "monthly" as const },
		{ period: "2024-02", count: 15, type: "monthly" as const },
		{ period: "2024-03", count: 8, type: "monthly" as const },
	];

	const mockWeeklyData = [
		{ period: "2024-01", count: 3, type: "weekly" as const },
		{ period: "2024-02", count: 5, type: "weekly" as const },
		{ period: "2024-03", count: 2, type: "weekly" as const },
	];

	it("should render card structure with title and period selector", () => {
		const mockOnPeriodChange = vi.fn();

		render(
			<CommitAnalysisCard
				period="monthly"
				commitStats={mockMonthlyData}
				onPeriodChange={mockOnPeriodChange}
			/>,
		);

		// カードタイトルが表示されることを確認
		expect(
			screen.getByRole("heading", { name: "コミット数" }),
		).toBeInTheDocument();

		// 期間選択ラベルが表示されることを確認
		expect(screen.getByText("表示期間:")).toBeInTheDocument();

		// ラジオボタンが表示されることを確認
		expect(screen.getByRole("radio", { name: "月別" })).toBeInTheDocument();
		expect(
			screen.getByRole("radio", { name: "週別 (2年間分)" }),
		).toBeInTheDocument();
	});

	it("should show correct period selection state", () => {
		const mockOnPeriodChange = vi.fn();

		// 月別が選択された状態でテスト
		const { rerender } = render(
			<CommitAnalysisCard
				period="monthly"
				commitStats={mockMonthlyData}
				onPeriodChange={mockOnPeriodChange}
			/>,
		);

		let monthlyRadio = screen.getByRole("radio", { name: "月別" });
		let weeklyRadio = screen.getByRole("radio", { name: "週別 (2年間分)" });

		expect(monthlyRadio).toBeChecked();
		expect(weeklyRadio).not.toBeChecked();

		// 週別が選択された状態で再テスト
		rerender(
			<CommitAnalysisCard
				period="weekly"
				commitStats={mockWeeklyData}
				onPeriodChange={mockOnPeriodChange}
			/>,
		);

		monthlyRadio = screen.getByRole("radio", { name: "月別" });
		weeklyRadio = screen.getByRole("radio", { name: "週別 (2年間分)" });

		expect(weeklyRadio).toBeChecked();
		expect(monthlyRadio).not.toBeChecked();
	});

	it("should handle period changes through user interaction", async () => {
		const user = userEvent.setup();
		const mockOnPeriodChange = vi.fn();

		const { rerender } = render(
			<CommitAnalysisCard
				period="monthly"
				commitStats={mockMonthlyData}
				onPeriodChange={mockOnPeriodChange}
			/>,
		);

		// 週別ラジオボタンをクリック（月別から週別への変更）
		const weeklyRadio = screen.getByRole("radio", { name: "週別 (2年間分)" });
		await user.click(weeklyRadio);

		expect(mockOnPeriodChange).toHaveBeenCalledWith("weekly");
		expect(mockOnPeriodChange).toHaveBeenCalledTimes(1);

		// 週別選択状態で再レンダリングして、月別への変更をテスト
		mockOnPeriodChange.mockClear();
		rerender(
			<CommitAnalysisCard
				period="weekly"
				commitStats={mockWeeklyData}
				onPeriodChange={mockOnPeriodChange}
			/>,
		);

		const monthlyRadio = screen.getByRole("radio", { name: "月別" });
		await user.click(monthlyRadio);

		expect(mockOnPeriodChange).toHaveBeenCalledWith("monthly");
		expect(mockOnPeriodChange).toHaveBeenCalledTimes(1);
	});

	it("should handle empty data gracefully", () => {
		const mockOnPeriodChange = vi.fn();

		render(
			<CommitAnalysisCard
				period="monthly"
				commitStats={[]}
				onPeriodChange={mockOnPeriodChange}
			/>,
		);

		// コンポーネントがレンダリングされることを確認
		expect(
			screen.getByRole("heading", { name: "コミット数" }),
		).toBeInTheDocument();
		expect(screen.getByText("表示期間:")).toBeInTheDocument();

		// 空データの場合のメッセージが表示されることを確認
		expect(screen.getByText("コミットデータがありません")).toBeInTheDocument();
	});
});

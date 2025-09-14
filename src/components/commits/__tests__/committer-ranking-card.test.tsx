import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type {
	CommitterRanking,
	RankingPeriod,
} from "@/database/repositories/commits";
import { CommitterRankingCard } from "../committer-ranking-card";

describe("CommitterRankingCard", () => {
	afterEach(() => {
		cleanup();
	});

	const mockRankings: Record<RankingPeriod, CommitterRanking[]> = {
		all: [
			{
				rank: 1,
				authorName: "Alice",
				authorEmail: "alice@example.com",
				commitCount: 150,
			},
			{
				rank: 2,
				authorName: "Bob",
				authorEmail: "bob@example.com",
				commitCount: 120,
			},
			{
				rank: 3,
				authorName: "Charlie",
				authorEmail: "charlie@example.com",
				commitCount: 95,
			},
		],
		year: [
			{
				rank: 1,
				authorName: "Bob",
				authorEmail: "bob@example.com",
				commitCount: 80,
			},
			{
				rank: 2,
				authorName: "Alice",
				authorEmail: "alice@example.com",
				commitCount: 60,
			},
		],
		halfYear: [
			{
				rank: 1,
				authorName: "Charlie",
				authorEmail: "charlie@example.com",
				commitCount: 45,
			},
		],
		month: [],
	};

	it("コンポーネントが正しくレンダリングされる", () => {
		render(<CommitterRankingCard rankings={mockRankings} />);

		expect(screen.getByText("コミッターランキング")).toBeInTheDocument();
		expect(screen.getByText("全期間")).toBeInTheDocument();
		expect(screen.getByText("直近1年")).toBeInTheDocument();
		expect(screen.getByText("直近半年")).toBeInTheDocument();
		expect(screen.getByText("直近1ヶ月")).toBeInTheDocument();
	});

	it("デフォルトで全期間のランキングが表示される", () => {
		render(<CommitterRankingCard rankings={mockRankings} />);

		// 名前が表示されていることを確認
		expect(screen.getByText("Alice")).toBeInTheDocument();
		expect(screen.getByText("Bob")).toBeInTheDocument();
		expect(screen.getByText("Charlie")).toBeInTheDocument();

		// メールアドレスが表示されていることを確認
		expect(screen.getByText("alice@example.com")).toBeInTheDocument();
		expect(screen.getByText("bob@example.com")).toBeInTheDocument();
		expect(screen.getByText("charlie@example.com")).toBeInTheDocument();

		// コミット数が表示されていることを確認
		expect(screen.getByText("150")).toBeInTheDocument();
		expect(screen.getByText("120")).toBeInTheDocument();
		expect(screen.getByText("95")).toBeInTheDocument();
	});

	it("上位3名にメダルアイコンが表示される", () => {
		const { container } = render(
			<CommitterRankingCard rankings={mockRankings} />,
		);

		// ランクアイコンを含む要素を取得
		const rankElements = container.querySelectorAll(
			".flex.items-center.justify-center.w-8.h-8",
		);
		const rankTexts = Array.from(rankElements).map((el) => el.textContent);

		// 上位3名にメダルが表示されることを確認
		expect(rankTexts[0]).toBe("🥇");
		expect(rankTexts[1]).toBe("🥈");
		expect(rankTexts[2]).toBe("🥉");
	});

	it("期間を切り替えるとランキングが更新される", async () => {
		const user = userEvent.setup();
		render(<CommitterRankingCard rankings={mockRankings} />);

		// 直近1年をクリック
		await user.click(screen.getByText("直近1年"));

		// 直近1年のランキングが表示される
		expect(screen.getByText("Bob")).toBeInTheDocument();
		expect(screen.getByText("80")).toBeInTheDocument();
		expect(screen.getByText("Alice")).toBeInTheDocument();
		expect(screen.getByText("60")).toBeInTheDocument();

		// Charlie（全期間では3位）は表示されない
		expect(screen.queryByText("Charlie")).not.toBeInTheDocument();
	});

	it("期間変更時にコールバックが呼ばれる", async () => {
		const user = userEvent.setup();
		const onPeriodChange = vi.fn();
		render(
			<CommitterRankingCard
				rankings={mockRankings}
				onPeriodChange={onPeriodChange}
			/>,
		);

		await user.click(screen.getByText("直近半年"));

		expect(onPeriodChange).toHaveBeenCalledWith("halfYear");
	});

	it("データがない期間は空メッセージを表示する", async () => {
		const user = userEvent.setup();
		render(<CommitterRankingCard rankings={mockRankings} />);

		await user.click(screen.getByText("直近1ヶ月"));

		expect(
			screen.getByText("この期間のコミットデータがありません"),
		).toBeInTheDocument();
	});

	it("選択された期間のボタンがハイライトされる", async () => {
		const user = userEvent.setup();
		render(<CommitterRankingCard rankings={mockRankings} />);

		// 初期状態で全期間がハイライト
		const allButton = screen.getByText("全期間");
		expect(allButton.className).toContain("bg-primary");

		// 直近1年をクリック
		await user.click(screen.getByText("直近1年"));

		// 直近1年がハイライト、全期間はハイライト解除
		const yearButton = screen.getByText("直近1年");
		expect(yearButton.className).toContain("bg-primary");
		expect(allButton.className).not.toContain("bg-primary");
	});

	it("ランキング番号が正しく表示される", () => {
		const longRankings: Record<RankingPeriod, CommitterRanking[]> = {
			all: Array.from({ length: 10 }, (_, i) => ({
				rank: i + 1,
				authorName: `User ${i + 1}`,
				authorEmail: `user${i + 1}@example.com`,
				commitCount: 100 - i * 10,
			})),
			year: [],
			halfYear: [],
			month: [],
		};

		const { container } = render(
			<CommitterRankingCard rankings={longRankings} />,
		);

		// 4位以降は数字で表示される
		const rankElements = container.querySelectorAll(
			".flex.items-center.justify-center.w-8.h-8",
		);
		const rankTexts = Array.from(rankElements).map((el) => el.textContent);

		expect(rankTexts).toContain("🥇"); // 1位
		expect(rankTexts).toContain("🥈"); // 2位
		expect(rankTexts).toContain("🥉"); // 3位
		expect(rankTexts).toContain("4"); // 4位
		expect(rankTexts).toContain("10"); // 10位
	});

	it("コミット数のラベルが正しく表示される", () => {
		render(<CommitterRankingCard rankings={mockRankings} />);

		// コミットカウントが表示されていることを確認
		expect(screen.getByText("150")).toBeInTheDocument();
		expect(screen.getByText("120")).toBeInTheDocument();
		expect(screen.getByText("95")).toBeInTheDocument();
	});
});

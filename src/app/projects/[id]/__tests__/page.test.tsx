import { render, screen, waitFor } from "@testing-library/react";
import { notFound } from "next/navigation";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { buildProjectWithStats } from "@/lib/testing/factories";
import {
	getMonthlyCommitStats,
	getProjectDetail,
	getWeeklyCommitStats,
} from "../../actions";
import ProjectDetailPage from "../page";

// ResizeObserverのモック（Rechartsで必要）
class MockResizeObserver {
	observe = vi.fn();
	unobserve = vi.fn();
	disconnect = vi.fn();
}

beforeAll(() => {
	global.ResizeObserver = MockResizeObserver;
});

// モック設定
vi.mock("next/navigation", () => ({
	notFound: vi.fn(),
}));

vi.mock("../../actions", () => ({
	getProjectDetail: vi.fn(),
	getMonthlyCommitStats: vi.fn(),
	getWeeklyCommitStats: vi.fn(),
}));

const mockProject = buildProjectWithStats({
	id: 1,
	name: "テストプロジェクト",
	description: "これはテスト用のプロジェクトです",
	gitlab_id: 123,
	default_branch: "main",
	web_url: "https://gitlab.com/test/project",
	visibility: "public",
	commitCount: 42,
	lastCommitDate: new Date("2024-01-15"),
});

const mockMonthlyData = [
	{ period: "2024-01", count: 10, type: "monthly" as const },
	{ period: "2024-02", count: 15, type: "monthly" as const },
];

const mockWeeklyData = [
	{ period: "2024-01", count: 3, type: "weekly" as const },
	{ period: "2024-02", count: 5, type: "weekly" as const },
];

describe("ProjectDetailPage", () => {
	it("should display loading state initially", () => {
		vi.mocked(getProjectDetail).mockImplementation(
			() => new Promise(() => {}), // 永続的にpending
		);
		vi.mocked(getMonthlyCommitStats).mockImplementation(
			() => new Promise(() => {}),
		);
		vi.mocked(getWeeklyCommitStats).mockImplementation(
			() => new Promise(() => {}),
		);

		render(<ProjectDetailPage params={{ id: "1" }} />);

		expect(
			screen.getByText("プロジェクト情報を読み込み中..."),
		).toBeInTheDocument();
		expect(screen.getByText("プロジェクト一覧に戻る")).toBeInTheDocument();
	});

	it("should display project details when data is loaded", async () => {
		vi.mocked(getProjectDetail).mockResolvedValue(mockProject);
		vi.mocked(getMonthlyCommitStats).mockResolvedValue(mockMonthlyData);
		vi.mocked(getWeeklyCommitStats).mockResolvedValue(mockWeeklyData);

		render(<ProjectDetailPage params={{ id: "1" }} />);

		await waitFor(() => {
			expect(screen.getByText("テストプロジェクト")).toBeInTheDocument();
		});

		// プロジェクト情報
		expect(
			screen.getByText("これはテスト用のプロジェクトです"),
		).toBeInTheDocument();
		expect(screen.getByText("パブリック")).toBeInTheDocument();
		expect(screen.getByText("デフォルトブランチ: main")).toBeInTheDocument();
		expect(screen.getByText("GitLab ID: 123")).toBeInTheDocument();

		// 統計情報
		expect(screen.getByText("42")).toBeInTheDocument(); // コミット数
		expect(screen.getByText("2024/1/15")).toBeInTheDocument(); // 最終更新

		// リンク
		const gitlabLink = screen.getByText("GitLabで表示");
		expect(gitlabLink).toHaveAttribute(
			"href",
			"https://gitlab.com/test/project",
		);
		expect(gitlabLink).toHaveAttribute("target", "_blank");

		// 戻るリンク（複数要素ある場合も対応）
		const backLinks = screen.getAllByText("プロジェクト一覧に戻る");
		expect(backLinks.length).toBeGreaterThan(0);
	});

	it("should display error state when data fetch fails", async () => {
		vi.mocked(getProjectDetail).mockRejectedValue(
			new Error("データ取得エラー"),
		);
		vi.mocked(getMonthlyCommitStats).mockResolvedValue([]);
		vi.mocked(getWeeklyCommitStats).mockResolvedValue(mockWeeklyData);

		render(<ProjectDetailPage params={{ id: "1" }} />);

		await waitFor(() => {
			expect(screen.getByText("データ取得エラー")).toBeInTheDocument();
		});

		// 戻るリンクが存在することを確認（複数要素ある場合も対応）
		const backLinks = screen.getAllByText("プロジェクト一覧に戻る");
		expect(backLinks.length).toBeGreaterThan(0);
	});

	it("should call notFound when project is not found", async () => {
		vi.mocked(getProjectDetail).mockResolvedValue(null);
		vi.mocked(getMonthlyCommitStats).mockResolvedValue([]);
		vi.mocked(getWeeklyCommitStats).mockResolvedValue(mockWeeklyData);

		render(<ProjectDetailPage params={{ id: "1" }} />);

		await waitFor(() => {
			expect(notFound).toHaveBeenCalled();
		});
	});

	it("should call notFound for invalid project ID", () => {
		render(<ProjectDetailPage params={{ id: "invalid" }} />);

		expect(notFound).toHaveBeenCalled();
	});

	it("should display '未同期' when lastCommitDate is null", async () => {
		const projectWithoutSync = {
			...mockProject,
			lastCommitDate: null,
		};
		vi.mocked(getProjectDetail).mockResolvedValue(projectWithoutSync);
		vi.mocked(getMonthlyCommitStats).mockResolvedValue([]);
		vi.mocked(getWeeklyCommitStats).mockResolvedValue(mockWeeklyData);

		render(<ProjectDetailPage params={{ id: "1" }} />);

		await waitFor(() => {
			expect(screen.getByText("未同期")).toBeInTheDocument();
		});
	});
});

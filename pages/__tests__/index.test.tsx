import { cleanup, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Home from "../index.jsx";

// Mock Next.js Head component
vi.mock("next/head", () => {
	return {
		default: ({ children }: { children: ReactNode }) => children,
	};
});

describe("ホームページ", () => {
	beforeEach(() => {
		// Clean up DOM and reset mocks before each test
		cleanup();
		vi.resetAllMocks();
		vi.clearAllMocks();
	});

	it("ページタイトルが表示される", () => {
		// Mock successful API response
		global.fetch = vi.fn().mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				status: "healthy",
				timestamp: "2023-01-01T00:00:00.000Z",
				uptime: 3600,
				environment: "test",
			}),
		});

		render(<Home />);

		expect(
			screen.getByRole("heading", { name: /GitLab Repository Analyzer/i }),
		).toBeInTheDocument();
		expect(
			screen.getByText(
				"GitLabリポジトリの構造、品質、依存関係を分析するWebツール",
			),
		).toBeInTheDocument();
	});

	it("ローディング状態を表示する", () => {
		// Mock delayed API response
		global.fetch = vi.fn().mockImplementation(() => new Promise(() => {}));

		render(<Home />);

		expect(screen.getByText("ヘルスチェック中...")).toBeInTheDocument();
	});

	it("ヘルスチェックAPIを呼び出してステータスを表示する", async () => {
		const mockHealthData = {
			status: "healthy",
			timestamp: "2023-01-01T00:00:00.000Z",
			uptime: 3600,
			environment: "test",
		};

		global.fetch = vi.fn().mockResolvedValueOnce({
			ok: true,
			json: async () => mockHealthData,
		});

		render(<Home />);

		// API呼び出し検証
		expect(global.fetch).toHaveBeenCalledWith("/api/health");
		expect(global.fetch).toHaveBeenCalledTimes(1);

		await waitFor(() => {
			expect(screen.getByText("正常")).toBeInTheDocument();
		});

		// Use more specific selectors to avoid multiple element matches
		const healthSection = screen.getByRole("heading", { name: /システム状態/i }).parentElement;
		expect(healthSection).toHaveTextContent("最終確認:");
		expect(healthSection).toHaveTextContent("稼働時間:");
		expect(healthSection).toHaveTextContent("3600");
		expect(healthSection).toHaveTextContent("秒");
		expect(healthSection).toHaveTextContent("環境:");
		expect(healthSection).toHaveTextContent("test");
	});

	it("unhealthyステータスを正しく表示する", async () => {
		const mockHealthData = {
			status: "unhealthy",
			timestamp: "2023-01-01T00:00:00.000Z",
			uptime: 1800,
			environment: "test",
		};

		global.fetch = vi.fn().mockResolvedValueOnce({
			ok: true,
			json: async () => mockHealthData,
		});

		render(<Home />);

		await waitFor(() => {
			expect(screen.getByText("異常")).toBeInTheDocument();
		});
	});

	it("APIエラー時にエラーメッセージを表示する", async () => {
		global.fetch = vi.fn().mockRejectedValueOnce(new Error("API Error"));

		// コンソールエラーをモック（テスト出力を綺麗にするため）
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		render(<Home />);

		await waitFor(() => {
			expect(
				screen.getByText("ヘルスチェックの取得に失敗しました"),
			).toBeInTheDocument();
		});

		expect(consoleSpy).toHaveBeenCalledWith(
			"ヘルスチェックの取得に失敗しました:",
			expect.any(Error),
		);

		consoleSpy.mockRestore();
	});

	it("APIレスポンスがJSON形式でない場合にエラーを処理する", async () => {
		global.fetch = vi.fn().mockResolvedValueOnce({
			ok: true,
			json: async () => {
				throw new Error("Invalid JSON");
			},
		});

		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		render(<Home />);

		await waitFor(() => {
			expect(
				screen.getByText("ヘルスチェックの取得に失敗しました"),
			).toBeInTheDocument();
		});

		consoleSpy.mockRestore();
	});
});

import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/health/route";

describe("/health（App Router）", () => {
	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it("GET リクエストでヘルスデータを返す", async () => {
		const response = await GET();

		expect(response.status).toBe(200);

		const data = await response.json();
		expect(data).toMatchObject({
			status: "healthy",
			timestamp: expect.any(String),
			uptime: expect.any(Number),
			environment: expect.any(String),
		});

		// タイムスタンプが有効なISO文字列であることを確認
		expect(() => new Date(data.timestamp).toISOString()).not.toThrow();

		// 稼働時間が正の数であることを確認
		expect(data.uptime).toBeGreaterThan(0);
	});

	it("環境変数が設定されていない場合、developmentを返す", async () => {
		vi.stubEnv("NODE_ENV", undefined);

		const response = await GET();
		const data = await response.json();

		expect(data.environment).toBe("development");
	});
});

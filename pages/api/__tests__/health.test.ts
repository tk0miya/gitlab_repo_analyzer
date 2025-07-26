import { describe, expect, it, vi } from "vitest";
import type { NextApiRequest, NextApiResponse } from "next";
import { createMocks } from "node-mocks-http";
import handler from "../health.js";

describe("/api/health", () => {
	it("GET リクエストでヘルスデータを返す", async () => {
		const { req, res } = createMocks({
			method: "GET",
		});

		await handler(req, res);

		expect(res._getStatusCode()).toBe(200);

		const data = JSON.parse(res._getData());
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

	it("サポートされていないHTTPメソッドで405エラーを返す", async () => {
		const { req, res } = createMocks({
			method: "POST",
		});

		await handler(req, res);

		expect(res._getStatusCode()).toBe(405);
		expect(res._getHeaders()).toHaveProperty("allow", ["GET"]);
		expect(res._getData()).toBe("Method POST Not Allowed");
	});

	it("環境変数が設定されていない場合、developmentを返す", async () => {
		vi.stubEnv("NODE_ENV", undefined);

		const { req, res } = createMocks({
			method: "GET",
		});

		await handler(req, res);

		const data = JSON.parse(res._getData());
		expect(data.environment).toBe("development");

		vi.unstubAllEnvs();
	});
});

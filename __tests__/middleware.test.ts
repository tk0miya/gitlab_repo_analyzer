import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "../middleware";

describe("セキュリティミドルウェア", () => {
	it("基本的なセキュリティヘッダーを設定する", async () => {
		const request = new NextRequest("http://localhost:3000/");
		const response = await middleware(request);

		expect(response.headers.get("X-Frame-Options")).toBe("DENY");
		expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
		expect(response.headers.get("X-XSS-Protection")).toBe("1; mode=block");
		expect(response.headers.get("Referrer-Policy")).toBe(
			"strict-origin-when-cross-origin",
		);
	});

	it("API routes に CORS ヘッダーを設定する", async () => {
		const request = new NextRequest("http://localhost:3000/api/health");
		const response = await middleware(request);

		expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
		expect(response.headers.get("Access-Control-Allow-Methods")).toBe(
			"GET, POST, PUT, DELETE, OPTIONS",
		);
		expect(response.headers.get("Access-Control-Allow-Headers")).toBe(
			"Content-Type, Authorization",
		);
	});

	it("API以外のルートにはCORSヘッダーを設定しない", async () => {
		const request = new NextRequest("http://localhost:3000/");
		const response = await middleware(request);

		expect(response.headers.get("Access-Control-Allow-Origin")).toBeNull();
		expect(response.headers.get("Access-Control-Allow-Methods")).toBeNull();
		expect(response.headers.get("Access-Control-Allow-Headers")).toBeNull();
	});

	it("異なるAPIルートでもCORSヘッダーを設定する", async () => {
		const request = new NextRequest("http://localhost:3000/api/users");
		const response = await middleware(request);

		expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
		expect(response.headers.get("Access-Control-Allow-Methods")).toBe(
			"GET, POST, PUT, DELETE, OPTIONS",
		);
		expect(response.headers.get("Access-Control-Allow-Headers")).toBe(
			"Content-Type, Authorization",
		);
	});

	it("ネストされたAPIルートでもCORSヘッダーを設定する", async () => {
		const request = new NextRequest("http://localhost:3000/api/health");
		const response = await middleware(request);

		expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
	});

	it("すべてのルートで基本セキュリティヘッダーを設定する", async () => {
		const routes = [
			"http://localhost:3000/",
			"http://localhost:3000/about",
			"http://localhost:3000/api/health",
			"http://localhost:3000/admin/dashboard",
		];

		for (const url of routes) {
			const request = new NextRequest(url);
			const response = await middleware(request);

			expect(response.headers.get("X-Frame-Options")).toBe("DENY");
			expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
			expect(response.headers.get("X-XSS-Protection")).toBe("1; mode=block");
			expect(response.headers.get("Referrer-Policy")).toBe(
				"strict-origin-when-cross-origin",
			);
		}
	});

	it("レスポンスが正常に返される", async () => {
		const request = new NextRequest("http://localhost:3000/");
		const response = await middleware(request);

		expect(response).toBeDefined();
		expect(response.status).toBe(200);
	});
});

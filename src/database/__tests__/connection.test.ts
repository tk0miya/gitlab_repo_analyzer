import { afterAll, beforeAll, describe, expect, it } from "vitest";

describe("Database Connection", () => {
	let connectionModule: any;

	// 動的インポートを使用して環境変数設定後にモジュールを読み込み
	beforeAll(async () => {
		connectionModule = await import("../connection.js");
	});

	afterAll(async () => {
		if (connectionModule?.closeConnection) {
			await connectionModule.closeConnection();
		}
	});

	describe("testConnection", () => {
		it("should successfully test database connection and verify pool validity", async () => {
			const result = await connectionModule.testConnection();
			expect(result).toBe(true);
		});
	});
});

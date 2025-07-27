import { afterAll, describe, expect, it } from "vitest";
import { closeConnection, testConnection } from "@/database/connection.js";

describe("Database Connection", () => {
	afterAll(async () => {
		await closeConnection();
	});

	describe("testConnection", () => {
		it("should successfully test database connection and verify pool validity", async () => {
			const result = await testConnection();
			expect(result).toBe(true);
		});
	});
});

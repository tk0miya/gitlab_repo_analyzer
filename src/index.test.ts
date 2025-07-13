import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loadConfig } from "./config/index.js";

/**
 * メインアプリケーションと設定システムのテストファイル
 */

describe("環境設定テスト", () => {
	it("TypeScript環境が正常に動作すること", () => {
		const testValue: string = "test";
		expect(testValue).toBe("test");
	});

	it("Node.js環境が利用可能であること", () => {
		expect(process.version).toMatch(/^v\d+\.\d+\.\d+/);
	});
});

describe("設定システムテスト", () => {
	let originalEnv: NodeJS.ProcessEnv;

	beforeEach(() => {
		originalEnv = { ...process.env };
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	it("設定システムが正常に動作する", async () => {
		// 有効な設定を設定
		process.env.GITLAB_TOKEN = "test-token-12345";
		process.env.DB_DATABASE = "test-database";
		process.env.DB_USERNAME = "test-user";

		const config = await loadConfig();

		expect(config.gitlab.token).toBe("test-token-12345");
		expect(config.gitlab.url).toBe("https://gitlab.com");
		expect(config.database.database).toBe("test-database");
		expect(config.database.username).toBe("test-user");
	});

	it("必須設定が不足している場合エラーが発生する", async () => {
		// 必須項目を削除
		delete process.env.GITLAB_TOKEN;
		delete process.env.DB_DATABASE;
		delete process.env.DB_USERNAME;

		await expect(loadConfig()).rejects.toThrow("設定の検証に失敗しました");
	});
});

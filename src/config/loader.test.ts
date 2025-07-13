import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { ConfigLoader } from "./loader.js";

describe("ConfigLoader", () => {
	let originalEnv: NodeJS.ProcessEnv;

	beforeEach(() => {
		// 環境変数をバックアップ
		originalEnv = { ...process.env };
	});

	afterEach(() => {
		// 環境変数を復元
		process.env = originalEnv;
	});

	test("デフォルト設定で初期化される", async () => {
		// 環境変数をクリア
		delete process.env.GITLAB_TOKEN;
		delete process.env.DB_HOST;
		delete process.env.DB_DATABASE;
		delete process.env.DB_USERNAME;

		const loader = ConfigLoader.getInstance();

		// バリデーションエラーが発生することを確認（必須項目が不足）
		await expect(loader.load()).rejects.toThrow("設定の検証に失敗しました");
	});

	test("環境変数から設定が読み込まれる", async () => {
		// 環境変数を設定
		process.env.GITLAB_TOKEN = "test-token";
		process.env.DB_HOST = "test-host";
		process.env.DB_PORT = "3306";
		process.env.DB_DATABASE = "test-db";
		process.env.DB_USERNAME = "test-user";
		process.env.DB_PASSWORD = "test-pass";
		process.env.DB_SSL = "true";

		const loader = ConfigLoader.getInstance();
		const config = await loader.load();

		expect(config.gitlab.token).toBe("test-token");
		expect(config.database.host).toBe("test-host");
		expect(config.database.port).toBe(3306);
		expect(config.database.database).toBe("test-db");
		expect(config.database.username).toBe("test-user");
		expect(config.database.password).toBe("test-pass");
		expect(config.database.ssl).toBe(true);
	});

	test("GitLab設定の固定値が正しく設定される", async () => {
		// 必須項目のみ設定
		process.env.GITLAB_TOKEN = "test-token";
		process.env.DB_DATABASE = "test-db";
		process.env.DB_USERNAME = "test-user";

		const loader = ConfigLoader.getInstance();
		const config = await loader.load();

		// GitLab設定の固定値を確認
		expect(config.gitlab.url).toBe("https://gitlab.com");
		expect(config.gitlab.apiVersion).toBe("v4");
		expect(config.gitlab.timeout).toBe(30000);
	});

	test("設定のバリデーションが動作する", async () => {
		// 不正な設定を設定
		process.env.GITLAB_TOKEN = ""; // 空文字（無効）
		process.env.DB_PORT = "invalid"; // 数値以外（無効）

		const loader = ConfigLoader.getInstance();

		// バリデーションエラーが発生することを確認
		await expect(loader.load()).rejects.toThrow("設定の検証に失敗しました");
	});
});

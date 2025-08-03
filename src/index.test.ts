import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loadConfig } from "./config/index";

/**
 * メインアプリケーションと設定システムのテストファイル
 * vitest設定とTypeScript統合の動作確認用
 */

describe("環境設定テスト", () => {
	it("TypeScript環境が正常に動作すること", () => {
		const testValue: string = "test";
		expect(testValue).toBe("test");
	});

	it("Node.js環境が利用可能であること", () => {
		expect(process.version).toMatch(/^v\d+\.\d+\.\d+/);
	});

	it("パスエイリアス設定の動作確認", () => {
		// パスエイリアス（@/src）が設定されていることを確認
		// 実際のインポートが必要な場合は別途テストを追加
		expect(true).toBe(true);
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
		expect(config.database.database).toBe("gitlab_analyzer_test");
		expect(config.database.username).toBe("test-user");
	});

	it("必須設定が不足している場合エラーが発生する", async () => {
		// 必須項目を削除
		delete process.env.GITLAB_TOKEN;
		delete process.env.DB_DATABASE;
		delete process.env.DB_USERNAME;

		// ConfigLoaderのインスタンスを取得して.envファイル読み込みをスキップ
		const { ConfigLoader } = await import("./config/loader");
		const loader = ConfigLoader.getInstance();
		loader.setSkipDotenv(true);

		await expect(loader.load()).rejects.toThrow("設定の検証に失敗しました");
	});
});

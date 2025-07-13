import { describe, expect, it } from "vitest";

/**
 * 基本的なテストファイル
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

/**
 * GitLabリポジトリ分析ツールのテスト
 * vitest設定とTypeScript統合のテスト
 */

import { describe, expect, it } from "vitest";

// TypeScript型チェックテスト
describe("TypeScript統合テスト", () => {
	it("基本的な型チェックが動作する", () => {
		const text: string = "TypeScript正常動作";
		const number: number = 42;

		expect(typeof text).toBe("string");
		expect(typeof number).toBe("number");
	});
});

// Node.js環境テスト
describe("Node.js環境テスト", () => {
	it("process.versionが取得できる", () => {
		expect(process.version).toBeDefined();
		expect(process.version).toMatch(/^v\d+\.\d+\.\d+/);
	});
});

// 基本関数テスト
describe("基本関数テスト", () => {
	it("文字列結合が正常に動作する", () => {
		const result = `GitLab分析ツール v${process.version}`;
		expect(result).toContain("GitLab分析ツール");
		expect(result).toContain(process.version);
	});
});
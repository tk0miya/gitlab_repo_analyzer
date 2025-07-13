import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		// TypeScript統合有効
		globals: true,
		environment: "node",

		// カバレッジ設定
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			exclude: [
				"coverage/**",
				"dist/**",
				"node_modules/**",
				"**/*.d.ts",
				"**/*.config.*",
				"**/*.test.*",
			],
			thresholds: {
				global: {
					branches: 80,
					functions: 80,
					lines: 80,
					statements: 80,
				},
			},
		},

		// モック設定
		mockReset: true,
		restoreMocks: true,

		// テストファイルパターン
		include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
		exclude: ["node_modules/**", "dist/**"],

		// タイムアウト設定
		testTimeout: 10000,
	},

	// パスエイリアス設定
	resolve: {
		alias: {
			"@": resolve(__dirname, "./src"),
			"@/src": resolve(__dirname, "./src"),
		},
	},

	// ESM対応
	esbuild: {
		target: "node22",
	},
});
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	esbuild: {
		jsx: "automatic", // Use automatic JSX runtime
		jsxImportSource: "react", // Specify React as JSX import source
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
			"@/api": path.resolve(__dirname, "./src/api"),
			"@/types": path.resolve(__dirname, "./src/types"),
			"@/database": path.resolve(__dirname, "./src/database"),
			"@/config": path.resolve(__dirname, "./src/config"),
		},
	},
	test: {
		globals: false,
		environment: "jsdom", // Enable browser environment for React components
		setupFiles: ["./tests/setup.ts"], // Setup file for React Testing Library
		mockReset: true,
		restoreMocks: true,
		typecheck: {
			tsconfig: "./tsconfig.json",
		},
		// Provide expect globally for jest-dom while keeping other functions explicit
		pool: "forks",
	},
});

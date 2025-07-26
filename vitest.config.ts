import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "jsdom", // Enable browser environment for React components
		setupFiles: ["./tests/setup.ts"], // Setup file for React Testing Library
		mockReset: true,
		restoreMocks: true,
	},
});

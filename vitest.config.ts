import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [tsconfigPaths()],
	esbuild: {
		jsx: "automatic", // Use automatic JSX runtime
		jsxImportSource: "react", // Specify React as JSX import source
	},
	test: {
		environment: "jsdom", // Enable browser environment for React components
		setupFiles: ["./config/vitest/setup.ts"], // Setup file for React Testing Library
		mockReset: true,
		restoreMocks: true,
		silent: "passed-only", // 成功したテストのconsole出力を抑制
		reporters: "dot", // 最小限のドット表示
	},
});

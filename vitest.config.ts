import { defineConfig } from "vitest/config";

export default defineConfig({
	esbuild: {
		jsx: "automatic",
	},
	test: {
		environment: "jsdom",
		setupFiles: ["./tests/setup.ts"],
		globals: true,
		include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
		environmentMatchGlobs: [
			["tests/**/(auth|loginRoute|logoutRoute|middleware).test.ts", "node"],
		],
	},
});

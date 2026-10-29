import { defineConfig } from "vite-plus"
import { playwright } from "vite-plus/test/browser-playwright"

export default defineConfig({
	test: {
		include: ["source/**/*.spec.ts"],
		typecheck: { enabled: true },
		browser: {
			provider: playwright(),
			instances: [{ browser: "chromium" }],
			headless: true,
		},
	},
	fmt: {
		useTabs: true,
		semi: false,
		printWidth: 80,
		ignorePatterns: ["**/*.md"],
	},
	lint: {
		jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
		rules: { "vite-plus/prefer-vite-plus-imports": "error" },
		options: { typeAware: true, typeCheck: true },
		overrides: [
			{
				files: ["**/*.test-d.ts"],
				rules: { "typescript/prefer-as-const": "off" },
			},
		],
	},
})

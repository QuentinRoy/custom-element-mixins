import { playwright } from "@vitest/browser-playwright"
import { defineConfig } from "vitest/config"

export default defineConfig({
	test: {
		include: ["source/**/*.spec.ts"],
		browser: {
			provider: playwright(),
			instances: [{ browser: "chromium" }],
			headless: true,
		},
	},
})

import { expect, test } from "vitest"
import { toKebabCase } from "./utils.ts"

test("toKebabCase converts camelCase", () => {
	expect(toKebabCase("helloWorld")).toBe("hello-world")
})

test("toKebabCase keeps kebab-case lowercase", () => {
	expect(toKebabCase("already-kebab-case")).toBe("already-kebab-case")
})

test("toKebabCase separates digit-to-uppercase boundaries", () => {
	expect(toKebabCase("v2FeatureFlag")).toBe("v2-feature-flag")
})

test("toKebabCase lowercases the full output", () => {
	expect(toKebabCase("ABC")).toBe("abc")
})

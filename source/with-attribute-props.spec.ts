import { expect, expectTypeOf, test } from "vitest"
import type { Merge } from "./utils.ts"
import { number, WithAttributeProps } from "./with-attribute-props.ts"

class AttributeTarget {
	#map = new Map<string, string>()
	getAttribute(name: string): string | null {
		return this.#map.get(name) ?? null
	}
	setAttribute(name: string, value: string): void {
		this.#map.set(name, value)
	}
	removeAttribute(name: string): void {
		this.#map.delete(name)
	}
}

test("WithHTMLAttributes attributes getter and setters", () => {
	class A extends AttributeTarget {
		unknown = "unknown" as const
	}

	const T = WithAttributeProps(A, {
		myAttr: {
			parse(value: string | null): "a" | "unknown" {
				if (value == null || value !== "a") return this.unknown
				return value
			},
			serialize(value: "a" | "b" | "c" | "unknown"): string | null {
				switch (value) {
					case "a":
					case "b":
						return value
					case this.unknown:
						return this.myAttr
					default:
						return null
				}
			},
		},
	})
	let t = new T()
	expectTypeOf(t).toEqualTypeOf<
		Merge<
			AttributeTarget,
			{ unknown: "unknown"; myAttr: "a" | "b" | "c" | "unknown" }
		>
	>()

	expect(t.myAttr).toBe("unknown")
	expect(t.getAttribute("my-attr")).toBe(null)
	t.myAttr = "a"
	expect(t.getAttribute("my-attr")).toBe("a")
	expect(t.myAttr).toBe("a")
	t.myAttr = "b"
	expect(t.getAttribute("my-attr")).toBe("b")
	expect(t.myAttr).toBe("unknown")
	t.myAttr = "c"
	expect(t.getAttribute("my-attr")).toBe(null)
	expect(t.myAttr).toBe("unknown")
	t.myAttr = "a"
	t.myAttr = "unknown"
	expect(t.getAttribute("my-attr")).toBe("a")
	expect(t.myAttr).toBe("a")
})

test("number() without default", () => {
	let n = number()
	expect(n.parse(null)).toBe(null)
	expect(n.serialize(null)).toBe(null)
	expect(n.parse("123")).toBe(123)
	expect(n.serialize(123)).toBe("123")
	expect(() => n.parse("not a number")).toThrowErrorMatchingInlineSnapshot(
		`[Error: Expected attribute to be a number, got "not a number"]`,
	)
})

test("number() with default", () => {
	let n = number({ default: 3 })
	expect(n.parse(null)).toBe(3)
	expect(n.parse("123")).toBe(123)
	expect(n.serialize(123)).toBe("123")
	expect(() => n.parse("not a number")).toThrowErrorMatchingInlineSnapshot(
		`[Error: Expected attribute to be a number, got "not a number"]`,
	)
})

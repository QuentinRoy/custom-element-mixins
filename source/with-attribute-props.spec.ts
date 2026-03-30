import { expect, expectTypeOf, test } from "vitest"
import {
	boolean,
	number,
	pickList,
	string,
	WithAttributeProps,
} from "./with-attribute-props.ts"

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
	expectTypeOf(t).toEqualTypeOf<A & { myAttr: "a" | "b" | "c" | "unknown" }>()

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

	expect(t).toBeInstanceOf(A)
})

test("number() without default", () => {
	let n = number()
	expect(n.parse(null)).toBe(null)
	expect(n.serialize(null)).toBe(null)
	expect(n.parse("123")).toBe(123)
	expect(n.serialize(123)).toBe("123")
	expect(n.parse("not a number")).toBe(null)
})

test("number() with default", () => {
	let n = number({ default: 3 })
	expect(n.parse(null)).toBe(3)
	expect(n.parse("123")).toBe(123)
	expect(n.serialize(123)).toBe("123")
	expect(n.parse("not a number")).toBe(3)
})

test("string() without default", () => {
	let s = string()
	expect(s.parse(null)).toBe(null)
	expect(s.parse("hello")).toBe("hello")
	expect(s.serialize("hello")).toBe("hello")
	expect(s.serialize(null)).toBe(null)
})

test("string() with default", () => {
	let s = string({ default: "fallback" })
	expect(s.parse(null)).toBe("fallback")
	expect(s.parse("hello")).toBe("hello")
	expect(s.serialize("hello")).toBe("hello")
})

test("boolean()", () => {
	let b = boolean()
	expect(b.parse(null)).toBe(false)
	expect(b.parse("")).toBe(true)
	expect(b.parse("present")).toBe(true)
	expect(b.serialize(true)).toBe("")
	expect(b.serialize(false)).toBe(null)
})

test("pickList() without default", () => {
	let p = pickList({ values: ["primary", "secondary"] as const })
	expect(p.parse(null)).toBe(null)
	expect(p.parse("primary")).toBe("primary")
	expect(p.parse("unknown")).toBe(null)
	expect(p.serialize("secondary")).toBe("secondary")
	expect(p.serialize(null)).toBe(null)
})

test("pickList() with default", () => {
	let p = pickList({
		values: ["primary", "secondary"] as const,
		default: "primary",
	})
	expect(p.parse(null)).toBe("primary")
	expect(p.parse("secondary")).toBe("secondary")
	expect(p.parse("unknown")).toBe("primary")
	expect(p.serialize("secondary")).toBe("secondary")
})

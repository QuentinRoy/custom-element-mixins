import { expect, test } from "vitest"
import { boolean, number, pickList, string } from "./attribute-serializers.ts"

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

test("number() accepts values supported by Number()", () => {
	let n = number({ default: 7 })
	expect(n.parse("   42 ")).toBe(42)
	expect(n.parse("0x10")).toBe(16)
	expect(n.parse("Infinity")).toBe(Number.POSITIVE_INFINITY)
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

test("pickList() does not allow values outside the configured list", () => {
	let p = pickList({
		values: ["small", "large"] as const,
		default: "small",
	})
	expect(p.parse("SMALL")).toBe("small")
	expect(p.parse(" large ")).toBe("small")
})

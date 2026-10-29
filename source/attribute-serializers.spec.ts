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
	expect(n.parse("")).toBe(0)
	expect(n.parse(" \t\n ")).toBe(0)
	expect(n.parse("   42 ")).toBe(42)
	expect(n.parse("0x10")).toBe(16)
	expect(n.parse("Infinity")).toBe(Number.POSITIVE_INFINITY)
	expect(n.parse("-Infinity")).toBe(Number.NEGATIVE_INFINITY)
	expect(n.parse("1e999")).toBe(Number.POSITIVE_INFINITY)
	expect(n.parse("NaN")).toBe(7)
})

test("number() can reject blank attributes without rejecting infinity", () => {
	let n = number({ default: 7, rejectEmpty: true })
	let nullable = number({ rejectEmpty: true })
	for (let value of ["", " \t\n "]) {
		expect(n.parse(value)).toBe(7)
		expect(nullable.parse(value)).toBe(null)
	}
	expect(n.parse("0")).toBe(0)
	expect(n.parse(" 42 ")).toBe(42)
	expect(n.parse("Infinity")).toBe(Number.POSITIVE_INFINITY)
})

test("number() can reject non-finite values without rejecting blank attributes", () => {
	let n = number({ default: 7, finite: true })
	let nullable = number({ finite: true })
	for (let value of ["NaN", "Infinity", "-Infinity", "1e999", "-1e999"]) {
		expect(n.parse(value)).toBe(7)
		expect(nullable.parse(value)).toBe(null)
	}
	expect(n.parse("")).toBe(0)
	expect(n.parse(" \t\n ")).toBe(0)
	expect(n.parse("0")).toBe(0)
	expect(n.parse("-12.5")).toBe(-12.5)
	expect(n.parse("1e3")).toBe(1000)
})

test.each([
	NaN,
	Infinity,
	-Infinity,
])("number() rejects a non-finite default %s when finite is enabled", (defaultValue) => {
	expect(() => number({ default: defaultValue, finite: true })).toThrow(
		RangeError,
	)
})

test("number() can combine blank rejection and finite validation", () => {
	let n = number({ default: 7, rejectEmpty: true, finite: true })
	let nullable = number({ default: null, rejectEmpty: true, finite: true })
	for (let value of [
		null,
		"",
		" \t\n ",
		"NaN",
		"Infinity",
		"-Infinity",
		"12px",
	]) {
		expect(n.parse(value)).toBe(7)
		expect(nullable.parse(value)).toBe(null)
	}
	for (let [value, expected] of [
		["0", 0],
		[" 42 ", 42],
		["-12.5", -12.5],
		["1e3", 1000],
		["0x10", 16],
	] as const) {
		expect(n.parse(value)).toBe(expected)
		expect(nullable.parse(value)).toBe(expected)
	}
	expect(n.serialize(Infinity)).toBe("Infinity")
	expect(nullable.serialize(null)).toBe(null)
})

test("number() restrictions can be explicitly disabled", () => {
	let n = number({ default: 7, rejectEmpty: false, finite: false })
	expect(n.parse("")).toBe(0)
	expect(n.parse(" \t\n ")).toBe(0)
	expect(n.parse("Infinity")).toBe(Infinity)
	expect(n.parse("-Infinity")).toBe(-Infinity)
})

test.each([
	NaN,
	Infinity,
	-Infinity,
])("number() still allows a non-finite default %s when finite is disabled", (defaultValue) => {
	expect(number({ default: defaultValue }).parse(null)).toBe(defaultValue)
	expect(
		number({ default: defaultValue, finite: false }).parse("invalid"),
	).toBe(defaultValue)
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

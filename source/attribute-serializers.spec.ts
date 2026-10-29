import { expect, test } from "vite-plus/test"
import { boolean, number, pickList, string } from "./attribute-serializers.ts"

test.each([
	[Symbol("missing"), undefined, undefined],
	[{ missing: true }, undefined, undefined],
	[false, undefined, undefined],
	[0, "0", undefined],
	["fallback", undefined, "fallback"],
	[null, undefined, undefined],
	[undefined, undefined, undefined],
] as const)(
	"serializers accept an arbitrary default %s",
	(defaultValue, numericAttribute, stringAttribute) => {
		let n = number({ default: defaultValue, finite: true, rejectEmpty: true })
		for (let value of [undefined, "invalid", "", "Infinity"]) {
			expect(n.parse(value)).toBe(defaultValue)
		}
		expect(n.parse("42")).toBe(42)
		expect(n.serialize(defaultValue)).toBe(numericAttribute)

		let s = string({ default: defaultValue })
		expect(s.parse(undefined)).toBe(defaultValue)
		expect(s.parse("")).toBe("")
		expect(s.parse("hello")).toBe("hello")
		expect(s.serialize(defaultValue)).toBe(stringAttribute)

		let p = pickList({ values: ["small", "large"], default: defaultValue })
		expect(p.parse(undefined)).toBe(defaultValue)
		expect(p.parse("invalid")).toBe(defaultValue)
		expect(p.parse("small")).toBe("small")
		expect(p.serialize(defaultValue)).toBe(stringAttribute)
	},
)

test("number() without default", () => {
	let n = number()
	expect(n.parse(undefined)).toBe(undefined)
	expect(n.serialize(undefined)).toBe(undefined)
	expect(n.parse("123")).toBe(123)
	expect(n.serialize(123)).toBe("123")
	expect(n.parse("not a number")).toBe(undefined)
})

test("number() with default", () => {
	let n = number({ default: 3 })
	expect(n.parse(undefined)).toBe(3)
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
	let optional = number({ rejectEmpty: true })
	for (let value of ["", " \t\n "]) {
		expect(n.parse(value)).toBe(7)
		expect(optional.parse(value)).toBe(undefined)
	}
	expect(n.parse("0")).toBe(0)
	expect(n.parse(" 42 ")).toBe(42)
	expect(n.parse("Infinity")).toBe(Number.POSITIVE_INFINITY)
})

test("number() can reject non-finite values without rejecting blank attributes", () => {
	let n = number({ default: 7, finite: true })
	let optional = number({ finite: true })
	for (let value of ["NaN", "Infinity", "-Infinity", "1e999", "-1e999"]) {
		expect(n.parse(value)).toBe(7)
		expect(optional.parse(value)).toBe(undefined)
	}
	expect(n.parse("")).toBe(0)
	expect(n.parse(" \t\n ")).toBe(0)
	expect(n.parse("0")).toBe(0)
	expect(n.parse("-12.5")).toBe(-12.5)
	expect(n.parse("1e3")).toBe(1000)
})

test.each([NaN, Infinity, -Infinity])(
	"number() rejects a non-finite default %s when finite is enabled",
	(defaultValue) => {
		expect(() => number({ default: defaultValue, finite: true })).toThrow(
			RangeError,
		)
	},
)

test("number() can combine blank rejection and finite validation", () => {
	let n = number({ default: 7, rejectEmpty: true, finite: true })
	let optional = number({ default: undefined, rejectEmpty: true, finite: true })
	for (let value of [
		undefined,
		"",
		" \t\n ",
		"NaN",
		"Infinity",
		"-Infinity",
		"12px",
	]) {
		expect(n.parse(value)).toBe(7)
		expect(optional.parse(value)).toBe(undefined)
	}
	for (let [value, expected] of [
		["0", 0],
		[" 42 ", 42],
		["-12.5", -12.5],
		["1e3", 1000],
		["0x10", 16],
	] as const) {
		expect(n.parse(value)).toBe(expected)
		expect(optional.parse(value)).toBe(expected)
	}
	expect(n.serialize(Infinity)).toBe("Infinity")
	expect(optional.serialize(undefined)).toBe(undefined)
})

test("number() restrictions can be explicitly disabled", () => {
	let n = number({ default: 7, rejectEmpty: false, finite: false })
	expect(n.parse("")).toBe(0)
	expect(n.parse(" \t\n ")).toBe(0)
	expect(n.parse("Infinity")).toBe(Infinity)
	expect(n.parse("-Infinity")).toBe(-Infinity)
})

test.each([NaN, Infinity, -Infinity])(
	"number() still allows a non-finite default %s when finite is disabled",
	(defaultValue) => {
		expect(number({ default: defaultValue }).parse(undefined)).toBe(
			defaultValue,
		)
		expect(
			number({ default: defaultValue, finite: false }).parse("invalid"),
		).toBe(defaultValue)
	},
)

test("string() without default", () => {
	let s = string()
	expect(s.parse(undefined)).toBe(undefined)
	expect(s.parse("hello")).toBe("hello")
	expect(s.serialize("hello")).toBe("hello")
	expect(s.serialize(undefined)).toBe(undefined)
})

test("string() with default", () => {
	let s = string({ default: "fallback" })
	expect(s.parse(undefined)).toBe("fallback")
	expect(s.parse("hello")).toBe("hello")
	expect(s.serialize("hello")).toBe("hello")
})

test("boolean()", () => {
	let b = boolean()
	expect(b.parse(undefined)).toBe(false)
	expect(b.parse("")).toBe(true)
	expect(b.parse("present")).toBe(true)
	expect(b.serialize(true)).toBe("")
	expect(b.serialize(false)).toBe(undefined)
})

test("pickList() without default", () => {
	let p = pickList({ values: ["primary", "secondary"] as const })
	expect(p.parse(undefined)).toBe(undefined)
	expect(p.parse("primary")).toBe("primary")
	expect(p.parse("unknown")).toBe(undefined)
	expect(p.serialize("secondary")).toBe("secondary")
	expect(p.serialize(undefined)).toBe(undefined)
})

test("pickList() with default", () => {
	let p = pickList({
		values: ["primary", "secondary"] as const,
		default: "primary",
	})
	expect(p.parse(undefined)).toBe("primary")
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

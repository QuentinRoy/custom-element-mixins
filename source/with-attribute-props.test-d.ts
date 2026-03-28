import { expectTypeOf, test } from "vitest"
import type { Constructor, Simplify } from "./utils.ts"
import {
	type AttributeSerializer,
	boolean,
	number,
	string,
	WithAttributeProps,
} from "./with-attribute-props.ts"

test("Type of WithAttributeProps parameters", () => {
	type AttributeTarget = {
		a: "a"
		setAttribute(name: string, value: string): void
		getAttribute(name: string): string | null
		removeAttribute(name: string): void
	}

	type T = ReturnType<
		typeof WithAttributeProps<
			Constructor<AttributeTarget, ["arg1", "arg2"]>,
			{
				x: {
					parse(value: string | null): "x"
					serialize(value: "x"): string | null
				}
			}
		>
	>
	type Expected = Constructor<
		{
			a: "a"
			setAttribute(name: string, value: string): void
			getAttribute(name: string): string | null
			removeAttribute(name: string): void
			x: "x"
		},
		["arg1", "arg2"]
	>
	expectTypeOf<T>().toEqualTypeOf<Expected>()
})

test("Type of WithAttributeProps asymmetric parameters", () => {
	class AttributeTarget {
		setAttribute(_name: string, _value: string): void {}
		getAttribute(_name: string): string | null {
			return null
		}
		removeAttribute(_name: string): void {}
		unknown = "unknown" as const
	}

	const Mixed = WithAttributeProps(AttributeTarget, {
		mode: {
			parse(value: string | null): "a" | "unknown" {
				if (value === "a") return "a"
				return this.unknown
			},
			serialize(value: "a" | "b" | "unknown"): string | null {
				return value === "unknown" ? null : value
			},
		},
	})

	expectTypeOf<InstanceType<typeof Mixed>>().toEqualTypeOf<{
		setAttribute(name: string, value: string): void
		getAttribute(name: string): string | null
		removeAttribute(name: string): void
		unknown: "unknown"
		mode: "a" | "b" | "unknown"
	}>()
})

test("Type of WithAttributeProps forbidden asymmetric parameters", () => {
	class AttributeTarget {
		setAttribute(_name: string, _value: string): void {}
		getAttribute(_name: string): string | null {
			return null
		}
		removeAttribute(_name: string): void {}
		unknown = "unknown" as const
	}

	const Forbidden = WithAttributeProps(AttributeTarget, {
		attr: {
			parse(_value: string | null): "a" | "b" {
				return "a"
			},
			// @ts-expect-error serialize must accept all values returned by parse.
			serialize(value: "a"): string | null {
				return value
			},
		},
	})
	void Forbidden
})

test("Type of number()", () => {
	let n1 = number()
	expectTypeOf(n1).toEqualTypeOf<{
		parse(a: string | null): number | null
		serialize(v: number | null): string | null
	}>

	let n2 = number({ default: 0 })
	expectTypeOf(n2).toEqualTypeOf<{
		parse(a: string | null): number
		serialize(v: number): string | null
	}>
})

test("Type of string()", () => {
	let s2 = string()
	expectTypeOf<Simplify<typeof s2>>().toEqualTypeOf<{
		parse: (a: string | null) => string | null
		serialize: (value: string | null) => string | null
	}>()
	let s1 = string({ default: "hello" })
	expectTypeOf<Simplify<typeof s1>>().toEqualTypeOf<{
		parse(a: string | null): string
		serialize(v: string): string | null
	}>()
})

test("Type of boolean()", () => {
	let b = boolean()
	expectTypeOf<Simplify<typeof b>>().toEqualTypeOf<{
		parse(a: string | null): boolean
		serialize(v: boolean): string | null
	}>()
})

test("Type of AttributeSerializer", () => {
	type T = AttributeSerializer<unknown, "test">
	expectTypeOf<Simplify<T>>().toEqualTypeOf<{
		parse(value: string | null): "test"
		serialize(value: "test"): string | null
	}>()

	type U = AttributeSerializer<unknown, "a" | "b" | null>
	expectTypeOf<Simplify<U>>().toEqualTypeOf<{
		parse(value: string | null): "a" | "b" | null
		serialize(value: "a" | "b" | null): string | null
	}>()

	type D = {
		parse(value: string | null): "a"
		serialize(value: "a" | "b" | "c"): string
	}
	expectTypeOf<
		D extends AttributeSerializer<unknown, "a"> ? true : false
	>().toEqualTypeOf<true>()
	expectTypeOf<
		D extends AttributeSerializer<unknown, "b"> ? true : false
	>().toEqualTypeOf<false>()

	const valid: AttributeSerializer<unknown, "a" | "b" | "c"> = {
		parse() {
			return "a"
		},
		serialize(value) {
			return value
		},
	}
	expectTypeOf(valid).toExtend<AttributeSerializer<unknown, "a" | "b" | "c">>()

	const invalid: AttributeSerializer<unknown, "a" | "b"> = {
		parse(): "a" | "b" {
			return "a"
		},
		// @ts-expect-error serialize must accept all values returned by parse.
		serialize(value: "a") {
			return value
		},
	}
	void invalid

	type V = Simplify<AttributeSerializer<unknown, "test">>
	expectTypeOf<V>().toEqualTypeOf<{
		parse(value: string | null): "test"
		serialize(value: "test"): string | null
	}>()

	type W = Simplify<AttributeSerializer<unknown, "a" | "b" | null>>
	expectTypeOf<W>().toEqualTypeOf<{
		parse(value: string | null): "a" | "b" | null
		serialize(value: "a" | "b" | null): string | null
	}>()
})

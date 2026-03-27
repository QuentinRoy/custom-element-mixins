import { expectTypeOf, test } from "vitest"
import type { Constructor, Simplify } from "./utils.ts"
import {
	type AttributeSerializer,
	boolean,
	number,
	string,
	type WithAttributeProps,
} from "./with-attribute-props.ts"

test("Type of WithHTMLAttributes parameters", () => {
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

test("Type of HtmlAttributeDescriptor", () => {
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
	expectTypeOf<D>().toMatchTypeOf<AttributeSerializer<unknown, "a">>()
	expectTypeOf<D>().toMatchTypeOf<AttributeSerializer<unknown, "a" | "b">>()
	expectTypeOf<D>().toMatchTypeOf<
		AttributeSerializer<unknown, "a" | "b" | "c">
	>()
	expectTypeOf<D>().not.toMatchTypeOf<AttributeSerializer<unknown, "b">>()
	// FIXME: This should not be an error
	expectTypeOf<D>().not.toMatchTypeOf<
		AttributeSerializer<unknown, "a" | "b" | "c" | "other one">
	>()
})

test("Type of HtmlAttributeDescriptor", () => {
	type T = Simplify<AttributeSerializer<unknown, "test">>
	expectTypeOf<T>().toEqualTypeOf<{
		parse(value: string | null): "test"
		serialize(value: "test"): string | null
	}>()

	type U = Simplify<AttributeSerializer<unknown, "a" | "b" | null>>
	expectTypeOf<U>().toEqualTypeOf<{
		parse(value: string | null): "a" | "b" | null
		serialize(value: "a" | "b" | null): string | null
	}>()
})

import { expectTypeOf, test } from "vite-plus/test"
import { boolean, number, pickList, string } from "./attribute-serializers.ts"
import type { Simplify } from "./utils.ts"
import type { AttributeSerializer } from "./with-attribute-props.ts"

test("arbitrary defaults are included in parsed and assigned types", () => {
	const missing = Symbol("missing")
	expectTypeOf(number({ default: missing })).toEqualTypeOf<
		AttributeSerializer<unknown, number | symbol>
	>()
	expectTypeOf(string({ default: missing })).toEqualTypeOf<
		AttributeSerializer<unknown, string | symbol>
	>()
	expectTypeOf(
		pickList({ values: ["small", "large"], default: missing }),
	).toEqualTypeOf<AttributeSerializer<unknown, "small" | "large" | symbol>>()

	const fallback = { missing: true }
	expectTypeOf(number({ default: fallback })).toEqualTypeOf<
		AttributeSerializer<unknown, number | typeof fallback>
	>()
	expectTypeOf(string({ default: 0 })).toEqualTypeOf<
		AttributeSerializer<unknown, string | 0>
	>()
	expectTypeOf(number({ default: "auto" })).toEqualTypeOf<
		AttributeSerializer<unknown, number | "auto">
	>()
	expectTypeOf(
		pickList({ values: ["small", "large"], default: "auto" }),
	).toEqualTypeOf<AttributeSerializer<unknown, "small" | "large" | "auto">>()
})

test("optional and undefined defaults preserve the undefined fallback type", () => {
	let options: { default?: symbol } = {}
	let unionDefault = undefined as symbol | undefined
	for (let opts of [options, { default: unionDefault }]) {
		expectTypeOf(number(opts)).toEqualTypeOf<
			AttributeSerializer<unknown, number | symbol | undefined>
		>()
		expectTypeOf(string(opts)).toEqualTypeOf<
			AttributeSerializer<unknown, string | symbol | undefined>
		>()
		expectTypeOf(
			pickList({ ...opts, values: ["small", "large"] }),
		).toEqualTypeOf<
			AttributeSerializer<unknown, "small" | "large" | symbol | undefined>
		>()
	}
	expectTypeOf(string({ default: undefined })).toEqualTypeOf(string())
	expectTypeOf(
		pickList({ values: ["small", "large"], default: undefined }),
	).toEqualTypeOf(pickList({ values: ["small", "large"] }))
	expectTypeOf(
		pickList({ values: ["small", "large"], default: "small" }),
	).toEqualTypeOf<AttributeSerializer<unknown, "small" | "large">>()
	expectTypeOf(
		pickList<"small" | "large">({
			values: ["small", "large"],
			default: "small",
		}),
	).toEqualTypeOf<AttributeSerializer<unknown, "small" | "large">>()
})

test("explicit null and void defaults retain their types", () => {
	expectTypeOf(number({ default: null })).toEqualTypeOf<
		AttributeSerializer<unknown, number | null>
	>()
	expectTypeOf(string({ default: null })).toEqualTypeOf<
		AttributeSerializer<unknown, string | null>
	>()
	expectTypeOf(
		pickList({ values: ["small", "large"], default: null }),
	).toEqualTypeOf<AttributeSerializer<unknown, "small" | "large" | null>>()

	let fallback = undefined as void
	expectTypeOf(number({ default: fallback })).toEqualTypeOf<
		AttributeSerializer<unknown, number | void>
	>()
	expectTypeOf(string({ default: fallback })).toEqualTypeOf<
		AttributeSerializer<unknown, string | void>
	>()
	expectTypeOf(
		pickList({ values: ["small", "large"], default: fallback }),
	).toEqualTypeOf<AttributeSerializer<unknown, "small" | "large" | void>>()
})

test("Type of number()", () => {
	let n1 = number()
	expectTypeOf(n1).toEqualTypeOf<{
		parse(a: string | undefined): number | undefined
		serialize(v: number | undefined): string | undefined
	}>()

	let n2 = number({ default: 0 })
	expectTypeOf(n2).toEqualTypeOf<{
		parse(a: string | undefined): number
		serialize(v: number): string | undefined
	}>()
})

test("number() options preserve the inferred property types", () => {
	for (let options of [
		{ rejectEmpty: true },
		{ finite: true },
		{ rejectEmpty: true, finite: true },
	]) {
		expectTypeOf(number(options)).toEqualTypeOf(number())
		expectTypeOf(number({ ...options, default: undefined })).toEqualTypeOf(
			number(),
		)
		expectTypeOf(number({ ...options, default: 0 })).toEqualTypeOf(
			number({ default: 0 }),
		)
	}
})

test("Type of string()", () => {
	let s2 = string()
	expectTypeOf<Simplify<typeof s2>>().toEqualTypeOf<{
		parse: (a: string | undefined) => string | undefined
		serialize: (value: string | undefined) => string | undefined
	}>()
	let s1 = string({ default: "hello" })
	expectTypeOf<Simplify<typeof s1>>().toEqualTypeOf<{
		parse(a: string | undefined): string
		serialize(v: string): string | undefined
	}>()
})

test("Type of boolean()", () => {
	let b = boolean()
	expectTypeOf<Simplify<typeof b>>().toEqualTypeOf<{
		parse(a: string | undefined): boolean
		serialize(v: boolean): string | undefined
	}>()
})

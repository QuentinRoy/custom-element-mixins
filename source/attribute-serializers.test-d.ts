import { expectTypeOf, test } from "vitest"
import { boolean, number, string } from "./attribute-serializers.ts"
import type { Simplify } from "./utils.ts"

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

test("number() options preserve the inferred property types", () => {
	for (let options of [
		{ rejectEmpty: true },
		{ finite: true },
		{ rejectEmpty: true, finite: true },
	]) {
		expectTypeOf(number(options)).toEqualTypeOf(number())
		expectTypeOf(number({ ...options, default: null })).toEqualTypeOf(number())
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

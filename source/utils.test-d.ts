import { expectTypeOf, test } from "vitest"
import type {
	ConcreteKeysOf,
	Constructor,
	IsEqual,
	Merge,
	ReadonlyKeysOf,
	Simplify,
} from "./utils.ts"

declare const sym: unique symbol

test("type of Simplify", () => {
	type T = Simplify<{ a: 1 } & { b: 2 }>
	expectTypeOf<T>().toEqualTypeOf<{ a: 1; b: 2 }>()
})

test("type of Constructor", () => {
	type C = Constructor<{ x: number }, [string, boolean]>
	expectTypeOf<ConstructorParameters<C>>().toEqualTypeOf<[string, boolean]>()
	expectTypeOf<InstanceType<C>>().toEqualTypeOf<{ x: number }>()
})

test("type of IsEqual", () => {
	expectTypeOf<IsEqual<"a", "a">>().toEqualTypeOf<true>()
	expectTypeOf<IsEqual<"a", "b">>().toEqualTypeOf<false>()
	expectTypeOf<IsEqual<"a" | "b", "b" | "a">>().toEqualTypeOf<true>()
	expectTypeOf<IsEqual<{ a: 1 }, { a: 1 }>>().toEqualTypeOf<true>()
	expectTypeOf<IsEqual<{ a: 1 }, { readonly a: 1 }>>().toEqualTypeOf<false>()
	expectTypeOf<
		IsEqual<{ a?: 1 }, { a: 1 | undefined }>
	>().toEqualTypeOf<false>()
	expectTypeOf<IsEqual<[1, 2], [1, 2]>>().toEqualTypeOf<true>()
	expectTypeOf<IsEqual<[1, 2], [1, number]>>().toEqualTypeOf<false>()
	expectTypeOf<IsEqual<never, never>>().toEqualTypeOf<true>()
})

test("type of ReadonlyKeysOf", () => {
	type T = ReadonlyKeysOf<{
		readonly a: 1
		b: 2
		readonly c?: 3
	}>
	expectTypeOf<T>().toEqualTypeOf<"a" | "c">()
})

test("type of ConcreteKeysOf", () => {
	type T1 = ConcreteKeysOf<{ a: 1; 2: 2; [sym]: 3 }>
	expectTypeOf<T1>().toEqualTypeOf<"a" | 2 | typeof sym>()

	type T2 = ConcreteKeysOf<{ [key: string]: unknown; a: 1 }>
	expectTypeOf<T2>().toEqualTypeOf<never>()
})

test("type of Merge", () => {
	type T = Merge<{ a: 1; b: 2 }, { b: 3; c: 4 }>
	expectTypeOf<T>().toEqualTypeOf<{ a: 1; b: 3; c: 4 }>()
})

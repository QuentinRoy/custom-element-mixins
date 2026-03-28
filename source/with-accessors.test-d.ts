import { expectTypeOf, test } from "vitest"
import type { Simplify } from "./utils.ts"
import { type Accessors, WithAccessors } from "./with-accessors.ts"

test("type of Accessors", () => {
	expectTypeOf<Accessors>().toEqualTypeOf<
		Record<
			PropertyKey,
			{
				get(this: unknown): unknown
				set?(this: unknown, value: unknown): void
			}
		>
	>()

	type Props = { a: "a"; readonly b: "b"; c: "c"; d: "d" }
	type Accessors1 = Simplify<Accessors<Props>>
	expectTypeOf<Accessors1>().toEqualTypeOf<{
		a: { get(this: Props): "a"; set(this: Props, value: "a"): void }
		b: { get(this: Props): "b"; set?: undefined }
		c: { get(this: Props): "c"; set(this: Props, value: "c"): void }
		d: { get(this: Props): "d"; set(this: Props, value: "d"): void }
	}>()

	class Class1 {
		readonly c = "c" as const
		e = "e" as const
	}
	type This1 = Simplify<Props & Class1>
	type Accessors2 = Simplify<Accessors<Props, typeof Class1>>
	expectTypeOf<Accessors2>().toEqualTypeOf<{
		a: { get(this: This1): "a"; set(this: This1, value: "a"): void }
		b: { get(this: This1): "b"; set?: undefined }
		c: { get(this: This1): "c"; set(this: This1, value: "c"): void }
		d: { get(this: This1): "d"; set(this: This1, value: "d"): void }
	}>()

	class Class2 {
		b = "b" as const
		readonly c = "c" as const
		e = "e" as const
	}
	type This2 = { c: "c"; e: "e"; a: "a"; readonly b: "b"; d: "d" }
	type Accessors3 = Simplify<Accessors<Props, typeof Class2>>
	expectTypeOf<Accessors3>().toEqualTypeOf<{
		a: { get(this: This2): "a"; set(this: This2, value: "a"): void }
		// P attempts to make b readonly, but it is writable in Class2. This is not
		// allowed. Class2 may attempt to write to b, so it must be writable.
		b: never
		c: { get(this: This2): "c"; set(this: This2, value: "c"): void }
		d: { get(this: This2): "d"; set(this: This2, value: "d"): void }
	}>()
})

test("type of WithAccessors accessors argument", () => {
	class Base {
		first: "a" | "b" = "a"
		last: "c" | "d" = "c"
		readonly id = 1 as const
	}

	const Enhanced = WithAccessors(Base, {
		fullName: {
			get(): `${"a" | "b"}${"c" | "d"}` {
				expectTypeOf(this.first).toEqualTypeOf<"a" | "b">()
				expectTypeOf(this.last).toEqualTypeOf<"c" | "d">()
				expectTypeOf(this.id).toEqualTypeOf<1>()
				expectTypeOf(this.initials).toEqualTypeOf<"a" | "b">()
				return `${this.first}${this.last}`
			},
			set(_value: string): void {
				this.first = "a"
				this.last = "c"
			},
		},
		initials: {
			get(): "a" | "b" {
				return this.first
			},
			set(value: "a" | "b"): void {
				this.first = value
			},
		},
		id: {
			get(): 1 {
				return 1
			},
		},
	})

	type EnhancedInstance = InstanceType<typeof Enhanced>
	expectTypeOf<EnhancedInstance>().toEqualTypeOf<{
		first: "a" | "b"
		last: "c" | "d"
		readonly id: 1
		fullName: "ac" | "ad" | "bc" | "bd"
		initials: "a" | "b"
	}>()

	WithAccessors(Base, {
		// @ts-expect-error setter must accept all values returned by getter.
		invalid: {
			get(): "a" | "b" {
				return "a"
			},
			set(value: "a"): void {
				void value
			},
		},
	})
})

test("unsupported descriptor properties are forbidden", () => {
	class Base {
		a: "a" = "a"
	}

	WithAccessors(Base, {
		x: {
			get(): "a" {
				return "a"
			},
			// @ts-expect-error only enumerable: true is allowed.
			enumerable: false,
		},
	})

	WithAccessors(Base, {
		x: {
			get(): "a" {
				return "a"
			},
			// @ts-expect-error configurable can only be false when provided.
			configurable: true,
		},
	})

	WithAccessors(Base, {
		x: {
			get(): "a" {
				return "a"
			},
			// @ts-expect-error accessor descriptors cannot define a value.
			value: "a",
		},
	})

	WithAccessors(Base, {
		x: {
			get(): "a" {
				return "a"
			},
			// @ts-expect-error accessor descriptors cannot define writable.
			writable: true,
		},
	})

	WithAccessors(Base, {
		x: {
			get(): "a" {
				return "a"
			},
			// @ts-expect-error unknown descriptor properties are not allowed.
			extra: "forbidden",
		},
	})
})

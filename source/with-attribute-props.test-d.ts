import { expectTypeOf, test } from "vitest"
import type { Class, Simplify } from "./utils.ts"
import {
	type AttributeSerializer,
	WithAttributeProps,
} from "./with-attribute-props.ts"

class AttributeTarget {
	getAttribute(_name: string): string | null {
		return null
	}
	setAttribute(_name: string, _value: string): void {}
	removeAttribute(_name: string): void {}
}

const mockSerializer: AttributeSerializer<unknown, unknown> = {
	parse(value: string | null) {
		return value
	},
	serialize(value: unknown) {
		return String(value)
	},
}

test("Type of WithAttributeProps parameters", () => {
	type T = ReturnType<
		typeof WithAttributeProps<
			Class<AttributeTarget & { a: "a" }, ["arg1", "arg2"]>,
			{
				x: {
					parse(value: string | null): "x"
					serialize(value: "x"): string | null
				}
			}
		>
	>
	type Expected = Class<AttributeTarget & { a: "a"; x: "x" }, ["arg1", "arg2"]>
	expectTypeOf<T>().toExtend<Expected>()
	expectTypeOf<Expected>().toExtend<T>()
})

test("Type of WithAttributeProps asymmetric parameters", () => {
	class Target extends AttributeTarget {
		unknown = "unknown" as const
	}

	const Mixed = WithAttributeProps(Target, {
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

	type MixedInstance = InstanceType<typeof Mixed>
	type ExpectedMixedInstance = AttributeTarget & {
		unknown: "unknown"
		mode: "a" | "b" | "unknown"
	}
	expectTypeOf<MixedInstance>().toExtend<ExpectedMixedInstance>()
	expectTypeOf<ExpectedMixedInstance>().toExtend<MixedInstance>()
})

test("Type of WithAttributeProps forbidden asymmetric parameters", () => {
	class Target extends AttributeTarget {
		unknown = "unknown" as const
	}

	const Forbidden = WithAttributeProps(Target, {
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

test("WithAttributeProps should not discards static members", () => {
	class BaseWithStatics extends AttributeTarget {
		prop: string = "test"

		static VERSION: string = "1.0.0"
		static create(): BaseWithStatics {
			return new BaseWithStatics()
		}
	}

	const Enhanced = WithAttributeProps(BaseWithStatics, {
		attr: {
			parse(value: string | null): string {
				return value ?? ""
			},
			serialize(value: string): string | null {
				return value
			},
		},
	})

	// Instance type works correctly
	type EnhancedInstance = InstanceType<typeof Enhanced>
	expectTypeOf<EnhancedInstance>().toHaveProperty("prop")
	expectTypeOf<EnhancedInstance>().toHaveProperty("attr")
	expectTypeOf(Enhanced).toHaveProperty("VERSION")
})

test("WithAttributeProps should inherit from Base class", () => {
	class Base extends AttributeTarget {
		baseMethod() {
			return "ok"
		}
		baseProp = "base"
	}

	const Enhanced = WithAttributeProps(Base, {
		value: mockSerializer,
	})

	// Runtime inheritance is correct; this assertion captures the intended
	// constructor-level inheritance in the type system as well.
	expectTypeOf(Enhanced).toExtend<typeof Base>()
	const x: Base = new Enhanced()
	void x
})

test("WithAttributeProps should preserve base class method overloads", () => {
	class Base extends AttributeTarget {
		method(value: "a"): "a"
		method(value: "b"): "b"
		method(value: string): string {
			return value
		}
	}

	const Enhanced = WithAttributeProps(Base, {
		value: mockSerializer,
	})

	// Overloads from Base should remain visible on the resulting instance type.
	const instance = new Enhanced()
	expectTypeOf(instance.method("a")).toEqualTypeOf<"a">()
	expectTypeOf(instance.method("b")).toEqualTypeOf<"b">()
})

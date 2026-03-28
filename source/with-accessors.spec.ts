import { expect, test } from "vitest"
import { WithAccessors } from "./with-accessors.ts"

test("WithAccessors", () => {
	class T {
		readonly a: "a" | "b"
		b: "a" | "b" | "c" = "a"
		c = "c" as const
		constructor(a: "a") {
			this.a = a
		}
	}

	// This is defined on the side to prevent type narrowing and to test that
	// extra properties are ignored. In particular, if is enumerable: false was
	// preserved before calling Object.defineProperties, the property would not be
	// enumerable in the final object. This is not supported, so it should
	// remain enumerable. However, because accessors type is protected,
	// adding it shouldn't be possible.
	const accessorWithExtra = {
		get(): "d1" | "d2" {
			return "d1"
		},
		extraProp: "should be ignored",
	}
	const U = WithAccessors(T, {
		a: {
			get(): "a" | "b" {
				return "a"
			},
			set(value: "a" | "b" | "c"): void {
				this.b = value
			},
		},
		d: accessorWithExtra,
		e: {
			get(): string {
				return this.d
			},
			set(_value: string | number): void {
				this.a = "b"
			},
		},
	})
	let u = new U("a")
	expect(new U("a")).toEqual({
		a: "a",
		b: "a",
		c: "c",
		d: "d1",
		e: "d1",
	})

	u.a = "b"
	// a setter actually sets "b"
	expect(u.b).toBe("b")
	// a getter always returns "a"
	expect(u.a).toBe("a")
})

import { expect, expectTypeOf, test } from "vitest"
import { WithAttributeProps } from "./with-attribute-props.ts"

const browserTest = test.skipIf(
	typeof window === "undefined" || typeof customElements === "undefined",
)

function defineElement(tagName: string, ctor: CustomElementConstructor) {
	if (!customElements.get(tagName)) {
		customElements.define(tagName, ctor)
	}
}

class AttributeTarget {
	#map = new Map<string, string>()
	getAttribute(name: string): string | null {
		return this.#map.has(name) ? String(this.#map.get(name)) : null
	}
	setAttribute(name: string, value: string): void {
		this.#map.set(name, value)
	}
	removeAttribute(name: string): void {
		this.#map.delete(name)
	}
}

test("WithHTMLAttributes attributes getter and setters", () => {
	class A extends AttributeTarget {
		unknown = "unknown" as const
	}

	const T = WithAttributeProps(A, {
		myAttr: {
			parse(value: string | null): "a" | "unknown" {
				if (value == null || value !== "a") return this.unknown
				return value
			},
			serialize(value: "a" | "b" | "c" | "unknown"): string | null {
				switch (value) {
					case "a":
					case "b":
						return value
					case this.unknown:
						return this.myAttr
					default:
						return null
				}
			},
		},
	})
	let t = new T()
	expectTypeOf(t).toEqualTypeOf<A & { myAttr: "a" | "b" | "c" | "unknown" }>()

	expect(t.myAttr).toBe("unknown")
	expect(t.getAttribute("my-attr")).toBe(null)
	t.myAttr = "a"
	expect(t.getAttribute("my-attr")).toBe("a")
	expect(t.myAttr).toBe("a")
	t.myAttr = "b"
	expect(t.getAttribute("my-attr")).toBe("b")
	expect(t.myAttr).toBe("unknown")
	t.myAttr = "c"
	expect(t.getAttribute("my-attr")).toBe(null)
	expect(t.myAttr).toBe("unknown")
	t.myAttr = "a"
	t.myAttr = "unknown"
	expect(t.getAttribute("my-attr")).toBe("a")
	expect(t.myAttr).toBe("a")

	expect(t).toBeInstanceOf(A)
})

const isoDate = {
	parse(value: string | null): Date | null {
		if (value == null) return null
		const date = new Date(value)
		return Number.isNaN(date.valueOf()) ? null : date
	},
	serialize(value: Date | null): string | null {
		return value == null ? null : value.toISOString()
	},
}

browserTest(
	"WithAttributeProps syncs props and kebab-case HTMLElement attributes",
	() => {
		const Mixed = WithAttributeProps(HTMLElement, {
			publishedAt: isoDate,
		})

		defineElement("x-attrs-a", Mixed)
		const el = document.createElement("x-attrs-a") as InstanceType<typeof Mixed>

		expect(el.publishedAt).toBe(null)
		expect(el.getAttribute("published-at")).toBe(null)

		const date = new Date("2026-01-02T03:04:05.000Z")
		el.publishedAt = date
		expect(el.getAttribute("published-at")).toBe("2026-01-02T03:04:05.000Z")
		expect(el.publishedAt?.toISOString()).toBe("2026-01-02T03:04:05.000Z")

		el.setAttribute("published-at", "invalid")
		expect(el.publishedAt).toBe(null)

		el.publishedAt = null
		expect(el.getAttribute("published-at")).toBe(null)
	},
)

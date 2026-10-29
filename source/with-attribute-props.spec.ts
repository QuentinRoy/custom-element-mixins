import { expect, expectTypeOf, test } from "vite-plus/test"
import { number, pickList, string } from "./attribute-serializers.ts"
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

test("custom serializers receive undefined for missing attributes", () => {
	const Mixed = WithAttributeProps(AttributeTarget, {
		label: {
			parse(value: string | undefined) {
				expect(value).toBe(undefined)
				return value
			},
			serialize(value: string | undefined) {
				return value
			},
		},
	})
	let el = new Mixed()
	expect(el.label).toBe(undefined)
	el.label = "hello"
	expect(el.getAttribute("label")).toBe("hello")
	el.label = undefined
	expect(el.getAttribute("label")).toBe(null)
	expect(el.label).toBe(undefined)
})

test("attribute props infer symbol defaults and remove attributes when assigned them", () => {
	const missing = Symbol("missing")
	const Mixed = WithAttributeProps(AttributeTarget, {
		count: number({ default: missing, finite: true }),
		title: string({ default: missing }),
		size: pickList({ values: ["small", "large"], default: missing }),
	})
	let el = new Mixed()
	expectTypeOf(el.count).toEqualTypeOf<number | symbol>()
	expectTypeOf(el.title).toEqualTypeOf<string | symbol>()
	expectTypeOf(el.size).toEqualTypeOf<"small" | "large" | symbol>()
	for (let key of ["count", "title", "size"] as const) {
		expect(el[key]).toBe(missing)
	}
	el.count = 42
	el.title = "hello"
	el.size = "large"
	expect(el.count).toBe(42)
	expect(el.title).toBe("hello")
	expect(el.size).toBe("large")
	for (let key of ["count", "title", "size"] as const) {
		el[key] = missing
		expect(el.getAttribute(key)).toBe(null)
		expect(el[key]).toBe(missing)
	}
})

test("numeric attribute props use their fallback for rejected input", () => {
	const WithRate = WithAttributeProps(AttributeTarget, {
		rate: number({ default: 60, rejectEmpty: true, finite: true }),
	})
	let el = new WithRate()
	expect(el.rate).toBe(60)
	el.setAttribute("rate", "")
	expect(el.rate).toBe(60)
	el.rate = Infinity
	expect(el.getAttribute("rate")).toBe("Infinity")
	expect(el.rate).toBe(60)
	el.rate = NaN
	expect(el.rate).toBe(60)
	el.rate = 0
	expect(el.getAttribute("rate")).toBe("0")
	expect(el.rate).toBe(0)
	el.rate = 24
	expect(el.rate).toBe(24)
})

test("WithHTMLAttributes attributes getter and setters", () => {
	class A extends AttributeTarget {
		unknown = "unknown" as const
	}

	const T = WithAttributeProps(A, {
		myAttr: {
			parse(value: string | undefined): "a" | "unknown" {
				if (value == undefined || value !== "a") return this.unknown
				return value
			},
			serialize(value: "a" | "b" | "c" | "unknown"): string | undefined {
				switch (value) {
					case "a":
					case "b":
						return value
					case this.unknown:
						return this.myAttr
					default:
						return undefined
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
	parse(value: string | undefined): Date | undefined {
		if (value == undefined) return undefined
		const date = new Date(value)
		return Number.isNaN(date.valueOf()) ? undefined : date
	},
	serialize(value: Date | undefined): string | undefined {
		return value == undefined ? undefined : value.toISOString()
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

		expect(el.publishedAt).toBe(undefined)
		expect(el.getAttribute("published-at")).toBe(null)

		const date = new Date("2026-01-02T03:04:05.000Z")
		el.publishedAt = date
		expect(el.getAttribute("published-at")).toBe("2026-01-02T03:04:05.000Z")
		expect(el.publishedAt?.toISOString()).toBe("2026-01-02T03:04:05.000Z")

		el.setAttribute("published-at", "invalid")
		expect(el.publishedAt).toBe(undefined)

		el.publishedAt = undefined
		expect(el.getAttribute("published-at")).toBe(null)
	},
)

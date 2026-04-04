import { expect, test } from "vitest"
import {
	boolean,
	number,
	pickList,
	string,
	WithAttributeProps,
} from "./with-attribute-props.ts"

const browserTest =
	typeof window !== "undefined" && typeof customElements !== "undefined"
		? test
		: test.skip

function defineElement(tagName: string, ctor: CustomElementConstructor) {
	if (!customElements.get(tagName)) {
		customElements.define(tagName, ctor)
	}
}

browserTest("WithAttributeProps syncs props and kebab-case attributes", () => {
	const Mixed = WithAttributeProps(HTMLElement, {
		pageNumber: number({ default: 1 }),
		labelText: string(),
		open: boolean(),
		variant: pickList({ values: ["primary", "secondary"] as const }),
	})

	defineElement("x-attrs-a", Mixed)
	const el = document.createElement("x-attrs-a") as InstanceType<typeof Mixed>

	expect(el.pageNumber).toBe(1)
	expect(el.getAttribute("page-number")).toBe(null)

	el.pageNumber = 3
	expect(el.getAttribute("page-number")).toBe("3")
	expect(el.pageNumber).toBe(3)

	el.labelText = "hello"
	expect(el.getAttribute("label-text")).toBe("hello")
	el.labelText = null
	expect(el.getAttribute("label-text")).toBe(null)

	el.open = true
	expect(el.hasAttribute("open")).toBe(true)
	expect(el.getAttribute("open")).toBe("")
	el.open = false
	expect(el.hasAttribute("open")).toBe(false)

	el.variant = "secondary"
	expect(el.getAttribute("variant")).toBe("secondary")
	el.setAttribute("variant", "unsupported")
	expect(el.variant).toBe(null)
})

browserTest("WithAttributeProps parse uses element instance as this", () => {
	class Base extends HTMLElement {
		unknown = "missing" as const
	}

	const Mixed = WithAttributeProps(Base, {
		status: {
			parse(this: Base, value: string | null) {
				return value ?? this.unknown
			},
			serialize(this: Base, value: string) {
				return value === this.unknown ? null : value
			},
		},
	})

	defineElement("x-attrs-b", Mixed)
	const el = document.createElement("x-attrs-b") as InstanceType<typeof Mixed>

	expect(el.status).toBe("missing")
	el.status = "ready"
	expect(el.getAttribute("status")).toBe("ready")
	el.status = "missing"
	expect(el.getAttribute("status")).toBe(null)
})

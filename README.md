# custom-element-mixins

TypeScript mixins for custom elements, with property types inferred from accessors and attribute serializers. The library has no runtime dependencies.

- `WithAccessors`: define typed getters and setters on instances.
- `WithAttributeProps`: map typed properties to HTML attributes.
- Built-in serializers: `number`, `string`, `boolean`, and `pickList`.

## Install

This package is published on [JSR](https://jsr.io/@quentinroy/custom-element-mixins).

```bash
# Vite+ (vp)
vp add jsr:@quentinroy/custom-element-mixins

# pnpm 10.9+
pnpm add jsr:@quentinroy/custom-element-mixins

# npm
npx jsr add @quentinroy/custom-element-mixins

# Yarn 4.9+
yarn add jsr:@quentinroy/custom-element-mixins

# Deno
deno add jsr:@quentinroy/custom-element-mixins
```

```ts
import {
  WithAccessors,
  WithAttributeProps,
  number,
  string,
  boolean,
  pickList,
} from "@quentinroy/custom-element-mixins";
```

## Example

This custom element keeps its properties and HTML attributes in sync:

```ts
import { WithAttributeProps, number, string, boolean, pickList } from "@quentinroy/custom-element-mixins";

class HTMLBookCardElement extends WithAttributeProps(HTMLElement, {
  page: number({ default: 1 }),
  bookTitle: string(),
  open: boolean(),
  variant: pickList({ values: ["primary", "secondary"], default: "primary" }),
}) {
  static get observedAttributes() {
    return ["page", "book-title", "open", "variant"];
  }

  connectedCallback() {
    this.#render();
  }

  attributeChangedCallback() {
    this.#render();
  }

  #render() {
    this.textContent = `${this.bookTitle} (page ${this.page}) - ${this.variant}`;
  }
}

customElements.define("book-card", HTMLBookCardElement);
const el = new HTMLBookCardElement();

// Prop -> attribute
el.page = 3;
el.bookTitle = "Dune";
el.open = true;
el.variant = "secondary";
// el.getAttribute("page") === "3"
// el.getAttribute("book-title") === "Dune"
// el.hasAttribute("open") === true
// el.getAttribute("variant") === "secondary"

// Attribute -> prop
el.setAttribute("page", "12");
el.setAttribute("book-title", "Foundation");
el.removeAttribute("open");
el.setAttribute("variant", "primary");
// el.page === 12
// el.bookTitle === "Foundation"
// el.open === false
// el.variant === "primary"
```

## `WithAccessors`

Defines property descriptors on each instance using `Object.defineProperties`.

```ts
import { WithAccessors } from "@quentinroy/custom-element-mixins";

class CounterBase {
  count = 0;
}

const Counter = WithAccessors(CounterBase, {
  doubled: {
    get() {
      return this.count * 2;
    },
    set(value: number) {
      this.count = Math.floor(value / 2);
    },
  },
});

const counter = new Counter();
counter.doubled = 10;
// counter.count === 5
// counter.doubled === 10
```

You can also use the returned class directly in `extends`:

```ts
import { WithAccessors } from "@quentinroy/custom-element-mixins";

class Counter extends WithAccessors(class {
  count = 0;
}, {
  doubled: {
    get() {
      return this.count * 2;
    },
    set(value: number) {
      this.count = Math.floor(value / 2);
    },
  },
}) {
  increment() {
    this.count += 1;
    return this.doubled;
  }
}

const counter = new Counter();
counter.doubled = 10;
counter.increment();
```

Notes:

- Accessors are enumerable.
- Only `get` and optional `set` are used; other descriptor flags are intentionally ignored.
- If a key is readonly on the base type, the accessor must be readonly-compatible.

## `WithAttributeProps`

Builds typed properties backed by attributes. The base class is usually `HTMLElement` or a subclass. It can be any class that implements:

- `getAttribute(name: string): string | null`
- `setAttribute(name: string, value: string): void`
- `removeAttribute(name: string): void`

Property names are converted to kebab-case attribute names (`myAttr` -> `my-attr`). Missing DOM attributes return `null`; `WithAttributeProps` converts that to `undefined` before calling a serializer.

```ts
import { WithAttributeProps, number, string, boolean, pickList } from "@quentinroy/custom-element-mixins";

const WithProps = WithAttributeProps(HTMLElement, {
  page: number({ default: 1 }),
  bookTitle: string(),
  open: boolean(),
  variant: pickList({ values: ["primary", "secondary"], default: "primary" }),
});

customElements.define("attribute-props-example", WithProps);
const el = new WithProps();
el.page = 3; // prop -> attribute: page="3"
el.setAttribute("page", "7"); // attribute -> prop
// el.page === 7

el.open = true; // prop -> attribute: open=""
el.removeAttribute("open"); // attribute -> prop
// el.open === false

el.bookTitle = "Dune"; // prop -> attribute: book-title="Dune"
el.setAttribute("book-title", "Foundation"); // attribute -> prop
// el.bookTitle === "Foundation"

el.variant = "secondary"; // prop -> attribute: variant="secondary"
el.setAttribute("variant", "primary"); // attribute -> prop
// el.variant === "primary"
```

You can also provide custom serializers. Their `parse` function receives `string | undefined`, with `undefined` for an absent attribute. Their `serialize` function returns a string to store or `undefined` to remove the attribute:

```ts
const WithCustom = WithAttributeProps(HTMLElement, {
  mode: {
    parse(value: string | undefined): "auto" | "manual" {
      return value === "manual" ? "manual" : "auto";
    },
    serialize(value: "auto" | "manual"): string {
      return value;
    },
  },
});
```

## `number(options?)`

- `number()` -> prop type: `number | undefined`
- `number({ default: n })` -> prop type: `number`
- `number({ default: Symbol("missing") })` -> prop type: `number | symbol`
- If the attribute is missing or invalid, parsing returns the default when provided, otherwise `undefined`.

Parsing uses JavaScript's `Number()` conversion. By default, empty and whitespace-only strings become `0`, and `"Infinity"` and `"-Infinity"` are accepted. `NaN` and malformed numeric text use the fallback.

Use `rejectEmpty` and `finite` to restrict accepted input:

```ts
const rate = number({ default: 60, rejectEmpty: true, finite: true });

rate.parse("");         // 60
rate.parse("   ");      // 60
rate.parse("Infinity"); // 60
rate.parse("1e999");    // 60 (overflow)
rate.parse("0");        // 0
rate.parse(" 24 ");     // 24
```

- `rejectEmpty`: empty and whitespace-only strings use the fallback.
- `finite`: non-finite results, including overflow, use the fallback. A non-finite numeric `default` throws a `RangeError` when the serializer is created.

Both options default to `false` and work independently. Without a default, rejected input returns `undefined`. Nonempty input still follows `Number()`, including hexadecimal and scientific notation.

These options affect parsing. Serialization still converts numbers to strings: with the options above, assigning `el.rate = Infinity` stores `rate="Infinity"`, and reading `el.rate` returns `60`.

## `string(options?)`

- `string()` -> prop type: `string | undefined`
- `string({ default: s })` -> prop type: `string`
- `string({ default: Symbol("missing") })` -> prop type: `string | symbol`

## `boolean()`

- Presence-based boolean attribute.
- Parse: attribute present -> `true`, absent -> `false`.
- Serialize: `true` -> `""`, `false` -> `undefined`.

## `pickList({ values, default? })`

- Restricts to a fixed list of string values.
- Returns `undefined` when missing and no default is provided.
- If the attribute value is outside `values`, parsing returns the default when provided, otherwise `undefined`.

The `number`, `string`, and `pickList` serializers accept defaults of any type. The property type includes the default's type. A `pickList` default can also be a string outside the allowed values; it does not add that string to the allowed attribute values.

```ts
const missing = Symbol("missing");
const count = number({ default: missing, finite: true });

count.parse(undefined);   // missing
count.parse("invalid");   // missing
count.parse("42");        // 42
count.serialize(missing); // undefined (removes the attribute)
```

Defaults outside the serializer's normal value type (`number` for `number`, `string` for `string` and `pickList`) serialize to `undefined`, removing the attribute. Defaults of the normal type serialize as usual. Omitting a default is equivalent to `{ default: undefined }`. Explicit defaults, including `null`, are returned unchanged.

## Development

Install [Vite+](https://viteplus.dev/guide/). The project pins Node.js 26.13.0 in `.node-version` and uses pnpm through `vp`.

```bash
vp install
vp exec playwright install --with-deps --only-shell chromium
vp check
vp test
vp run test:browser
```

Use `vp test watch` to watch tests and `vp fmt` to format code. Tests include TypeScript type assertions.

Package metadata and published files are configured in `jsr.json`. CI publishes to JSR after checks pass on `main`. To check the package before publishing:

```bash
vp dlx jsr publish --dry-run
```

## License

MIT

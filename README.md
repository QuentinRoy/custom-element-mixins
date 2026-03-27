# custom-element-mixins

Tiny TypeScript-first mixins for building classes (especially custom elements) with strong typing and no runtime dependencies.

## Features

- `WithAccessors`: define typed getters/setters on instances
- `WithAttributeProps`: map typed properties to attributes
- Built-in serializers: `number`, `string`, `boolean`, `pickList`

## Install

This package is intended to be published on JSR.

```bash
# pnpm
pnpm add jsr:@quentinroy/custom-element-mixins

# npm
npx jsr add @quentinroy/custom-element-mixins

# yarn
yarn add jsr:@quentinroy/custom-element-mixins

# deno
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

## API

## `WithAccessors`

Defines property descriptors on each instance using `Object.defineProperties`.

```ts
import { WithAccessors } from "jsr:@quentinroy/custom-element-mixins";

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

Notes:

- Accessors are enumerable.
- Only `get` and optional `set` are used; other descriptor flags are intentionally ignored.
- If a key is readonly on the base type, the accessor must be readonly-compatible.

## `WithAttributeProps`

Builds typed properties backed by attributes. Typically, base class would be `HTMLElement` or a subclass, but it can be any class that implements:

- `getAttribute(name: string): string | null`
- `setAttribute(name: string, value: string): void`
- `removeAttribute(name: string): void`

Property names are converted to kebab-case attribute names (`myAttr` -> `my-attr`).

```ts
import { WithAttributeProps, number, string, boolean, pickList } from "jsr:@quentinroy/custom-element-mixins";

class MyElement extends HTMLElement {}

const WithProps = WithAttributeProps(MyElement, {
  page: number({ default: 1 }),
  bookTitle: string(),
  open: boolean(),
  variant: pickList({ values: ["primary", "secondary"], default: "primary" }),
});

const el = new WithProps();
el.page = 3;          // sets attribute page="3"
el.open = true;       // sets attribute open=""
el.bookTitle = null;  // removes attribute book-title
el.variant = "secondary";
```

You can also provide custom serializers:

```ts
const WithCustom = WithAttributeProps(HTMLElement, {
  mode: {
    parse(value: string | null): "auto" | "manual" {
      return value === "manual" ? "manual" : "auto";
    },
    serialize(value: "auto" | "manual"): string {
      return value;
    },
  },
});
```

## Serializers

## `number(options?)`

- `number()` -> prop type: `number | null`
- `number({ default: n })` -> prop type: `number`
- If attribute value is missing or invalid, parse returns the default when provided, otherwise `null`.

## `string(options?)`

- `string()` -> prop type: `string | null`
- `string({ default: s })` -> prop type: `string`

## `boolean()`

- Presence-based boolean attribute.
- Parse: attribute present -> `true`, absent -> `false`.
- Serialize: `true` -> `""`, `false` -> `null`.

## `pickList({ values, default? })`

- Restricts to a fixed list of string values.
- Returns `null` when missing and no default is provided.
- If attribute value is outside `values`, parse returns the default when provided, otherwise `null`.

## Development

```bash
pnpm test
```

## License

MIT

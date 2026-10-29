# @quentinroy/custom-element-mixins

## 1.0.0

### Major changes

- Pass `undefined` to a serializer's `parse` function when an attribute is missing. Custom serializers must accept `string | undefined` instead of `string | null`. `WithAttributeProps` converts the DOM's `null` to `undefined` before parsing.
- Use `undefined` instead of `null` as the return value from `serialize` to remove an attribute. Custom serializers must return `string | undefined`.
- Return `undefined` instead of `null` from `number`, `string`, and `pickList` when parsing falls back to an omitted or explicitly `undefined` default. Set `{ default: null }` to keep the `null` fallback.

### Minor changes

- Allow defaults of any type in `number`, `string`, and `pickList`, and include the default's type in the property type. Explicit defaults are returned unchanged. Assigning a default outside the serializer's normal value type removes the attribute; defaults of the normal type serialize as usual.
- Add `rejectEmpty` to `number()` to treat empty and whitespace-only strings as invalid and return the fallback. The option defaults to `false`.
- Add `finite` to `number()` to reject non-finite results, including numeric overflow, and return the fallback. The option defaults to `false`. When enabled, a non-finite numeric default throws a `RangeError` when the serializer is created.

## 0.2.0

### Major Changes

- `number()` does not throw when attribute value is invalid. Instead, it returns the default value if provided, otherwise `null`. This is a breaking change since previously it threw an error.

## 0.3.0

### Minor Changes

- Exported `WithAttributePropsConstructor` and `WithAccessorsConstructor` types for better type inference when using the mixins.

## 0.3.1

### Patch Changes

- Switch to `interface` (instead of `type`) when possible. None of these types are exported so this is a non-breaking change. It may slightly improve speed of type checking in some cases.

## 0.4.0

### Major Changes

- Disallow accessors with incompatible getter and setter types. In particular, setter must allow every values returned by the getter. This is a breaking change since previously it was previously possible, and resulting property would get it's type from the setter. This could lead to runtime errors as getter could return values that setter would not accept, leading to incorrect type inference and potential runtime errors.

## 0.4.1

### Patch Changes

- Fix erased base class static members in TypeScript types for classes returned by `WithAccessors` and `WithAttributeProps`.
- Fix collapsed base class overloads in TypeScript types for enhanced instances.
- Fix returned class types to properly extend their base class in TypeScript.

## 0.4.2

### Patch Changes

- Fix value being parsed twice in `number` attribute serializer every time the attribute is accessed. This was a performance issue.

# @quentinroy/custom-element-mixins

## Unreleased

### Major Changes

- Use `undefined` for missing attribute values throughout the serializer API. Custom serializers now receive `string | undefined` and return `string | undefined` when serializing; returning `undefined` removes the attribute. `WithAttributeProps` converts the DOM's missing-attribute `null` to `undefined`.
- Allow defaults of any type in `number`, `string`, and `pickList`. Omitted defaults now return `undefined`; explicit defaults, including `null`, are preserved. Defaults outside the serializer's normal value type remove the attribute when assigned.

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

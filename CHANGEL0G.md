# @quentinroy/custom-element-mixins

## 0.2.0

### Major Changes

- `number()` does not throw when attribute value is invalid. Instead, it returns the default value if provided, otherwise `null`. This is a breaking change since previously it threw an error.

## 0.3.0

### Minor Changes

- Exported `WithAttributePropsConstructor` and `WithAccessorsConstructor` types for better type inference when using the mixins.

## 0.3.1

### Patch Changes

- Switch to `interface` (instead of `type`) when possible. None of these types are exported so this is a non-breaking change. It may slightly improve speed of type checking in some cases.

## 4.0.0

### Major Changes

- Disallow accessors with incompatible getter and setter types. In particular, setter must allow every values returned by the getter. This is a breaking change since previously it was previously possible, and resulting property would get it's type from the setter. This could lead to runtime errors as getter could return values that setter would not accept, leading to incorrect type inference and potential runtime errors.

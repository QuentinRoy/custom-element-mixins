# @quentinroy/custom-element-mixins

## 0.2.0

### Major Changes

- `number()` does not throw when attribute value is invalid. Instead, it returns the default value if provided, otherwise `null`. This is a breaking change since previously it threw an error.

## 0.3.0

### Minor Changes

- Exported `WithAttributePropsConstructor` and `WithAccessorsConstructor` types for better type inference when using the mixins.

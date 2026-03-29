import { type Class, toKebabCase } from "./utils.ts"
import { WithAccessors } from "./with-accessors.ts"
import type {
	AccessorsFromSerializers,
	AttributeSerializer,
	AttributeTarget,
	BindSerializers,
	StrictSerializers,
	UnconstrainedSerializer,
	WithAttributePropsClass,
} from "./with-attribute-props.types.ts"

export type {
	AttributeSerializer,
	WithAttributePropsClass as WithAttributePropsConstructor,
} from "./with-attribute-props.types.ts"

type PreparedSerializers<
	Base extends Class<object>,
	InnerSerializers,
> = StrictSerializers<BindSerializers<Base, InnerSerializers>>

type AttributePropAccessors<
	Base extends Class<object>,
	InnerSerializers,
> = AccessorsFromSerializers<PreparedSerializers<Base, InnerSerializers>>

/**
 * Mixin that adds props mapped to attributes to a class, typically an HTMLElement.
 * The props are defined by the serializers parameter, which defines how to parse and serialize the attribute values.
 * `getAttribute` and `setAttribute` are used to read and write the attribute values, so the class must implement these methods.
 *
 * @param Base The base class to add props to.
 * @param serializers The serializers that define the props to add to the class.
 * @returns A new class that extends the base class and has the props defined by the serializers parameter.
 * @returns A constructor for the new class that extends the base class and has the props defined by the serializers parameter.
 */
export function WithAttributeProps<
	// biome-ignore lint/suspicious/noExplicitAny: Any constructor is allowed.
	Base extends Class<AttributeTarget, any[]>,
	// biome-ignore lint/suspicious/noExplicitAny: Any serializer is allowed.
	InnerSerializer extends Record<string, UnconstrainedSerializer<any, any>>,
>(
	Base: Base,
	// We need to bind it again, because this is not going to be
	// preserved if it was not explicitly defined in Serializer.
	// Bounding it again allows this to be properly inferred when accessors is
	// provided inline without needing to explicitly define it.
	serializers: PreparedSerializers<Base, InnerSerializer>,
): WithAttributePropsClass<Base, InnerSerializer> {
	let accessors: AttributePropAccessors<Base, InnerSerializer> =
		createAccessors(serializers)
	return WithAccessors(Base, accessors) as WithAttributePropsClass<
		Base,
		InnerSerializer
	>
}

function createAccessors<
	InnerSerializers extends Record<
		string,
		// biome-ignore lint/suspicious/noExplicitAny: value types vary per serializer.
		UnconstrainedSerializer<any, any>
	>,
>(attributeSerializers: InnerSerializers) {
	let result = {} as Record<string, unknown>
	for (let key in attributeSerializers) {
		let serializer = attributeSerializers[key]
		result[key] = createAccessor(key, serializer)
	}
	return result as AccessorsFromSerializers<InnerSerializers>
}

function createAccessor(
	name: string,
	// biome-ignore lint/suspicious/noExplicitAny: value type is opaque at runtime.
	serializer: UnconstrainedSerializer<any, any>,
) {
	let attributeName = toKebabCase(name)
	const { parse, serialize } = serializer
	if (parse == null || serialize == null) {
		throw new Error("parse and serialize must be defined in the serializer.")
	}
	return {
		get(this: AttributeTarget) {
			let value = this.getAttribute(attributeName)
			return parse.call(this, value)
		},
		set(this: AttributeTarget, value: unknown) {
			let serialized = serialize.call(this, value)
			if (serialized == null) {
				this.removeAttribute(attributeName)
			} else {
				this.setAttribute(attributeName, serialized)
			}
		},
	}
}

/**
 * Creates an attribute serializer for numeric props.
 *
 * `parse` converts the attribute string to a number.
 * When the attribute is missing, or is not a valid number, it returns the
 * provided default or `null`.
 *
 * @param options Configuration for the serializer.
 * @param options.default Value returned when the attribute is missing or invalid.
 */
export function number(options: {
	default: number
}): AttributeSerializer<unknown, number>
export function number(options?: {
	default?: null | undefined
}): AttributeSerializer<unknown, number | null>
export function number({
	default: defaultValue = null,
}: {
	default?: number | null | undefined
} = {}) {
	return {
		parse(value: string | null) {
			if (value == null) return defaultValue
			let parsed = Number(value)
			if (Number.isNaN(parsed)) {
				value = null
			}
			return value == null ? defaultValue : Number(value)
		},
		serialize(value: number | null) {
			return value == null ? null : String(value)
		},
	}
}

/**
 * Creates an attribute serializer for string props.
 *
 * `parse` returns the attribute value as-is, or the provided default when the
 * attribute is missing.
 *
 * @param options Configuration for the serializer.
 * @param options.default Value returned when the attribute is missing.
 */
export function string(options: {
	default: string
}): AttributeSerializer<unknown, string>
export function string(options?: {
	default?: undefined | null
}): AttributeSerializer<unknown, string | null>
export function string({
	default: defaultValue = null,
}: {
	default?: string | null | undefined
} = {}) {
	return {
		parse(value: string | null) {
			return value ?? defaultValue
		},
		serialize(value: string | null) {
			return value ?? null
		},
	}
}

/**
 * Creates a presence-based boolean attribute serializer.
 *
 * `parse` returns `true` when the attribute exists and `false` otherwise.
 * `serialize` maps `true` to an empty string and `false` to `null`.
 *
 * @param _options Reserved for API consistency. No options are currently supported.
 */
export function boolean(
	_options: Record<PropertyKey, never> = {},
): AttributeSerializer<unknown, boolean> {
	return {
		parse(value: string | null) {
			return value != null
		},
		serialize(value: boolean) {
			return value ? "" : null
		},
	}
}

/**
 * Creates a serializer constrained to a fixed list of string values.
 *
 * If the attribute is missing, or has a value outside `options.values`,
 * `parse` returns the provided default or `null`.
 *
 * @param options Configuration for the serializer.
 * @param options.values Allowed string values.
 * @param options.default Value returned when the attribute is missing or invalid.
 */
export function pickList<const K extends string>(options: {
	default?: undefined
	values: Readonly<Array<K>>
}): AttributeSerializer<unknown, K | null>
export function pickList<const K extends string>(options: {
	default: NoInfer<K>
	values: Readonly<Array<K>>
}): AttributeSerializer<unknown, K>
export function pickList<const K extends string>(options: {
	default?: K
	values: Readonly<Array<K>>
}): AttributeSerializer<unknown, K | null> {
	let values = new Set(options.values)
	return {
		parse(value) {
			if (value == null || !values.has(value as K)) {
				return options.default ?? null
			}
			return value as K
		},
		serialize(value) {
			return value
		},
	}
}

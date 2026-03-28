import { type Constructor, type Simplify, toKebabCase } from "./utils.ts"
import { WithAccessors } from "./with-accessors.ts"

type BindSerializer<
	Base extends Constructor<object>,
	InnerSerializer,
> = BindSerializerHelper<
	InstanceType<Base>,
	InnerSerializer,
	PropsFromSerializer<InnerSerializer>
>

type BindSerializerHelper<This, InnerSerializer, AccessorProps> = {
	[Key in keyof InnerSerializer]: InnerSerializer[Key] extends UnboundSerializer<
		infer GetValue,
		infer SetValue
	>
		? Key extends keyof This
			? AttributeSerializer<
					SerializerThis<This, AccessorProps>,
					GetValue & This[Key],
					SetValue | This[Key]
				>
			: AttributeSerializer<
					SerializerThis<This, AccessorProps>,
					GetValue,
					SetValue
				>
		: InnerSerializer[Key]
}

type StrictSerializers<InnerSerializer> = {
	[K in keyof InnerSerializer]: ValidateSerializer<InnerSerializer[K]>
}

type ValidateSerializer<S> = [S] extends [
	UnconstrainedSerializer<infer GetValue, infer SetValue>,
]
	? [GetValue] extends [SetValue]
		? S
		: never
	: never

/**
 * Constructor type returned by WithAttributeProps.
 *
 * Instances preserve the base instance shape and add property types inferred
 * from the provided attribute serializers.
 *
 * @typeParam Base Base constructor being extended.
 * @typeParam InnerSerializer Serializer map used to derive added properties.
 */
export interface WithAttributePropsConstructor<
	Base extends Constructor<object>,
	InnerSerializer,
> {
	/**
	 * Creates an instance with typed property-to-attribute mappings.
	 *
	 * @param args Arguments forwarded to the base constructor.
	 */
	new (
		...args: ConstructorParameters<Base>
	): Simplify<InstanceType<Base> & PropsFromSerializer<InnerSerializer>>
}

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
	Base extends Constructor<AttributeTarget, any[]>,
	// biome-ignore lint/suspicious/noExplicitAny: Any serializer is allowed.
	InnerSerializer extends Record<string, UnconstrainedSerializer<any, any>>,
>(
	Base: Base,
	// We need to bind it again, because this is not going to be
	// preserved if it was not explicitly defined in Serializer.
	// Bounding it again allows this to be properly inferred when accessors is
	// provided inline without needing to explicitly define it.
	serializers: StrictSerializers<BindSerializer<Base, InnerSerializer>>,
): WithAttributePropsConstructor<Base, InnerSerializer> {
	let accessors = createAccessors(serializers)
	// @ts-expect-error - This is fine, the types are just too complex for TypeScript to understand.
	return WithAccessors(Base, accessors)
}

type AttributeTarget = Pick<
	HTMLElement,
	"getAttribute" | "setAttribute" | "removeAttribute"
>

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

type PropsFromSerializer<T> = Simplify<{
	[K in keyof T as T[K] extends AttributeSerializer<
		infer _1,
		infer _2,
		infer _3
	>
		? K
		: never]: T[K] extends AttributeSerializer<
		infer _1,
		infer _2,
		infer SetValue
	>
		? SetValue
		: never
}>

// I am not sure why, but it does seem that at least serialize
// must be made optional here. It may be because of the serialize protection
// there is in the Serializer type.
interface UnconstrainedSerializer<GetValue, SetValue> {
	parse?: (a: string | null) => GetValue
	serialize?: (value: SetValue) => string | null
}

interface UnboundSerializer<GetValue, SetValue = GetValue> {
	parse: (a: string | null) => GetValue
	serialize: (value: SetValue) => string | null
}

/**
 * Describes how a property is read from and written to an attribute.
 *
 * `parse` receives the raw attribute value and returns the property value.
 * `serialize` receives the property value and returns the attribute string to
 * store, or `null` to remove the attribute.
 *
 * @typeParam This Type of `this` inside the serializer functions.
 * @typeParam GetValue Type returned by `parse`.
 * @typeParam SetValue Type accepted by `serialize`.
 */
export interface AttributeSerializer<This, GetValue, SetValue = GetValue> {
	/**
	 * Parses a raw attribute string (or null when absent) into a property value.
	 *
	 * @param attributeValue Raw attribute value.
	 */
	parse: (this: This, attributeValue: string | null) => GetValue
	/**
	 * Serializes a property value to an attribute string, or null to remove it.
	 *
	 * @param propValue Property value to serialize.
	 */
	serialize: (this: This, propValue: SetValue) => string | null
}

type SerializerThis<This, AccessorProps> = Simplify<
	Omit<This, keyof AccessorProps> & AccessorProps
>

type AccessorsFromSerializers<D> = {
	[K in keyof D]: D[K] extends UnconstrainedSerializer<infer P, infer S>
		? {
				get(this: AttributeTarget): P
				set(this: AttributeTarget, value: S): void
			}
		: never
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

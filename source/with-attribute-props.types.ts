import type { Constructor, Simplify } from "./utils.ts"

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

// I am not sure why, but it does seem that at least serialize
// must be made optional here. It may be because of the serialize protection
// there is in the Serializer type.
export interface UnconstrainedSerializer<GetValue, SetValue> {
	parse?: (a: string | null) => GetValue
	serialize?: (value: SetValue) => string | null
}

export type AttributeTarget = Pick<
	HTMLElement,
	"getAttribute" | "setAttribute" | "removeAttribute"
>

export type BindSerializers<
	Base extends Constructor<object>,
	InnerSerializers,
> = {
	[Key in keyof InnerSerializers]: BindSerializerValue<
		InstanceType<Base>,
		SerializerProperties<InnerSerializers>,
		Key,
		InnerSerializers[Key]
	>
}

export type StrictSerializers<InnerSerializers> = {
	[K in keyof InnerSerializers]: ValidateSerializer<InnerSerializers[K]>
}

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
	): Simplify<InstanceType<Base> & SerializerProperties<InnerSerializer>>
}

export type AccessorsFromSerializers<D> = {
	[K in keyof D]: D[K] extends UnconstrainedSerializer<
		infer ParsedValue,
		infer AssignedValue
	>
		? {
				get(this: AttributeTarget): ParsedValue
				set(this: AttributeTarget, value: AssignedValue): void
			}
		: never
}

interface InputSerializer<GetValue, SetValue = GetValue> {
	parse: (a: string | null) => GetValue
	serialize: (value: SetValue) => string | null
}

type BoundSerializerContext<
	This extends object,
	SerializerProps,
> = MergeSerializerProps<This, SerializerProps>

type BindSerializerValue<
	This extends object,
	SerializerProps,
	Key,
	SerializerValue,
> =
	SerializerValue extends InputSerializer<
		infer ParsedValue,
		infer AssignedValue
	>
		? BindInputSerializer<
				This,
				SerializerProps,
				Key,
				ParsedValue,
				AssignedValue
			>
		: SerializerValue

type BindInputSerializer<
	This extends object,
	SerializerProps,
	Key,
	ParsedValue,
	AssignedValue,
> = Key extends keyof This
	? AttributeSerializer<
			BoundSerializerContext<This, SerializerProps>,
			ParsedValue & This[Key],
			AssignedValue | This[Key]
		>
	: AttributeSerializer<
			BoundSerializerContext<This, SerializerProps>,
			ParsedValue,
			AssignedValue
		>

type ValidateSerializer<S> = S extends {
	parse: (attributeValue: string | null) => infer GetValue
	serialize: (this: infer This, propValue: infer SetValue) => string | null
}
	? Omit<S, "serialize"> & {
			serialize: (this: This, propValue: GetValue | SetValue) => string | null
		}
	: S

type MergeSerializerProps<This, SerializerProps> = Simplify<
	Omit<This, keyof SerializerProps> & SerializerProps
>

type SerializerKeys<T> = {
	[K in keyof T]: T[K] extends AttributeSerializer<infer _1, infer _2, infer _3>
		? K
		: never
}[keyof T]

type SerializerAssignedValue<T> =
	T extends AttributeSerializer<infer _1, infer _2, infer SetValue>
		? SetValue
		: never

type SerializerProperties<T> = Simplify<{
	[K in SerializerKeys<T>]: SerializerAssignedValue<T[K]>
}>

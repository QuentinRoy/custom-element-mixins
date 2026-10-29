import type { Class, ConstructorWithStatics, Simplify } from "./utils.ts"

/**
 * Describes how a property is read from and written to an attribute.
 *
 * `parse` receives the raw attribute value and returns the property value.
 * `serialize` receives the property value and returns the attribute string to
 * store, or `undefined` to remove the attribute.
 *
 * @typeParam This Type of `this` inside the serializer functions.
 * @typeParam GetValue Type returned by `parse`.
 * @typeParam SetValue Type accepted by `serialize`.
 */
export interface AttributeSerializer<This, GetValue, SetValue = GetValue> {
	/**
	 * Parses a raw attribute string (or undefined when absent) into a property value.
	 *
	 * @param attributeValue Raw attribute value.
	 */
	parse: (this: This, attributeValue: string | undefined) => GetValue
	/**
	 * Serializes a property value to an attribute string, or undefined to remove it.
	 *
	 * @param propValue Property value to serialize.
	 */
	serialize: (this: This, propValue: SetValue) => string | undefined
}

// I am not sure why, but it does seem that at least serialize
// must be made optional here. It may be because of the serialize protection
// there is in the Serializer type.
export interface UnconstrainedSerializer<GetValue, SetValue> {
	parse?: (a: string | undefined) => GetValue
	serialize?: (value: SetValue) => string | undefined
}

export type AttributeTarget = Pick<
	HTMLElement,
	"getAttribute" | "setAttribute" | "removeAttribute"
>

export type BindSerializers<Base extends Class<object>, InnerSerializers> = {
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
 * Class type returned by WithAttributeProps.
 *
 * Instances preserve the base instance shape and add property types inferred
 * from the provided attribute serializers.
 *
 * @typeParam Base Base class being extended.
 * @typeParam InnerSerializer Serializer map used to derive added properties.
 */
export type WithAttributePropsClass<
	Base extends Class<object>,
	InnerSerializer,
> = ConstructorWithStatics<
	Base,
	InstanceType<Base> & SerializerProperties<InnerSerializer>
>

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
	parse: (a: string | undefined) => GetValue
	serialize: (value: SetValue) => string | undefined
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
	parse: (attributeValue: string | undefined) => infer GetValue
	serialize: (this: infer This, propValue: infer SetValue) => string | undefined
}
	? Omit<S, "serialize"> & {
			serialize: (
				this: This,
				propValue: GetValue | SetValue,
			) => string | undefined
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

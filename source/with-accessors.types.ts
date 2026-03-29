import type {
	AnyConstructor,
	Class,
	ConcreteKeysOf,
	ConstructorWithStatics,
	Merge,
	ReadonlyKeysOf,
	Simplify,
} from "./utils.ts"

/**
 * Describes a single property accessor.
 *
 * @typeParam This Type of `this` inside the accessor functions.
 * @typeParam GetValue Type returned by `get`.
 * @typeParam SetValue Type accepted by `set`.
 */
export interface Accessor<This, GetValue, SetValue = GetValue> {
	/** Reads the computed property value from the instance. */
	get: (this: This) => GetValue
	/**
	 * Writes a new value to the instance. Omit for readonly accessors.
	 *
	 * @param value New value to assign.
	 */
	set?: (this: This, value: SetValue) => void
}

/**
 * Describes a map of property accessors that can be passed to `WithAccessors`.
 *
 * Keys are interpreted as property names. Writable properties produce accessors
 * with both `get` and `set`; readonly properties produce getter-only accessors.
 * When `This` is provided, accessor `this` is bound to the final instance type.
 *
 * @typeParam M Property map to describe through accessors.
 * @typeParam This Constructor whose instance type should be used as `this`.
 */
export type Accessors<
	M extends Record<PropertyKey, unknown> = Record<PropertyKey, unknown>,
	This extends AnyConstructor = AnyConstructor,
> = BindAccessors<This, InputAccessors<M>>

export interface UnconstrainedAccessor<GetValue, SetValue = GetValue> {
	get: () => GetValue
	set?: (value: SetValue) => void
}

export type BindAccessors<Base extends AnyConstructor, InnerAccessors> = {
	[Key in keyof InnerAccessors]: BindAccessorValue<
		InstanceType<Base>,
		AccessorProperties<InnerAccessors>,
		Key,
		InnerAccessors[Key]
	>
}

type BoundAccessorContext<
	This extends object,
	AccessorProps,
> = MergeAccessorProps<This, AccessorProps>

type BindAccessorValue<This extends object, AccessorProps, Key, AccessorValue> =
	AccessorValue extends InputWritableAccessor<infer GetValue, infer SetValue>
		? BindWritableAccessor<This, AccessorProps, Key, GetValue, SetValue>
		: AccessorValue extends InputReadonlyAccessor<infer GetValue>
			? BindReadonlyAccessor<This, AccessorProps, Key, GetValue>
			: AccessorValue

type BindWritableAccessor<
	This extends object,
	AccessorProps,
	Key,
	GetValue,
	SetValue,
> = Key extends keyof This
	? BoundWritableAccessor<
			BoundAccessorContext<This, AccessorProps>,
			GetValue & This[Key],
			SetValue | This[Key]
		>
	: BoundWritableAccessor<
			BoundAccessorContext<This, AccessorProps>,
			GetValue,
			SetValue
		>

type BindReadonlyAccessor<
	This extends object,
	AccessorProps,
	Key,
	GetValue,
> = Key extends keyof This
	? Key extends ReadonlyKeysOf<This>
		? BoundReadonlyAccessor<
				BoundAccessorContext<This, AccessorProps>,
				GetValue & This[Key]
			>
		: never
	: BoundReadonlyAccessor<BoundAccessorContext<This, AccessorProps>, GetValue>

type InputAccessors<M extends object> = Simplify<
	{
		-readonly [K in Exclude<keyof M, ConcreteKeysOf<M>>]: Accessor<
			unknown,
			M[K],
			M[K]
		>
	} & {
		-readonly [K in ConcreteKeysOf<M>]: K extends ReadonlyKeysOf<M>
			? BoundReadonlyAccessor<unknown, M[K]>
			: BoundWritableAccessor<unknown, M[K]>
	}
>

/**
 * Descriptor flags accepted by `WithAccessors` in addition to `get`/`set`.
 *
 * Any other descriptor property is intentionally rejected.
 */
interface StrictAccessorBase {
	enumerable?: true
	value?: undefined
	writable?: undefined
	configurable?: false
}

export type StrictAccessors<InnerAccessors> = {
	[K in keyof InnerAccessors]: ValidateAccessor<InnerAccessors[K]> &
		StrictAccessorBase
}

type ValidateAccessor<A> = A extends {
	get: (...args: []) => infer GetValue
	set: (this: infer This, value: infer SetValue) => void
}
	? Omit<A, "set"> & {
			set: (this: This, value: GetValue | SetValue) => void
		}
	: A

/**
 * Constructor type returned by WithAccessors.
 *
 * Instances preserve the base instance shape and add the accessor-backed
 * properties inferred from the provided accessor map.
 *
 * @typeParam Base Base constructor being extended.
 * @typeParam InnerAccessors Accessor map used to derive added properties.
 */
export type WithAccessorsClass<
	Base extends Class<object>,
	InnerAccessors,
> = ConstructorWithStatics<
	Base,
	Merge<
		InstanceType<Base>,
		AccessorProperties<BindAccessors<Base, InnerAccessors>>
	>
>

interface InputReadonlyAccessor<Value> {
	get: () => Value
	set?: undefined
}

interface InputWritableAccessor<GetValue, SetValue = GetValue> {
	get: () => GetValue
	set: (value: SetValue) => void
}

interface BoundReadonlyAccessor<This, GetValue> {
	get: (this: This) => GetValue
	set?: undefined
}

interface BoundWritableAccessor<This, GetValue, SetValue = GetValue> {
	get: (this: This) => GetValue
	set: (this: This, value: SetValue) => void
}

type MergeAccessorProps<This, AccessorProps> = Simplify<
	Omit<This, keyof AccessorProps> & AccessorProps
>

type WritableAccessorKeys<T> = {
	[K in keyof T]: T[K] extends BoundWritableAccessor<
		// biome-ignore lint/suspicious/noExplicitAny: any is required in conditional helpers.
		any,
		// biome-ignore lint/suspicious/noExplicitAny: any is required in conditional helpers.
		any,
		// biome-ignore lint/suspicious/noExplicitAny: any is required in conditional helpers.
		any
	>
		? K
		: never
}[keyof T]

type ReadonlyAccessorKeys<T> = {
	[K in keyof T]: T[K] extends BoundReadonlyAccessor<
		// biome-ignore lint/suspicious/noExplicitAny: any is required in conditional helpers.
		any,
		// biome-ignore lint/suspicious/noExplicitAny: any is required in conditional helpers.
		any
	>
		? K
		: never
}[keyof T]

type WritableAccessorValue<T> =
	T extends BoundWritableAccessor<
		// biome-ignore lint/suspicious/noExplicitAny: any is required in conditional helpers.
		any,
		// biome-ignore lint/suspicious/noExplicitAny: any is required in conditional helpers.
		any,
		infer SetValue
	>
		? SetValue
		: never

type ReadonlyAccessorValue<T> =
	T extends BoundReadonlyAccessor<
		// biome-ignore lint/suspicious/noExplicitAny: any is required in conditional helpers.
		any,
		infer GetValue
	>
		? GetValue
		: never

type AccessorProperties<T> = Simplify<
	{
		[K in WritableAccessorKeys<T>]: WritableAccessorValue<T[K]>
	} & {
		readonly [K in ReadonlyAccessorKeys<T>]: ReadonlyAccessorValue<T[K]>
	}
>

import type {
	AnyConstructor,
	ConcreteKeysOf,
	Constructor,
	Merge,
	ReadonlyKeysOf,
	Simplify,
} from "./utils.ts"

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
> = BindAccessors<This, UnboundAccessors<M>>

/**
 * Describes a single property accessor.
 *
 * @typeParam This Type of `this` inside the accessor functions.
 * @typeParam Value Type returned by `get` and accepted by `set`.
 */
export interface Accessor<This, Value> {
	/** Reads the computed property value from the instance. */
	get: (this: This) => Value
	/**
	 * Writes a new value to the instance. Omit for readonly accessors.
	 *
	 * @param value New value to assign.
	 */
	set?: (this: This, value: Value) => void
}

export type BindAccessors<
	Base extends AnyConstructor,
	InnerAccessors,
> = BindAccessorsHelper<
	InstanceType<Base>,
	InnerAccessors,
	PropsFromAccessors<InnerAccessors>
>

type BindAccessorsHelper<This extends object, InnerAccessors, AccessorProps> = {
	[Key in keyof InnerAccessors]: InnerAccessors[Key] extends UnboundWritableAccessor<
		infer Value
	>
		? WritableAccessor<
				AccessorThis<This, AccessorProps>,
				Value & (Key extends keyof This ? This[Key] : unknown)
			>
		: InnerAccessors[Key] extends UnboundReadonlyAccessor<infer GetValue>
			? Key extends keyof This
				? Key extends ReadonlyKeysOf<This>
					? ReadonlyAccessor<
							AccessorThis<This, AccessorProps>,
							GetValue & This[Key]
						>
					: never
				: ReadonlyAccessor<AccessorThis<This, AccessorProps>, GetValue>
			: InnerAccessors[Key]
}

type UnboundAccessors<M extends object> = Simplify<
	{
		-readonly [K in Exclude<keyof M, ConcreteKeysOf<M>>]: Accessor<
			unknown,
			M[K]
		>
	} & {
		-readonly [K in ConcreteKeysOf<M>]: K extends ReadonlyKeysOf<M>
			? ReadonlyAccessor<unknown, M[K]>
			: WritableAccessor<unknown, M[K]>
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

type StrictAccessors<InnerAccessors> = {
	[K in keyof InnerAccessors]: (InnerAccessors[K] extends UnconstrainedAccessor<
		infer _
	>
		? InnerAccessors[K]
		: never) &
		StrictAccessorBase
}

/**
 * Constructor type returned by WithAccessors.
 *
 * Instances preserve the base instance shape and add the accessor-backed
 * properties inferred from the provided accessor map.
 *
 * @typeParam Base Base constructor being extended.
 * @typeParam InnerAccessors Accessor map used to derive added properties.
 */
export interface WithAccessorsConstructor<
	Base extends Constructor<object>,
	InnerAccessors,
> {
	/**
	 * Creates an instance that combines base members with accessor-backed props.
	 *
	 * @param args Arguments forwarded to the base constructor.
	 */
	new (
		...args: ConstructorParameters<Base>
	): Merge<
		InstanceType<Base>,
		PropsFromAccessors<BindAccessors<Base, InnerAccessors>>
	>
}

/**
 * Mixin that adds accessors to a class.
 * @param Base The base class to add accessors to.
 * @param accessors The accessors to add to the class.
 */
export function WithAccessors<
	Base extends AnyConstructor,
	InnerAccessors extends BindAccessors<
		Base,
		// biome-ignore lint/suspicious/noExplicitAny: Any accessor is allowed.
		Record<string, UnconstrainedAccessor<any>>
	>,
>(
	Base: Base,
	// We need to bound it again, because this is not going to be
	// preserved if it was not explicitly defined in Accessors.
	// Bounding it again allows this to be properly inferred when accessors is
	// provided inline without needing to explicitly define it.
	accessors: StrictAccessors<BindAccessors<Base, InnerAccessors>>,
): WithAccessorsConstructor<Base, InnerAccessors> {
	let cleanAccessors: Record<
		PropertyKey,
		UnconstrainedAccessor<unknown> & { enumerable: true }
	> = {}
	for (let key in accessors) {
		let { get, set } = accessors[key]
		cleanAccessors[key] = { get, enumerable: true }
		if (set != null) {
			cleanAccessors[key].set = set
		}
	}
	// @ts-expect-error We know this is correct, but TypeScript can't verify it.
	return class extends Base {
		constructor(...params: ConstructorParameters<Base>) {
			super(...params)
			Object.defineProperties(this, cleanAccessors)
		}
	}
}

type PropsFromAccessors<T> = Simplify<
	{
		// biome-ignore lint/suspicious/noExplicitAny: any is required here.
		[K in keyof T as T[K] extends WritableAccessor<any, any>
			? K
			: // biome-ignore lint/suspicious/noExplicitAny: any is required here.
				never]: T[K] extends WritableAccessor<any, infer Value> ? Value : never
	} & {
		// biome-ignore lint/suspicious/noExplicitAny: any is required here.
		readonly [K in keyof T as T[K] extends ReadonlyAccessor<any, any>
			? K
			: // biome-ignore lint/suspicious/noExplicitAny: any is required here.
				never]: T[K] extends ReadonlyAccessor<any, infer Value> ? Value : never
	}
>

interface UnconstrainedAccessor<Value> {
	get: () => Value
	set?: (value: Value) => void
}

interface UnboundReadonlyAccessor<Value> {
	get: () => Value
	set?: undefined
}

interface UnboundWritableAccessor<Value> {
	get: () => Value
	set: (value: Value) => void
}

interface ReadonlyAccessor<This, GetValue> {
	get: (this: This) => GetValue
	set?: undefined
}

interface WritableAccessor<This, Value> {
	get: (this: This) => Value
	set: (this: This, value: Value) => void
}

type AccessorThis<This, AccessorProps> = Simplify<
	Omit<This, keyof AccessorProps> & AccessorProps
>

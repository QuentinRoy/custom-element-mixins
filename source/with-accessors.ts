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
		infer GetValue,
		infer SetValue
	>
		? Key extends keyof This
			? WritableAccessor<
					AccessorThis<This, AccessorProps>,
					GetValue & This[Key],
					SetValue | This[Key]
				>
			: WritableAccessor<AccessorThis<This, AccessorProps>, GetValue, SetValue>
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
			M[K],
			M[K]
		>
	} & {
		-readonly [K in ConcreteKeysOf<M>]: K extends ReadonlyKeysOf<M>
			? ReadonlyAccessor<unknown, M[K]>
			: WritableAccessor<unknown, M[K]>
	}
>

type ProtectAccessors<InnerAccessors> = {
	[K in keyof InnerAccessors]: InnerAccessors[K] & {
		enumerable?: true
		value?: undefined
		writable?: undefined
		configurable?: false
	}
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
		Record<string, UnconstrainedAccessor<any, any>>
	>,
>(
	Base: Base,
	// We need to bound it again, because this is not going to be
	// preserved if it was not explicitly defined in Accessors.
	// Bounding it again allows this to be properly inferred when accessors is
	// provided inline without needing to explicitly define it.
	accessors: ProtectAccessors<BindAccessors<Base, InnerAccessors>>,
): WithAccessorsConstructor<Base, InnerAccessors> {
	let cleanAccessors: Record<
		PropertyKey,
		UnconstrainedAccessor<unknown, unknown> & { enumerable: true }
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
		[K in keyof T as T[K] extends WritableAccessor<infer _1, infer _2, infer _3>
			? K
			: never]: T[K] extends WritableAccessor<
			infer _1,
			infer _2,
			infer SetValue
		>
			? SetValue
			: never
	} & {
		readonly [K in keyof T as T[K] extends ReadonlyAccessor<infer _1, infer _2>
			? K
			: never]: T[K] extends ReadonlyAccessor<infer _, infer GetValue>
			? GetValue
			: never
	}
>

interface UnconstrainedAccessor<GetValue, SetValue = GetValue> {
	get: () => GetValue
	set?: (value: SetValue) => void
}

interface UnboundReadonlyAccessor<GetValue> {
	get: () => GetValue
	set?: undefined
}

interface UnboundWritableAccessor<GetValue, SetValue = GetValue> {
	get: () => GetValue
	set: (value: SetValue) => void
}

interface ReadonlyAccessor<This, GetValue> {
	get: (this: This) => GetValue
	set?: undefined
}

interface WritableAccessor<This, GetValue, SetValue = GetValue> {
	get: (this: This) => GetValue
	set: (this: This, value: SetValue) => void
}

type AccessorThis<This, AccessorProps> = Simplify<
	Omit<This, keyof AccessorProps> & AccessorProps
>

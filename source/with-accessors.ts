import type {
	AnyConstructor,
	ConcreteKeysOf,
	Constructor,
	Merge,
	ReadonlyKeysOf,
	Simplify,
} from "./utils.ts"

export type Accessors<
	M extends Record<PropertyKey, unknown> = Record<PropertyKey, unknown>,
	This extends AnyConstructor = AnyConstructor,
> = BindAccessors<This, UnboundAccessors<M>>

export type Accessor<This, GetValue, SetValue = GetValue> = {
	get: (this: This) => GetValue
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

export interface WithAccessorsConstructor<
	Base extends Constructor<object>,
	InnerAccessors,
> {
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

type UnconstrainedAccessor<GetValue, SetValue = GetValue> = {
	get: () => GetValue
	set?: (value: SetValue) => void
}

type UnboundReadonlyAccessor<GetValue> = {
	get: () => GetValue
	set?: undefined
}

type UnboundWritableAccessor<GetValue, SetValue = GetValue> = {
	get: () => GetValue
	set: (value: SetValue) => void
}

type ReadonlyAccessor<This, GetValue> = {
	get: (this: This) => GetValue
	set?: undefined
}

type WritableAccessor<This, GetValue, SetValue = GetValue> = {
	get: (this: This) => GetValue
	set: (this: This, value: SetValue) => void
}

type AccessorThis<This, AccessorProps> = Simplify<
	Omit<This, keyof AccessorProps> & AccessorProps
>

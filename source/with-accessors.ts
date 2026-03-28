import type { AnyConstructor } from "./utils.ts"
import type {
	BindAccessors,
	StrictAccessors,
	UnconstrainedAccessor,
	WithAccessorsConstructor,
} from "./with-accessors.types.ts"

export type {
	Accessor,
	Accessors,
	WithAccessorsConstructor,
} from "./with-accessors.types.ts"

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

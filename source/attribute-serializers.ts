import type { AttributeSerializer } from "./with-attribute-props.ts"

interface NumberOptions {
	default?: number | null | undefined
	rejectEmpty?: boolean
	finite?: boolean
}

/**
 * Creates an attribute serializer for numeric props.
 *
 * `parse` converts the attribute string using `Number()`.
 * When the attribute is missing, or is not a valid number, it returns the
 * provided default or `null`.
 *
 * @param options Configuration for the serializer.
 * @param options.default Value returned when the attribute is missing or invalid.
 * @param options.rejectEmpty Treat empty and whitespace-only strings as invalid. Defaults to false.
 * @param options.finite Reject non-finite numbers. Defaults to false.
 * @throws {RangeError} If `finite` is true and the provided default is non-finite.
 */
export function number(
	options: NumberOptions & {
		default: number
	},
): AttributeSerializer<unknown, number>
export function number(
	options?: NumberOptions & {
		default?: null | undefined
	},
): AttributeSerializer<unknown, number | null>
export function number({
	default: defaultValue = null,
	rejectEmpty = false,
	finite = false,
}: NumberOptions = {}) {
	if (finite && defaultValue != null && !Number.isFinite(defaultValue)) {
		throw new RangeError("The default must be finite when finite is enabled.")
	}
	return {
		parse(value: string | null) {
			if (value == null || (rejectEmpty && value.trim() === "")) {
				return defaultValue
			}
			let parsed = Number(value)
			if (Number.isNaN(parsed) || (finite && !Number.isFinite(parsed))) {
				return defaultValue
			}
			return parsed
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

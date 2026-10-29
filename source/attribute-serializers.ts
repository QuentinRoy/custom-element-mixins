import type { AttributeSerializer } from "./with-attribute-props.ts"

interface NumberOptions<Default> {
	default?: Default
	rejectEmpty?: boolean
	finite?: boolean
}

/**
 * Creates an attribute serializer for numeric props.
 *
 * `parse` converts the attribute string using `Number()`.
 * When the attribute is missing, or is not a valid number, it returns the
 * provided default or `undefined`.
 *
 * @param options Configuration for the serializer.
 * @param options.default Value returned when the attribute is missing or invalid.
 * @param options.rejectEmpty Treat empty and whitespace-only strings as invalid. Defaults to false.
 * @param options.finite Reject non-finite numbers. Defaults to false.
 * @throws {RangeError} If `finite` is true and the provided default is a non-finite number.
 */
export function number<const Default>(
	options: NumberOptions<Default> & {
		default: Default
	},
): AttributeSerializer<unknown, number | Default>
export function number<const Default = undefined>(
	options?: NumberOptions<Default>,
): AttributeSerializer<unknown, number | Default | undefined>
export function number({
	default: defaultValue,
	rejectEmpty = false,
	finite = false,
}: NumberOptions<unknown> = {}) {
	if (
		finite &&
		typeof defaultValue === "number" &&
		!Number.isFinite(defaultValue)
	) {
		throw new RangeError("The default must be finite when finite is enabled.")
	}
	return {
		parse(value: string | undefined) {
			if (value === undefined || (rejectEmpty && value.trim() === "")) {
				return defaultValue
			}
			let parsed = Number(value)
			if (Number.isNaN(parsed) || (finite && !Number.isFinite(parsed))) {
				return defaultValue
			}
			return parsed
		},
		serialize(value: unknown) {
			return typeof value === "number" ? String(value) : undefined
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
export function string<const Default>(options: {
	default: Default
}): AttributeSerializer<unknown, string | Default>
export function string<const Default = undefined>(options?: {
	default?: Default
}): AttributeSerializer<unknown, string | Default | undefined>
export function string({
	default: defaultValue,
}: {
	default?: unknown
} = {}) {
	return {
		parse(value: string | undefined) {
			return value ?? defaultValue
		},
		serialize(value: unknown) {
			return typeof value === "string" ? value : undefined
		},
	}
}

/**
 * Creates a presence-based boolean attribute serializer.
 *
 * `parse` returns `true` when the attribute exists and `false` otherwise.
 * `serialize` maps `true` to an empty string and `false` to `undefined`.
 *
 * @param _options Reserved for API consistency. No options are currently supported.
 */
export function boolean(
	_options: Record<PropertyKey, never> = {},
): AttributeSerializer<unknown, boolean> {
	return {
		parse(value: string | undefined) {
			return value !== undefined
		},
		serialize(value: boolean) {
			return value ? "" : undefined
		},
	}
}

/**
 * Creates a serializer constrained to a fixed list of string values.
 *
 * If the attribute is missing, or has a value outside `options.values`,
 * `parse` returns the provided default or `undefined`.
 *
 * @param options Configuration for the serializer.
 * @param options.values Allowed string values.
 * @param options.default Value returned when the attribute is missing or invalid.
 */
export function pickList<const K extends string, const Default = K>(options: {
	default: Default
	values: Readonly<Array<K>>
}): AttributeSerializer<unknown, K | Default>
export function pickList<
	const K extends string,
	const Default = undefined,
>(options: {
	default?: Default
	values: Readonly<Array<K>>
}): AttributeSerializer<unknown, K | Default | undefined>
export function pickList<const K extends string>(options: {
	default?: unknown
	values: Readonly<Array<K>>
}) {
	let values = new Set(options.values)
	return {
		parse(value: string | undefined) {
			if (value === undefined || !values.has(value as K)) {
				return options.default
			}
			return value as K
		},
		serialize(value: unknown) {
			return typeof value === "string" ? value : undefined
		},
	}
}

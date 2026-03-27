/**
 * Expands an object-ish type into a plain mapped shape for readability.
 * Useful to make intersections easier to inspect in hovers and error messages.
 *
 * @typeParam T The type to normalize into a plain object shape.
 */
export type Simplify<T> = {
	[K in keyof T]: T[K]
} & {}

/**
 * Generic constructor type.
 *
 * @typeParam T The instance type produced by the constructor.
 * @typeParam Arguments The constructor parameter tuple.
 */
export interface Constructor<T, Arguments extends unknown[] = []> {
	new (...args: Arguments): T
}

/**
 * Type-level equality check.
 *
 * Returns `true` only when `A` and `B` are identical types,
 * otherwise returns `false`.
 *
 * @typeParam A The left-hand type to compare.
 * @typeParam B The right-hand type to compare.
 */
export type IsEqual<A, B> =
	(<G>() => G extends (A & G) | G ? 1 : 2) extends <G>() => G extends
		| (B & G)
		| G
		? 1
		: 2
		? true
		: false

/**
 * Produces the union of keys that are readonly on a given object type.
 *
 * @typeParam Type The object type to inspect.
 */
export type ReadonlyKeysOf<Type extends object> = {
	[Key in keyof Type]-?: IsEqual<
		{ [Key2 in Key]: Type[Key2] },
		{ -readonly [Key2 in Key]: Type[Key2] }
	> extends true
		? never
		: Key
}[keyof Type]

/**
 * Produces only concrete keys from `T`.
 *
 * Index-signature keys (`string`, `number`, `symbol`) are excluded,
 * while literal keys are preserved.
 *
 * @typeParam T The object type from which to extract concrete keys.
 */
export type ConcreteKeysOf<T> = {
	[K in keyof T]: string extends K
		? never
		: number extends K
			? never
			: symbol extends K
				? never
				: K
}[keyof T]

/**
 * Merges two object types where `Target` wins for overlapping keys.
 *
 * @typeParam Source The base shape.
 * @typeParam Target The overriding shape.
 */
export type Merge<Source, Target> = Simplify<
	Omit<Source, keyof Target> & Target
>

/**
 * Converts camelCase/PascalCase-like text to kebab-case.
 *
 * @param str The input string to convert.
 * @returns The kebab-case version of `str`.
 */
export function toKebabCase(str: string): string {
	return str.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()
}

export class Empty {}

// biome-ignore lint/suspicious/noExplicitAny: Any constructor is allowed.
export interface AnyConstructor extends Constructor<object, any[]> {}

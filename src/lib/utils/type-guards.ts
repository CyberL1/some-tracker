export interface EffectLike {
	effect: number;
	delay: number;
	parameter: number;
	tableIndex?: number;
}

export function isEffectLike(value: unknown): value is EffectLike {
	return (
		typeof value === 'object' &&
		value !== null &&
		'effect' in value &&
		'delay' in value &&
		'parameter' in value &&
		typeof (value as Record<string, unknown>).effect === 'number' &&
		typeof (value as Record<string, unknown>).delay === 'number' &&
		typeof (value as Record<string, unknown>).parameter === 'number'
	);
}

export function isNumber(value: unknown): value is number {
	return typeof value === 'number';
}

export function isString(value: unknown): value is string {
	return typeof value === 'string';
}

export function isPrimitive(
	value: unknown
): value is string | number | null | undefined {
	return value === null || value === undefined || typeof value !== 'object';
}

export function toNumber(value: unknown, defaultValue: number = 0): number {
	if (typeof value === 'number') {
		return value;
	}
	if (typeof value === 'string') {
		const parsed = Number(value);
		return isNaN(parsed) ? defaultValue : parsed;
	}
	return defaultValue;
}


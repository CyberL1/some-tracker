const ZERO_VALUE = -1;

export function formatHex(
	value: number | string | null | undefined,
	digits: number,
	allowZeroValue?: boolean
): string {
	if (value === null || value === undefined) return '.'.repeat(digits);

	const num = typeof value === 'string' ? parseInt(value, 16) || 0 : value;

	if (allowZeroValue) {
		if (num === 0) return '.'.repeat(digits);
		if (num === ZERO_VALUE) return '0'.repeat(digits);
	} else {
		if (num === 0) return '.'.repeat(digits);
	}

	return num.toString(16).toUpperCase().padStart(digits, '0');
}

function normalizeSymbolValue(
	value: number | string | null | undefined,
	allowZeroValue?: boolean
): number | null {
	if (value === null || value === undefined) return null;
	if (typeof value === 'string') {
		if (value.toUpperCase() === 'OFF') return ZERO_VALUE;
		if (allowZeroValue === false && (value === '00' || value === '0')) return null;
		if (allowZeroValue !== false && (value === '00' || value === '0')) return ZERO_VALUE;
		const parsed = parseInt(value, 36);
		return isNaN(parsed) ? null : parsed;
	}
	return value;
}

export function formatSymbol(
	value: number | string | null | undefined,
	length: number,
	allowZeroValue?: boolean
): string {
	const num = normalizeSymbolValue(value, allowZeroValue);

	if (num === null || num === 0) return '.'.repeat(length);
	if (num === ZERO_VALUE)
		return allowZeroValue === false ? '.'.repeat(length) : '0'.repeat(length);

	const base36 = num.toString(36).toUpperCase();
	if (base36.length <= length) {
		return base36.padStart(length, '0');
	}
	return base36.slice(-length);
}

export function parseHex(value: string, length: number, allowZeroValue?: boolean): number | null {
	if (value === '.'.repeat(length)) return 0;

	const parsed = parseInt(value.replace(/\./g, '0'), 16);

	if (allowZeroValue && parsed === 0) {
		return ZERO_VALUE;
	}

	return parsed || 0;
}

export function parseSymbol(
	value: string,
	length: number,
	allowZeroValue?: boolean
): number {
	if (value === '.'.repeat(length)) return 0;

	const cleaned = value.replace(/\./g, '').toUpperCase();
	if (cleaned === 'OFF') return ZERO_VALUE;
	if (cleaned === '00' || cleaned === '0') return allowZeroValue === false ? 0 : ZERO_VALUE;

	const parsed = parseInt(cleaned, 36);
	return isNaN(parsed) ? 0 : parsed;
}

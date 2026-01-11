export function formatHex(value: number | string | null | undefined, digits: number): string {
	if (value === 0 || value === null || value === undefined) return '.'.repeat(digits);
	const num = typeof value === 'string' ? parseInt(value, 16) || 0 : value;
	if (num === 0) return '.'.repeat(digits);
	return num.toString(16).toUpperCase().padStart(digits, '0');
}

const TABLE_OFF_VALUE = -1;
const TABLE_OFF_DISPLAY = '00';
const NOTE_OFF_DISPLAY = 'OFF';

function normalizeSymbolValue(value: number | string | null | undefined): number | null {
	if (value === null || value === undefined) return null;
	if (typeof value === 'string') {
		if (value.toUpperCase() === NOTE_OFF_DISPLAY || value === TABLE_OFF_DISPLAY)
			return TABLE_OFF_VALUE;
		const parsed = parseInt(value, 36);
		return isNaN(parsed) ? null : parsed;
	}
	return value;
}

export function formatSymbol(value: number | string | null | undefined, length: number): string {
	const num = normalizeSymbolValue(value);

	if (num === null || num === 0) return '.'.repeat(length);
	if (num === TABLE_OFF_VALUE) return TABLE_OFF_DISPLAY.padStart(length, '0');

	const base36 = num.toString(36).toUpperCase();
	if (base36.length <= length) {
		return base36.padStart(length, '0');
	}
	return base36.slice(-length);
}

export function parseHex(value: string, length: number): number {
	if (value === '.'.repeat(length)) return 0;
	return parseInt(value.replace(/\./g, '0'), 16) || 0;
}

export function parseSymbol(value: string, length: number): number {
	if (value === '.'.repeat(length)) return 0;

	const cleaned = value.replace(/\./g, '').toUpperCase();
	if (cleaned === NOTE_OFF_DISPLAY || cleaned === TABLE_OFF_DISPLAY) return TABLE_OFF_VALUE;

	const parsed = parseInt(cleaned, 36);
	return isNaN(parsed) ? 0 : parsed;
}

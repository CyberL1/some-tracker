export function formatHex(value: number | string | null | undefined, digits: number): string {
	if (value === 0 || value === null || value === undefined) return '.'.repeat(digits);
	const num = typeof value === 'string' ? parseInt(value, 16) || 0 : value;
	if (num === 0) return '.'.repeat(digits);
	return num.toString(16).toUpperCase().padStart(digits, '0');
}

export function formatSymbol(value: number | string | null | undefined, length: number): string {
	if (value === 0 || value === null || value === undefined) return '.'.repeat(length);
	
	let num: number;
	if (typeof value === 'string') {
		const parsed = parseInt(value, 36);
		if (isNaN(parsed)) {
			return '.'.repeat(length);
		}
		num = parsed;
	} else {
		num = value;
	}
	
	if (num === 0) return '.'.repeat(length);
	if (num < 10) {
		return num.toString().padStart(length, '0');
	}
	const letter = String.fromCharCode(65 + (num - 10));
	return letter.padStart(length, '0');
}

export function parseHex(value: string, length: number): number {
	if (value === '.'.repeat(length)) return 0;
	return parseInt(value.replace(/\./g, '0'), 16) || 0;
}

export function parseSymbol(value: string, length: number): number {
	if (value === '.'.repeat(length)) return 0;
	const cleaned = value.replace(/\./g, '0');
	if (/^[0-9]+$/.test(cleaned)) {
		return parseInt(cleaned, 10) || 0;
	}
	const firstChar = cleaned[0];
	if (firstChar >= '0' && firstChar <= '9') {
		return parseInt(firstChar, 10) || 0;
	}
	return firstChar.charCodeAt(0) - 65 + 10;
}

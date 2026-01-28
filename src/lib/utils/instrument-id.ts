export function isValidInstrumentId(id: string): boolean {
	if (!id || id.length !== 2) return false;
	const upperId = id.toUpperCase();
	return /^[0-9A-Z]{2}$/.test(upperId);
}

export function normalizeInstrumentId(id: string): string {
	return id.toUpperCase().padStart(2, '0');
}

export function instrumentIdToNumber(id: string): number {
	if (!isValidInstrumentId(id)) return 0;
	return parseInt(id, 36);
}

export const MAX_INSTRUMENT_ID_NUM = 1295;

export function numberToInstrumentId(num: number): string {
	if (num < 0 || num > MAX_INSTRUMENT_ID_NUM) return '00';
	return num.toString(36).toUpperCase().padStart(2, '0');
}

export function getNextAvailableInstrumentId(existingIds: string[]): string {
	const usedNumbers = new Set(existingIds.map((id) => instrumentIdToNumber(id)));
	for (let i = 1; i <= MAX_INSTRUMENT_ID_NUM; i++) {
		if (!usedNumbers.has(i)) {
			return numberToInstrumentId(i);
		}
	}
	return '';
}

export function isInstrumentIdInRange(id: string): boolean {
	if (!isValidInstrumentId(id)) return false;
	const num = instrumentIdToNumber(id);
	return num >= 1 && num <= MAX_INSTRUMENT_ID_NUM;
}

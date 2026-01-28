export const MAX_TABLE_ID = 34;

export function tableIdToDisplayChar(id: number): string {
	if (id < 0 || id > MAX_TABLE_ID) return '';
	return (id + 1).toString(36).toUpperCase();
}

export function tableDisplayCharToId(char: string): number {
	const upper = char.toUpperCase();
	if (!upper || upper.length !== 1) return -1;
	const code = upper.charCodeAt(0);
	if (code >= '1'.charCodeAt(0) && code <= '9'.charCodeAt(0)) {
		return code - '0'.charCodeAt(0) - 1;
	}
	if (code >= 'A'.charCodeAt(0) && code <= 'Z'.charCodeAt(0)) {
		return 9 + (code - 'A'.charCodeAt(0));
	}
	return -1;
}

export function isValidTableDisplayChar(char: string): boolean {
	return tableDisplayCharToId(char) >= 0;
}

export function getNextAvailableTableId(existingIds: number[]): number {
	const used = new Set(existingIds);
	for (let i = 0; i <= MAX_TABLE_ID; i++) {
		if (!used.has(i)) return i;
	}
	return -1;
}

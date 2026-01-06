export interface ClipboardCell {
	row: number;
	column: number;
	fieldKey: string;
	fieldType: string;
	value: unknown;
}

export interface ClipboardData {
	cells: ClipboardCell[];
	minRow: number;
	minColumn: number;
	maxRow: number;
	maxColumn: number;
	rowCount: number;
	columnCount: number;
}

class ClipboardStore {
	private data: ClipboardData | null = $state(null);

	get hasData(): boolean {
		return this.data !== null && this.data.cells.length > 0;
	}

	get clipboardData(): ClipboardData | null {
		return this.data;
	}

	copy(cells: ClipboardCell[], minRow: number, minColumn: number, maxRow: number, maxColumn: number): void {
		this.data = {
			cells: cells.map(cell => ({ ...cell })),
			minRow,
			minColumn,
			maxRow,
			maxColumn,
			rowCount: maxRow - minRow + 1,
			columnCount: maxColumn - minColumn + 1
		};
	}

	clear(): void {
		this.data = null;
	}
}

export const clipboardStore = new ClipboardStore();


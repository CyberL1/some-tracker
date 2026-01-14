export interface SelectionBounds {
	minRow: number;
	maxRow: number;
	minCol: number;
	maxCol: number;
}

export interface SelectionState {
	selectionStartRow: number | null;
	selectionStartColumn: number | null;
	selectionEndRow: number | null;
	selectionEndColumn: number | null;
}

export class SelectionBoundsService {
	static getSelectionBounds(state: SelectionState): SelectionBounds | null {
		if (
			state.selectionStartRow === null ||
			state.selectionStartColumn === null ||
			state.selectionEndRow === null ||
			state.selectionEndColumn === null
		) {
			return null;
		}

		return {
			minRow: Math.min(state.selectionStartRow, state.selectionEndRow),
			maxRow: Math.max(state.selectionStartRow, state.selectionEndRow),
			minCol: Math.min(state.selectionStartColumn, state.selectionEndColumn),
			maxCol: Math.max(state.selectionStartColumn, state.selectionEndColumn)
		};
	}

	static isInSelection(
		rowIndex: number,
		bounds: SelectionBounds | null
	): boolean {
		if (!bounds) {
			return false;
		}
		return rowIndex >= bounds.minRow && rowIndex <= bounds.maxRow;
	}

	static getSelectionColumnBounds(
		rowIndex: number,
		bounds: SelectionBounds | null
	): { startCol: number; endCol: number } | null {
		if (!this.isInSelection(rowIndex, bounds)) {
			return null;
		}
		return {
			startCol: bounds!.minCol,
			endCol: bounds!.maxCol
		};
	}
}

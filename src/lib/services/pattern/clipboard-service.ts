import type { Pattern } from '../../models/song';
import { PatternFieldDetection } from './editing/pattern-field-detection';
import { PatternValueUpdates } from './editing/pattern-value-updates';
import type { EditingContext } from './editing/editing-context';
import { clipboardStore, type ClipboardCell } from '../../stores/clipboard.svelte';

export interface ClipboardContext {
	pattern: Pattern;
	selectedRow: number;
	selectedColumn: number;
	hasSelection: boolean;
	getSelectionBounds: () => {
		minRow: number;
		maxRow: number;
		minCol: number;
		maxCol: number;
	} | null;
	getCellPositions: (rowString: string, row: number) => any[];
	getPatternRowData: (pattern: Pattern, row: number) => string;
	createEditingContext: (pattern: Pattern, row: number, col: number) => EditingContext;
}

export class ClipboardService {
	static copySelection(context: ClipboardContext): void {
		const { pattern, selectedRow, selectedColumn, hasSelection, getSelectionBounds } = context;

		if (hasSelection) {
			this.copyMultipleCells(context);
		} else {
			this.copySingleCell(context, pattern, selectedRow, selectedColumn);
		}
	}

	private static copyMultipleCells(context: ClipboardContext): void {
		const {
			pattern,
			getSelectionBounds,
			getCellPositions,
			getPatternRowData,
			createEditingContext
		} = context;
		const bounds = getSelectionBounds();
		if (!bounds) return;

		const { minRow, maxRow, minCol, maxCol } = bounds;
		const cells: ClipboardCell[] = [];

		for (let row = minRow; row <= maxRow && row < pattern.length; row++) {
			const rowString = getPatternRowData(pattern, row);
			const cellPositions = getCellPositions(rowString, row);

			for (let col = minCol; col <= maxCol && col < cellPositions.length; col++) {
				const cell = cellPositions[col];
				if (!cell.fieldKey) continue;

				const editingContext = createEditingContext(pattern, row, col);
				const fieldInfo = PatternFieldDetection.detectFieldAtCursor(editingContext);
				if (!fieldInfo) continue;

				const field = PatternValueUpdates.getFieldDefinition(editingContext, cell.fieldKey);
				if (!field) continue;

				const value = PatternValueUpdates.getFieldValue(editingContext, fieldInfo);

				cells.push({
					row: row - minRow,
					column: col - minCol,
					fieldKey: cell.fieldKey,
					fieldType: field.type,
					value
				});
			}
		}

		clipboardStore.copy(cells, 0, 0, maxRow - minRow, maxCol - minCol);
	}

	private static copySingleCell(
		context: ClipboardContext,
		pattern: Pattern,
		row: number,
		col: number
	): void {
		const { getCellPositions, getPatternRowData, createEditingContext } = context;
		const rowString = getPatternRowData(pattern, row);
		const cellPositions = getCellPositions(rowString, row);

		const cell = cellPositions[col];
		if (!cell.fieldKey) return;

		const editingContext = createEditingContext(pattern, row, col);
		const fieldInfo = PatternFieldDetection.detectFieldAtCursor(editingContext);
		if (!fieldInfo) return;

		const field = PatternValueUpdates.getFieldDefinition(editingContext, cell.fieldKey);
		if (!field) return;

		const value = PatternValueUpdates.getFieldValue(editingContext, fieldInfo);

		clipboardStore.copy(
			[
				{
					row: 0,
					column: 0,
					fieldKey: cell.fieldKey,
					fieldType: field.type,
					value
				}
			],
			0,
			0,
			0,
			0
		);
	}

	static pasteSelection(
		context: ClipboardContext,
		onPatternUpdate: (pattern: Pattern) => void
	): void {
		const clipboardData = clipboardStore.clipboardData;
		if (!clipboardData) return;

		const {
			pattern: originalPattern,
			selectedRow,
			selectedColumn,
			getCellPositions,
			getPatternRowData,
			createEditingContext
		} = context;
		let pattern = originalPattern;

		for (const clipCell of clipboardData.cells) {
			const targetRow = selectedRow + clipCell.row;
			const targetCol = selectedColumn + clipCell.column;

			if (targetRow < 0 || targetRow >= pattern.length) continue;

			const rowString = getPatternRowData(pattern, targetRow);
			const cellPositions = getCellPositions(rowString, targetRow);
			if (targetCol < 0 || targetCol >= cellPositions.length) continue;

			const cell = cellPositions[targetCol];
			if (!cell.fieldKey || cell.fieldKey !== clipCell.fieldKey) continue;

			const editingContext = createEditingContext(pattern, targetRow, targetCol);
			const fieldInfo = PatternFieldDetection.detectFieldAtCursor(editingContext);
			if (!fieldInfo) continue;

			pattern = PatternValueUpdates.updateFieldValue(
				{ ...editingContext, pattern },
				fieldInfo,
				clipCell.value as string | number
			);
		}

		if (pattern !== originalPattern) {
			onPatternUpdate(pattern);
		}
	}
}

import { describe, it, expect } from 'vitest';
import {
	SelectionBoundsService,
	type SelectionState
} from '../../../../src/lib/services/pattern/selection-bounds-service';

describe('SelectionBoundsService', () => {
	describe('getSelectionBounds', () => {
		it('should return null when any selection value is null', () => {
			const state: SelectionState = {
				selectionStartRow: null,
				selectionStartColumn: null,
				selectionEndRow: null,
				selectionEndColumn: null
			};

			const result = SelectionBoundsService.getSelectionBounds(state);

			expect(result).toBeNull();
		});

		it('should return null when only start row is set', () => {
			const state: SelectionState = {
				selectionStartRow: 5,
				selectionStartColumn: null,
				selectionEndRow: null,
				selectionEndColumn: null
			};

			const result = SelectionBoundsService.getSelectionBounds(state);

			expect(result).toBeNull();
		});

		it('should return bounds when all selection values are set', () => {
			const state: SelectionState = {
				selectionStartRow: 10,
				selectionStartColumn: 5,
				selectionEndRow: 15,
				selectionEndColumn: 8
			};

			const result = SelectionBoundsService.getSelectionBounds(state);

			expect(result).toEqual({
				minRow: 10,
				maxRow: 15,
				minCol: 5,
				maxCol: 8
			});
		});

		it('should correctly calculate bounds when end is before start', () => {
			const state: SelectionState = {
				selectionStartRow: 15,
				selectionStartColumn: 8,
				selectionEndRow: 10,
				selectionEndColumn: 5
			};

			const result = SelectionBoundsService.getSelectionBounds(state);

			expect(result).toEqual({
				minRow: 10,
				maxRow: 15,
				minCol: 5,
				maxCol: 8
			});
		});

		it('should handle single cell selection', () => {
			const state: SelectionState = {
				selectionStartRow: 7,
				selectionStartColumn: 3,
				selectionEndRow: 7,
				selectionEndColumn: 3
			};

			const result = SelectionBoundsService.getSelectionBounds(state);

			expect(result).toEqual({
				minRow: 7,
				maxRow: 7,
				minCol: 3,
				maxCol: 3
			});
		});

		it('should handle zero values correctly', () => {
			const state: SelectionState = {
				selectionStartRow: 0,
				selectionStartColumn: 0,
				selectionEndRow: 0,
				selectionEndColumn: 0
			};

			const result = SelectionBoundsService.getSelectionBounds(state);

			expect(result).toEqual({
				minRow: 0,
				maxRow: 0,
				minCol: 0,
				maxCol: 0
			});
		});
	});

	describe('isInSelection', () => {
		it('should return false when bounds is null', () => {
			const result = SelectionBoundsService.isInSelection(5, null);

			expect(result).toBe(false);
		});

		it('should return true when row is within bounds', () => {
			const bounds = {
				minRow: 10,
				maxRow: 20,
				minCol: 0,
				maxCol: 5
			};

			expect(SelectionBoundsService.isInSelection(10, bounds)).toBe(true);
			expect(SelectionBoundsService.isInSelection(15, bounds)).toBe(true);
			expect(SelectionBoundsService.isInSelection(20, bounds)).toBe(true);
		});

		it('should return false when row is outside bounds', () => {
			const bounds = {
				minRow: 10,
				maxRow: 20,
				minCol: 0,
				maxCol: 5
			};

			expect(SelectionBoundsService.isInSelection(9, bounds)).toBe(false);
			expect(SelectionBoundsService.isInSelection(21, bounds)).toBe(false);
			expect(SelectionBoundsService.isInSelection(0, bounds)).toBe(false);
		});

		it('should return true for boundary values', () => {
			const bounds = {
				minRow: 5,
				maxRow: 10,
				minCol: 0,
				maxCol: 3
			};

			expect(SelectionBoundsService.isInSelection(5, bounds)).toBe(true);
			expect(SelectionBoundsService.isInSelection(10, bounds)).toBe(true);
		});
	});

	describe('getSelectionColumnBounds', () => {
		const bounds = {
			minRow: 10,
			maxRow: 20,
			minCol: 5,
			maxCol: 15
		};

		it('should return null when bounds is null', () => {
			const result = SelectionBoundsService.getSelectionColumnBounds(15, null);

			expect(result).toBeNull();
		});

		it('should return null when row is not in selection', () => {
			const result = SelectionBoundsService.getSelectionColumnBounds(25, bounds);

			expect(result).toBeNull();
		});

		it('should return column bounds when row is in selection', () => {
			const result = SelectionBoundsService.getSelectionColumnBounds(15, bounds);

			expect(result).toEqual({
				startCol: 5,
				endCol: 15
			});
		});

		it('should return column bounds for first row of selection', () => {
			const result = SelectionBoundsService.getSelectionColumnBounds(10, bounds);

			expect(result).toEqual({
				startCol: 5,
				endCol: 15
			});
		});

		it('should return column bounds for last row of selection', () => {
			const result = SelectionBoundsService.getSelectionColumnBounds(20, bounds);

			expect(result).toEqual({
				startCol: 5,
				endCol: 15
			});
		});
	});
});

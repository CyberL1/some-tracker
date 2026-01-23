import { describe, it, expect, vi } from 'vitest';
import { ProgressiveSelectionService } from '../../../../src/lib/services/pattern/progressive-selection-service';
import { Pattern } from '../../../../src/lib/models/song';
import { AY_CHIP_SCHEMA } from '../../../../src/lib/chips/ay/schema';

describe('ProgressiveSelectionService', () => {
	const schema = AY_CHIP_SCHEMA;

	const createMockPattern = (length: number = 64): Pattern => {
		const pattern = new Pattern(1, length, schema);
		return pattern;
	};

	const mockGetCellPositions = vi.fn((rowString: string, rowIndex: number) => {
		return [
			{ x: 0, width: 10, charIndex: 10, fieldKey: 'envelopeValue' },
			{ x: 10, width: 10, charIndex: 15, fieldKey: 'envelopeEffect' },
			{ x: 20, width: 10, charIndex: 20, fieldKey: 'noiseValue' },
			{ x: 30, width: 10, charIndex: 23, fieldKey: 'note' },
			{ x: 40, width: 10, charIndex: 27, fieldKey: 'instrument' },
			{ x: 50, width: 10, charIndex: 29, fieldKey: 'envelopeShape' },
			{ x: 60, width: 10, charIndex: 30, fieldKey: 'table' },
			{ x: 70, width: 10, charIndex: 32, fieldKey: 'volume' },
			{ x: 80, width: 10, charIndex: 34, fieldKey: 'effect' },
			{ x: 90, width: 10, charIndex: 39, fieldKey: 'note' },
			{ x: 100, width: 10, charIndex: 43, fieldKey: 'instrument' },
			{ x: 110, width: 10, charIndex: 45, fieldKey: 'envelopeShape' },
			{ x: 120, width: 10, charIndex: 46, fieldKey: 'table' },
			{ x: 130, width: 10, charIndex: 48, fieldKey: 'volume' },
			{ x: 140, width: 10, charIndex: 50, fieldKey: 'effect' },
			{ x: 150, width: 10, charIndex: 55, fieldKey: 'note' },
			{ x: 160, width: 10, charIndex: 59, fieldKey: 'instrument' },
			{ x: 170, width: 10, charIndex: 61, fieldKey: 'envelopeShape' },
			{ x: 180, width: 10, charIndex: 62, fieldKey: 'table' },
			{ x: 190, width: 10, charIndex: 64, fieldKey: 'volume' },
			{ x: 200, width: 10, charIndex: 66, fieldKey: 'effect' }
		];
	});

	const mockGetPatternRowData = vi.fn((pattern: Pattern, rowIndex: number) => {
		return '00 0000 0000 00 --- 00000 0000 --- 00000 0000 --- 00000';
	});

	it('should select entire column when no selection exists', () => {
		const pattern = createMockPattern();
		const result = ProgressiveSelectionService.selectAll(
			pattern,
			5,
			null,
			null,
			null,
			null,
			mockGetCellPositions,
			mockGetPatternRowData,
			schema
		);

		expect(result).toEqual({
			startRow: 0,
			endRow: 63,
			startColumn: 5,
			endColumn: 5
		});
	});

	it('should select entire channel when entire column is selected', () => {
		const pattern = createMockPattern();
		const result = ProgressiveSelectionService.selectAll(
			pattern,
			5,
			0,
			5,
			63,
			5,
			mockGetCellPositions,
			mockGetPatternRowData,
			schema
		);

		expect(result.startRow).toBe(0);
		expect(result.endRow).toBe(63);
		expect(result.startColumn).toBe(3);
		expect(result.endColumn).toBe(6);
	});

	it('should select entire pattern when entire channel is selected', () => {
		const pattern = createMockPattern();
		const result = ProgressiveSelectionService.selectAll(
			pattern,
			5,
			0,
			3,
			63,
			6,
			mockGetCellPositions,
			mockGetPatternRowData,
			schema
		);

		expect(result.startRow).toBe(0);
		expect(result.endRow).toBe(63);
		expect(result.startColumn).toBe(0);
		expect(result.endColumn).toBe(20);
	});

	it('should handle selection in middle channel', () => {
		const pattern = createMockPattern();
		const result = ProgressiveSelectionService.selectAll(
			pattern,
			11,
			0,
			11,
			63,
			11,
			mockGetCellPositions,
			mockGetPatternRowData,
			schema
		);

		expect(result.startRow).toBe(0);
		expect(result.endRow).toBe(63);
		expect(result.startColumn).toBe(7);
		expect(result.endColumn).toBe(11);
	});

	it('should select column when partial selection exists', () => {
		const pattern = createMockPattern();
		const result = ProgressiveSelectionService.selectAll(
			pattern,
			5,
			10,
			5,
			20,
			5,
			mockGetCellPositions,
			mockGetPatternRowData,
			schema
		);

		expect(result).toEqual({
			startRow: 0,
			endRow: 63,
			startColumn: 5,
			endColumn: 5
		});
	});

	it('should select all global fields when entire global column is selected', () => {
		const pattern = createMockPattern();
		const result = ProgressiveSelectionService.selectAll(
			pattern,
			1,
			0,
			1,
			63,
			1,
			mockGetCellPositions,
			mockGetPatternRowData,
			schema
		);

		expect(result.startRow).toBe(0);
		expect(result.endRow).toBe(63);
		expect(result.startColumn).toBe(0);
		expect(result.endColumn).toBe(2);
	});

	it('should select entire pattern when all global fields are selected', () => {
		const pattern = createMockPattern();
		const result = ProgressiveSelectionService.selectAll(
			pattern,
			1,
			0,
			0,
			63,
			2,
			mockGetCellPositions,
			mockGetPatternRowData,
			schema
		);

		expect(result.startRow).toBe(0);
		expect(result.endRow).toBe(63);
		expect(result.startColumn).toBe(0);
		expect(result.endColumn).toBe(20);
	});
});

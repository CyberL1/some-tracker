import { describe, it, expect, vi } from 'vitest';
import {
	PatternFieldEditAction,
	BulkPatternEditAction,
	type PatternEditContext
} from '../../../src/lib/models/actions';
import { Pattern } from '../../../src/lib/models/song';

describe('PatternFieldEditAction', () => {
	it('should execute and update pattern', () => {
		const oldPattern = new Pattern(0, 64);
		const newPattern = new Pattern(0, 64);

		oldPattern.channels[0].rows[0].note.name = 0;
		newPattern.channels[0].rows[0].note.name = 5;

		const updatePatterns = vi.fn();
		const setCursor = vi.fn();

		const context: PatternEditContext = {
			patterns: [oldPattern],
			updatePatterns,
			setCursor
		};

		const action = new PatternFieldEditAction(context, oldPattern, newPattern, {
			row: 0,
			column: 0,
			patternOrderIndex: 0
		});

		action.execute();

		expect(updatePatterns).toHaveBeenCalledOnce();
		expect(setCursor).toHaveBeenCalledWith({ row: 0, column: 0, patternOrderIndex: 0 });
	});

	it('should undo and restore original pattern', () => {
		const oldPattern = new Pattern(0, 64);
		const newPattern = new Pattern(0, 64);

		oldPattern.channels[0].rows[0].note.name = 0;
		newPattern.channels[0].rows[0].note.name = 5;

		const updatePatterns = vi.fn();
		const setCursor = vi.fn();

		const context: PatternEditContext = {
			patterns: [oldPattern],
			updatePatterns,
			setCursor
		};

		const action = new PatternFieldEditAction(context, oldPattern, newPattern, {
			row: 0,
			column: 0,
			patternOrderIndex: 0
		});

		action.undo();

		expect(updatePatterns).toHaveBeenCalledOnce();
		expect(setCursor).toHaveBeenCalledWith({ row: 0, column: 0, patternOrderIndex: 0 });

		const updatedPatterns = updatePatterns.mock.calls[0][0];
		expect(updatedPatterns[0].channels[0].rows[0].note.name).toBe(0);
	});

	it('should return cursor position', () => {
		const oldPattern = new Pattern(0, 64);
		const newPattern = new Pattern(0, 64);

		const context: PatternEditContext = {
			patterns: [oldPattern],
			updatePatterns: vi.fn(),
			setCursor: vi.fn()
		};

		const action = new PatternFieldEditAction(context, oldPattern, newPattern, {
			row: 5,
			column: 3,
			patternOrderIndex: 2
		});

		const cursorPos = action.getCursorPosition();

		expect(cursorPos).toEqual({ row: 5, column: 3, patternOrderIndex: 2 });
	});

	it('should deep clone patterns to avoid mutation', () => {
		const oldPattern = new Pattern(0, 64);
		const newPattern = new Pattern(0, 64);

		oldPattern.channels[0].rows[0].note.name = 0;
		newPattern.channels[0].rows[0].note.name = 5;

		const updatePatterns = vi.fn();
		const context: PatternEditContext = {
			patterns: [oldPattern],
			updatePatterns,
			setCursor: vi.fn()
		};

		const action = new PatternFieldEditAction(context, oldPattern, newPattern, {
			row: 0,
			column: 0,
			patternOrderIndex: 0
		});

		oldPattern.channels[0].rows[0].note.name = 10;
		newPattern.channels[0].rows[0].note.name = 15;

		action.undo();

		const updatedPatterns = updatePatterns.mock.calls[0][0];
		expect(updatedPatterns[0].channels[0].rows[0].note.name).toBe(0);
	});
});

describe('BulkPatternEditAction', () => {
	it('should execute bulk edit', () => {
		const oldPattern = new Pattern(0, 64);
		const newPattern = new Pattern(0, 64);

		for (let i = 0; i < 5; i++) {
			oldPattern.channels[0].rows[i].note.name = 0;
			newPattern.channels[0].rows[i].note.name = i + 1;
		}

		const updatePatterns = vi.fn();
		const setCursor = vi.fn();

		const context: PatternEditContext = {
			patterns: [oldPattern],
			updatePatterns,
			setCursor
		};

		const action = new BulkPatternEditAction(context, oldPattern, newPattern, {
			row: 0,
			column: 0,
			patternOrderIndex: 0
		});

		action.execute();

		expect(updatePatterns).toHaveBeenCalledOnce();
		expect(setCursor).toHaveBeenCalledWith({ row: 0, column: 0, patternOrderIndex: 0 });
	});

	it('should undo bulk edit and restore all changes', () => {
		const oldPattern = new Pattern(0, 64);
		const newPattern = new Pattern(0, 64);

		for (let i = 0; i < 5; i++) {
			oldPattern.channels[0].rows[i].note.name = 0;
			newPattern.channels[0].rows[i].note.name = i + 1;
		}

		const updatePatterns = vi.fn();
		const setCursor = vi.fn();

		const context: PatternEditContext = {
			patterns: [oldPattern],
			updatePatterns,
			setCursor
		};

		const action = new BulkPatternEditAction(context, oldPattern, newPattern, {
			row: 0,
			column: 0,
			patternOrderIndex: 0
		});

		action.undo();

		expect(updatePatterns).toHaveBeenCalledOnce();

		const updatedPatterns = updatePatterns.mock.calls[0][0];
		for (let i = 0; i < 5; i++) {
			expect(updatedPatterns[0].channels[0].rows[i].note.name).toBe(0);
		}
	});
});


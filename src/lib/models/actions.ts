import type { Pattern } from './song';

export interface CursorPosition {
	row: number;
	column: number;
	patternOrderIndex: number;
}

export interface Action {
	execute(): void;
	undo(): void;
	getCursorPosition(): CursorPosition;
}

export interface PatternEditContext {
	patterns: Pattern[];
	updatePatterns: (patterns: Pattern[]) => void;
	setCursor: (position: CursorPosition) => void;
}

export class PatternFieldEditAction implements Action {
	private oldPattern: Pattern;
	private newPattern: Pattern;
	private cursorPosition: CursorPosition;

	constructor(
		private context: PatternEditContext,
		oldPattern: Pattern,
		newPattern: Pattern,
		cursorPosition: CursorPosition
	) {
		this.oldPattern = this.deepClonePattern(oldPattern);
		this.newPattern = this.deepClonePattern(newPattern);
		this.cursorPosition = { ...cursorPosition };
	}

	execute(): void {
		this.replacePattern(this.newPattern);
		this.context.setCursor(this.cursorPosition);
	}

	undo(): void {
		this.replacePattern(this.oldPattern);
		this.context.setCursor(this.cursorPosition);
	}

	getCursorPosition(): CursorPosition {
		return { ...this.cursorPosition };
	}

	private replacePattern(pattern: Pattern): void {
		const newPatterns = this.context.patterns.map((p) =>
			p.id === pattern.id ? this.deepClonePattern(pattern) : p
		);
		this.context.updatePatterns(newPatterns);
	}

	private deepClonePattern(pattern: Pattern): Pattern {
		return JSON.parse(JSON.stringify(pattern));
	}
}

export class BulkPatternEditAction implements Action {
	private oldPattern: Pattern;
	private newPattern: Pattern;
	private cursorPosition: CursorPosition;

	constructor(
		private context: PatternEditContext,
		oldPattern: Pattern,
		newPattern: Pattern,
		cursorPosition: CursorPosition
	) {
		this.oldPattern = this.deepClonePattern(oldPattern);
		this.newPattern = this.deepClonePattern(newPattern);
		this.cursorPosition = { ...cursorPosition };
	}

	execute(): void {
		this.replacePattern(this.newPattern);
		this.context.setCursor(this.cursorPosition);
	}

	undo(): void {
		this.replacePattern(this.oldPattern);
		this.context.setCursor(this.cursorPosition);
	}

	getCursorPosition(): CursorPosition {
		return { ...this.cursorPosition };
	}

	private replacePattern(pattern: Pattern): void {
		const newPatterns = this.context.patterns.map((p) =>
			p.id === pattern.id ? this.deepClonePattern(pattern) : p
		);
		this.context.updatePatterns(newPatterns);
	}

	private deepClonePattern(pattern: Pattern): Pattern {
		return JSON.parse(JSON.stringify(pattern));
	}
}

export class PatternLengthChangeAction implements Action {
	private oldPattern: Pattern;
	private newPattern: Pattern;
	private oldCursorPosition: CursorPosition;
	private newCursorPosition: CursorPosition;

	constructor(
		private context: PatternEditContext,
		oldPattern: Pattern,
		newPattern: Pattern,
		oldCursorPosition: CursorPosition
	) {
		this.oldPattern = this.deepClonePattern(oldPattern);
		this.newPattern = this.deepClonePattern(newPattern);
		this.oldCursorPosition = { ...oldCursorPosition };

		this.newCursorPosition = {
			...oldCursorPosition,
			row: Math.min(oldCursorPosition.row, newPattern.length - 1)
		};
	}

	execute(): void {
		this.replacePattern(this.newPattern);
		this.context.setCursor(this.newCursorPosition);
	}

	undo(): void {
		this.replacePattern(this.oldPattern);
		this.context.setCursor(this.oldCursorPosition);
	}

	getCursorPosition(): CursorPosition {
		return { ...this.newCursorPosition };
	}

	private replacePattern(pattern: Pattern): void {
		const newPatterns = this.context.patterns.map((p) =>
			p.id === pattern.id ? this.deepClonePattern(pattern) : p
		);
		this.context.updatePatterns(newPatterns);
	}

	private deepClonePattern(pattern: Pattern): Pattern {
		return JSON.parse(JSON.stringify(pattern));
	}
}

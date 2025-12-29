import type { getColors } from '../utils/colors';
import type { PatternEditorTextParser, FieldSegment } from './pattern-editor-text-parser';
import type { Chip } from '../models/chips';
import { BaseCanvasRenderer, type BaseRenderOptions } from './base-canvas-renderer';

export interface PatternEditorRenderOptions extends BaseRenderOptions {
	lineHeight: number;
	schema: Chip['schema'];
}

export interface RowRenderData {
	rowString: string;
	y: number;
	isSelected: boolean;
	rowIndex: number;
	selectedColumn: number;
	segments: FieldSegment[];
	cellPositions: ReturnType<PatternEditorTextParser['getCellPositions']>;
}

export class PatternEditorRenderer extends BaseCanvasRenderer {
	private lineHeight: number;
	private schema: Chip['schema'];

	constructor(options: PatternEditorRenderOptions) {
		super(options);
		this.lineHeight = options.lineHeight;
		this.schema = options.schema;
	}

	drawRow(data: RowRenderData): void {
		this.drawRowBackground(data);
		this.drawRowText(data);
	}

	private drawRowBackground(data: RowRenderData): void {
		if (data.rowIndex % 4 === 0) {
			this.fillRect(
				0,
				data.y,
				this.canvasWidth,
				this.lineHeight,
				this.colors.patternAlternate
			);
		}

		if (data.isSelected) {
			this.fillRect(
				0,
				data.y,
				this.canvasWidth,
				this.lineHeight,
				this.colors.patternSelected
			);
		}

		if (data.isSelected && data.selectedColumn < data.cellPositions.length) {
			const cellPos = data.cellPositions[data.selectedColumn];
			this.fillRect(
				cellPos.x - 1,
				data.y,
				cellPos.width + 2,
				this.lineHeight,
				this.colors.patternCellSelected
			);
		}
	}

	private drawRowText(data: RowRenderData): void {
		let x = 10;
		let segmentIndex = 0;
		let currentSegment = data.segments[0];

		for (let i = 0; i < data.rowString.length; i++) {
			const char = data.rowString[i];

			if (char === ' ') {
				x += this.measureText(' ');
				continue;
			}

			while (currentSegment && i >= currentSegment.end) {
				segmentIndex++;
				currentSegment = data.segments[segmentIndex];
			}

			const color = this.determineCharColor(char, data, currentSegment, i);
			this.fillText(char, x, data.y + this.lineHeight / 2, color);
			x += this.measureText(char);
		}
	}

	private determineCharColor(
		char: string,
		data: RowRenderData,
		currentSegment: FieldSegment | undefined,
		index: number
	): string {
		let color = this.colors.patternText;
		if (currentSegment) {
			color = currentSegment.color;
		}

		const fieldText = currentSegment
			? data.rowString.substring(currentSegment.start, currentSegment.end)
			: '';

		const isEmptyField = fieldText && fieldText.split('').every((c) => c === '.' || c === '-');

		if ((char === '.' || char === '-') && isEmptyField) {
			const field =
				currentSegment &&
				(this.schema.fields[currentSegment.fieldKey] ||
					this.schema.globalFields?.[currentSegment.fieldKey]);
			const isAtomic = field?.selectable === 'atomic';
			if (isAtomic) {
				if (fieldText === '---') {
					return data.isSelected
						? this.colors.patternEmptySelected
						: data.rowIndex % 4 === 0
							? this.colors.patternAlternateEmpty
							: this.colors.patternEmpty;
				} else {
					return color;
				}
			} else {
				return data.isSelected
					? this.colors.patternEmptySelected
					: data.rowIndex % 4 === 0
						? this.colors.patternAlternateEmpty
						: this.colors.patternEmpty;
			}
		}

		return color;
	}
}

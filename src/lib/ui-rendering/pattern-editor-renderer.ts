import type { PatternEditorTextParser, FieldSegment } from './pattern-editor-text-parser';
import type { Chip } from '../chips/types';
import { BaseCanvasRenderer, type BaseRenderOptions } from './base-canvas-renderer';
import { PatternTemplateParser } from '../services/pattern/editing/pattern-template-parsing';

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
	channelMuted: boolean[];
}

export interface ChannelLabelData {
	rowString: string;
	channelLabels: string[];
	channelMuted: boolean[];
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

	drawChannelLabels(data: ChannelLabelData): void {
		const channelPositions = this.calculateChannelPositions(data.rowString);
		const labelY = this.lineHeight / 2;

		this.fillRect(0, 0, this.canvasWidth, this.lineHeight, this.colors.patternBg);

		for (let i = 0; i < data.channelLabels.length && i < channelPositions.length; i++) {
			const label = `Channel ${data.channelLabels[i]}`;
			const x = channelPositions[i];
			const isMuted = data.channelMuted[i] ?? false;
			const color = isMuted ? this.colors.patternEmpty : this.colors.patternText;

			this.fillText(label, x, labelY, color);
		}
	}

	calculateChannelPositions(rowString: string): number[] {
		const positions: number[] = [];
		let x = 10;
		let i = 0;

		const skipSpaces = () => {
			while (i < rowString.length && rowString[i] === ' ') {
				x += this.measureText(' ');
				i++;
			}
		};

		skipSpaces();

		while (i < rowString.length && rowString[i] !== ' ') {
			x += this.measureText(rowString[i]);
			i++;
		}
		skipSpaces();

		if (this.schema.globalTemplate && this.schema.globalFields) {
			const globalTemplate = this.schema.globalTemplate;
			let templatePos = 0;
			while (templatePos < globalTemplate.length && i < rowString.length) {
				if (globalTemplate[templatePos] === '{') {
					const end = globalTemplate.indexOf('}', templatePos);
					if (end !== -1) {
						const key = globalTemplate.substring(templatePos + 1, end);
						const field = this.schema.globalFields[key];
						if (field) {
							for (let j = 0; j < field.length && i < rowString.length; j++) {
								if (rowString[i] !== ' ') {
									x += this.measureText(rowString[i]);
								} else {
									x += this.measureText(' ');
								}
								i++;
							}
						}
						templatePos = end + 1;
					} else {
						templatePos++;
					}
				} else if (globalTemplate[templatePos] === ' ') {
					if (i < rowString.length && rowString[i] === ' ') {
						x += this.measureText(' ');
						i++;
					}
					templatePos++;
				} else {
					templatePos++;
				}
			}
			skipSpaces();
		}

		const template = this.schema.template;
		while (i < rowString.length) {
			skipSpaces();
			if (i >= rowString.length) break;

			const channelStart = x;
			let templatePos = 0;
			let foundField = false;

			while (templatePos < template.length && i < rowString.length) {
				if (template[templatePos] === '{') {
					const end = template.indexOf('}', templatePos);
					if (end !== -1) {
						const key = template.substring(templatePos + 1, end);
						const field = this.schema.fields[key];
						if (field) {
							for (let j = 0; j < field.length && i < rowString.length; j++) {
								if (rowString[i] !== ' ') {
									x += this.measureText(rowString[i]);
								} else {
									x += this.measureText(' ');
								}
								i++;
							}
							foundField = true;
						}
						templatePos = end + 1;
					} else {
						break;
					}
				} else if (template[templatePos] === ' ') {
					if (i < rowString.length && rowString[i] === ' ') {
						x += this.measureText(' ');
						i++;
					}
					templatePos++;
				} else {
					templatePos++;
				}
			}

			if (foundField) {
				positions.push(channelStart);
			} else {
				break;
			}
		}

		return positions;
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
		const originalAlpha = this.ctx.globalAlpha;

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

			const channelIndex = this.getChannelIndexForChar(data, currentSegment, i);
			const isMuted = channelIndex >= 0 && data.channelMuted[channelIndex];

			if (isMuted) {
				this.ctx.globalAlpha = originalAlpha * 0.4;
			} else {
				this.ctx.globalAlpha = originalAlpha;
			}

			const color = this.determineCharColor(char, data, currentSegment, i);
			this.fillText(char, x, data.y + this.lineHeight / 2, color);
			x += this.measureText(char);
		}

		this.ctx.globalAlpha = originalAlpha;
	}

	private getChannelIndexForChar(
		data: RowRenderData,
		currentSegment: FieldSegment | undefined,
		charIndex: number
	): number {
		if (!currentSegment) return -1;

		const field =
			this.schema.fields[currentSegment.fieldKey] ||
			this.schema.globalFields?.[currentSegment.fieldKey];
		if (!field) return -1;

		const isGlobal = !!this.schema.globalFields?.[currentSegment.fieldKey];
		if (isGlobal) return -1;

		let pos = PatternTemplateParser.skipRowNumber(data.rowString, 0);
		pos = PatternTemplateParser.parseGlobalTemplate(data.rowString, pos, this.schema);

		let channelIndex = 0;
		const template = this.schema.template;

		while (pos < charIndex && pos < data.rowString.length) {
			pos = PatternTemplateParser.skipSpaces(data.rowString, pos);
			if (pos >= data.rowString.length || pos >= charIndex) break;

			let channelStart = pos;
			PatternTemplateParser.parseTemplate(
				template,
				this.schema.fields,
				(key, field, isSpace) => {
					if (isSpace) {
						if (pos < data.rowString.length && data.rowString[pos] === ' ') {
							pos++;
						}
					} else {
						if (pos < charIndex) {
							pos += field.length;
						}
					}
				}
			);

			if (pos === channelStart) break;

			if (pos < charIndex) {
				channelIndex++;
			} else {
				break;
			}
		}

		return channelIndex;
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

		const field =
			currentSegment &&
			(this.schema.fields[currentSegment.fieldKey] ||
				this.schema.globalFields?.[currentSegment.fieldKey]);

		const isEmptyField = fieldText && fieldText.split('').every((c) => c === '.' || c === '-');

		if ((char === '.' || char === '-') && isEmptyField) {
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

		if (currentSegment && !isEmptyField) {
			const isNoteField = field?.type === 'note';
			const isEffectField =
				currentSegment.fieldKey === 'effect' ||
				currentSegment.fieldKey === 'envelopeEffect';

			if (char === '.' && isEffectField) {
				return data.isSelected
					? this.colors.patternEmptySelected
					: data.rowIndex % 4 === 0
						? this.colors.patternAlternateEmpty
						: this.colors.patternEmpty;
			}

			if (isNoteField) {
				if (fieldText === 'OFF') {
					return this.colors.patternNoteOff;
				}

				const validNotePattern = /^[A-G][#-]\d$/;
				const isPartOfValidNote = validNotePattern.test(fieldText);

				if (char === '.' && !isPartOfValidNote) {
					return data.isSelected
						? this.colors.patternEmptySelected
						: data.rowIndex % 4 === 0
							? this.colors.patternAlternateEmpty
							: this.colors.patternEmpty;
				}

				if (char === '-' && !isPartOfValidNote) {
					return data.isSelected
						? this.colors.patternEmptySelected
						: data.rowIndex % 4 === 0
							? this.colors.patternAlternateEmpty
							: this.colors.patternEmpty;
				}
			}
		}

		return color;
	}
}

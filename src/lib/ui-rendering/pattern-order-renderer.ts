import type { Pattern } from '../models/song';
import type { getColors } from '../utils/colors';
import type { getFonts } from '../utils/fonts';
import { BaseCanvasRenderer, type BaseRenderOptions } from './base-canvas-renderer';

export interface PatternOrderRenderOptions extends BaseRenderOptions {
	fonts: ReturnType<typeof getFonts>;
	canvasHeight: number;
	fontSize: number;
	cellWidth: number;
	cellHeight: number;
	padding: number;
	fadeHeight: number;
}

export interface PatternCell {
	pattern: Pattern | undefined;
	patternId: number;
	y: number;
	isSelected: boolean;
	isHovered: boolean;
	isEditing: boolean;
	editingValue: string;
	index: number;
}

export class PatternOrderRenderer extends BaseCanvasRenderer {
	private fonts: ReturnType<typeof getFonts>;
	private canvasHeight: number;
	private fontSize: number;
	private cellWidth: number;
	private cellHeight: number;
	private padding: number;
	private fadeHeight: number;

	constructor(options: PatternOrderRenderOptions) {
		super(options);
		this.fonts = options.fonts;
		this.canvasHeight = options.canvasHeight;
		this.fontSize = options.fontSize;
		this.cellWidth = options.cellWidth;
		this.cellHeight = options.cellHeight;
		this.padding = options.padding;
		this.fadeHeight = options.fadeHeight;
	}

	drawPatternCell(cell: PatternCell): void {
		const cellY = cell.y - this.cellHeight / 2;
		const isEmpty = !cell.pattern;

		this.drawCellBackground(cell, cellY);
		this.drawCellText(cell, isEmpty);
		this.drawCellEditingIndicator(cell, cellY);
		this.drawCellSelectionIndicator(cell);
	}

	private drawCellBackground(cell: PatternCell, cellY: number): void {
		if (cell.isSelected) {
			this.fillRect(
				this.padding,
				cellY,
				this.cellWidth,
				this.cellHeight,
				this.colors.patternNoise
			);
			this.strokeRectPixelPerfect(
				this.padding,
				cellY,
				this.cellWidth,
				this.cellHeight,
				this.colors.patternInstrument
			);
		} else if (cell.isHovered) {
			this.fillRect(
				this.padding,
				cellY,
				this.cellWidth,
				this.cellHeight,
				this.colors.patternHeader
			);
			this.strokeRectPixelPerfect(
				this.padding,
				cellY,
				this.cellWidth,
				this.cellHeight,
				this.colors.patternInstrument
			);
		} else {
			const bgColor =
				cell.index % 2 === 0 ? this.colors.patternBg : this.colors.patternAlternate;
			this.fillRect(this.padding, cellY, this.cellWidth, this.cellHeight, bgColor);
			this.strokeRectPixelPerfect(
				this.padding,
				cellY,
				this.cellWidth,
				this.cellHeight,
				this.colors.patternEmpty
			);
		}
	}

	private drawCellText(cell: PatternCell, isEmpty: boolean): void {
		let patternText: string;
		if (cell.isEditing) {
			patternText =
				cell.editingValue === ''
					? cell.patternId.toString().padStart(2, '0')
					: cell.editingValue.padStart(2, '0');
		} else {
			patternText = cell.patternId.toString().padStart(2, '0');
		}

		const editingColor = cell.isEditing
			? cell.editingValue === ''
				? this.colors.patternEnvelope
				: this.colors.patternEditing
			: null;

		const textColor = isEmpty
			? this.colors.patternEmpty
			: cell.isEditing
				? editingColor!
				: this.colors.patternText;

		this.setTextAlign('center');
		this.setTextBaseline('middle');
		this.fillText(patternText, this.padding + this.cellWidth / 2, cell.y, textColor);
	}

	private drawCellEditingIndicator(cell: PatternCell, cellY: number): void {
		if (!cell.isEditing) return;

		this.save();
		const borderColor =
			cell.editingValue === '' ? this.colors.patternEnvelope : this.colors.patternEditing;
		this.strokeRect(
			this.padding + 1,
			cellY + 1,
			this.cellWidth - 2,
			this.cellHeight - 2,
			borderColor,
			2
		);

		const patternText =
			cell.editingValue === ''
				? cell.patternId.toString().padStart(2, '0')
				: cell.editingValue.padStart(2, '0');
		const textWidth = this.measureText(patternText);
		const charWidth = textWidth / 2;
		const underlineY = cell.y + this.fontSize / 2 + 2;
		const centerX = this.padding + this.cellWidth / 2;
		const underlineX = centerX - charWidth;

		const underlineColor =
			cell.editingValue === '' ? this.colors.patternEnvelope : this.colors.patternEditing;
		this.beginPath();
		this.moveTo(underlineX, underlineY);
		this.lineTo(underlineX + charWidth * 2, underlineY);
		this.stroke(underlineColor, 1);
		this.restore();
		this.setTextAlign('center');
		this.setTextBaseline('middle');
	}

	private drawCellSelectionIndicator(cell: PatternCell): void {
		if (!cell.isSelected) return;

		this.save();
		this.setTextAlign('left');
		this.setTextBaseline('middle');
		this.fillText('►', 2, cell.y, this.colors.patternEnvelope);
		this.restore();
		this.setTextAlign('center');
		this.setTextBaseline('middle');
	}

	drawScrollIndicators(hasMoreAbove: boolean, hasMoreBelow: boolean): void {
		if (hasMoreAbove) {
			this.drawTopFade();
		}

		if (hasMoreBelow) {
			this.drawBottomFade();
		}

		this.drawScrollArrows(hasMoreAbove, hasMoreBelow);
	}

	private drawTopFade(): void {
		const topGradient = this.createLinearGradient(0, 0, 0, this.fadeHeight);
		topGradient.addColorStop(0, this.colors.patternBg);
		topGradient.addColorStop(1, 'rgba(0,0,0,0)');
		this.ctx.fillStyle = topGradient;
		this.fillRect(0, 0, this.canvasWidth, this.fadeHeight);
	}

	private drawBottomFade(): void {
		const bottomGradient = this.createLinearGradient(
			0,
			this.canvasHeight - this.fadeHeight,
			0,
			this.canvasHeight
		);
		bottomGradient.addColorStop(0, 'rgba(0,0,0,0)');
		bottomGradient.addColorStop(1, this.colors.patternBg);
		this.ctx.fillStyle = bottomGradient;
		this.fillRect(0, this.canvasHeight - this.fadeHeight, this.canvasWidth, this.fadeHeight);
	}

	private drawScrollArrows(hasMoreAbove: boolean, hasMoreBelow: boolean): void {
		this.save();
		this.setFont(`${this.fontSize}px ${this.fonts.mono}`);
		this.setTextAlign('center');

		if (hasMoreAbove) {
			this.setTextBaseline('top');
			this.fillText('▲', this.canvasWidth / 2, 2, this.colors.patternEnvelope);
		}
		if (hasMoreBelow) {
			this.setTextBaseline('bottom');
			this.fillText(
				'▼',
				this.canvasWidth / 2,
				this.canvasHeight - 2,
				this.colors.patternEnvelope
			);
		}
		this.restore();
	}
}

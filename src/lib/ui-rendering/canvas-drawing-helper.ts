import type { getColors } from '../utils/colors';

export interface DrawingContext {
	ctx: CanvasRenderingContext2D;
	colors: ReturnType<typeof getColors>;
}

export class CanvasDrawingHelper {
	protected ctx: CanvasRenderingContext2D;
	protected colors: ReturnType<typeof getColors>;

	constructor(context: DrawingContext) {
		this.ctx = context.ctx;
		this.colors = context.colors;
	}

	protected fillRect(x: number, y: number, width: number, height: number, color?: string): void {
		if (color) {
			this.ctx.fillStyle = color;
		}
		this.ctx.fillRect(x, y, width, height);
	}

	protected strokeRect(
		x: number,
		y: number,
		width: number,
		height: number,
		color?: string,
		lineWidth: number = 1
	): void {
		if (color) {
			this.ctx.strokeStyle = color;
		}
		this.ctx.lineWidth = lineWidth;
		this.ctx.strokeRect(x, y, width, height);
	}

	protected fillText(text: string, x: number, y: number, color?: string): void {
		if (color) {
			this.ctx.fillStyle = color;
		}
		this.ctx.fillText(text, x, y);
	}

	protected measureText(text: string): number {
		return this.ctx.measureText(text).width;
	}

	protected save(): void {
		this.ctx.save();
	}

	protected restore(): void {
		this.ctx.restore();
	}

	protected setTextAlign(align: CanvasTextAlign): void {
		this.ctx.textAlign = align;
	}

	protected setTextBaseline(baseline: CanvasTextBaseline): void {
		this.ctx.textBaseline = baseline;
	}

	protected setFont(font: string): void {
		this.ctx.font = font;
	}

	protected createLinearGradient(x0: number, y0: number, x1: number, y1: number): CanvasGradient {
		return this.ctx.createLinearGradient(x0, y0, x1, y1);
	}

	protected beginPath(): void {
		this.ctx.beginPath();
	}

	protected moveTo(x: number, y: number): void {
		this.ctx.moveTo(x, y);
	}

	protected lineTo(x: number, y: number): void {
		this.ctx.lineTo(x, y);
	}

	protected stroke(color?: string, lineWidth?: number): void {
		if (color) {
			this.ctx.strokeStyle = color;
		}
		if (lineWidth !== undefined) {
			this.ctx.lineWidth = lineWidth;
		}
		this.ctx.stroke();
	}

	protected fillRectWithAlpha(
		x: number,
		y: number,
		width: number,
		height: number,
		color: string,
		alpha: number
	): void {
		this.save();
		this.ctx.globalAlpha = alpha;
		this.fillRect(x, y, width, height, color);
		this.restore();
	}

	protected strokeRectPixelPerfect(
		x: number,
		y: number,
		width: number,
		height: number,
		color?: string,
		lineWidth: number = 1
	): void {
		this.strokeRect(x + 0.5, y + 0.5, width - 1, height - 1, color, lineWidth);
	}
}

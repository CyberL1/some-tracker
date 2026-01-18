import type { getColors } from '../utils/colors';
import type { getPatternOrderColors } from '../utils/pattern-order-colors';
import { CanvasDrawingHelper, type DrawingContext } from './canvas-drawing-helper';

export interface BaseRenderOptions {
	ctx: CanvasRenderingContext2D;
	colors: ReturnType<typeof getColors> | ReturnType<typeof getPatternOrderColors>;
	canvasWidth: number;
}

export abstract class BaseCanvasRenderer extends CanvasDrawingHelper {
	protected canvasWidth: number;

	constructor(options: BaseRenderOptions) {
		super({ ctx: options.ctx, colors: options.colors });
		this.canvasWidth = options.canvasWidth;
	}

	drawBackground(canvasHeight: number): void {
		const bgColor = 'patternBg' in this.colors ? this.colors.patternBg : 'orderBg' in this.colors ? this.colors.orderBg : '#1e1e2e';
		this.fillRect(0, 0, this.canvasWidth, canvasHeight, bgColor);
	}
}

import type { getColors } from '../utils/colors';
import { CanvasDrawingHelper, type DrawingContext } from './canvas-drawing-helper';

export interface BaseRenderOptions {
	ctx: CanvasRenderingContext2D;
	colors: ReturnType<typeof getColors>;
	canvasWidth: number;
}

export abstract class BaseCanvasRenderer extends CanvasDrawingHelper {
	protected canvasWidth: number;

	constructor(options: BaseRenderOptions) {
		super({ ctx: options.ctx, colors: options.colors });
		this.canvasWidth = options.canvasWidth;
	}

	drawBackground(canvasHeight: number): void {
		this.fillRect(0, 0, this.canvasWidth, canvasHeight, this.colors.patternBg);
	}
}

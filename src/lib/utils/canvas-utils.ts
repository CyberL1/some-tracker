export interface CanvasSetupOptions {
	canvas: HTMLCanvasElement;
	ctx: CanvasRenderingContext2D;
	width: number;
	height: number;
	fontSize: number;
	fonts: ReturnType<typeof import('./fonts').getFonts>;
	textAlign?: CanvasTextAlign;
	textBaseline?: CanvasTextBaseline;
}

export function setupCanvas(options: CanvasSetupOptions): void {
	const {
		canvas,
		ctx,
		width,
		height,
		fontSize,
		fonts,
		textAlign = 'left',
		textBaseline = 'middle'
	} = options;

	const dpr = window.devicePixelRatio || 1;
	canvas.width = width * dpr;
	canvas.height = height * dpr;
	canvas.style.width = `${width}px`;
	canvas.style.height = `${height}px`;

	ctx.scale(dpr, dpr);
	ctx.font = `${fontSize}px ${fonts.mono}`;
	ctx.textAlign = textAlign;
	ctx.textBaseline = textBaseline;
	
	canvas.style.fontFeatureSettings = "'liga' 0, 'calt' 0";
	canvas.style.fontVariantLigatures = 'none';
}

<script lang="ts">
	import type { Pattern } from '../../models/song';
	import { getColors } from '../../utils/colors';
	import { getFonts } from '../../utils/fonts';
	import { PatternService } from '../../services/patternService';

	interface Props {
		currentPatternOrderIndex: number;
		patterns: Record<number, Pattern>;
		selectedRow: number;
		patternOrder: number[];
		canvasHeight?: number;
		lineHeight?: number;
	}

	let {
		currentPatternOrderIndex = $bindable(),
		patterns = $bindable(),
		selectedRow = $bindable(),
		patternOrder = $bindable(),
		canvasHeight = 600
	}: Props = $props();

	const FONT_SIZE = 14;
	const CELL_WIDTH = 32;
	const CELL_HEIGHT = 28;
	const PADDING = 12;
	const FADE_HEIGHT = 30;
	const BUTTON_SIZE = 13;
	const BUTTON_SPACING = 1;

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;
	const canvasWidth = CELL_WIDTH + PADDING * 2 + BUTTON_SIZE * 2 + BUTTON_SPACING * 3;

	let COLORS = getColors();
	let FONTS = getFonts();

	$effect(() => {
		if (!canvas) return;

		ctx = canvas.getContext('2d')!;
		setupCanvas();
		draw();
	});

	$effect(() => {
		if (ctx) draw();
	});

	function setupCanvas(): void {
		const dpr = window.devicePixelRatio || 1;
		canvas.width = canvasWidth * dpr;
		canvas.height = canvasHeight * dpr;
		canvas.style.width = `${canvasWidth}px`;
		canvas.style.height = `${canvasHeight}px`;

		ctx.scale(dpr, dpr);
		ctx.font = `${FONT_SIZE}px ${FONTS.mono}`;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
	}

	function getVisibleRange() {
		const visibleCount = Math.floor(canvasHeight / CELL_HEIGHT);
		const halfVisible = Math.floor(visibleCount / 2);
		const startIndex = Math.max(0, currentPatternOrderIndex - halfVisible);

		const idealEndIndex = currentPatternOrderIndex + halfVisible;
		const endIndex = Math.min(patternOrder.length - 1, idealEndIndex);

		return { startIndex, endIndex };
	}

	function draw(): void {
		if (!ctx) return;

		const centerY = canvasHeight / 2;

		ctx.fillStyle = COLORS.patternBg;
		ctx.fillRect(0, 0, canvasWidth, canvasHeight);

		const { startIndex, endIndex } = getVisibleRange();

		for (let i = startIndex; i <= endIndex; i++) {
			if (i < 0 || i >= patternOrder.length) continue;

			const pattern = patterns[patternOrder[i]];
			if (!pattern) continue;

			const y = centerY - (currentPatternOrderIndex - i) * CELL_HEIGHT;

			if (y < -CELL_HEIGHT || y > canvasHeight + CELL_HEIGHT) continue;

			const isSelected = i === currentPatternOrderIndex;
			const isHovered = hoveredIndex === i;

			drawPatternCell(pattern, y, isSelected, i);

			// Draw buttons only for hovered patterns
			if (isHovered) {
				drawPatternButtons(y, i);
			}
		}

		drawScrollIndicators(startIndex, endIndex);
	}

	function drawPatternCell(
		pattern: Pattern,
		y: number,
		isSelected: boolean,
		index: number
	): void {
		const cellY = y - CELL_HEIGHT / 2;
		const isHovered = hoveredIndex === index;
		const isEditing = editingPatternIndex === index;

		if (isSelected) {
			ctx.fillStyle = COLORS.patternNoise;
			ctx.fillRect(PADDING, cellY, CELL_WIDTH, CELL_HEIGHT);

			ctx.strokeStyle = COLORS.patternInstrument;
			ctx.lineWidth = 1;
			ctx.strokeRect(PADDING + 0.5, cellY + 0.5, CELL_WIDTH - 1, CELL_HEIGHT - 1);
		} else if (isHovered) {
			ctx.fillStyle = COLORS.patternHeader;
			ctx.fillRect(PADDING, cellY, CELL_WIDTH, CELL_HEIGHT);

			ctx.strokeStyle = COLORS.patternInstrument;
			ctx.lineWidth = 1;
			ctx.strokeRect(PADDING + 0.5, cellY + 0.5, CELL_WIDTH - 1, CELL_HEIGHT - 1);
		} else {
			ctx.fillStyle = index % 2 === 0 ? COLORS.patternBg : COLORS.patternAlternate;
			ctx.fillRect(PADDING, cellY, CELL_WIDTH, CELL_HEIGHT);

			ctx.strokeStyle = COLORS.patternEmpty;
			ctx.lineWidth = 1;
			ctx.strokeRect(PADDING + 0.5, cellY + 0.5, CELL_WIDTH - 1, CELL_HEIGHT - 1);
		}

		let patternText: string;
		if (isEditing) {
			if (editingPatternValue === '') {
				patternText = pattern.id.toString().padStart(2, '0');
			} else {
				patternText = editingPatternValue.padStart(2, '0');
			}
		} else {
			patternText = pattern.id.toString().padStart(2, '0');
		}

		ctx.fillStyle = isEditing ? COLORS.patternEnvelope : COLORS.patternText;
		ctx.fillText(patternText, PADDING + CELL_WIDTH / 2, y);

		if (isEditing) {
			const digitPosition = editingPatternValue.length;
			const textWidth = ctx.measureText(patternText).width;
			const charWidth = textWidth / 2;
			const underlineY = y + FONT_SIZE / 2 + 2;
			const centerX = PADDING + CELL_WIDTH / 2;
			const underlineX = centerX - textWidth / 2 + digitPosition * charWidth;

			ctx.strokeStyle = COLORS.patternEnvelope;
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.moveTo(underlineX, underlineY);
			ctx.lineTo(underlineX + charWidth, underlineY);
			ctx.stroke();
		}

		if (isSelected) {
			ctx.save();
			ctx.fillStyle = COLORS.patternEnvelope;
			ctx.textAlign = 'left';
			ctx.fillText('►', 2, y);
			ctx.restore();
		}
	}

	function drawButton(
		x: number,
		y: number,
		text: string,
		isHovered: boolean,
		isEnabled: boolean = true
	): void {
		ctx.fillStyle = isHovered ? COLORS.patternHeader : COLORS.patternBg;
		ctx.fillRect(x, y, BUTTON_SIZE, BUTTON_SIZE);

		ctx.strokeStyle = isHovered
			? COLORS.patternText
			: isEnabled
				? COLORS.patternEmpty
				: COLORS.patternEmpty;
		ctx.lineWidth = isHovered ? 1.5 : 1;
		ctx.strokeRect(x + 0.5, y + 0.5, BUTTON_SIZE - 1, BUTTON_SIZE - 1);

		ctx.fillStyle = isHovered
			? COLORS.patternText
			: isEnabled
				? COLORS.patternText
				: COLORS.patternEmpty;
		ctx.fillText(text, x + BUTTON_SIZE / 2, y + BUTTON_SIZE / 2);
	}

	function drawPatternButtons(y: number, index: number): void {
		const buttonStartX = PADDING + CELL_WIDTH + BUTTON_SPACING;
		const buttonCenterY = y;

		ctx.save();
		ctx.font = `${BUTTON_SIZE - 3}px ${FONTS.mono}`;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';

		const gridHeight = BUTTON_SIZE * 2 + BUTTON_SPACING;
		const topRowY = buttonCenterY - gridHeight / 2;
		const bottomRowY = topRowY + BUTTON_SIZE + BUTTON_SPACING;
		const leftColX = buttonStartX;
		const rightColX = buttonStartX + BUTTON_SIZE + BUTTON_SPACING;

		const canRemove = patternOrder.length > 1;

		// Draw remove button
		drawButton(leftColX, topRowY, '-', hoveredButton === 'remove', canRemove);

		// Draw up button
		drawButton(rightColX, topRowY, 'U', hoveredButton === 'up');

		// Draw add button
		drawButton(leftColX, bottomRowY, '+', hoveredButton === 'add');

		// Draw clone button
		drawButton(rightColX, bottomRowY, 'C', hoveredButton === 'clone');

		ctx.restore();
	}

	function drawScrollIndicators(startIndex: number, endIndex: number): void {
		const hasMoreAbove = startIndex > 0;
		const visibleCount = Math.floor(canvasHeight / CELL_HEIGHT);
		const halfVisible = Math.floor(visibleCount / 2);
		const maxVisibleEndIndex = currentPatternOrderIndex + halfVisible;
		const hasMoreBelow = maxVisibleEndIndex < patternOrder.length - 1;

		if (hasMoreAbove) {
			const topGradient = ctx.createLinearGradient(0, 0, 0, FADE_HEIGHT);
			topGradient.addColorStop(0, COLORS.patternBg);
			topGradient.addColorStop(1, 'rgba(0,0,0,0)');
			ctx.fillStyle = topGradient;
			ctx.fillRect(0, 0, canvasWidth, FADE_HEIGHT);
		}

		if (hasMoreBelow) {
			const bottomGradient = ctx.createLinearGradient(
				0,
				canvasHeight - FADE_HEIGHT,
				0,
				canvasHeight
			);
			bottomGradient.addColorStop(0, 'rgba(0,0,0,0)');
			bottomGradient.addColorStop(1, COLORS.patternBg);
			ctx.fillStyle = bottomGradient;
			ctx.fillRect(0, canvasHeight - FADE_HEIGHT, canvasWidth, FADE_HEIGHT);
		}

		ctx.save();
		ctx.fillStyle = COLORS.patternEnvelope;
		ctx.textAlign = 'center';
		ctx.font = `${FONT_SIZE}px ${FONTS.mono}`;

		if (hasMoreAbove) {
			ctx.textBaseline = 'top';
			ctx.fillText('▲', canvasWidth / 2, 2);
		}
		if (hasMoreBelow) {
			ctx.textBaseline = 'bottom';
			ctx.fillText('▼', canvasWidth / 2, canvasHeight - 2);
		}
		ctx.restore();
	}

	let editingPatternIndex: number | null = null;
	let editingPatternValue: string = '';

	function handleClick(event: MouseEvent): void {
		const rect = canvas.getBoundingClientRect();
		const x = event.clientX - rect.left;
		const y = event.clientY - rect.top;
		const centerY = canvasHeight / 2;

		const clickedIndex = Math.round(currentPatternOrderIndex + (y - centerY) / CELL_HEIGHT);

		if (clickedIndex >= 0 && clickedIndex < patternOrder.length) {
			const isTargetPattern = clickedIndex === hoveredIndex;

			if (isTargetPattern && x > PADDING + CELL_WIDTH) {
				finishPatternEdit();

				const buttonStartX = PADDING + CELL_WIDTH + BUTTON_SPACING;
				const buttonCenterY =
					centerY - (currentPatternOrderIndex - clickedIndex) * CELL_HEIGHT;

				const gridHeight = BUTTON_SIZE * 2 + BUTTON_SPACING;
				const topRowY = buttonCenterY - gridHeight / 2;
				const bottomRowY = topRowY + BUTTON_SIZE + BUTTON_SPACING;
				const leftColX = buttonStartX;
				const rightColX = buttonStartX + BUTTON_SIZE + BUTTON_SPACING;

				if (y >= topRowY && y <= topRowY + BUTTON_SIZE) {
					if (x >= leftColX && x <= leftColX + BUTTON_SIZE) {
						if (patternOrder.length > 1) {
							removePatternAtIndex(clickedIndex);
						}
					} else if (x >= rightColX && x <= rightColX + BUTTON_SIZE) {
						makePatternUniqueAtIndex(clickedIndex);
					}
				} else if (y >= bottomRowY && y <= bottomRowY + BUTTON_SIZE) {
					if (x >= leftColX && x <= leftColX + BUTTON_SIZE) {
						addPatternAtIndex(clickedIndex);
					} else if (x >= rightColX && x <= rightColX + BUTTON_SIZE) {
						clonePatternAtIndex(clickedIndex);
					}
				}
			} else if (x <= PADDING + CELL_WIDTH) {
				if (x >= PADDING && x <= PADDING + CELL_WIDTH) {
					if (editingPatternIndex === clickedIndex) {
						// Already editing this pattern, do nothing
						return;
					} else {
						finishPatternEdit();
						switchPattern(clickedIndex);
						editingPatternIndex = clickedIndex;
						editingPatternValue = '';
						draw();
					}
				} else {
					finishPatternEdit();
					switchPattern(clickedIndex);
				}
			}
		} else {
			finishPatternEdit();
		}
	}

	function handleWheel(event: WheelEvent): void {
		event.preventDefault();
		const newIndex = currentPatternOrderIndex + Math.sign(event.deltaY);

		if (newIndex >= 0 && newIndex < patternOrder.length) {
			switchPattern(newIndex);
		}
	}

	function handleKeyDown(event: KeyboardEvent): void {
		const { key } = event;

		if (editingPatternIndex !== null) {
			if (key === 'Enter') {
				finishPatternEdit();
			} else if (key === 'Escape') {
				editingPatternIndex = null;
				editingPatternValue = '';
				draw();
			} else if (key >= '0' && key <= '9') {
				if (editingPatternValue.length < 2) {
					editingPatternValue += key;
					if (editingPatternValue.length === 2) {
						finishPatternEdit();
					} else {
						draw();
					}
				}
			} else if (key === 'Backspace') {
				editingPatternValue = editingPatternValue.slice(0, -1);
				draw();
			}
			return;
		}

		if (key === 'ArrowUp' && currentPatternOrderIndex > 0) {
			event.preventDefault();
			switchPattern(currentPatternOrderIndex - 1);
		} else if (key === 'ArrowDown' && currentPatternOrderIndex < patternOrder.length - 1) {
			event.preventDefault();
			switchPattern(currentPatternOrderIndex + 1);
		}
	}

	function finishPatternEdit(): void {
		if (editingPatternIndex === null) return;

		if (editingPatternValue !== '') {
			const displayedValue = editingPatternValue.padStart(2, '0');
			const newId = parseInt(displayedValue);
			const currentPatternId = patternOrder[editingPatternIndex];
			const currentPattern = patterns[currentPatternId];

			if (newId >= 0 && newId <= 99 && currentPattern) {
				if (!patterns[newId]) {
					const newPattern = PatternService.clonePattern(currentPattern, newId);
					patterns = { ...patterns, [newId]: newPattern };
				}

				patternOrder = patternOrder.map((id, index) =>
					index === editingPatternIndex ? newId : id
				);
			}
		}

		editingPatternIndex = null;
		editingPatternValue = '';
		draw();
	}

	let lastMouseY: number | null = null;
	let lastMouseX: number | null = null;
	let hoveredIndex: number | null = null;
	let hoveredButton: 'remove' | 'up' | 'add' | 'clone' | null = null;
	let previousHoveredButton: 'remove' | 'up' | 'add' | 'clone' | null = null;

	function detectButtonHover(
		mouseX: number,
		mouseY: number,
		buttonStartX: number,
		buttonCenterY: number
	): 'remove' | 'up' | 'add' | 'clone' | null {
		if (mouseX <= PADDING + CELL_WIDTH) return null;

		const gridHeight = BUTTON_SIZE * 2 + BUTTON_SPACING;
		const topRowY = buttonCenterY - gridHeight / 2;
		const bottomRowY = topRowY + BUTTON_SIZE + BUTTON_SPACING;
		const leftColX = buttonStartX;
		const rightColX = buttonStartX + BUTTON_SIZE + BUTTON_SPACING;

		if (mouseY >= topRowY && mouseY <= topRowY + BUTTON_SIZE) {
			if (mouseX >= leftColX && mouseX <= leftColX + BUTTON_SIZE) {
				return patternOrder.length > 1 ? 'remove' : null;
			}
			if (mouseX >= rightColX && mouseX <= rightColX + BUTTON_SIZE) {
				return 'up';
			}
			return null;
		}

		if (mouseY >= bottomRowY && mouseY <= bottomRowY + BUTTON_SIZE) {
			if (mouseX >= leftColX && mouseX <= leftColX + BUTTON_SIZE) {
				return 'add';
			}
			if (mouseX >= rightColX && mouseX <= rightColX + BUTTON_SIZE) {
				return 'clone';
			}
			return null;
		}

		return null;
	}

	function updateCursor(mouseY?: number, mouseX?: number): void {
		if (!canvas || mouseY === undefined) return;

		const centerY = canvasHeight / 2;
		const newHoveredIndex = Math.round(
			currentPatternOrderIndex + (mouseY - centerY) / CELL_HEIGHT
		);

		const { startIndex, endIndex } = getVisibleRange();
		const isOverPattern =
			newHoveredIndex >= 0 &&
			newHoveredIndex < patternOrder.length &&
			newHoveredIndex >= startIndex &&
			newHoveredIndex <= endIndex;

		const previousHoveredIndex = hoveredIndex;
		hoveredIndex = isOverPattern ? newHoveredIndex : null;

		if (isOverPattern && mouseX !== undefined) {
			const buttonStartX = PADDING + CELL_WIDTH + BUTTON_SPACING;
			const buttonCenterY =
				centerY - (currentPatternOrderIndex - newHoveredIndex) * CELL_HEIGHT;
			hoveredButton = detectButtonHover(mouseX, mouseY, buttonStartX, buttonCenterY);
		} else {
			hoveredButton = null;
		}

		if (previousHoveredIndex !== hoveredIndex || previousHoveredButton !== hoveredButton) {
			previousHoveredButton = hoveredButton;
			draw();
		}
	}

	function switchPattern(index: number): void {
		currentPatternOrderIndex = index;
		selectedRow = 0;

		if (lastMouseY !== null) {
			updateCursor(lastMouseY);
		}
	}

	function handleMouseMove(event: MouseEvent): void {
		const rect = canvas.getBoundingClientRect();
		const y = event.clientY - rect.top;
		const x = event.clientX - rect.left;
		lastMouseY = y;
		lastMouseX = x;
		updateCursor(y, x);
	}

	function handleMouseLeave(): void {
		const previousHoveredIndex = hoveredIndex;
		const previousHoveredButton = hoveredButton;
		hoveredIndex = null;
		hoveredButton = null;
		lastMouseY = null;
		lastMouseX = null;
		canvas.style.cursor = 'default';

		if (previousHoveredIndex !== null || previousHoveredButton !== null) {
			draw();
		}
	}

	function addPatternAtIndex(index: number): void {
		const result = PatternService.addPatternAfter(patterns, patternOrder, index);

		patterns = result.newPatterns;
		patternOrder = result.newPatternOrder;
		currentPatternOrderIndex = result.insertIndex;
		selectedRow = 0;

		if (lastMouseY !== null && lastMouseX !== null) {
			updateCursor(lastMouseY, lastMouseX);
		}
	}

	function removePatternAtIndex(index: number): void {
		const result = PatternService.removePatternAt(patternOrder, index);

		patternOrder = result.newPatternOrder;

		currentPatternOrderIndex = PatternService.calculateAdjustedIndex(
			currentPatternOrderIndex,
			index,
			result.newPatternOrder.length
		);
		selectedRow = 0;

		if (lastMouseY !== null && lastMouseX !== null) {
			updateCursor(lastMouseY, lastMouseX);
		}
	}

	function clonePatternAtIndex(index: number): void {
		const result = PatternService.clonePatternAfter(patterns, patternOrder, index);

		if (!result) return;

		patterns = result.newPatterns;
		patternOrder = result.newPatternOrder;
		currentPatternOrderIndex = result.insertIndex;
		selectedRow = 0;

		if (lastMouseY !== null && lastMouseX !== null) {
			updateCursor(lastMouseY, lastMouseX);
		}
	}

	function makePatternUniqueAtIndex(index: number): void {
		const result = PatternService.makePatternUnique(patterns, patternOrder, index);

		if (!result) return;

		patterns = result.newPatterns;
		patternOrder = result.newPatternOrder;

		if (index === currentPatternOrderIndex) {
			selectedRow = 0;
		}

		if (lastMouseY !== null && lastMouseX !== null) {
			updateCursor(lastMouseY, lastMouseX);
		}
	}
</script>

<canvas
	bind:this={canvas}
	tabindex="0"
	onclick={handleClick}
	onwheel={handleWheel}
	onkeydown={handleKeyDown}
	onmousemove={handleMouseMove}
	onmouseleave={handleMouseLeave}
	class="block border border-[var(--pattern-empty)] bg-[var(--pattern-bg)] focus:ring-1 focus:ring-[var(--pattern-header)]/50 focus:outline-none"
	style="width: {canvasWidth}px; height: {canvasHeight}px;"></canvas>

<script lang="ts">
	import type { Pattern } from '../../models/song';
	import { getColors } from '../../utils/colors';
	import { getFonts } from '../../utils/fonts';
	import { setupCanvas as setupCanvasUtil } from '../../utils/canvas-utils';
	import { PatternService } from '../../services/patternService';
	import IconCarbonUnlink from '~icons/carbon/unlink';
	import IconCarbonCopy from '~icons/carbon/copy';
	import IconCarbonSubtract from '~icons/carbon/subtract';
	import IconCarbonAdd from '~icons/carbon/add';
	import PatternOrderButton from './PatternOrderButton.svelte';

	interface Props {
		currentPatternOrderIndex: number;
		patterns: Record<number, Pattern>;
		selectedRow: number;
		patternOrder: number[];
		canvasHeight?: number;
		lineHeight?: number;
		songPatterns?: Pattern[];
		onPatternCreated?: (pattern: Pattern) => void;
	}

	let {
		currentPatternOrderIndex = $bindable(),
		patterns = $bindable(),
		selectedRow = $bindable(),
		patternOrder = $bindable(),
		canvasHeight = 600,
		songPatterns = [],
		onPatternCreated
	}: Props = $props();

	const FONT_SIZE = 14;
	const CELL_WIDTH = 32;
	const CELL_HEIGHT = 28;
	const PADDING = 12;
	const FADE_HEIGHT = 30;
	const BUTTON_SIZE = 22;
	const BUTTON_SPACING = 2;
	const BUTTON_COLUMN_WIDTH = BUTTON_SIZE;

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;
	const canvasWidth = CELL_WIDTH + PADDING * 2 + BUTTON_COLUMN_WIDTH + BUTTON_SPACING;

	let COLORS = getColors();
	let FONTS = getFonts();

	let lastDrawnOrderIndex = -1;
	let lastPatternOrderLength = -1;
	let lastHoveredIndex: number | null = null;
	let lastCanvasHeight = -1;
	let needsSetup = true;

	$effect(() => {
		if (!canvas) return;

		if (needsSetup || !ctx) {
			ctx = canvas.getContext('2d')!;
			setupCanvas();
			needsSetup = false;
			lastDrawnOrderIndex = currentPatternOrderIndex;
			lastPatternOrderLength = patternOrder.length;
			lastCanvasHeight = canvasHeight;
			draw();
			return;
		}

		const sizeChanged = canvasHeight !== lastCanvasHeight;
		const orderChanged =
			currentPatternOrderIndex !== lastDrawnOrderIndex ||
			patternOrder.length !== lastPatternOrderLength ||
			sizeChanged;

		if (sizeChanged) {
			setupCanvas();
		}

		if (orderChanged) {
			lastDrawnOrderIndex = currentPatternOrderIndex;
			lastPatternOrderLength = patternOrder.length;
			lastCanvasHeight = canvasHeight;
			draw();
			lastHoveredIndex = hoveredIndex;
		} else if (hoveredIndex !== lastHoveredIndex) {
			draw();
			lastHoveredIndex = hoveredIndex;
		}
	});

	function setupCanvas(): void {
		setupCanvasUtil({
			canvas,
			ctx,
			width: canvasWidth,
			height: canvasHeight,
			fontSize: FONT_SIZE,
			fonts: FONTS,
			textAlign: 'center',
			textBaseline: 'middle'
		});
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

		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillStyle = COLORS.patternBg;
		ctx.fillRect(0, 0, canvasWidth, canvasHeight);

		const { startIndex, endIndex } = getVisibleRange();

		for (let i = startIndex; i <= endIndex; i++) {
			if (i < 0 || i >= patternOrder.length) continue;

			const patternId = patternOrder[i];
			let pattern = patterns[patternId];
			if (!pattern) {
				const foundPattern = songPatterns.find((p) => p.id === patternId);
				if (foundPattern) {
					pattern = foundPattern;
				}
			}

			const y = centerY - (currentPatternOrderIndex - i) * CELL_HEIGHT;

			if (y < -CELL_HEIGHT || y > canvasHeight + CELL_HEIGHT) continue;

			const isSelected = i === currentPatternOrderIndex;
			const isHovered = hoveredIndex === i;

			drawPatternCell(pattern, patternId, y, isSelected, i);
		}

		drawScrollIndicators(startIndex, endIndex);
	}

	function drawPatternCell(
		pattern: Pattern | undefined,
		patternId: number,
		y: number,
		isSelected: boolean,
		index: number
	): void {
		const cellY = y - CELL_HEIGHT / 2;
		const isHovered = hoveredIndex === index;
		const isEditing = editingPatternIndex === index;
		const isEmpty = !pattern;

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
				patternText = patternId.toString().padStart(2, '0');
			} else {
				patternText = editingPatternValue.padStart(2, '0');
			}
		} else {
			patternText = patternId.toString().padStart(2, '0');
		}

		ctx.fillStyle = isEmpty
			? COLORS.patternEmpty
			: isEditing
				? COLORS.patternEnvelope
				: COLORS.patternText;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText(patternText, PADDING + CELL_WIDTH / 2, y);

		if (isEditing) {
			ctx.save();
			ctx.strokeStyle = COLORS.patternEnvelope;
			ctx.lineWidth = 2;
			ctx.strokeRect(PADDING + 1, cellY + 1, CELL_WIDTH - 2, CELL_HEIGHT - 2);

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
			ctx.restore();
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
		}

		if (isSelected) {
			ctx.save();
			ctx.fillStyle = COLORS.patternEnvelope;
			ctx.textAlign = 'left';
			ctx.textBaseline = 'middle';
			ctx.fillText('►', 2, y);
			ctx.restore();
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
		}
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

	let editingPatternIndex: number | null = $state(null);
	let editingPatternValue: string = $state('');

	function handleClick(event: MouseEvent): void {
		const rect = canvas.getBoundingClientRect();
		const x = event.clientX - rect.left;
		const y = event.clientY - rect.top;
		const centerY = canvasHeight / 2;

		const clickedIndex = Math.round(currentPatternOrderIndex + (y - centerY) / CELL_HEIGHT);

		if (clickedIndex >= 0 && clickedIndex < patternOrder.length) {
			if (x <= PADDING + CELL_WIDTH && x >= PADDING) {
				finishPatternEdit();
				switchPattern(clickedIndex);
				editingPatternIndex = clickedIndex;
				editingPatternValue = '';
				draw();
			} else {
				finishPatternEdit();
				switchPattern(clickedIndex);
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

			if (newId >= 0 && newId <= 99) {
				if (!patterns[newId]) {
					const newPattern = currentPattern
						? PatternService.clonePattern(currentPattern, newId)
						: PatternService.createEmptyPattern(newId);
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
	let hoveredButton: 'remove' | 'up' | 'add' | 'clone' | null = $state(null);

	function updateCursor(mouseY?: number, mouseX?: number): void {
		if (!canvas || mouseY === undefined) return;

		const centerY = canvasHeight / 2;
		const { startIndex, endIndex } = getVisibleRange();

		let newHoveredIndex: number | null = null;

		const buttonAreaLeft = PADDING + CELL_WIDTH + BUTTON_SPACING;
		const buttonAreaRight = buttonAreaLeft + BUTTON_SIZE;
		const totalHeight = BUTTON_SIZE * 4 + BUTTON_SPACING * 3;
		const buttonAreaTop = centerY - totalHeight / 2;
		const buttonAreaBottom = buttonAreaTop + totalHeight;

		const isInButtonArea =
			mouseX !== undefined &&
			mouseX >= buttonAreaLeft &&
			mouseX <= buttonAreaRight &&
			mouseY >= buttonAreaTop &&
			mouseY <= buttonAreaBottom;

		if (!isInButtonArea && mouseX !== undefined && mouseX <= PADDING + CELL_WIDTH) {
			const calculatedIndex = Math.round(
				currentPatternOrderIndex + (mouseY - centerY) / CELL_HEIGHT
			);

			const isOverPattern =
				calculatedIndex >= 0 &&
				calculatedIndex < patternOrder.length &&
				calculatedIndex >= startIndex &&
				calculatedIndex <= endIndex;

			if (isOverPattern) {
				newHoveredIndex = calculatedIndex;
			}
		}

		if (hoveredIndex !== newHoveredIndex) {
			hoveredIndex = newHoveredIndex;
			draw();
		}

		canvas.style.cursor = newHoveredIndex !== null ? 'pointer' : 'default';
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
		hoveredIndex = null;
		hoveredButton = null;
		lastMouseY = null;
		lastMouseX = null;
		canvas.style.cursor = 'default';

		if (previousHoveredIndex !== null) {
			draw();
		}
	}

	function handleMouseEnter(): void {
		if (canvas) {
			canvas.focus();
		}
	}

	function addPatternAtIndex(index: number): void {
		const result = PatternService.addPatternAfter(patterns, patternOrder, index);

		patterns = result.newPatterns;
		patternOrder = result.newPatternOrder;
		currentPatternOrderIndex = result.insertIndex;
		selectedRow = 0;

		lastDrawnOrderIndex = -1;
		lastPatternOrderLength = -1;
		draw();

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

		lastDrawnOrderIndex = -1;
		lastPatternOrderLength = -1;
		draw();

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

		lastDrawnOrderIndex = -1;
		lastPatternOrderLength = -1;
		draw();

		if (lastMouseY !== null && lastMouseX !== null) {
			updateCursor(lastMouseY, lastMouseX);
		}
	}

	function makePatternUniqueAtIndex(index: number): void {
		const currentPatternId = patternOrder[index];
		let currentPattern = patterns[currentPatternId];

		if (!currentPattern) {
			const foundPattern = songPatterns.find((p) => p.id === currentPatternId);
			if (!foundPattern) {
				return;
			}
			currentPattern = foundPattern;
			patterns = { ...patterns, [currentPatternId]: currentPattern };
		} else {
			const foundPattern = songPatterns.find((p) => p.id === currentPatternId);
			if (foundPattern && foundPattern !== currentPattern) {
				currentPattern = foundPattern;
				patterns = { ...patterns, [currentPatternId]: currentPattern };
			}
		}

		const result = PatternService.makePatternUnique(patterns, patternOrder, index);

		if (!result) return;

		patterns = result.newPatterns;
		patternOrder = result.newPatternOrder;
		onPatternCreated?.(result.newPatterns[result.newPatternId]);

		if (index === currentPatternOrderIndex) {
			selectedRow = 0;
		}

		lastDrawnOrderIndex = -1;
		lastPatternOrderLength = -1;
		draw();

		if (lastMouseY !== null && lastMouseX !== null) {
			updateCursor(lastMouseY, lastMouseX);
		}
	}

	const buttonStartX = PADDING + CELL_WIDTH + BUTTON_SPACING;
	const buttonCenterY = $derived(canvasHeight / 2);
	const totalHeight = BUTTON_SIZE * 4 + BUTTON_SPACING * 3;
	const startY = $derived(buttonCenterY - totalHeight / 2);
	const canRemove = $derived(patternOrder.length > 1);
</script>

<div style="width: {canvasWidth}px; height: {canvasHeight}px;" class="relative overflow-hidden">
	<canvas
		bind:this={canvas}
		tabindex="0"
		onclick={handleClick}
		onwheel={handleWheel}
		onkeydown={handleKeyDown}
		onmousemove={handleMouseMove}
		onmouseleave={handleMouseLeave}
		onmouseenter={handleMouseEnter}
		class="focus:border-opacity-50 border-pattern-empty bg-pattern-bg focus:border-pattern-text block border transition-colors duration-150 focus:outline-none"
		style="width: {canvasWidth}px; height: {canvasHeight}px;"></canvas>

	<div
		class="pointer-events-none absolute"
		style="left: {buttonStartX}px; top: {startY}px; width: {BUTTON_SIZE}px;">
		<PatternOrderButton
			buttonType="up"
			isHovered={hoveredButton === 'up'}
			onClick={() => makePatternUniqueAtIndex(currentPatternOrderIndex)}
			onMouseEnter={() => (hoveredButton = 'up')}
			onMouseLeave={() => (hoveredButton = null)}
			title="Make Unique"
			size={BUTTON_SIZE}>
			<IconCarbonUnlink
				class="text-pattern-text"
				style="height: {BUTTON_SIZE - 6}px; width: {BUTTON_SIZE - 6}px;" />
		</PatternOrderButton>
		<PatternOrderButton
			buttonType="remove"
			isHovered={hoveredButton === 'remove'}
			onClick={() => {
				if (canRemove) removePatternAtIndex(currentPatternOrderIndex);
			}}
			onMouseEnter={() => (hoveredButton = canRemove ? 'remove' : null)}
			onMouseLeave={() => (hoveredButton = null)}
			disabled={!canRemove}
			title="Remove"
			size={BUTTON_SIZE}>
			<IconCarbonSubtract
				class="text-pattern-text"
				style="height: {BUTTON_SIZE - 6}px; width: {BUTTON_SIZE - 6}px;" />
		</PatternOrderButton>
		<PatternOrderButton
			buttonType="add"
			isHovered={hoveredButton === 'add'}
			onClick={() => addPatternAtIndex(currentPatternOrderIndex)}
			onMouseEnter={() => (hoveredButton = 'add')}
			onMouseLeave={() => (hoveredButton = null)}
			title="Add"
			size={BUTTON_SIZE}>
			<IconCarbonAdd
				class="text-pattern-text"
				style="height: {BUTTON_SIZE - 6}px; width: {BUTTON_SIZE - 6}px;" />
		</PatternOrderButton>
		<PatternOrderButton
			buttonType="clone"
			isHovered={hoveredButton === 'clone'}
			onClick={() => clonePatternAtIndex(currentPatternOrderIndex)}
			onMouseEnter={() => (hoveredButton = 'clone')}
			onMouseLeave={() => (hoveredButton = null)}
			title="Clone"
			size={BUTTON_SIZE}
			hasMargin={false}>
			<IconCarbonCopy
				class="text-pattern-text"
				style="height: {BUTTON_SIZE - 6}px; width: {BUTTON_SIZE - 6}px;" />
		</PatternOrderButton>
	</div>
</div>

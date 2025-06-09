<script lang="ts">
	import type { Pattern, Ornament, Instrument } from '../../models/song';
	import type { ChipProcessor } from '../../core/chip-processor';
	import type { AudioService } from '../../services/audio-service';
	import { getColors } from '../../utils/colors';
	import { getFonts } from '../../utils/fonts';
	import { getRowData } from '../../utils/pattern-format';
	import PatternOrder from './PatternOrder.svelte';
	import { getContext } from 'svelte';
	import { PATTERN_EDITOR_CONSTANTS } from './types';
	import { playbackStore } from '../../stores/playback.svelte';

	let {
		patterns = $bindable(),
		patternOrder = $bindable(),
		ayProcessor,
		tuningTable,
		speed,
		ornaments,
		instruments
	}: {
		patterns: Pattern[];
		patternOrder: number[];
		ayProcessor: ChipProcessor;
		tuningTable: number[];
		speed: number;
		ornaments: Ornament[];
		instruments: Instrument[];
	} = $props();

	const services: { audioService: AudioService } = getContext('container');

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;

	let COLORS = getColors();
	let FONTS = getFonts();

	let canvasWidth = $state(PATTERN_EDITOR_CONSTANTS.DEFAULT_CANVAS_WIDTH);
	let canvasHeight = $state(PATTERN_EDITOR_CONSTANTS.DEFAULT_CANVAS_HEIGHT);
	let lineHeight =
		PATTERN_EDITOR_CONSTANTS.FONT_SIZE * PATTERN_EDITOR_CONSTANTS.LINE_HEIGHT_MULTIPLIER;

	let selectedColumn = $state(0);
	let currentPatternOrderIndex = $state(0);
	let selectedRow = $state(0);

	let currentPattern = $derived(patterns[patternOrder[currentPatternOrderIndex]]);

	export function onSongChange() {
		selectedRow = 0;
		currentPatternOrderIndex = 0;
		ayProcessor.stop();
	}

	export function resetToBeginning() {
		selectedRow = 0;
		currentPatternOrderIndex = 0;
	}

	async function togglePlayback() {
		if (!ayProcessor || !ayProcessor.isAudioNodeAvailable()) {
			console.warn('Audio processor not available or not initialized');
			return;
		}

		try {
			if (!services.audioService.playing) {
				if (!currentPattern) {
					console.warn('No pattern selected');
					return;
				}

				ayProcessor.sendInitPattern(currentPattern, currentPatternOrderIndex);
				ayProcessor.sendInitTuningTable(tuningTable);
				ayProcessor.sendInitSpeed(speed);
				ayProcessor.sendInitOrnaments(ornaments);
				ayProcessor.sendInitInstruments(instruments);

				services.audioService.updateOrder(patternOrder);
				services.audioService.play();
			}
		} catch (error) {
			console.error('Error during playback toggle:', error);
			services.audioService.stop();
		}
	}

	function pausePlayback() {
		services.audioService.stop();
	}

	function getCellPositions(
		rowData: string
	): { x: number; width: number; char: string; partIndex: number; charIndex: number }[] {
		const parts = rowData.split(' ');
		const positions: {
			x: number;
			width: number;
			char: string;
			partIndex: number;
			charIndex: number;
		}[] = [];
		let x = 10;

		for (let partIndex = 0; partIndex < parts.length; partIndex++) {
			const part = parts[partIndex];
			if (!part) continue;

			// Skip row number (partIndex 0) - it's not selectable
			if (partIndex === 0) {
				x += ctx.measureText(part).width;
				if (partIndex < parts.length - 1) {
					x += ctx.measureText(' ').width;
				}
				continue;
			}

			// Check if this is a note column (partIndex 4, 7, 10 for channels 1, 2, 3)
			const isNoteColumn = partIndex >= 4 && (partIndex - 4) % 3 === 0;

			if (isNoteColumn) {
				// Treat entire note as a single cell
				const width = ctx.measureText(part).width;
				positions.push({ x, width, char: part, partIndex, charIndex: 0 });
				x += width;
			} else {
				// Add each character as a separate cell
				for (let charIndex = 0; charIndex < part.length; charIndex++) {
					const char = part[charIndex];
					const width = ctx.measureText(char).width;
					positions.push({ x, width, char, partIndex, charIndex });
					x += width;
				}
			}

			if (partIndex < parts.length - 1) {
				x += ctx.measureText(' ').width;
			}
		}

		return positions;
	}

	function getTotalCellCount(rowData: string): number {
		const parts = rowData.split(' ');
		let count = 0;

		for (let partIndex = 0; partIndex < parts.length; partIndex++) {
			const part = parts[partIndex];
			if (!part) continue;

			// Skip row number (partIndex 0) - it's not selectable
			if (partIndex === 0) {
				continue;
			}

			// Check if this is a note column (partIndex 4, 7, 10 for channels 1, 2, 3)
			const isNoteColumn = partIndex >= 4 && (partIndex - 4) % 3 === 0;

			if (isNoteColumn) {
				// Note column counts as 1 cell
				count += 1;
			} else {
				// Other columns: each character is a cell
				count += part.length;
			}
		}

		return count;
	}

	function getVisibleRows() {
		const visibleCount = Math.floor(canvasHeight / lineHeight);
		const halfVisible = Math.floor(visibleCount / 2);
		const startRow = selectedRow - halfVisible;
		const endRow = selectedRow + halfVisible;

		const rows = [];
		let displayIndex = 0;

		for (let i = startRow; i <= endRow; i++) {
			let rowAdded = false;

			if (i >= 0 && i < currentPattern.length) {
				rows.push({
					rowIndex: i,
					isSelected: i === selectedRow,
					isGhost: false,
					patternIndex: patternOrder[currentPatternOrderIndex],
					displayIndex
				});
				rowAdded = true;
			} else if (i < 0) {
				const prevPatternOrderIndex = currentPatternOrderIndex - 1;
				if (prevPatternOrderIndex >= 0) {
					const prevPatternIndex = patternOrder[prevPatternOrderIndex];
					const prevPattern = patterns[prevPatternIndex];
					if (prevPattern) {
						const ghostRowIndex = prevPattern.length + i;
						if (ghostRowIndex >= 0 && ghostRowIndex < prevPattern.length) {
							rows.push({
								rowIndex: ghostRowIndex,
								isSelected: false,
								isGhost: true,
								patternIndex: prevPatternIndex,
								displayIndex
							});
							rowAdded = true;
						}
					}
				}
			} else {
				const nextPatternOrderIndex = currentPatternOrderIndex + 1;
				if (nextPatternOrderIndex < patternOrder.length) {
					const nextPatternIndex = patternOrder[nextPatternOrderIndex];
					const nextPattern = patterns[nextPatternIndex];
					if (nextPattern) {
						const ghostRowIndex = i - currentPattern.length;
						if (ghostRowIndex < nextPattern.length) {
							rows.push({
								rowIndex: ghostRowIndex,
								isSelected: false,
								isGhost: true,
								patternIndex: nextPatternIndex,
								displayIndex
							});
							rowAdded = true;
						}
					}
				}
			}

			if (!rowAdded) {
				rows.push({
					rowIndex: -1,
					isSelected: false,
					isGhost: false,
					patternIndex: -1,
					displayIndex,
					isEmpty: true
				});
			}

			displayIndex++;
		}
		return rows;
	}

	function setupCanvas() {
		if (!canvas) return;

		ctx = canvas.getContext('2d')!;

		try {
			updateSize();

			const dpr = window.devicePixelRatio || 1;
			canvas.width = canvasWidth * dpr;
			canvas.height = canvasHeight * dpr;
			canvas.style.width = canvasWidth + 'px';
			canvas.style.height = canvasHeight + 'px';

			ctx.scale(dpr, dpr);
			ctx.font = `${PATTERN_EDITOR_CONSTANTS.FONT_SIZE}px ${FONTS.mono}`;
			ctx.textBaseline = 'middle';
		} catch (error) {
			console.error('Error during canvas setup:', error);
		}
	}

	function drawRow(rowData: string, y: number, isSelected: boolean, rowIndex: number) {
		if (rowIndex % 8 >= 4) {
			ctx.fillStyle = COLORS.patternAlternate;
			ctx.fillRect(0, y, canvasWidth, lineHeight);
		}

		if (isSelected) {
			ctx.fillStyle = COLORS.patternSelected;
			ctx.fillRect(0, y, canvasWidth, lineHeight);
		}

		const cellPositions = getCellPositions(rowData);

		if (isSelected && selectedColumn < cellPositions.length) {
			const cellPos = cellPositions[selectedColumn];
			ctx.fillStyle = COLORS.patternCellSelected;
			ctx.fillRect(cellPos.x - 1, y, cellPos.width + 2, lineHeight);
		}

		const parts = rowData.split(' ');
		let x = 10;

		for (let i = 0; i < parts.length; i++) {
			const part = parts[i];
			if (!part) continue;

			let baseColor = COLORS.patternText;
			if (i === 0) {
				baseColor = COLORS.patternRowNum;
			} else if (i >= 4 && (i - 4) % 3 === 0) {
				baseColor = COLORS.patternNote;
			} else if (i >= 4 && (i - 4) % 3 === 1) {
				baseColor = COLORS.patternInstrument;
			} else if (i >= 4 && (i - 4) % 3 === 2) {
				baseColor = COLORS.patternEffect;
			} else if (i === 1) {
				baseColor = COLORS.patternEnvelope;
			} else if (i === 2) {
				baseColor = COLORS.patternEffect;
			} else if (i === 3) {
				baseColor = COLORS.patternNoise;
			}

			const isNote = i >= 4 && (i - 4) % 3 === 0;

			if (isNote && part === '---') {
				ctx.fillStyle = COLORS.patternEmpty;
				ctx.fillText(part, x, y + lineHeight / 2);
				x += ctx.measureText(part).width;
			} else if (isNote) {
				ctx.fillStyle = baseColor;
				ctx.fillText(part, x, y + lineHeight / 2);
				x += ctx.measureText(part).width;
			} else {
				for (let charIndex = 0; charIndex < part.length; charIndex++) {
					const char = part[charIndex];
					const color = char === '.' || char === '-' ? COLORS.patternEmpty : baseColor;

					ctx.fillStyle = color;
					ctx.fillText(char, x, y + lineHeight / 2);
					x += ctx.measureText(char).width;
				}
			}

			x += ctx.measureText(' ').width;
		}
	}

	function draw() {
		if (!ctx || !currentPattern) return;

		ctx.fillStyle = COLORS.patternBg;
		ctx.fillRect(0, 0, canvasWidth, canvasHeight);

		const visibleRows = getVisibleRows();
		visibleRows.forEach((row) => {
			const y = row.displayIndex * lineHeight;

			if (row.isEmpty) {
				return;
			}

			if (row.isGhost) {
				ctx.globalAlpha = 0.3;
			} else {
				ctx.globalAlpha = 1.0;
			}

			const pattern = patterns[row.patternIndex];
			if (pattern) {
				const rowData = getRowData(pattern, row.rowIndex);
				drawRow(rowData, y, row.isSelected, row.rowIndex);
			}
		});

		ctx.globalAlpha = 1.0;
	}

	function moveRow(delta: number) {
		const newRow = selectedRow + delta;
		if (newRow >= 0 && newRow < currentPattern.length) {
			selectedRow = newRow;
		} else if (delta < 0 && currentPatternOrderIndex > 0) {
			currentPatternOrderIndex--;
			selectedRow = patterns[patternOrder[currentPatternOrderIndex]].length - 1;
		} else if (delta > 0 && currentPatternOrderIndex < patternOrder.length - 1) {
			currentPatternOrderIndex++;
			selectedRow = 0;
		}

		if (currentPattern) {
			const rowData = getRowData(currentPattern, selectedRow);
			const maxCells = getTotalCellCount(rowData);
			if (selectedColumn >= maxCells) {
				selectedColumn = Math.max(0, maxCells - 1);
			}
		}
	}

	function moveColumn(delta: number) {
		if (!currentPattern) return;

		const rowData = getRowData(currentPattern, selectedRow);
		const maxCells = getTotalCellCount(rowData);
		const newColumn = selectedColumn + delta;

		if (newColumn >= 0 && newColumn < maxCells) {
			selectedColumn = newColumn;
		}
	}

	function handleKeyDown(event: KeyboardEvent) {
		switch (event.key) {
			case ' ':
				event.preventDefault();
				playbackStore.isPlaying = !playbackStore.isPlaying;
				break;
			case 'ArrowUp':
				event.preventDefault();
				moveRow(-1);
				break;
			case 'ArrowDown':
				event.preventDefault();
				moveRow(1);
				break;
			case 'ArrowLeft':
				event.preventDefault();
				moveColumn(-1);
				break;
			case 'ArrowRight':
				event.preventDefault();
				moveColumn(1);
				break;
			case 'PageUp':
				event.preventDefault();
				moveRow(-16);
				break;
			case 'PageDown':
				event.preventDefault();
				moveRow(16);
				break;
			case 'Home':
				event.preventDefault();
				if (event.ctrlKey) {
					selectedRow = 0;
				} else {
					selectedColumn = 0;
				}
				break;
			case 'End':
				event.preventDefault();
				if (event.ctrlKey) {
					selectedRow = currentPattern.length - 1;
				} else {
					const rowData = getRowData(currentPattern, selectedRow);
					const maxCells = getTotalCellCount(rowData);
					selectedColumn = Math.max(0, maxCells - 1);
				}
				break;
		}
	}

	function handleWheel(event: WheelEvent) {
		if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
			return;
		}

		event.preventDefault();
		moveRow(Math.sign(event.deltaY));
	}

	function handleMouseEnter(): void {
		if (canvas) {
			canvas.focus();
		}
	}

	function updateSize() {
		canvasHeight = Math.max(
			PATTERN_EDITOR_CONSTANTS.MIN_CANVAS_HEIGHT,
			window.innerHeight - PATTERN_EDITOR_CONSTANTS.CANVAS_TOP_MARGIN
		);
		if (ctx && currentPattern) {
			const sampleRowData = getRowData(currentPattern, 0);
			canvasWidth =
				ctx.measureText(sampleRowData).width + PATTERN_EDITOR_CONSTANTS.CANVAS_PADDING;
		} else {
			canvasWidth = PATTERN_EDITOR_CONSTANTS.DEFAULT_CANVAS_WIDTH;
		}
	}

	$effect(() => {
		if (canvas) {
			setupCanvas();
			draw();
		}
	});

	$effect(() => {
		const handleResize = () => {
			if (document.hidden) return;
			updateSize();
			setupCanvas();
			draw();
		};

		const handleVisibilityChange = () => {
			if (!document.hidden) {
				updateSize();
				setupCanvas();
				draw();
			}
		};

		window.addEventListener('resize', handleResize);
		document.addEventListener('visibilitychange', handleVisibilityChange);

		return () => {
			window.removeEventListener('resize', handleResize);
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		};
	});

	$effect(() => {
		if (playbackStore.isPlaying) {
			togglePlayback();
		} else {
			pausePlayback();
		}
	});

	$effect(() => {
		if (!ayProcessor) return;

		const handlePatternUpdate = (
			currentRow: number,
			currentPatternOrderIndexUpdate?: number
		) => {
			if (services.audioService.playing) {
				selectedRow = currentRow;
				if (currentPatternOrderIndexUpdate !== undefined) {
					currentPatternOrderIndex = currentPatternOrderIndexUpdate;
				}
			}
		};

		const handlePatternRequest = (requestedOrderIndex: number) => {
			if (requestedOrderIndex >= 0 && requestedOrderIndex < patternOrder.length) {
				const patternIndex = patternOrder[requestedOrderIndex];
				const requestedPattern = patterns[patternIndex];

				if (requestedPattern) {
					ayProcessor.sendRequestedPattern(requestedPattern);
				}
			}
		};

		ayProcessor.setCallbacks(handlePatternUpdate, handlePatternRequest);
	});
</script>

<div class="flex flex-col gap-2">
	<div class="flex" style="max-height: {canvasHeight}px">
		<PatternOrder
			bind:currentPatternOrderIndex
			bind:patterns
			bind:selectedRow
			bind:patternOrder
			{canvasHeight}
			{lineHeight} />

		<canvas
			bind:this={canvas}
			tabindex="0"
			onkeydown={handleKeyDown}
			onwheel={handleWheel}
			onmouseenter={handleMouseEnter}
			class="focus:border-opacity-50 block border border-[var(--pattern-empty)] transition-colors duration-150 focus:border-[var(--pattern-text)] focus:outline-none">
		</canvas>
	</div>
</div>

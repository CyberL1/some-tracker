<script lang="ts">
	import type { Pattern, Instrument } from '../../models/song';
	import type {
		ChipProcessor,
		TuningTableSupport,
		InstrumentSupport
	} from '../../core/chip-processor';
	import type { AudioService } from '../../services/audio-service';
	import type { Chip } from '../../models/chips';
	import { getColors } from '../../utils/colors';
	import { getFonts } from '../../utils/fonts';
	import { getContext } from 'svelte';
	import { PATTERN_EDITOR_CONSTANTS } from './types';
	import { playbackStore } from '../../stores/playback.svelte';
	import { getFormatter } from '../../models/formatters/formatter-factory';
	import { getConverter } from '../../models/adapters/converter-factory';

	let {
		patterns,
		patternOrder = $bindable(),
		currentPatternOrderIndex = $bindable(0),
		selectedRow = $bindable(0),
		isActive = false,
		onfocus,
		initAllChips,
		getSpeedForChip,
		chip,
		chipProcessor,
		tuningTable,
		speed,
		instruments
	}: {
		patterns: Pattern[];
		patternOrder: number[];
		currentPatternOrderIndex: number;
		selectedRow: number;
		isActive?: boolean;
		onfocus?: () => void;
		initAllChips?: () => void;
		getSpeedForChip?: (chipIndex: number) => number | null;
		chip: Chip;
		chipProcessor: ChipProcessor;
		tuningTable: number[];
		speed: number;
		instruments: Instrument[];
	} = $props();

	const services: { audioService: AudioService } = getContext('container');

	const formatter = getFormatter(chip);
	const converter = getConverter(chip);
	const schema = chip.schema;

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;
	let containerDiv: HTMLDivElement;

	let COLORS = getColors();
	let FONTS = getFonts();

	let canvasWidth = $state(PATTERN_EDITOR_CONSTANTS.DEFAULT_CANVAS_WIDTH);
	let canvasHeight = $state(PATTERN_EDITOR_CONSTANTS.DEFAULT_CANVAS_HEIGHT);
	let lineHeight =
		PATTERN_EDITOR_CONSTANTS.FONT_SIZE * PATTERN_EDITOR_CONSTANTS.LINE_HEIGHT_MULTIPLIER;

	let selectedColumn = $state(0);

	let currentPattern = $derived.by(() => {
		const patternId = patternOrder[currentPatternOrderIndex];
		return patterns.find((p) => p.id === patternId);
	});

	export function resetToBeginning() {
		selectedRow = 0;
		currentPatternOrderIndex = 0;
	}

	export function setPatternOrderIndex(index: number) {
		if (index >= 0 && index < patternOrder.length) {
			currentPatternOrderIndex = index;
		}
	}

	export function setSelectedRow(row: number) {
		if (currentPattern && row >= 0 && row < currentPattern.length) {
			selectedRow = row;
		}
	}

	export function playFromCursor() {
		if (!chipProcessor || !chipProcessor.isAudioNodeAvailable()) {
			console.warn('Audio processor not available or not initialized');
			return;
		}

		try {
			if (!currentPattern) {
				console.warn('No pattern selected');
				return;
			}

			initAllChips?.();
			services.audioService.playFromRow(selectedRow, currentPatternOrderIndex, getSpeedForChip);
		} catch (error) {
			console.error('Error during playback from cursor:', error);
			services.audioService.stop();
		}
	}

	export function togglePlayback() {
		if (!chipProcessor || !chipProcessor.isAudioNodeAvailable()) {
			console.warn('Audio processor not available or not initialized');
			return;
		}

		try {
			if (!services.audioService.playing) {
				if (!currentPattern) {
					console.warn('No pattern selected');
					return;
				}

				initAllChips?.();
				services.audioService.play();
			}
		} catch (error) {
			console.error('Error during playback toggle:', error);
			services.audioService.stop();
		}
	}

	function initPlayback() {
		chipProcessor.sendInitPattern(currentPattern, currentPatternOrderIndex);
		chipProcessor.sendInitSpeed(speed);

		if (chip.type === 'ay') {
			const withTuningTables = chipProcessor as ChipProcessor & TuningTableSupport;
			const withInstruments = chipProcessor as ChipProcessor & InstrumentSupport;

			withTuningTables.sendInitTuningTable(tuningTable);
			withInstruments.sendInitInstruments(instruments);
		}
	}

	function pausePlayback() {
		services.audioService.stop();
	}

	interface FieldSegment {
		start: number;
		end: number;
		fieldKey: string;
		color: string;
	}

	function parseRowString(rowString: string, rowIndex: number): FieldSegment[] {
		const segments: FieldSegment[] = [];
		let pos = 0;

		const skipSpaces = () => {
			while (pos < rowString.length && rowString[pos] === ' ') {
				pos++;
			}
		};

		skipSpaces();
		const rowNumStart = pos;
		while (pos < rowString.length && rowString[pos] !== ' ') {
			pos++;
		}
		if (rowNumStart < pos) {
			const colorKey = rowIndex % 4 === 0 ? 'patternRowNumAlternate' : 'patternRowNum';
			segments.push({
				start: rowNumStart,
				end: pos,
				fieldKey: 'rowNum',
				color: COLORS[colorKey as keyof typeof COLORS] || COLORS.patternText
			});
		}
		skipSpaces();

		if (schema.globalTemplate && schema.globalFields) {
			const globalStart = pos;
			const globalTemplate = schema.globalTemplate;
			let templatePos = 0;
			while (templatePos < globalTemplate.length) {
				if (globalTemplate[templatePos] === '{') {
					const end = globalTemplate.indexOf('}', templatePos);
					if (end !== -1) {
						const key = globalTemplate.substring(templatePos + 1, end);
						const field = schema.globalFields[key];
						if (field) {
							const colorKey = formatter.getColorForField(key, schema);
							const color =
								COLORS[colorKey as keyof typeof COLORS] || COLORS.patternText;
							segments.push({
								start: pos,
								end: pos + field.length,
								fieldKey: key,
								color
							});
							pos += field.length;
						}
						templatePos = end + 1;
					} else {
						templatePos++;
					}
				} else if (globalTemplate[templatePos] === ' ') {
					pos++;
					templatePos++;
				} else {
					templatePos++;
				}
			}
			skipSpaces();
		}

		const template = schema.template;
		while (pos < rowString.length) {
			skipSpaces();
			if (pos >= rowString.length) break;

			const channelStart = pos;
			let templatePos = 0;
			let foundField = false;
			while (templatePos < template.length) {
				if (template[templatePos] === '{') {
					const end = template.indexOf('}', templatePos);
					if (end !== -1) {
						const key = template.substring(templatePos + 1, end);
						const field = schema.fields[key];
						if (field) {
							const colorKey = formatter.getColorForField(key, schema);
							const color =
								COLORS[colorKey as keyof typeof COLORS] || COLORS.patternText;
							segments.push({
								start: pos,
								end: pos + field.length,
								fieldKey: key,
								color
							});
							pos += field.length;
							foundField = true;
						}
						templatePos = end + 1;
					} else {
						break;
					}
				} else if (template[templatePos] === ' ') {
					if (pos < rowString.length && rowString[pos] === ' ') {
						pos++;
					}
					templatePos++;
				} else {
					templatePos++;
				}
			}
			if (!foundField) break;
		}
		return segments;
	}

	function getCellPositions(
		rowString: string,
		rowIndex: number
	): { x: number; width: number; charIndex: number; fieldKey?: string }[] {
		const positions: { x: number; width: number; charIndex: number; fieldKey?: string }[] = [];
		const segments = parseRowString(rowString, rowIndex);
		let x = 10;
		let i = 0;

		while (i < rowString.length) {
			const char = rowString[i];
			if (char === ' ') {
				x += ctx.measureText(' ').width;
				i++;
				continue;
			}

			const segment = segments.find((s) => i >= s.start && i < s.end);

			if (!segment) {
				const width = ctx.measureText(char).width;
				x += width;
				i++;
				continue;
			}

			const field =
				schema.fields[segment.fieldKey] || schema.globalFields?.[segment.fieldKey];

			if (segment.fieldKey === 'rowNum' || field?.skip) {
				const skipText = rowString.substring(segment.start, segment.end);
				x += ctx.measureText(skipText).width;
				i = segment.end;
				continue;
			}

			const isAtomic = field?.selectable === 'atomic';

			if (isAtomic && i === segment.start) {
				const fieldText = rowString.substring(segment.start, segment.end);
				const width = ctx.measureText(fieldText).width;
				positions.push({ x, width, charIndex: segment.start, fieldKey: segment.fieldKey });
				x += width;
				i = segment.end;
			} else if (isAtomic && i > segment.start) {
				const width = ctx.measureText(char).width;
				x += width;
				i++;
			} else if (!isAtomic) {
				const width = ctx.measureText(char).width;
				positions.push({ x, width, charIndex: i, fieldKey: segment.fieldKey });
				x += width;
				i++;
			} else {
				const width = ctx.measureText(char).width;
				x += width;
				i++;
			}
		}

		return positions;
	}

	function getTotalCellCount(rowString: string): number {
		return rowString.replace(/\s/g, '').length;
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

	function drawRowStructured(
		rowString: string,
		y: number,
		isSelected: boolean,
		rowIndex: number
	) {
		if (rowIndex % 4 === 0) {
			ctx.fillStyle = COLORS.patternAlternate;
			ctx.fillRect(0, y, canvasWidth, lineHeight);
		}

		if (isSelected) {
			ctx.fillStyle = COLORS.patternSelected;
			ctx.fillRect(0, y, canvasWidth, lineHeight);
		}

		const cellPositions = getCellPositions(rowString, rowIndex);
		if (isSelected && selectedColumn < cellPositions.length) {
			const cellPos = cellPositions[selectedColumn];
			ctx.fillStyle = COLORS.patternCellSelected;
			ctx.fillRect(cellPos.x - 1, y, cellPos.width + 2, lineHeight);
		}

		const segments = parseRowString(rowString, rowIndex);
		let x = 10;
		let segmentIndex = 0;
		let currentSegment = segments[0];

		for (let i = 0; i < rowString.length; i++) {
			const char = rowString[i];

			if (char === ' ') {
				x += ctx.measureText(' ').width;
				continue;
			}

			while (currentSegment && i >= currentSegment.end) {
				segmentIndex++;
				currentSegment = segments[segmentIndex];
			}

			let color = COLORS.patternText;
			if (currentSegment) {
				color = currentSegment.color;
			}

			const field =
				currentSegment &&
				(schema.fields[currentSegment.fieldKey] ||
					schema.globalFields?.[currentSegment.fieldKey]);
			const isAtomic = field?.selectable === 'atomic';
			const fieldText = currentSegment
				? rowString.substring(currentSegment.start, currentSegment.end)
				: '';

			const isEmptyField =
				fieldText && fieldText.split('').every((c) => c === '.' || c === '-');

			if ((char === '.' || char === '-') && isEmptyField) {
				if (isAtomic) {
					if (fieldText === '---') {
						ctx.fillStyle = isSelected
							? COLORS.patternEmptySelected
							: rowIndex % 4 === 0
								? COLORS.patternAlternateEmpty
								: COLORS.patternEmpty;
					} else {
						ctx.fillStyle = color;
					}
				} else {
					ctx.fillStyle = isSelected
						? COLORS.patternEmptySelected
						: rowIndex % 4 === 0
							? COLORS.patternAlternateEmpty
							: COLORS.patternEmpty;
				}
			} else {
				ctx.fillStyle = color;
			}

			ctx.fillText(char, x, y + lineHeight / 2);
			x += ctx.measureText(char).width;
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

			const pattern = patterns.find((p) => p.id === row.patternIndex);
			if (pattern) {
				const genericPattern = converter.toGeneric(pattern);
				const genericPatternRow = genericPattern.patternRows[row.rowIndex];
				const genericChannels = genericPattern.channels.map((ch) => ch.rows[row.rowIndex]);
				const rowString = formatter.formatRow(
					genericPatternRow,
					genericChannels,
					row.rowIndex,
					schema
				);
				drawRowStructured(rowString, y, row.isSelected && isActive, row.rowIndex);
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
			const prevPatternId = patternOrder[currentPatternOrderIndex];
			const prevPattern = patterns.find((p) => p.id === prevPatternId);
			if (prevPattern) {
				selectedRow = prevPattern.length - 1;
			}
		} else if (delta > 0 && currentPatternOrderIndex < patternOrder.length - 1) {
			currentPatternOrderIndex++;
			selectedRow = 0;
		}

		if (currentPattern) {
			const genericPattern = converter.toGeneric(currentPattern);
			const genericPatternRow = genericPattern.patternRows[selectedRow];
			const genericChannels = genericPattern.channels.map((ch) => ch.rows[selectedRow]);
			const rowString = formatter.formatRow(
				genericPatternRow,
				genericChannels,
				selectedRow,
				schema
			);
			const cellPositions = getCellPositions(rowString, selectedRow);
			const maxCells = cellPositions.length;
			if (selectedColumn >= maxCells) {
				selectedColumn = Math.max(0, maxCells - 1);
			}
		}
	}

	function moveColumn(delta: number) {
		if (!currentPattern) return;

		const genericPattern = converter.toGeneric(currentPattern);
		const genericPatternRow = genericPattern.patternRows[selectedRow];
		const genericChannels = genericPattern.channels.map((ch) => ch.rows[selectedRow]);
		const rowString = formatter.formatRow(
			genericPatternRow,
			genericChannels,
			selectedRow,
			schema
		);
		const cellPositions = getCellPositions(rowString, selectedRow);
		const maxCells = cellPositions.length;
		let newColumn = selectedColumn + delta;

		if (newColumn < 0) newColumn = 0;
		if (newColumn >= maxCells) newColumn = maxCells - 1;

		selectedColumn = newColumn;
	}

	function handleKeyDown(event: KeyboardEvent) {
		switch (event.key) {
			case ' ':
				event.preventDefault();
				playbackStore.isPlaying = !playbackStore.isPlaying;
				if (playbackStore.isPlaying) {
					togglePlayback();
				} else {
					pausePlayback();
				}
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
					const genericPattern = converter.toGeneric(currentPattern);
					const genericPatternRow = genericPattern.patternRows[selectedRow];
					const genericChannels = genericPattern.channels.map(
						(ch) => ch.rows[selectedRow]
					);
					const rowString = formatter.formatRow(
						genericPatternRow,
						genericChannels,
						selectedRow,
						schema
					);
					const cellPositions = getCellPositions(rowString, selectedRow);
					const maxCells = cellPositions.length;
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
			onfocus?.();
		}
	}

	function updateSize() {
		if (containerDiv) {
			const availableHeight = containerDiv.clientHeight;
			const gap = 8;

			canvasHeight = Math.max(
				PATTERN_EDITOR_CONSTANTS.MIN_CANVAS_HEIGHT,
				availableHeight - gap
			);
		} else {
			canvasHeight = Math.max(
				PATTERN_EDITOR_CONSTANTS.MIN_CANVAS_HEIGHT,
				window.innerHeight - PATTERN_EDITOR_CONSTANTS.CANVAS_TOP_MARGIN
			);
		}

		if (ctx && currentPattern) {
			const genericPattern = converter.toGeneric(currentPattern);
			const genericPatternRow = genericPattern.patternRows[0];
			const genericChannels = genericPattern.channels.map((ch) => ch.rows[0]);
			const rowString = formatter.formatRow(genericPatternRow, genericChannels, 0, schema);
			const width = ctx.measureText(rowString).width;
			canvasWidth = width + PATTERN_EDITOR_CONSTANTS.CANVAS_PADDING;
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
		if (!containerDiv) return;

		const resizeObserver = new ResizeObserver(() => {
			if (containerDiv.clientHeight > 0) {
				updateSize();
				setupCanvas();
				draw();
			}
		});

		resizeObserver.observe(containerDiv);

		return () => {
			resizeObserver.disconnect();
		};
	});

	$effect(() => {
		if (!chipProcessor) return;

		const currentPatterns = patterns;
		const currentPatternOrder = patternOrder;

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
			if (requestedOrderIndex >= 0 && requestedOrderIndex < currentPatternOrder.length) {
				const patternId = currentPatternOrder[requestedOrderIndex];
				const requestedPattern = currentPatterns.find((p) => p.id === patternId);

				if (requestedPattern) {
					chipProcessor.sendRequestedPattern(requestedPattern, requestedOrderIndex);
				} else {
					console.warn(
						`PatternEditor [${chipProcessor.chip.name}]: Pattern with ID ${patternId} not found at order index ${requestedOrderIndex}. Available pattern IDs:`,
						currentPatterns.map((p) => p.id)
					);
				}
			}
		};

		const handleSpeedUpdate = (newSpeed: number) => {
			services.audioService.updateSpeed(newSpeed);
		};

		chipProcessor.setCallbacks(handlePatternUpdate, handlePatternRequest, handleSpeedUpdate);
	});
</script>

<div bind:this={containerDiv} class="flex h-full flex-col gap-2">
	<div class="flex" style="max-height: {canvasHeight}px">
		<canvas
			bind:this={canvas}
			tabindex="0"
			onkeydown={handleKeyDown}
			onwheel={handleWheel}
			onmouseenter={handleMouseEnter}
			class="focus:border-opacity-50 border-pattern-empty focus:border-pattern-text block border transition-colors duration-150 focus:outline-none">
		</canvas>
	</div>
</div>

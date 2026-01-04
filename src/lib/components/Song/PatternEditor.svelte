<script lang="ts">
	import type { Pattern, Instrument } from '../../models/song';
	import type {
		ChipProcessor,
		TuningTableSupport,
		InstrumentSupport
	} from '../../chips/base/processor';
	import type { AudioService } from '../../services/audio/audio-service';
	import type { Chip } from '../../chips/types';
	import { getColors } from '../../utils/colors';
	import { getFonts } from '../../utils/fonts';
	import { setupCanvas as setupCanvasUtil } from '../../utils/canvas-utils';
	import { getContext } from 'svelte';
	import { PATTERN_EDITOR_CONSTANTS } from './types';
	import { playbackStore } from '../../stores/playback.svelte';
	import { getFormatter, getConverter } from '../../chips/registry';
	import { PatternService } from '../../services/pattern/pattern-service';
	import { PatternNavigationService } from '../../services/pattern/pattern-navigation';
	import {
		PatternVisibleRowsService,
		type VisibleRow,
		type VisibleRowsCache
	} from '../../services/pattern/pattern-visible-rows';
	import { PatternEditingService } from '../../services/pattern/pattern-editing';
	import { PatternEditorRenderer } from '../../ui-rendering/pattern-editor-renderer';
	import { PatternEditorTextParser } from '../../ui-rendering/pattern-editor-text-parser';
	import { Cache } from '../../utils/memoize';
	import { channelMuteStore } from '../../stores/channel-mute.svelte';

	let {
		patterns = $bindable(),
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

	const rowStringCache = new Cache<string, string>(500);
	const patternGenericCache = new Cache<number, ReturnType<typeof converter.toGeneric>>(100);
	const cellPositionsCache = new Cache<
		string,
		ReturnType<PatternEditorTextParser['getCellPositions']>
	>(500);
	const rowSegmentsCache = new Cache<
		string,
		ReturnType<PatternEditorTextParser['parseRowString']>
	>(500);
	let textParser: PatternEditorTextParser | null = $state(null);
	let renderer: PatternEditorRenderer | null = $state(null);
	let lastVisibleRowsCache: VisibleRowsCache | null = null;

	let currentPattern = $derived.by(() => {
		const patternId = patternOrder[currentPatternOrderIndex];
		let pattern = patterns.find((p) => p.id === patternId);

		if (!pattern) {
			pattern = PatternService.createEmptyPattern(patternId);
			patterns = [...patterns, pattern];
		}

		return pattern;
	});

	$effect(() => {
		patterns.length;
		patternOrder.length;
		rowStringCache.clear();
		patternGenericCache.clear();
		cellPositionsCache.clear();
		rowSegmentsCache.clear();
		lastVisibleRowsCache = null;
	});

	function ensurePatternExists(): Pattern | null {
		return currentPattern;
	}

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
		const pattern = currentPattern || ensurePatternExists();
		if (pattern && row >= 0 && row < pattern.length) {
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
			services.audioService.playFromRow(
				selectedRow,
				currentPatternOrderIndex,
				getSpeedForChip
			);
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

	function getCellPositions(
		rowString: string,
		rowIndex: number
	): ReturnType<PatternEditorTextParser['getCellPositions']> {
		if (!textParser) return [];
		return textParser.getCellPositions(rowString, rowIndex);
	}

	function getTotalCellCount(rowString: string): number {
		return rowString.replace(/\s/g, '').length;
	}

	function getVisibleRows(pattern: Pattern): VisibleRow[] {
		const { rows, cache } = PatternVisibleRowsService.getVisibleRows(
			pattern,
			{
				patterns,
				patternOrder,
				currentPatternOrderIndex,
				selectedRow,
				canvasHeight,
				lineHeight,
				createPatternIfMissing: (patternId: number) => {
					const newPattern = PatternService.createEmptyPattern(patternId);
					patterns = [...patterns, newPattern];
					return newPattern;
				}
			},
			lastVisibleRowsCache
		);
		lastVisibleRowsCache = cache;
		return rows;
	}

	function setupCanvas() {
		if (!canvas) return;

		ctx = canvas.getContext('2d')!;

		try {
			updateSize();

			setupCanvasUtil({
				canvas,
				ctx,
				width: canvasWidth,
				height: canvasHeight,
				fontSize: PATTERN_EDITOR_CONSTANTS.FONT_SIZE,
				fonts: FONTS,
				textBaseline: 'middle'
			});

			textParser = new PatternEditorTextParser(
				schema,
				formatter,
				COLORS,
				ctx,
				rowSegmentsCache,
				cellPositionsCache
			);

			renderer = new PatternEditorRenderer({
				ctx,
				colors: COLORS,
				canvasWidth,
				lineHeight,
				schema
			});
		} catch (error) {
			console.error('Error during canvas setup:', error);
		}
	}

	function getChipIndex(): number {
		return services.audioService.chipProcessors.findIndex((p) => p === chipProcessor);
	}

	function getChannelMutedState(pattern: Pattern): boolean[] {
		const chipIndex = getChipIndex();
		return pattern.channels.map(
			(_, index) => chipIndex >= 0 && channelMuteStore.isChannelMuted(chipIndex, index)
		);
	}

	function getPatternRowData(pattern: Pattern, rowIndex: number): string {
		let genericPattern = patternGenericCache.get(pattern.id);
		if (!genericPattern) {
			genericPattern = converter.toGeneric(pattern);
			patternGenericCache.set(pattern.id, genericPattern);
		}

		const genericPatternRow = genericPattern.patternRows[rowIndex];
		const genericChannels = genericPattern.channels.map((ch) => ch.rows[rowIndex]);

		const rowCacheKey = `${pattern.id}:${rowIndex}`;
		let rowString = rowStringCache.get(rowCacheKey);
		if (!rowString) {
			rowString = formatter.formatRow(genericPatternRow, genericChannels, rowIndex, schema);
			rowStringCache.set(rowCacheKey, rowString);
		}

		return rowString;
	}

	function draw() {
		if (!ctx || !renderer || !textParser) return;

		renderer.drawBackground(canvasHeight);

		const visibleRows = getVisibleRows(currentPattern);

		for (const row of visibleRows) {
			const y = row.displayIndex * lineHeight;

			if (row.isEmpty) {
				continue;
			}

			if (row.isGhost) {
				ctx.globalAlpha = 0.3;
			} else {
				ctx.globalAlpha = 1.0;
			}

			const patternToRender = patterns.find((p) => p.id === row.patternIndex);
			if (patternToRender && row.rowIndex >= 0 && row.rowIndex < patternToRender.length) {
				const rowString = getPatternRowData(patternToRender, row.rowIndex);

				if (!textParser || !renderer) continue;
				const segments = textParser.parseRowString(rowString, row.rowIndex);
				const cellPositions = getCellPositions(rowString, row.rowIndex);
				const channelMuted = getChannelMutedState(patternToRender);

				renderer.drawRow({
					rowString,
					y,
					isSelected: row.isSelected && isActive,
					rowIndex: row.rowIndex,
					selectedColumn,
					segments,
					cellPositions,
					channelMuted
				});
			}
		}

		ctx.globalAlpha = 1.0;

		if (currentPattern) {
			const patternToRender = patterns.find((p) => p.id === currentPattern.id);
			if (patternToRender) {
				const firstVisibleRow = visibleRows.find((r) => !r.isEmpty);
				if (
					firstVisibleRow &&
					firstVisibleRow.rowIndex >= 0 &&
					firstVisibleRow.rowIndex < patternToRender.length
				) {
					const rowString = getPatternRowData(patternToRender, firstVisibleRow.rowIndex);

					const channelLabels =
						schema.channelLabels || patternToRender.channels.map((ch) => ch.label);
					const channelMuted = getChannelMutedState(patternToRender);

					renderer.drawChannelLabels({
						rowString,
						channelLabels,
						channelMuted
					});
				}
			}
		}
	}

	function moveRow(delta: number) {
		if (playbackStore.isPlaying) return;

		const pattern = currentPattern || ensurePatternExists();
		if (!pattern) return;

		const navigationState = PatternNavigationService.moveRow(
			{
				selectedRow,
				currentPatternOrderIndex,
				selectedColumn
			},
			{
				patterns,
				patternOrder,
				currentPattern: pattern,
				converter,
				formatter,
				schema,
				getCellPositions
			},
			delta
		);

		selectedRow = navigationState.selectedRow;
		currentPatternOrderIndex = navigationState.currentPatternOrderIndex;

		const updatedPattern = currentPattern || ensurePatternExists();
		if (updatedPattern) {
			const updatedState = PatternNavigationService.moveColumn(navigationState, {
				patterns,
				patternOrder,
				currentPattern: updatedPattern,
				converter,
				formatter,
				schema,
				getCellPositions
			});
			selectedColumn = updatedState.selectedColumn;
		}
	}

	function moveColumn(delta: number) {
		const pattern = currentPattern || ensurePatternExists();
		if (!pattern) return;

		const navigationState = PatternNavigationService.moveColumnByDelta(
			{
				selectedRow,
				currentPatternOrderIndex,
				selectedColumn
			},
			{
				patterns,
				patternOrder,
				currentPattern: pattern,
				converter,
				formatter,
				schema,
				getCellPositions
			},
			delta
		);

		selectedColumn = navigationState.selectedColumn;
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.ctrlKey || event.metaKey || event.altKey) {
			return;
		}

		const selection = window.getSelection();
		if (selection && selection.toString().length > 0) {
			selection.removeAllRanges();
		}

		const patternId = patternOrder[currentPatternOrderIndex];
		let pattern = patterns.find((p) => p.id === patternId);
		if (!pattern) {
			pattern = PatternService.createEmptyPattern(patternId);
			patterns = [...patterns, pattern];
		}

		const rowString = getPatternRowData(pattern, selectedRow);
		const cellPositions = getCellPositions(rowString, selectedRow);
		const segments = textParser ? textParser.parseRowString(rowString, selectedRow) : undefined;

		const editingResult = PatternEditingService.handleKeyInput(
			{
				pattern,
				selectedRow,
				selectedColumn,
				cellPositions,
				segments,
				converter,
				formatter,
				schema
			},
			event.key
		);

		if (editingResult) {
			event.preventDefault();
			const patternIndex = patterns.findIndex((p) => p.id === pattern.id);
			if (patternIndex >= 0) {
				patterns = [
					...patterns.slice(0, patternIndex),
					editingResult.updatedPattern,
					...patterns.slice(patternIndex + 1)
				];
			}

			if (editingResult.shouldMoveNext) {
				moveColumn(1);
			}

			rowStringCache.clear();
			patternGenericCache.clear();
			cellPositionsCache.clear();
			rowSegmentsCache.clear();
			lastVisibleRowsCache = null;
			draw();
			return;
		}

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
				if (!playbackStore.isPlaying) {
					event.preventDefault();
					moveRow(-1);
				}
				break;
			case 'ArrowDown':
				if (!playbackStore.isPlaying) {
					event.preventDefault();
					moveRow(1);
				}
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
				if (!playbackStore.isPlaying) {
					event.preventDefault();
					moveRow(-16);
				}
				break;
			case 'PageDown':
				if (!playbackStore.isPlaying) {
					event.preventDefault();
					moveRow(16);
				}
				break;
			case 'Home':
				event.preventDefault();
				if (event.ctrlKey) {
					if (!playbackStore.isPlaying) {
						selectedRow = 0;
					}
				} else {
					selectedColumn = 0;
				}
				break;
			case 'End':
				event.preventDefault();
				if (event.ctrlKey) {
					if (!playbackStore.isPlaying) {
						selectedRow = pattern.length - 1;
					}
				} else {
					const navigationState = PatternNavigationService.moveToRowEnd(
						{
							selectedRow,
							currentPatternOrderIndex,
							selectedColumn
						},
						{
							patterns,
							patternOrder,
							currentPattern: pattern,
							converter,
							formatter,
							schema,
							getCellPositions
						}
					);
					selectedColumn = navigationState.selectedColumn;
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

	let isHoveringLabel = $state(false);

	function handleMouseMove(event: MouseEvent): void {
		if (!canvas) return;

		const rect = canvas.getBoundingClientRect();
		const y = event.clientY - rect.top;

		const wasHovering = isHoveringLabel;
		isHoveringLabel = y <= lineHeight;

		if (wasHovering !== isHoveringLabel) {
			canvas.style.cursor = isHoveringLabel ? 'pointer' : 'default';
		}
	}

	function handleMouseLeave(): void {
		if (canvas) {
			canvas.style.cursor = 'default';
			isHoveringLabel = false;
		}
	}

	function handleMouseEnter(): void {
		if (canvas) {
			canvas.focus();
			const selection = window.getSelection();
			if (selection) {
				selection.removeAllRanges();
			}
			onfocus?.();
		}
	}

	function handleCanvasClick(event: MouseEvent): void {
		if (!canvas || !currentPattern || !renderer || !textParser) return;

		const rect = canvas.getBoundingClientRect();
		const x = event.clientX - rect.left;
		const y = event.clientY - rect.top;

		const patternToRender = patterns.find((p) => p.id === currentPattern.id);
		if (!patternToRender) return;

		if (y <= lineHeight) {
			const visibleRows = getVisibleRows(currentPattern);
			const firstVisibleRow = visibleRows.find((r) => !r.isEmpty);
			if (
				!firstVisibleRow ||
				firstVisibleRow.rowIndex < 0 ||
				firstVisibleRow.rowIndex >= patternToRender.length
			)
				return;

			const rowString = getPatternRowData(patternToRender, firstVisibleRow.rowIndex);
			const channelPositions = renderer.calculateChannelPositions(rowString);

			for (let i = 0; i < channelPositions.length; i++) {
				const channelStart = channelPositions[i];
				const channelEnd =
					i < channelPositions.length - 1 ? channelPositions[i + 1] : canvasWidth;

				if (x >= channelStart && x < channelEnd) {
					const chipIndex = getChipIndex();
					if (chipIndex >= 0) {
						channelMuteStore.toggleChannel(chipIndex, i);
						const isMuted = channelMuteStore.isChannelMuted(chipIndex, i);
						chipProcessor.updateParameter(`channelMute_${i}`, isMuted);
						draw();
					}
					break;
				}
			}
			return;
		}

		const visibleRows = getVisibleRows(currentPattern);

		if (y <= lineHeight) return;

		let closestRow: (typeof visibleRows)[0] | null = null;
		let minRowDistance = Infinity;

		for (const row of visibleRows) {
			if (row.isEmpty || row.rowIndex < 0) continue;

			const rowY = row.displayIndex * lineHeight;
			const rowCenterY = rowY + lineHeight / 2;
			const distance = Math.abs(y - rowCenterY);

			if (distance < minRowDistance) {
				minRowDistance = distance;
				closestRow = row;
			}
		}

		if (!closestRow) return;

		const clickedRow = closestRow;

		const rowString = getPatternRowData(patternToRender, clickedRow.rowIndex);
		const cellPositions = getCellPositions(rowString, clickedRow.rowIndex);

		let closestColumn = 0;
		let minDistance = Infinity;

		for (let i = 0; i < cellPositions.length; i++) {
			const cell = cellPositions[i];
			if (cell.x === undefined) continue;

			const cellCenter = cell.x + (cell.width || 0) / 2;
			const distance = Math.abs(x - cellCenter);
			if (distance < minDistance) {
				minDistance = distance;
				closestColumn = i;
			}
		}

		if (!playbackStore.isPlaying) {
			selectedRow = clickedRow.rowIndex;
		}
		selectedColumn = closestColumn;
		canvas.focus();
		draw();
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
			const rowString = getPatternRowData(currentPattern, 0);
			const width = ctx.measureText(rowString).width;
			canvasWidth = width + PATTERN_EDITOR_CONSTANTS.CANVAS_PADDING;
		} else {
			canvasWidth = PATTERN_EDITOR_CONSTANTS.DEFAULT_CANVAS_WIDTH;
		}
	}

	let lastDrawnRow = -1;
	let lastDrawnOrderIndex = -1;
	let lastPatternOrderLength = -1;
	let lastPatternsLength = -1;
	let lastCanvasWidth = -1;
	let lastCanvasHeight = -1;
	let needsSetup = true;

	$effect(() => {
		if (!canvas) return;

		if (needsSetup || !ctx) {
			ctx = canvas.getContext('2d')!;
			setupCanvas();
			needsSetup = false;
			draw();
			lastDrawnRow = selectedRow;
			lastDrawnOrderIndex = currentPatternOrderIndex;
			lastPatternOrderLength = patternOrder.length;
			lastPatternsLength = patterns.length;
			lastCanvasWidth = canvasWidth;
			lastCanvasHeight = canvasHeight;
			return;
		}

		const patternChanged = currentPattern !== undefined;
		const sizeChanged = canvasWidth !== lastCanvasWidth || canvasHeight !== lastCanvasHeight;
		const rowChanged = selectedRow !== lastDrawnRow;
		const orderChanged =
			currentPatternOrderIndex !== lastDrawnOrderIndex ||
			patternOrder.length !== lastPatternOrderLength ||
			patterns.length !== lastPatternsLength;

		if (sizeChanged) {
			updateSize();
			setupCanvas();
			lastCanvasWidth = canvasWidth;
			lastCanvasHeight = canvasHeight;
		}

		if (rowChanged || orderChanged || patternChanged || sizeChanged) {
			draw();
			lastDrawnRow = selectedRow;
			lastDrawnOrderIndex = currentPatternOrderIndex;
			lastPatternOrderLength = patternOrder.length;
			lastPatternsLength = patterns.length;
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

	let lastPlaybackUpdate = 0;
	const PLAYBACK_THROTTLE_MS = 33;

	$effect(() => {
		if (!chipProcessor) return;

		const currentPatterns = patterns;
		const currentPatternOrder = patternOrder;

		const handlePatternUpdate = (
			currentRow: number,
			currentPatternOrderIndexUpdate?: number
		) => {
			if (!services.audioService.playing) return;

			const now = performance.now();
			if (now - lastPlaybackUpdate < PLAYBACK_THROTTLE_MS) return;
			lastPlaybackUpdate = now;

			selectedRow = currentRow;
			if (currentPatternOrderIndexUpdate !== undefined) {
				currentPatternOrderIndex = currentPatternOrderIndexUpdate;
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
	<div class="relative flex" style="max-height: {canvasHeight}px">
		<canvas
			bind:this={canvas}
			tabindex="0"
			onkeydown={handleKeyDown}
			onwheel={handleWheel}
			onmouseenter={handleMouseEnter}
			onmousemove={handleMouseMove}
			onmouseleave={handleMouseLeave}
			onclick={handleCanvasClick}
			class="focus:border-opacity-50 border-pattern-empty focus:border-pattern-text block border transition-colors duration-150 focus:outline-none">
		</canvas>
	</div>
</div>

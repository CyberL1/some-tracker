<script lang="ts">
	import type { Pattern, Instrument, Song } from '../../models/song';
	import type {
		ChipProcessor,
		TuningTableSupport,
		InstrumentSupport
	} from '../../chips/base/processor';
	import type { AudioService } from '../../services/audio/audio-service';
	import type { Table } from '../../models/project';
	import Card from '../Card/Card.svelte';
	import PatternEditor from './PatternEditor.svelte';
	import PatternOrder from './PatternOrder.svelte';
	import { TabView } from '../TabView';
	import { TablesView } from '../Tables';
	import { DetailsView } from '../Details';
	import { InstrumentsView } from '../Instruments';
	import IconCarbonChip from '~icons/carbon/chip';
	import IconCarbonListBoxes from '~icons/carbon/list-boxes';
	import IconCarbonDataTable from '~icons/carbon/data-table';
	import IconCarbonWaveform from '~icons/carbon/waveform';
	import IconCarbonInformationSquare from '~icons/carbon/information-square';
	import IconCarbonMaximize from '~icons/carbon/maximize';
	import IconCarbonMinimize from '~icons/carbon/minimize';
	import IconCarbonChevronUp from '~icons/carbon/chevron-up';
	import IconCarbonChevronDown from '~icons/carbon/chevron-down';
	import { PATTERN_EDITOR_CONSTANTS } from './types';
	import { getContext } from 'svelte';
	import Input from '../Input/Input.svelte';
	import { playbackStore } from '../../stores/playback.svelte';
	import StatusBar from './StatusBar.svelte';

	let {
		songs = $bindable(),
		patternOrder = $bindable(),
		chipProcessors,
		patternEditor = $bindable(),
		tables = $bindable(),
		projectSettings = $bindable(),
		onaction
	}: {
		songs: Song[];
		patternOrder: number[];
		chipProcessors: ChipProcessor[];
		patternEditor?: PatternEditor | null;
		tables: Table[];
		projectSettings: Record<string, unknown>;
		onaction?: (data: { action: string }) => void;
	} = $props();

	let sharedPatternOrderIndex = $state(0);
	let sharedSelectedRow = $state(0);
	let activeEditorIndex = $state(0);
	let songViewContainer: HTMLDivElement;
	let patternEditors: PatternEditor[] = $state([]);
	let rightPanelActiveTabId = $state('instruments');
	let isRightPanelExpanded = $state(false);
	let selectedColumn = $state(0);
	let selectedFieldKey = $state<string | null>(null);

	$effect(() => {
		if (rightPanelActiveTabId === 'details') {
			isRightPanelExpanded = false;
		}
	});

	$effect(() => {
		const activeEditor = patternEditors[activeEditorIndex];
		if (activeEditor) {
			selectedColumn = activeEditor.getSelectedColumn();
			selectedFieldKey = activeEditor.getSelectedFieldKey();
			const interval = setInterval(() => {
				selectedColumn = activeEditor.getSelectedColumn();
				selectedFieldKey = activeEditor.getSelectedFieldKey();
			}, 100);
			return () => clearInterval(interval);
		}
	});

	let patternLengthValue = $state('');
	let isPatternLengthInputFocused = $state(false);
	let isPatternLengthButtonAction = $state(false);
	let isUserEditingPatternLength = $state(false);

	const blurredContentClass = $derived(
		isRightPanelExpanded ? 'pointer-events-none opacity-50 blur-sm' : ''
	);

	const services: { audioService: AudioService } = getContext('container');

	let patternsRecord = $state<Record<number, Pattern>>({});

	const songPatterns = $derived(songs.flatMap((song) => song.patterns));

	const SPEED_EFFECT_TYPE = 'S'.charCodeAt(0);

	function handlePatternCreated(pattern: Pattern): void {
		songs.forEach((song) => {
			const existingPattern = song.patterns.find((p) => p.id === pattern.id);
			if (!existingPattern) {
				song.patterns = [...song.patterns, pattern];
			} else {
				song.patterns = song.patterns.map((p) => (p.id === pattern.id ? pattern : p));
			}
		});
	}

	function findLastSpeedCommand(
		song: Song,
		patternOrder: number[],
		startPatternOrderIndex: number,
		startRow: number
	): number | null {
		for (
			let patternOrderIdx = startPatternOrderIndex;
			patternOrderIdx >= 0;
			patternOrderIdx--
		) {
			const patternId = patternOrder[patternOrderIdx];
			const pattern = song.patterns.find((p) => p.id === patternId);
			if (!pattern) continue;

			const startRowIdx =
				patternOrderIdx === startPatternOrderIndex ? startRow : pattern.length - 1;

			for (let rowIdx = startRowIdx; rowIdx >= 0; rowIdx--) {
				for (const channel of pattern.channels) {
					const row = channel.rows[rowIdx];
					if (row.effects[0] && row.effects[0].effect === SPEED_EFFECT_TYPE) {
						const speed = row.effects[0].parameter;
						if (speed > 0) {
							return speed;
						}
					}
				}
			}
		}

		return null;
	}

	function getSpeedForChip(chipIndex: number): number | null {
		const song = songs[chipIndex];
		if (!song) return null;

		const lastSpeed = findLastSpeedCommand(
			song,
			patternOrder,
			sharedPatternOrderIndex,
			sharedSelectedRow
		);
		return lastSpeed !== null ? lastSpeed : song.initialSpeed;
	}

	function initAllChips(playPattern: boolean) {
		const patternId = patternOrder[sharedPatternOrderIndex];
		const patternOrderIndexForInit = playPattern ? 0 : sharedPatternOrderIndex;

		if (playPattern) {
			services.audioService.setPlayPatternRestoreOrder([...patternOrder], patternId);
			services.audioService.updateOrder([patternId]);
		}

		chipProcessors.forEach((chipProcessor, index) => {
			const song = songs[index];
			if (!song) return;

			const currentPattern = song.patterns.find((p) => p.id === patternId);
			if (!currentPattern) return;

			chipProcessor.sendInitPattern(currentPattern, patternOrderIndexForInit);
			chipProcessor.sendInitSpeed(song.initialSpeed);

			//TODO: this should be generic
			if (chipProcessor.chip.type === 'ay') {
				const withTuningTables = chipProcessor as ChipProcessor & TuningTableSupport;
				const withInstruments = chipProcessor as ChipProcessor & InstrumentSupport;

				withTuningTables.sendInitTuningTable(song.tuningTable);
				withInstruments.sendInitInstruments(song.instruments);
			}
		});

		if (!playPattern) {
			services.audioService.updateOrder(patternOrder);
		}
	}

	function initAllChipsForPlayback() {
		initAllChips(false);
	}

	function initAllChipsForPlayPattern() {
		initAllChips(true);
	}

	function getSpeedForPlayPattern(chipIndex: number): number | null {
		const song = songs[chipIndex];
		if (!song) return null;

		const lastSpeed = findLastSpeedCommand(song, patternOrder, sharedPatternOrderIndex, 0);
		return lastSpeed !== null ? lastSpeed : song.initialSpeed;
	}

	$effect(() => {
		if (songs.length === 0) {
			patternsRecord = {};
			return;
		}
		const record: Record<number, Pattern> = {};
		for (const song of songs) {
			for (const pattern of song.patterns) {
				record[pattern.id] = pattern;
			}
		}
		patternsRecord = record;
	});

	const lineHeight =
		PATTERN_EDITOR_CONSTANTS.FONT_SIZE * PATTERN_EDITOR_CONSTANTS.LINE_HEIGHT_MULTIPLIER;

	let patternOrderHeight = $state(PATTERN_EDITOR_CONSTANTS.DEFAULT_CANVAS_HEIGHT);

	const rightPanelTabs = [
		{ id: 'instruments', label: 'Instruments', icon: IconCarbonWaveform },
		{ id: 'tables', label: 'Tables', icon: IconCarbonDataTable },
		{ id: 'details', label: 'Details', icon: IconCarbonInformationSquare }
	];

	$effect(() => {
		if (!songViewContainer) return;

		const resizeObserver = new ResizeObserver(() => {
			if (songViewContainer.clientHeight > 0) {
				const availableHeight = songViewContainer.clientHeight;
				const gap = 8;
				patternOrderHeight = Math.max(
					PATTERN_EDITOR_CONSTANTS.MIN_CANVAS_HEIGHT,
					availableHeight - gap
				);
			}
		});

		resizeObserver.observe(songViewContainer);

		return () => {
			resizeObserver.disconnect();
		};
	});

	const currentPatternLength = $derived.by(() => {
		if (patternEditors.length === 0) return null;
		const activeEditor = patternEditors[activeEditorIndex];
		if (!activeEditor) return null;
		return activeEditor.getCurrentPatternLength?.() ?? null;
	});

	let lastSyncedEditorIndex = $state(-1);
	let lastSyncedPatternOrderIndex = $state(-1);
	let expectedPatternLength = $state<number | null>(null);

	function syncPatternLengthValue() {
		if (
			isPatternLengthInputFocused ||
			isPatternLengthButtonAction ||
			isUserEditingPatternLength
		) {
			return;
		}
		const activeEditor = patternEditors[activeEditorIndex];
		if (!activeEditor) {
			return;
		}
		const length = currentPatternLength;
		if (length !== null) {
			patternLengthValue = length.toString();
		}
	}

	$effect(() => {
		if (activeEditorIndex !== lastSyncedEditorIndex) {
			lastSyncedEditorIndex = activeEditorIndex;
			syncPatternLengthValue();
		}
	});

	$effect(() => {
		if (sharedPatternOrderIndex !== lastSyncedPatternOrderIndex) {
			lastSyncedPatternOrderIndex = sharedPatternOrderIndex;
			isPatternLengthInputFocused = false;
			isPatternLengthButtonAction = false;
			isUserEditingPatternLength = false;
			expectedPatternLength = null;
			syncPatternLengthValue();
		}
	});

	$effect(() => {
		if (expectedPatternLength !== null && currentPatternLength === expectedPatternLength) {
			isUserEditingPatternLength = false;
			isPatternLengthButtonAction = false;
			expectedPatternLength = null;
		}
	});

	$effect(() => {
		if (
			currentPatternLength !== null &&
			patternLengthValue === '' &&
			!isPatternLengthInputFocused &&
			!isPatternLengthButtonAction &&
			!isUserEditingPatternLength
		) {
			syncPatternLengthValue();
		}
	});

	function commitPatternLength() {
		isPatternLengthInputFocused = false;
		const length = parseInt(patternLengthValue, 10);
		const activeEditor = patternEditors[activeEditorIndex];
		if (!isNaN(length) && length >= 1 && length <= 256 && activeEditor) {
			try {
				activeEditor.resizePatternTo?.(length);
				expectedPatternLength = length;
			} catch (error) {
				console.error('Failed to resize pattern:', error);
				const current = currentPatternLength;
				if (current !== null) {
					patternLengthValue = current.toString();
				}
				isUserEditingPatternLength = false;
				expectedPatternLength = null;
			}
		} else {
			const current = currentPatternLength;
			if (current !== null) {
				patternLengthValue = current.toString();
			}
			isUserEditingPatternLength = false;
			expectedPatternLength = null;
		}
	}

	function incrementPatternLength() {
		const current = parseInt(patternLengthValue, 10);
		const activeEditor = patternEditors[activeEditorIndex];
		if (isNaN(current) || current < 1 || current >= 256 || !activeEditor) {
			return;
		}
		isPatternLengthButtonAction = true;
		isUserEditingPatternLength = true;
		const newLength = current + 1;
		try {
			activeEditor.resizePatternTo?.(newLength);
			patternLengthValue = newLength.toString();
			expectedPatternLength = newLength;
		} catch (error) {
			console.error('Failed to increment pattern length:', error);
			const actual = currentPatternLength;
			if (actual !== null) {
				patternLengthValue = actual.toString();
			}
			isUserEditingPatternLength = false;
			isPatternLengthButtonAction = false;
			expectedPatternLength = null;
		}
	}

	function decrementPatternLength() {
		const current = parseInt(patternLengthValue, 10);
		const activeEditor = patternEditors[activeEditorIndex];
		if (isNaN(current) || current <= 1 || current > 256 || !activeEditor) {
			return;
		}
		isPatternLengthButtonAction = true;
		isUserEditingPatternLength = true;
		const newLength = current - 1;
		try {
			activeEditor.resizePatternTo?.(newLength);
			patternLengthValue = newLength.toString();
			expectedPatternLength = newLength;
		} catch (error) {
			console.error('Failed to decrement pattern length:', error);
			const actual = currentPatternLength;
			if (actual !== null) {
				patternLengthValue = actual.toString();
			}
			isUserEditingPatternLength = false;
			isPatternLengthButtonAction = false;
			expectedPatternLength = null;
		}
	}
</script>

<div bind:this={songViewContainer} class="relative flex h-full flex-col overflow-hidden">
	<div class="flex flex-1 overflow-hidden">
		<div class="h-full shrink-0 transition-all duration-300 {blurredContentClass}">
			<Card
				title="Patterns Order"
				fullHeight={true}
				icon={IconCarbonListBoxes}
				class="overflow-hidden p-0">
				<PatternOrder
					bind:currentPatternOrderIndex={sharedPatternOrderIndex}
					bind:patterns={patternsRecord}
					bind:selectedRow={sharedSelectedRow}
					bind:patternOrder
					canvasHeight={patternOrderHeight}
					{lineHeight}
					{songPatterns}
					{songs}
					onPatternCreated={handlePatternCreated} />
			</Card>
		</div>
		<div
			class="flex flex-1 flex-col justify-center overflow-hidden transition-all duration-300 {blurredContentClass}">
			<div class="flex flex-1 justify-center overflow-hidden">
				{#each songs as song, i}
					<Card
						title={`${chipProcessors[i].chip.name} - (${i + 1})`}
						fullHeight={true}
						icon={IconCarbonChip}
						class="flex flex-col p-0">
						{#snippet headerContent()}
							{#if currentPatternLength !== null && activeEditorIndex === i}
								<div class="flex items-center gap-1">
									<div
										class="flex items-center rounded border border-[var(--color-app-border)] bg-[var(--color-app-surface)] {playbackStore.isPlaying
											? 'opacity-50'
											: ''}">
										<Input
											value={patternLengthValue}
											id="pattern-length-input-{i}"
											type="number"
											min="1"
											max="256"
											step="1"
											disabled={playbackStore.isPlaying}
											class="h-5 w-10 border-0 bg-transparent px-1 py-0 text-center font-mono text-xs leading-none focus:ring-0 disabled:cursor-not-allowed"
											onfocus={() => {
												if (!playbackStore.isPlaying) {
													isPatternLengthInputFocused = true;
													isUserEditingPatternLength = true;
												}
											}}
											oninput={(e) => {
												if (!playbackStore.isPlaying) {
													isPatternLengthInputFocused = true;
													isUserEditingPatternLength = true;
													patternLengthValue = (
														e.target as HTMLInputElement
													).value;
												}
											}}
											onblur={() => {
												isPatternLengthInputFocused = false;
												if (!playbackStore.isPlaying) {
													commitPatternLength();
												}
											}}
											onkeydown={(e: KeyboardEvent) => {
												if (playbackStore.isPlaying) {
													e.preventDefault();
													return;
												}
												if (e.key === 'Enter') {
													e.preventDefault();
													commitPatternLength();
													(e.target as HTMLInputElement)?.blur();
												}
											}} />
										<div
											class="flex flex-col border-l border-[var(--color-app-border)]">
											<button
												type="button"
												disabled={playbackStore.isPlaying}
												class="flex h-2.5 w-3.5 cursor-pointer items-center justify-center border-b border-[var(--color-app-border)] transition-colors hover:bg-[var(--color-app-surface-hover)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
												onclick={() => {
													if (!playbackStore.isPlaying) {
														incrementPatternLength();
													}
												}}
												title="Increment pattern length">
												<IconCarbonChevronUp
													class="h-2 w-2 text-[var(--color-app-text-muted)]" />
											</button>
											<button
												type="button"
												disabled={playbackStore.isPlaying}
												class="flex h-2.5 w-3.5 cursor-pointer items-center justify-center transition-colors hover:bg-[var(--color-app-surface-hover)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
												onclick={() => {
													if (!playbackStore.isPlaying) {
														decrementPatternLength();
													}
												}}
												title="Decrement pattern length">
												<IconCarbonChevronDown
													class="h-2 w-2 text-[var(--color-app-text-muted)]" />
											</button>
										</div>
									</div>
								</div>
							{/if}
						{/snippet}
						<div class="flex flex-1 flex-col overflow-hidden">
							<PatternEditor
								bind:this={patternEditors[i]}
								bind:patterns={song.patterns}
								bind:patternOrder
								bind:currentPatternOrderIndex={sharedPatternOrderIndex}
								bind:selectedRow={sharedSelectedRow}
								isActive={activeEditorIndex === i}
								onfocus={() => {
									activeEditorIndex = i;
									patternEditor = patternEditors[i];
									syncPatternLengthValue();
								}}
								{onaction}
								initAllChips={initAllChipsForPlayback}
								{initAllChipsForPlayPattern}
								{getSpeedForChip}
								{getSpeedForPlayPattern}
								speed={song.initialSpeed}
								tuningTable={song.tuningTable}
								instruments={song.instruments}
								{tables}
								chip={chipProcessors[i].chip}
								chipProcessor={chipProcessors[i]} />
						</div>
					</Card>
				{/each}
			</div>
		</div>
		<div
			class="relative z-10 h-full shrink-0 border-l border-[var(--color-app-border)] bg-[var(--color-app-surface-secondary)] transition-all duration-300 {isRightPanelExpanded
				? 'w-[1200px]'
				: 'w-[28rem]'}">
			<TabView tabs={rightPanelTabs} bind:activeTabId={rightPanelActiveTabId}>
				{#snippet children(tabId)}
					{#if tabId === 'tables'}
						<TablesView bind:tables bind:isExpanded={isRightPanelExpanded} />
					{:else if tabId === 'instruments'}
						<InstrumentsView
							{songs}
							bind:isExpanded={isRightPanelExpanded}
							chip={chipProcessors[0].chip} />
					{:else if tabId === 'details'}
						<DetailsView {chipProcessors} bind:values={projectSettings} {songs} />
					{/if}
				{/snippet}
			</TabView>
		</div>
	</div>
	{#if songs.length > 0 && activeEditorIndex < songs.length}
		{@const activeSong = songs[activeEditorIndex]}
		<StatusBar
			pattern={activeSong.patterns.find(
				(p) => p.id === patternOrder[sharedPatternOrderIndex]
			) || null}
			selectedRow={sharedSelectedRow}
			{selectedFieldKey}
			currentPatternOrderIndex={sharedPatternOrderIndex}
			{patternOrder}
			patterns={activeSong.patterns}
			speed={activeSong.initialSpeed}
			interruptFrequency={activeSong.interruptFrequency || 50}
			chip={chipProcessors[activeEditorIndex].chip} />
	{/if}
</div>

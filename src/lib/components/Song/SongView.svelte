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
	import { PATTERN_EDITOR_CONSTANTS } from './types';
	import { getContext } from 'svelte';

	let {
		songs = $bindable(),
		patternOrder = $bindable(),
		chipProcessors,
		patternEditor = $bindable(),
		tables = $bindable(),
		projectSettings = $bindable()
	}: {
		songs: Song[];
		patternOrder: number[];
		chipProcessors: ChipProcessor[];
		patternEditor?: PatternEditor | null;
		tables: Table[];
		projectSettings: Record<string, unknown>;
	} = $props();

	let sharedPatternOrderIndex = $state(0);
	let sharedSelectedRow = $state(0);
	let activeEditorIndex = $state(0);
	let songViewContainer: HTMLDivElement;
	let patternEditors: PatternEditor[] = $state([]);
	let rightPanelActiveTabId = $state('tables');
	let isRightPanelExpanded = $state(false);

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

	function initAllChipsForPlayback() {
		chipProcessors.forEach((chipProcessor, index) => {
			const song = songs[index];
			if (!song) return;

			const patternId = patternOrder[sharedPatternOrderIndex];
			const currentPattern = song.patterns.find((p) => p.id === patternId);
			if (!currentPattern) {
				return;
			}

			chipProcessor.sendInitPattern(currentPattern, sharedPatternOrderIndex);
			chipProcessor.sendInitSpeed(song.initialSpeed);

			//TODO: this should be generic
			if (chipProcessor.chip.type === 'ay') {
				const withTuningTables = chipProcessor as ChipProcessor & TuningTableSupport;
				const withInstruments = chipProcessor as ChipProcessor & InstrumentSupport;

				withTuningTables.sendInitTuningTable(song.tuningTable);
				withInstruments.sendInitInstruments(song.instruments);
			}
		});

		services.audioService.updateOrder(patternOrder);
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
		{ id: 'tables', label: 'Tables', icon: IconCarbonDataTable },
		{ id: 'instruments', label: 'Instruments', icon: IconCarbonWaveform },
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
</script>

<div bind:this={songViewContainer} class="relative flex h-full overflow-hidden">
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
		class="flex flex-1 justify-center overflow-hidden transition-all duration-300 {blurredContentClass}">
		{#each songs as song, i}
			<Card
				title={`${chipProcessors[i].chip.name} - (${i + 1})`}
				fullHeight={true}
				icon={IconCarbonChip}
				class="p-0">
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
					}}
					initAllChips={initAllChipsForPlayback}
					{getSpeedForChip}
					speed={song.initialSpeed}
					tuningTable={song.tuningTable}
					instruments={song.instruments}
					{tables}
					chip={chipProcessors[i].chip}
					chipProcessor={chipProcessors[i]} />
			</Card>
		{/each}
	</div>
	<div
		class="relative z-10 h-full shrink-0 border-l border-[var(--color-app-border)] bg-[var(--color-app-surface-secondary)] transition-all duration-300 {isRightPanelExpanded
			? 'w-[1200px]'
			: 'w-96'}">
		<TabView tabs={rightPanelTabs} bind:activeTabId={rightPanelActiveTabId}>
			{#snippet headerActions()}
				<button
					class="flex cursor-pointer items-center justify-center rounded px-2 py-1 text-[var(--color-app-text-tertiary)] transition-colors hover:bg-[var(--color-app-surface-hover)] hover:text-[var(--color-app-text-primary)]"
					onclick={() => (isRightPanelExpanded = !isRightPanelExpanded)}
					title={isRightPanelExpanded ? 'Collapse panel' : 'Expand panel'}>
					{#if isRightPanelExpanded}
						<IconCarbonMinimize class="h-4 w-4" />
					{:else}
						<IconCarbonMaximize class="h-4 w-4" />
					{/if}
				</button>
			{/snippet}
			{#snippet children(tabId)}
				{#if tabId === 'tables'}
					<TablesView bind:tables isExpanded={isRightPanelExpanded} />
				{:else if tabId === 'instruments'}
					<InstrumentsView {songs} isExpanded={isRightPanelExpanded} chip={chipProcessors[0].chip} />
				{:else if tabId === 'details'}
					<DetailsView {chipProcessors} bind:values={projectSettings} {songs} />
				{/if}
			{/snippet}
		</TabView>
	</div>
</div>

<script lang="ts">
	import type { Instrument, Song } from '../../models/song';
	import { Instrument as InstrumentModel } from '../../models/song';
	import { InstrumentRow } from '../../models/song';
	import IconCarbonWaveform from '~icons/carbon/waveform';
	import IconCarbonHexagonSolid from '~icons/carbon/hexagon-solid';
	import IconCarbonHexagonOutline from '~icons/carbon/hexagon-outline';
	import InstrumentEditor from './InstrumentEditor.svelte';
	import Card from '../Card/Card.svelte';
	import { getContext } from 'svelte';
	import type { AudioService } from '../../services/audio/audio-service';

	const services: { audioService: AudioService } = getContext('container');
	const TOTAL_INSTRUMENTS = 32;

	let {
		songs = [],
		isExpanded = false
	}: {
		songs: Song[];
		isExpanded: boolean;
	} = $props();

	// Work with the first song's instruments (or create a new array if no songs)
	let instruments = $derived.by(() => {
		if (songs.length === 0) return [];
		return songs[0].instruments;
	});

	let asHex = $state(false);
	let selectedInstrumentIndex = $state(0);
	let instrumentEditor: InstrumentEditor | null = $state(null);

	const hexIcon = $derived(asHex ? IconCarbonHexagonSolid : IconCarbonHexagonOutline);

	const cardActions = $derived([
		{
			label: 'Hex',
			icon: hexIcon,
			onClick: () => (asHex = !asHex),
			class: asHex ? 'text-blue-400' : ''
		}
	]);

	function isInstrumentUsed(instrument: Instrument): boolean {
		if (instrument.rows.length === 0) return false;
		if (instrument.rows.length === 1) {
			const row = instrument.rows[0];
			const isEmpty =
				!row.tone &&
				!row.noise &&
				!row.envelope &&
				row.toneAdd === 0 &&
				row.noiseAdd === 0 &&
				row.volume === 0;
			if (isEmpty && instrument.loop === 0) return false;
		}
		return true;
	}

	function handleInstrumentChange(instrument: Instrument): void {
		if (songs.length === 0) return;
		songs[0].instruments[selectedInstrumentIndex] = { ...instrument };
		songs[0].instruments = [...songs[0].instruments];
		songs = [...songs];
		services.audioService.updateInstruments(songs[0].instruments);
	}

	$effect(() => {
		if (songs.length === 0) return;

		const currentInstruments = songs[0].instruments;
		if (!currentInstruments || currentInstruments.length !== TOTAL_INSTRUMENTS) {
			const newInstruments = currentInstruments ? [...currentInstruments] : [];
			while (newInstruments.length < TOTAL_INSTRUMENTS) {
				const id = newInstruments.length;
				newInstruments.push(new InstrumentModel(id, [], 0, `Instrument ${id + 1}`));
			}
			if (newInstruments.length > TOTAL_INSTRUMENTS) {
				newInstruments.splice(TOTAL_INSTRUMENTS);
			}
			songs[0].instruments = newInstruments;
			songs = [...songs];
		}
	});

	$effect(() => {
		const currentInstruments = instruments;
		if (currentInstruments && selectedInstrumentIndex >= currentInstruments.length) {
			selectedInstrumentIndex = 0;
		}
	});
</script>

<div class="flex h-full flex-col">
	<Card
		title="Instruments"
		icon={IconCarbonWaveform}
		fullHeight={true}
		class="flex flex-col"
		actions={cardActions}>
		{#snippet children()}
			<div class="border-b border-neutral-700 bg-neutral-800">
				<div class="flex overflow-x-auto">
					{#each instruments || [] as instrument, index}
						{@const isUsed = isInstrumentUsed(instrument)}
						{@const isSelected = selectedInstrumentIndex === index}
						<button
							class="group relative flex shrink-0 cursor-pointer flex-col items-center border-r border-neutral-700 p-3 {isSelected
								? 'bg-blue-900/30'
								: isUsed
									? 'bg-neutral-800/40 hover:bg-neutral-800/70'
									: 'bg-neutral-950/60 hover:bg-neutral-950/80'}"
							onclick={() => (selectedInstrumentIndex = index)}>
							<span
								class="font-mono text-xs font-semibold {isSelected
									? 'text-blue-200'
									: isUsed
										? 'text-neutral-300 group-hover:text-neutral-100'
										: 'text-neutral-700 group-hover:text-neutral-600'}">
								{instrument.id.toString(36).toUpperCase().padStart(2, '0')}
							</span>
							<span
								class="text-xs {isSelected
									? 'text-blue-300/90'
									: isUsed
										? 'text-neutral-400 group-hover:text-neutral-300'
										: 'text-neutral-800 group-hover:text-neutral-700'}">
								{instrument.name}
							</span>
						</button>
					{/each}
				</div>
			</div>

			<div class="flex-1 overflow-auto p-4">
				{#if instruments && instruments[selectedInstrumentIndex]}
					{#key instruments[selectedInstrumentIndex].id}
						<InstrumentEditor
							bind:this={instrumentEditor}
							instrument={instruments[selectedInstrumentIndex]}
							{asHex}
							{isExpanded}
							onInstrumentChange={handleInstrumentChange} />
					{/key}
				{/if}
			</div>
		{/snippet}
	</Card>
</div>

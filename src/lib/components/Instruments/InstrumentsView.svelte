<script lang="ts">
	import type { Instrument, Song } from '../../models/song';
	import { Instrument as InstrumentModel } from '../../models/song';
	import { InstrumentRow } from '../../models/song';
	import IconCarbonWaveform from '~icons/carbon/waveform';
	import IconCarbonHexagonSolid from '~icons/carbon/hexagon-solid';
	import IconCarbonHexagonOutline from '~icons/carbon/hexagon-outline';
	import IconCarbonAdd from '~icons/carbon/add';
	import IconCarbonTrashCan from '~icons/carbon/trash-can';
	import IconCarbonMaximize from '~icons/carbon/maximize';
	import IconCarbonMinimize from '~icons/carbon/minimize';
	import Card from '../Card/Card.svelte';
	import Input from '../Input/Input.svelte';
	import { getContext } from 'svelte';
	import type { AudioService } from '../../services/audio/audio-service';
	import type { Chip } from '../../chips/types';
	import {
		isValidInstrumentId,
		normalizeInstrumentId,
		getNextAvailableInstrumentId,
		isInstrumentIdInRange
	} from '../../utils/instrument-id';

	const services: { audioService: AudioService } = getContext('container');

	let {
		songs = [],
		isExpanded = $bindable(false),
		chip
	}: {
		songs: Song[];
		isExpanded: boolean;
		chip: Chip;
	} = $props();

	// Work with the first song's instruments (or create a new array if no songs)
	let instruments = $derived.by(() => {
		if (songs.length === 0) return [];
		return songs[0].instruments;
	});

	let asHex = $state(false);
	let selectedInstrumentIndex = $state(0);
	let instrumentEditorRef: any = $state(null);

	const InstrumentEditor = $derived(chip.instrumentEditor);

	const hexIcon = $derived(asHex ? IconCarbonHexagonSolid : IconCarbonHexagonOutline);
	const expandIcon = $derived(isExpanded ? IconCarbonMinimize : IconCarbonMaximize);

	const cardActions = $derived([
		{
			label: 'Hex',
			icon: hexIcon,
			onClick: () => (asHex = !asHex),
			class: asHex ? 'text-[var(--color-app-primary)]' : ''
		},
		{
			label: isExpanded ? 'Collapse panel' : 'Expand panel',
			icon: expandIcon,
			onClick: () => (isExpanded = !isExpanded),
			class: ''
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

	function addInstrument(): void {
		if (songs.length === 0) return;
		const existingIds = songs[0].instruments.map((inst) => inst.id);
		const newId = getNextAvailableInstrumentId(existingIds);
		const newInstrument = new InstrumentModel(newId, [], 0, `Instrument ${newId}`);
		songs[0].instruments = [...songs[0].instruments, newInstrument];
		songs = [...songs];
		selectedInstrumentIndex = songs[0].instruments.length - 1;
		services.audioService.updateInstruments(songs[0].instruments);
	}

	function removeInstrument(index: number): void {
		if (songs.length === 0) return;
		if (songs[0].instruments.length <= 1) return;
		songs[0].instruments = songs[0].instruments.filter((_, i) => i !== index);
		songs = [...songs];
		if (selectedInstrumentIndex >= songs[0].instruments.length) {
			selectedInstrumentIndex = songs[0].instruments.length - 1;
		}
		services.audioService.updateInstruments(songs[0].instruments);
	}

	function updateInstrumentId(index: number, newId: string): void {
		if (songs.length === 0) return;
		const normalizedId = normalizeInstrumentId(newId);
		if (!isValidInstrumentId(normalizedId) || !isInstrumentIdInRange(normalizedId)) {
			return;
		}
		const existingIds = songs[0].instruments.map((inst, i) => (i === index ? '' : inst.id));
		if (existingIds.includes(normalizedId)) {
			return;
		}
		songs[0].instruments[index].id = normalizedId;
		songs[0].instruments = [...songs[0].instruments];
		songs = [...songs];
		services.audioService.updateInstruments(songs[0].instruments);
	}

	let editingInstrumentId: number | null = $state(null);
	let editingInstrumentIdValue = $state('');

	function startEditingInstrumentId(index: number): void {
		editingInstrumentId = index;
		editingInstrumentIdValue = instruments[index]?.id || '';
	}

	function finishEditingInstrumentId(): void {
		if (editingInstrumentId !== null) {
			updateInstrumentId(editingInstrumentId, editingInstrumentIdValue);
			editingInstrumentId = null;
			editingInstrumentIdValue = '';
		}
	}

	function cancelEditingInstrumentId(): void {
		editingInstrumentId = null;
		editingInstrumentIdValue = '';
	}

	function getInstrumentIdError(index: number, id: string): string | null {
		const normalizedId = normalizeInstrumentId(id);
		if (!isValidInstrumentId(normalizedId)) {
			return 'Invalid format (must be 2 characters: 0-9, A-Z)';
		}
		if (!isInstrumentIdInRange(normalizedId)) {
			return 'ID must be between 01 and ZZ';
		}
		const existingIds = instruments.map((inst, i) => (i === index ? '' : inst.id));
		if (existingIds.includes(normalizedId)) {
			return 'This ID is already used';
		}
		return null;
	}

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
			<div class="border-b border-[var(--color-app-border)] bg-[var(--color-app-surface-secondary)]">
				<div class="flex items-center overflow-x-auto">
					{#each instruments || [] as instrument, index}
						{@const isUsed = isInstrumentUsed(instrument)}
						{@const isSelected = selectedInstrumentIndex === index}
						{@const isEditing = editingInstrumentId === index}
						{#if isEditing}
							<div
								class="group relative flex shrink-0 flex-col items-center border-r border-[var(--color-app-border)] p-3 {isSelected
									? 'bg-[var(--color-app-primary)]'
									: isUsed
										? 'bg-[var(--color-app-surface-secondary)]/40 hover:bg-[var(--color-app-surface-secondary)]/70'
										: 'bg-[var(--color-app-background)]/60 hover:bg-[var(--color-app-background)]/80'}">
								<div class="flex flex-col items-center gap-1">
									<Input
										class="w-12 text-center font-mono text-xs"
										value={editingInstrumentIdValue}
										oninput={(e) => {
											const value = (
												e.target as HTMLInputElement
											).value.toUpperCase();
											if (value.length <= 2 && /^[0-9A-Z]*$/.test(value)) {
												editingInstrumentIdValue = value;
											}
										}}
										onkeydown={(e) => {
											if (e.key === 'Enter') {
												finishEditingInstrumentId();
											} else if (e.key === 'Escape') {
												cancelEditingInstrumentId();
											}
										}}
										onblur={finishEditingInstrumentId}
										autofocus />
									{#if editingInstrumentIdValue}
										{@const error = getInstrumentIdError(
											index,
											editingInstrumentIdValue
										)}
										{#if error}
											<span class="text-[0.6rem] text-red-400">{error}</span>
										{/if}
									{/if}
								</div>
							</div>
						{:else}
							<div
								class="group relative flex shrink-0 flex-col items-center border-r border-[var(--color-app-border)]">
								<button
									class="flex w-full shrink-0 cursor-pointer flex-col items-center p-3 {isSelected
										? 'bg-[var(--color-app-primary)]'
										: isUsed
											? 'bg-[var(--color-app-surface-secondary)]/40 hover:bg-[var(--color-app-surface-secondary)]/70'
											: 'bg-[var(--color-app-background)]/60 hover:bg-[var(--color-app-background)]/80'}"
									onclick={() => (selectedInstrumentIndex = index)}
									ondblclick={() => startEditingInstrumentId(index)}>
									<span
										class="font-mono text-xs font-semibold {isSelected
											? 'text-[var(--color-app-text-secondary)]'
											: isUsed
												? 'text-[var(--color-app-text-tertiary)] group-hover:text-[var(--color-app-text-primary)]'
												: 'text-[var(--color-app-text-muted)] group-hover:text-[var(--color-app-text-tertiary)]'}">
										{instrument.id}
									</span>
									<span
										class="text-xs {isSelected
											? 'text-[var(--color-app-text-secondary)]'
											: isUsed
												? 'text-[var(--color-app-text-muted)] group-hover:text-[var(--color-app-text-tertiary)]'
												: 'text-[var(--color-app-text-muted)] group-hover:text-[var(--color-app-text-muted)]'}">
										{instrument.name}
									</span>
								</button>
								{#if instruments.length > 1}
									<button
										class="absolute top-1 right-1 cursor-pointer rounded p-0.5 text-[var(--color-app-text-muted)] opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-400"
										onclick={(e) => {
											e.stopPropagation();
											removeInstrument(index);
										}}
										title="Remove instrument">
										<IconCarbonTrashCan class="h-3 w-3" />
									</button>
								{/if}
							</div>
						{/if}
					{/each}
					<button
						class="ml-2 flex shrink-0 items-center gap-1 rounded border border-[var(--color-app-border)] bg-[var(--color-app-surface-secondary)] px-3 py-2 text-xs text-[var(--color-app-text-tertiary)] transition-colors hover:bg-[var(--color-app-surface-hover)] hover:text-[var(--color-app-text-primary)]"
						onclick={addInstrument}
						title="Add new instrument">
						<IconCarbonAdd class="h-4 w-4" />
						<span>Add</span>
					</button>
				</div>
			</div>

			<div class="flex-1 overflow-auto p-4">
				{#if instruments && instruments[selectedInstrumentIndex]}
					{#key instruments[selectedInstrumentIndex].id}
						<InstrumentEditor
							bind:this={instrumentEditorRef}
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

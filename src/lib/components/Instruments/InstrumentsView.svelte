<script lang="ts">
	import type { Instrument, Song } from '../../models/song';
	import { Instrument as InstrumentModel } from '../../models/song';
	import { InstrumentRow } from '../../models/song';
	import IconCarbonWaveform from '~icons/carbon/waveform';
	import IconCarbonHexagonSolid from '~icons/carbon/hexagon-solid';
	import IconCarbonHexagonOutline from '~icons/carbon/hexagon-outline';
	import IconCarbonAdd from '~icons/carbon/add';
	import IconCarbonCopy from '~icons/carbon/copy';
	import IconCarbonTrashCan from '~icons/carbon/trash-can';
	import IconCarbonMaximize from '~icons/carbon/maximize';
	import IconCarbonMinimize from '~icons/carbon/minimize';
	import Card from '../Card/Card.svelte';
	import EditableIdField from '../EditableIdField/EditableIdField.svelte';
	import { getContext, tick, untrack } from 'svelte';
	import type { AudioService } from '../../services/audio/audio-service';
	import type { Chip } from '../../chips/types';
	import {
		isValidInstrumentId,
		normalizeInstrumentId,
		getNextAvailableInstrumentId,
		isInstrumentIdInRange,
		MAX_INSTRUMENT_ID_NUM
	} from '../../utils/instrument-id';
	import { migrateInstrumentIdInSong } from '../../services/project/id-migration';
	import { editorStateStore } from '../../stores/editor-state.svelte';

	const services: { audioService: AudioService } = getContext('container');
	const requestPatternRedraw = getContext<() => void>('requestPatternRedraw');

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
	let instrumentListScrollRef: HTMLDivElement | null = $state(null);

	$effect(() => {
		if (instruments.length > 0 && instruments[selectedInstrumentIndex]) {
			const instrumentId = instruments[selectedInstrumentIndex].id;
			untrack(() => {
				editorStateStore.setCurrentInstrument(instrumentId);
			});
		}
	});

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

	function compareInstrumentIds(a: Instrument, b: Instrument): number {
		return parseInt(a.id, 36) - parseInt(b.id, 36);
	}

	function sortInstrumentsAndSyncSelection(selectedId?: string): void {
		if (songs.length === 0) return;
		const list = songs[0].instruments;
		const sorted = [...list].sort(compareInstrumentIds);
		const needsSort = sorted.some((inst, i) => inst !== list[i]);
		if (!needsSort) return;
		songs[0].instruments = sorted;
		songs = [...songs];
		if (selectedId !== undefined) {
			const newIndex = sorted.findIndex((inst) => inst.id === selectedId);
			if (newIndex >= 0) selectedInstrumentIndex = newIndex;
		}
	}

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
		if (!newId) return;
		const newInstrument = new InstrumentModel(newId, [], 0, `Instrument ${newId}`);
		songs[0].instruments = [...songs[0].instruments, newInstrument];
		songs = [...songs];
		sortInstrumentsAndSyncSelection(newId);
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

	async function copyInstrument(copiedIndex: number): Promise<void> {
		if (songs.length === 0) return;
		const instrument = songs[0].instruments[copiedIndex];
		if (!instrument) return;
		const existingIds = songs[0].instruments.map((inst) => inst.id);
		const newId = getNextAvailableInstrumentId(existingIds);
		if (!newId) return;
		const copiedRows = instrument.rows.map((r) => new InstrumentRow({ ...r }));
		const copy = new InstrumentModel(
			newId,
			copiedRows,
			instrument.loop,
			instrument.name + ' (Copy)'
		);

		songs[0].instruments = [...songs[0].instruments, copy];
		songs = [...songs];
		sortInstrumentsAndSyncSelection(newId);
		services.audioService.updateInstruments(songs[0].instruments);
		await tick();
		instrumentListScrollRef
			?.querySelector(`[data-instrument-index="${selectedInstrumentIndex}"]`)
			?.scrollIntoView({ inline: 'nearest', block: 'nearest' });
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
		const oldId = songs[0].instruments[index].id;
		migrateInstrumentIdInSong(songs[0], oldId, normalizedId);
		songs[0].instruments[index].id = normalizedId;
		songs[0].instruments = [...songs[0].instruments];
		songs = [...songs];
		sortInstrumentsAndSyncSelection(normalizedId);
		services.audioService.updateInstruments(songs[0].instruments);
		requestPatternRedraw?.();
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

	$effect(() => {
		const list = songs[0]?.instruments;
		if (!list || list.length === 0) return;
		sortInstrumentsAndSyncSelection(list[selectedInstrumentIndex]?.id);
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
			<div
				class="border-b border-[var(--color-app-border)] bg-[var(--color-app-surface-secondary)]">
				<div class="flex items-center overflow-x-auto" bind:this={instrumentListScrollRef}>
					{#each instruments || [] as instrument, index}
						{@const isUsed = isInstrumentUsed(instrument)}
						{@const isSelected = selectedInstrumentIndex === index}
						{@const isEditing = editingInstrumentId === index}
						{#if isEditing}
							<div
								data-instrument-index={index}
								class="group relative flex min-w-[6rem] shrink-0 flex-col items-center border-r border-[var(--color-app-border)] p-3 {isSelected
									? 'bg-[var(--color-app-primary)]'
									: isUsed
										? 'bg-[var(--color-app-surface-secondary)]/40 hover:bg-[var(--color-app-surface-secondary)]/70'
										: 'bg-[var(--color-app-background)]/60 hover:bg-[var(--color-app-background)]/80'}">
								<EditableIdField
									bind:value={editingInstrumentIdValue}
									error={editingInstrumentIdValue
										? getInstrumentIdError(index, editingInstrumentIdValue)
										: null}
									onCommit={finishEditingInstrumentId}
									onCancel={cancelEditingInstrumentId}
									maxLength={2}
									inputFilter={(v) =>
										v
											.toUpperCase()
											.slice(0, 2)
											.replace(/[^0-9A-Z]/g, '')} />
							</div>
						{:else}
							<div
								data-instrument-index={index}
								class="group relative flex min-w-[6rem] shrink-0 flex-col items-center border-r border-[var(--color-app-border)]">
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
								<div
									class="absolute top-1 right-1 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
									<button
										class="cursor-pointer rounded p-0.5 text-[var(--color-app-text-muted)] hover:text-[var(--color-app-text-primary)]"
										onclick={(e) => {
											e.stopPropagation();
											copyInstrument(index);
										}}
										title="Copy instrument">
										<IconCarbonCopy class="h-3 w-3" />
									</button>
									{#if instruments.length > 1}
										<button
											class="cursor-pointer rounded p-0.5 text-[var(--color-app-text-muted)] hover:text-red-400"
											onclick={(e) => {
												e.stopPropagation();
												removeInstrument(index);
											}}
											title="Remove instrument">
											<IconCarbonTrashCan class="h-3 w-3" />
										</button>
									{/if}
								</div>
							</div>
						{/if}
					{/each}
					<button
						class="ml-2 flex shrink-0 cursor-pointer items-center gap-1 rounded border border-[var(--color-app-border)] bg-[var(--color-app-surface-secondary)] px-3 py-2 text-xs text-[var(--color-app-text-tertiary)] transition-colors hover:bg-[var(--color-app-surface-hover)] hover:text-[var(--color-app-text-primary)] disabled:cursor-not-allowed disabled:opacity-50"
						onclick={addInstrument}
						disabled={instruments.length >= MAX_INSTRUMENT_ID_NUM}
						title={instruments.length >= MAX_INSTRUMENT_ID_NUM
							? 'Maximum 1295 instruments (01–ZZ)'
							: 'Add new instrument'}>
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

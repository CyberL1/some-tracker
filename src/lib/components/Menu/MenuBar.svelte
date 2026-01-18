<script lang="ts">
	import { playbackStore } from '../../stores/playback.svelte';
	import MenuButton from './MenuButton.svelte';
	import type { MenuItem } from './types';
	import IconCarbonPlayFilledAlt from '~icons/carbon/play-filled-alt';
	import IconCarbonPauseFilled from '~icons/carbon/pause-filled';
	import IconCarbonSkipBackFilled from '~icons/carbon/skip-back-filled';
	import IconCarbonPlay from '~icons/carbon/play';
	import IconCarbonChevronUp from '~icons/carbon/chevron-up';
	import IconCarbonChevronDown from '~icons/carbon/chevron-down';
	import IconCarbonLayers from '~icons/carbon/layers';
	import IconCarbonArrowDown from '~icons/carbon/arrow-down';
	import { settingsStore } from '../../stores/settings.svelte';
	import { editorStateStore } from '../../stores/editor-state.svelte';
	import Input from '../Input/Input.svelte';
	import type { Song } from '../../models/song';
	import Checkbox from '../Checkbox/Checkbox.svelte';

	let activeMenu = $state('');
	let {
		menuItems = [],
		onAction,
		songs = []
	}: {
		menuItems: MenuItem[];
		onAction?: (data: { action: string }) => void;
		songs?: Song[];
	} = $props();

	const hasAYSong = $derived(songs.some((song) => song.chipType === 'ay'));

	const editorState = $derived(editorStateStore.get());

	let octaveValue = $state(editorStateStore.get().octave.toString());
	let stepValue = $state(editorStateStore.get().step.toString());
	let envelopeAsNote = $state(editorStateStore.get().envelopeAsNote);

	$effect(() => {
		octaveValue = editorState.octave.toString();
	});

	$effect(() => {
		stepValue = editorState.step.toString();
	});

	$effect(() => {
		envelopeAsNote = editorState.envelopeAsNote;
	});

	function handleMenuOpen(data: { label: string }) {
		activeMenu = data.label;
	}

	function handleMenuClose(data: { label?: string; all?: boolean }) {
		if (data.all) {
			activeMenu = '';
		} else if (data.label && activeMenu === data.label) {
			activeMenu = '';
		}
	}

	function handleAction(data: { action: string }) {
		onAction?.(data);
	}

	function commitOctave() {
		const octave = parseInt(octaveValue, 10);
		if (!isNaN(octave) && octave >= 0 && octave <= 8) {
			editorStateStore.setOctave(octave);
		} else {
			octaveValue = editorState.octave.toString();
		}
	}

	function commitStep() {
		const step = parseInt(stepValue, 10);
		if (!isNaN(step)) {
			editorStateStore.setStep(step);
		} else {
			stepValue = editorState.step.toString();
		}
	}

	function incrementOctave() {
		const current = editorStateStore.get().octave;
		if (current < 8) {
			editorStateStore.setOctave(current + 1);
		}
	}

	function decrementOctave() {
		const current = editorStateStore.get().octave;
		if (current > 0) {
			editorStateStore.setOctave(current - 1);
		}
	}

	function incrementStep() {
		const current = editorStateStore.get().step;
		editorStateStore.setStep(current + 1);
	}

	function decrementStep() {
		const current = editorStateStore.get().step;
		editorStateStore.setStep(current - 1);
	}
</script>

<div class="flex w-full items-center border-b border-[var(--color-app-border)] bg-[var(--color-app-surface-hover)] px-2 text-center">
	{#each menuItems as item}
		<MenuButton
			label={item.label}
			items={item.items || []}
			{activeMenu}
			onAction={handleAction}
			onMenuOpen={handleMenuOpen}
			onMenuClose={handleMenuClose} />
	{/each}

	<div class="ml-auto flex items-center gap-3">
		<div class="flex items-center gap-1.5">
			<IconCarbonLayers class="h-3.5 w-3.5 text-[var(--color-app-text-muted)]" />
			<label for="octave-input" class="text-xs font-medium text-[var(--color-app-text-tertiary)]">Octave:</label>
			<div class="flex items-center rounded border border-[var(--color-app-border)] bg-[var(--color-app-surface)]">
				<Input
					bind:value={octaveValue}
					id="octave-input"
					type="number"
					min={0}
					max={8}
					class="h-6 w-10 border-0 bg-transparent text-center font-mono text-xs focus:ring-0"
					onblur={commitOctave}
					onkeydown={(e: KeyboardEvent) => {
						if (e.key === 'Enter') {
							e.preventDefault();
							commitOctave();
							(e.target as HTMLInputElement)?.blur();
						}
					}} />
				<div class="flex flex-col border-l border-[var(--color-app-border)]">
					<button
						type="button"
						class="flex h-3 w-4 cursor-pointer items-center justify-center border-b border-[var(--color-app-border)] transition-colors hover:bg-[var(--color-app-surface-hover)]"
						onclick={incrementOctave}
						title="Increment octave">
						<IconCarbonChevronUp class="h-2.5 w-2.5 text-[var(--color-app-text-muted)]" />
					</button>
					<button
						type="button"
						class="flex h-3 w-4 cursor-pointer items-center justify-center transition-colors hover:bg-[var(--color-app-surface-hover)]"
						onclick={decrementOctave}
						title="Decrement octave">
						<IconCarbonChevronDown class="h-2.5 w-2.5 text-[var(--color-app-text-muted)]" />
					</button>
				</div>
			</div>
		</div>
		<div class="flex items-center gap-1.5">
			<IconCarbonArrowDown class="h-3.5 w-3.5 text-[var(--color-app-text-muted)]" />
			<label for="step-input" class="text-xs font-medium text-[var(--color-app-text-tertiary)]">Step:</label>
			<div class="flex items-center rounded border border-[var(--color-app-border)] bg-[var(--color-app-surface)]">
				<Input
					bind:value={stepValue}
					id="step-input"
					type="number"
					class="h-6 w-10 border-0 bg-transparent text-center font-mono text-xs focus:ring-0"
					onblur={commitStep}
					onkeydown={(e: KeyboardEvent) => {
						if (e.key === 'Enter') {
							e.preventDefault();
							commitStep();
							(e.target as HTMLInputElement)?.blur();
						} else if (e.key === 'ArrowUp') {
							e.preventDefault();
							incrementStep();
							commitStep();
						} else if (e.key === 'ArrowDown') {
							e.preventDefault();
							decrementStep();
							commitStep();
						}
					}} />
				<div class="flex flex-col border-l border-[var(--color-app-border)]">
					<button
						type="button"
						class="flex h-3 w-4 cursor-pointer items-center justify-center border-b border-[var(--color-app-border)] transition-colors hover:bg-[var(--color-app-surface-hover)]"
						onclick={incrementStep}
						title="Increment step">
						<IconCarbonChevronUp class="h-2.5 w-2.5 text-[var(--color-app-text-muted)]" />
					</button>
					<button
						type="button"
						class="flex h-3 w-4 cursor-pointer items-center justify-center transition-colors hover:bg-[var(--color-app-surface-hover)]"
						onclick={decrementStep}
						title="Decrement step">
						<IconCarbonChevronDown class="h-2.5 w-2.5 text-[var(--color-app-text-muted)]" />
					</button>
				</div>
			</div>
		</div>
		{#if hasAYSong}
			<div class="flex items-center gap-1.5">
				<label class="flex cursor-pointer items-center gap-1.5">
					<Checkbox
						showStatus={false}
						bind:checked={envelopeAsNote}
						onchange={() => {
							editorStateStore.setEnvelopeAsNote(envelopeAsNote);
						}}
						title="Envelope as Note" />
					<span class="text-xs font-medium text-[var(--color-app-text-tertiary)]">Env as Note</span>
				</label>
			</div>
		{/if}
	</div>

	<div class="absolute top-3.5 left-1/2 flex -translate-x-1/2 -translate-y-1/2 gap-1">
		<button
			class="rounded-sm border border-[var(--color-app-border)] bg-[var(--color-app-surface-active)] p-2 transition-colors hover:cursor-pointer hover:bg-[var(--color-app-surface-hover)]"
			title="Play from beginning"
			onclick={() => {
				onAction?.({ action: 'playFromBeginning' });
			}}>
			<IconCarbonSkipBackFilled class="h-4 w-4" />
		</button>

		<button
			class="rounded-sm border border-[var(--color-app-border)] bg-[var(--color-app-surface-active)] p-2 transition-colors hover:cursor-pointer hover:bg-[var(--color-app-surface-hover)]"
			title={playbackStore.isPlaying ? 'Pause' : 'Play/Resume'}
			onclick={() => {
				onAction?.({ action: 'togglePlayback' });
			}}>
			{#if !playbackStore.isPlaying}
				<IconCarbonPlayFilledAlt class="h-4 w-4" />
			{:else}
				<IconCarbonPauseFilled class="h-4 w-4" />
			{/if}
		</button>

		<button
			class="rounded-sm border border-[var(--color-app-border)] bg-[var(--color-app-surface-active)] p-2 transition-colors hover:cursor-pointer hover:bg-[var(--color-app-surface-hover)]"
			title="Play from cursor position"
			onclick={() => {
				onAction?.({ action: 'playFromCursor' });
			}}>
			<IconCarbonPlay class="h-4 w-4" />
		</button>
	</div>
</div>

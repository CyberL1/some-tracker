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
	import { settingsStore } from '../../stores/settings.svelte';
	import { editorStateStore } from '../../stores/editor-state.svelte';
	import Input from '../Input/Input.svelte';

	let activeMenu = $state('');
	let {
		menuItems = [],
		onAction
	}: {
		menuItems: MenuItem[];
		onAction?: (data: { action: string }) => void;
	} = $props();

	const editorState = $derived(editorStateStore.get());

	let octaveValue = $state(editorStateStore.get().octave.toString());
	let stepValue = $state(editorStateStore.get().step.toString());

	$effect(() => {
		octaveValue = editorState.octave.toString();
	});

	$effect(() => {
		stepValue = editorState.step.toString();
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
		if (!isNaN(octave) && octave >= 0 && octave <= 9) {
			editorStateStore.setOctave(octave);
		} else {
			octaveValue = editorState.octave.toString();
		}
	}

	function commitStep() {
		const step = parseInt(stepValue, 10);
		if (!isNaN(step) && step >= 1) {
			editorStateStore.setStep(step);
		} else {
			stepValue = editorState.step.toString();
		}
	}

	function incrementOctave() {
		const current = editorStateStore.get().octave;
		if (current < 9) {
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
		if (current > 1) {
			editorStateStore.setStep(current - 1);
		}
	}
</script>

<div class="flex w-full items-center border-b border-neutral-600 bg-neutral-700 px-2 text-center">
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
			<label for="octave-input" class="text-xs font-medium text-neutral-300">Octave:</label>
			<div class="flex items-center rounded border border-neutral-600 bg-neutral-900">
				<Input
					bind:value={octaveValue}
					id="octave-input"
					type="number"
					min={0}
					max={9}
					class="h-6 w-10 border-0 bg-transparent text-center font-mono text-xs focus:ring-0"
					onblur={commitOctave}
					onkeydown={(e: KeyboardEvent) => {
						if (e.key === 'Enter') {
							e.preventDefault();
							commitOctave();
							(e.target as HTMLInputElement)?.blur();
						}
					}} />
				<div class="flex flex-col border-l border-neutral-600">
					<button
						type="button"
						class="flex h-3 w-4 items-center justify-center border-b border-neutral-600 transition-colors hover:bg-neutral-700"
						onclick={incrementOctave}
						title="Increment octave">
						<IconCarbonChevronUp class="h-2.5 w-2.5 text-neutral-400" />
					</button>
					<button
						type="button"
						class="flex h-3 w-4 items-center justify-center transition-colors hover:bg-neutral-700"
						onclick={decrementOctave}
						title="Decrement octave">
						<IconCarbonChevronDown class="h-2.5 w-2.5 text-neutral-400" />
					</button>
				</div>
			</div>
		</div>
		<div class="flex items-center gap-1.5">
			<label for="step-input" class="text-xs font-medium text-neutral-300">Step:</label>
			<div class="flex items-center rounded border border-neutral-600 bg-neutral-900">
				<Input
					bind:value={stepValue}
					id="step-input"
					type="number"
					min={1}
					class="h-6 w-10 border-0 bg-transparent text-center font-mono text-xs focus:ring-0"
					onblur={commitStep}
					onkeydown={(e: KeyboardEvent) => {
						if (e.key === 'Enter') {
							e.preventDefault();
							commitStep();
							(e.target as HTMLInputElement)?.blur();
						}
					}} />
				<div class="flex flex-col border-l border-neutral-600">
					<button
						type="button"
						class="flex h-3 w-4 items-center justify-center border-b border-neutral-600 transition-colors hover:bg-neutral-700"
						onclick={incrementStep}
						title="Increment step">
						<IconCarbonChevronUp class="h-2.5 w-2.5 text-neutral-400" />
					</button>
					<button
						type="button"
						class="flex h-3 w-4 items-center justify-center transition-colors hover:bg-neutral-700"
						onclick={decrementStep}
						title="Decrement step">
						<IconCarbonChevronDown class="h-2.5 w-2.5 text-neutral-400" />
					</button>
				</div>
			</div>
		</div>
	</div>

	<div class="absolute top-3.5 left-1/2 flex -translate-x-1/2 -translate-y-1/2 gap-1">
		<button
			class="rounded-sm border border-neutral-400 bg-neutral-600 p-2 transition-colors hover:cursor-pointer hover:bg-neutral-500"
			title="Play from beginning"
			onclick={() => {
				onAction?.({ action: 'playFromBeginning' });
			}}>
			<IconCarbonSkipBackFilled class="h-4 w-4" />
		</button>

		<button
			class="rounded-sm border border-neutral-400 bg-neutral-600 p-2 transition-colors hover:cursor-pointer hover:bg-neutral-500"
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
			class="rounded-sm border border-neutral-400 bg-neutral-600 p-2 transition-colors hover:cursor-pointer hover:bg-neutral-500"
			title="Play from cursor position"
			onclick={() => {
				onAction?.({ action: 'playFromCursor' });
			}}>
			<IconCarbonPlay class="h-4 w-4" />
		</button>
	</div>
</div>

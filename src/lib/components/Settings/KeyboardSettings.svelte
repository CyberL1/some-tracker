<script lang="ts">
	import { BINDABLE_ACTIONS } from '../../config/keybindings';
	import { keybindingsStore } from '../../stores/keybindings.svelte';
	import { ShortcutString } from '../../utils/shortcut-string';
	import Button from '../Button/Button.svelte';

	let recordingActionId = $state<string | null>(null);
	let removeRecordingListener: (() => void) | null = null;

	function startRecording(actionId: string) {
		removeRecordingListener?.();
		recordingActionId = actionId;
		const handler = (event: KeyboardEvent) => {
			event.preventDefault();
			event.stopPropagation();
			if (event.key === 'Escape') {
				recordingActionId = null;
				removeRecordingListener?.();
				removeRecordingListener = null;
				return;
			}
			if (event.key === 'Shift' || event.key === 'Control' || event.key === 'Meta' || event.key === 'Alt') {
				return;
			}
			const shortcut = ShortcutString.fromEvent(event);
			keybindingsStore.setShortcut(actionId, shortcut);
			recordingActionId = null;
			removeRecordingListener?.();
			removeRecordingListener = null;
		};
		window.addEventListener('keydown', handler, true);
		removeRecordingListener = () => {
			window.removeEventListener('keydown', handler, true);
		};
	}

	function handleReset(actionId: string) {
		keybindingsStore.resetShortcut(actionId);
	}

	function handleResetAll() {
		keybindingsStore.resetAll();
	}
</script>

<div class="flex flex-col gap-2">
	<div class="flex items-center justify-between">
		<h3 class="text-xs font-semibold text-[var(--color-app-text-primary)]">Shortcuts</h3>
		<Button variant="secondary" onclick={handleResetAll}>Reset all</Button>
	</div>
	<div class="flex flex-col gap-1">
		{#each BINDABLE_ACTIONS as action (action.id)}
			<div
				class="grid grid-cols-[1fr_auto_auto] gap-x-4 items-center rounded border border-[var(--color-app-border)] px-2 py-1">
				<span class="text-xs text-[var(--color-app-text-primary)]">
					{action.label}
				</span>
				<span class="font-mono text-xs text-[var(--color-app-text-tertiary)]">
					{#if recordingActionId === action.id}
						Press a key...
					{:else}
						{ShortcutString.toDisplay(keybindingsStore.getShortcut(action.id))}
					{/if}
				</span>
				<div class="flex gap-1">
					<Button
						variant="secondary"
						onclick={() => startRecording(action.id)}
						disabled={recordingActionId !== null && recordingActionId !== action.id}>
						{#if recordingActionId === action.id}
							Recording...
						{:else}
							Record
						{/if}
					</Button>
					<Button
						variant="secondary"
						onclick={() => handleReset(action.id)}
						disabled={keybindingsStore.getShortcut(action.id) === action.defaultShortcut}>
						Reset
					</Button>
				</div>
			</div>
		{/each}
	</div>
</div>

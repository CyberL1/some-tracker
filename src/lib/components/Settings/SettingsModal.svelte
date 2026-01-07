<script lang="ts">
	import { settingsItems } from '../../config/settings';
	import { settingsStore } from '../../stores/settings.svelte';
	import type { Settings } from './types';
	import { RangeInput } from '../RangeInput';
	import { Checkbox } from '../Checkbox';
	import { FormField } from '../FormField';
	import Button from '../Button/Button.svelte';

	let { resolve, dismiss } = $props<{
		resolve?: (value?: any) => void;
		dismiss?: (error?: any) => void;
	}>();

	const currentSettings = settingsStore.get();
	let tempSettings = $state<Settings>({ ...currentSettings });

	function handleSave() {
		for (const item of settingsItems) {
			settingsStore.set(item.setting, tempSettings[item.setting]);
		}
		resolve?.();
	}

	function handleDismiss() {
		dismiss?.();
	}
</script>

<div class="w-96">
	<div class="flex items-center gap-2 border-b border-neutral-600 bg-neutral-900 px-4 py-3">
		<h2 class="text-sm font-bold text-neutral-100">Settings</h2>
	</div>

	<div class="max-h-[60vh] overflow-y-auto p-4">
		{#each settingsItems as item (item.setting)}
			{@const settingId = `setting-${item.setting}`}
			<FormField id={settingId} label={item.label} description={item.description}>
				{#if item.type === 'range'}
					<RangeInput
						id={settingId}
						bind:value={tempSettings[item.setting] as number}
						min={0}
						max={100} />
				{:else if item.type === 'toggle'}
					<Checkbox id={settingId} bind:checked={tempSettings[item.setting] as boolean} />
				{/if}
			</FormField>
		{/each}
	</div>

	<div class="flex justify-end gap-2 border-t border-neutral-600 bg-neutral-900 px-4 py-3">
		<Button variant="secondary" onclick={handleDismiss}>Dismiss</Button>
		<Button variant="primary" onclick={handleSave}>Save</Button>
	</div>
</div>

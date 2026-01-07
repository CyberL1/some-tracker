<script lang="ts">
	import { settingsItems, generalSettings, keyboardSettings } from '../../config/settings';
	import { settingsStore } from '../../stores/settings.svelte';
	import type { Settings } from './types';
	import { RangeInput } from '../RangeInput';
	import { Checkbox } from '../Checkbox';
	import { FormField } from '../FormField';
	import Button from '../Button/Button.svelte';
	import ConfirmModal from '../Modal/ConfirmModal.svelte';
	import { open } from '../../services/modal/modal-service';
	import { TabView } from '../TabView';

	let { resolve, dismiss, onCloseRef } = $props<{
		resolve?: (value?: any) => void;
		dismiss?: (error?: any) => void;
		onCloseRef?: { current: (() => void) | null };
	}>();

	const currentSettings = settingsStore.get();
	let tempSettings = $state<Settings>({ ...currentSettings });
	let activeTabId = $state('general');

	const hasUnsavedChanges = $derived(
		settingsItems.some((item) => tempSettings[item.setting] !== currentSettings[item.setting])
	);

	const tabs = [
		{ id: 'general', label: 'General' },
		{ id: 'keyboard', label: 'Keyboard' }
	];

	function handleSave() {
		for (const item of settingsItems) {
			settingsStore.set(item.setting, tempSettings[item.setting]);
		}
		resolve?.();
	}

	async function handleDismiss() {
		if (hasUnsavedChanges) {
			try {
				await open(ConfirmModal, {
					message: 'You have unsaved changes. Are you sure you want to close settings?'
				});
				dismiss?.();
			} catch {}
		} else {
			dismiss?.();
		}
	}

	$effect.pre(() => {
		if (onCloseRef) {
			onCloseRef.current = handleDismiss;
		}
	});
</script>

<div class="flex h-[600px] w-[600px] flex-col">
	<div class="flex items-center gap-2 border-b border-neutral-600 bg-neutral-900 px-4 py-3">
		<h2 class="text-sm font-bold text-neutral-100">Settings</h2>
	</div>

	<TabView {tabs} bind:activeTabId>
		{#snippet children(tabId)}
			<div class="overflow-y-auto p-4">
				{#if tabId === 'general'}
					{#each generalSettings as item (item.setting)}
						{@const settingId = `setting-${item.setting}`}
						<FormField id={settingId} label={item.label} description={item.description}>
							{#if item.type === 'range'}
								<RangeInput
									id={settingId}
									bind:value={tempSettings[item.setting] as number}
									min={0}
									max={100} />
							{:else if item.type === 'toggle'}
								<Checkbox
									id={settingId}
									bind:checked={tempSettings[item.setting] as boolean} />
							{/if}
						</FormField>
					{/each}
				{:else if tabId === 'keyboard'}
					{#each keyboardSettings as item (item.setting)}
						{@const settingId = `setting-${item.setting}`}
						<FormField id={settingId} label={item.label} description={item.description}>
							{#if item.type === 'range'}
								<RangeInput
									id={settingId}
									bind:value={tempSettings[item.setting] as number}
									min={0}
									max={100} />
							{:else if item.type === 'toggle'}
								<Checkbox
									id={settingId}
									bind:checked={tempSettings[item.setting] as boolean} />
							{/if}
						</FormField>
					{/each}
					{#if keyboardSettings.length === 0}
						<p class="text-sm text-neutral-400">No keyboard settings available yet.</p>
					{/if}
				{/if}
			</div>
		{/snippet}
	</TabView>

	<div class="flex justify-end gap-2 border-t border-neutral-600 bg-neutral-900 px-4 py-3">
		<Button variant="secondary" onclick={handleDismiss}>Dismiss</Button>
		<Button variant="primary" onclick={handleSave}>Save</Button>
	</div>
</div>

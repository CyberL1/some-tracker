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
	import AppearanceSettings from './AppearanceSettings.svelte';
	import Input from '../Input/Input.svelte';

	let { resolve, dismiss, onCloseRef, initialTabId } = $props<{
		resolve?: (value?: any) => void;
		dismiss?: (error?: any) => void;
		onCloseRef?: { current: (() => void) | null };
		initialTabId?: string;
	}>();

	const currentSettings = settingsStore.get();
	let tempSettings = $state<Settings>({ ...currentSettings });
	let activeTabId = $state(initialTabId || 'general');

	const hasUnsavedChanges = $derived(
		settingsItems.some((item) => tempSettings[item.setting] !== currentSettings[item.setting])
	);

	const tabs = [
		{ id: 'general', label: 'General' },
		{ id: 'keyboard', label: 'Keyboard' },
		{ id: 'appearance', label: 'Appearance' }
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
	<div class="flex items-center gap-2 border-b border-[var(--color-app-border)] bg-[var(--color-app-surface)] px-4 py-3">
		<h2 class="text-sm font-bold text-[var(--color-app-text-primary)]">Settings</h2>
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
									min={item.min ?? 0}
									max={item.max ?? 100}
									step={item.step ?? 1} />
							{:else if item.type === 'number'}
								<Input
									id={settingId}
									type="number"
									bind:value={tempSettings[item.setting]}
									min={item.min}
									max={item.max}
									step={item.step ?? 1}
									class="w-20 h-14"
									onblur={(e) => {
										const value = Number(e.currentTarget.value);
										const min = item.min ?? -Infinity;
										const max = item.max ?? Infinity;
										if (!isNaN(value)) {
											(tempSettings as any)[item.setting] = Math.max(min, Math.min(max, value));
										} else if (item.defaultValue !== undefined) {
											(tempSettings as any)[item.setting] = item.defaultValue;
										}
									}} />
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
									min={item.min ?? 0}
									max={item.max ?? 100}
									step={item.step ?? 1} />
							{:else if item.type === 'number'}
								<Input
									id={settingId}
									type="number"
									bind:value={tempSettings[item.setting]}
									min={item.min}
									max={item.max}
									step={item.step ?? 1}
									class="w-20 h-14"
									onblur={(e) => {
										const value = Number(e.currentTarget.value);
										const min = item.min ?? -Infinity;
										const max = item.max ?? Infinity;
										if (!isNaN(value)) {
											(tempSettings as any)[item.setting] = Math.max(min, Math.min(max, value));
										} else if (item.defaultValue !== undefined) {
											(tempSettings as any)[item.setting] = item.defaultValue;
										}
									}} />
							{:else if item.type === 'toggle'}
								<Checkbox
									id={settingId}
									bind:checked={tempSettings[item.setting] as boolean} />
							{/if}
						</FormField>
					{/each}
					{#if keyboardSettings.length === 0}
						<p class="text-sm text-[var(--color-app-text-muted)]">No keyboard settings available yet.</p>
					{/if}
				{:else if tabId === 'appearance'}
					<AppearanceSettings onCloseSettings={dismiss} bind:tempSettings={tempSettings} />
				{/if}
			</div>
		{/snippet}
	</TabView>

	<div class="flex justify-end gap-2 border-t border-[var(--color-app-border)] bg-[var(--color-app-surface)] px-4 py-3">
		<Button variant="secondary" onclick={handleDismiss}>Dismiss</Button>
		<Button variant="primary" onclick={handleSave}>Save</Button>
	</div>
</div>

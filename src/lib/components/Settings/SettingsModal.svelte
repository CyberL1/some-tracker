<script lang="ts">
	import { settingsItems, generalSettings, keyboardSettings } from '../../config/settings';
	import { settingsStore } from '../../stores/settings.svelte';
	import type { Settings } from './types';
	import Button from '../Button/Button.svelte';
	import ConfirmModal from '../Modal/ConfirmModal.svelte';
	import { open } from '../../services/modal/modal-service';
	import { TabView } from '../TabView';
	import AppearanceSettings from './AppearanceSettings.svelte';
	import SettingField from './SettingField.svelte';

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

<div class="flex h-[600px] w-[600px] flex-col overflow-x-hidden">
	<div class="flex items-center gap-2 border-b border-[var(--color-app-border)] bg-[var(--color-app-surface)] px-4 py-3">
		<h2 class="text-sm font-bold text-[var(--color-app-text-primary)]">Settings</h2>
	</div>

	<TabView {tabs} bind:activeTabId>
		{#snippet children(tabId)}
			<div class="overflow-x-hidden overflow-y-auto p-4">
				{#if tabId === 'general'}
					{#each generalSettings as item (item.setting)}
						<SettingField {item} bind:tempSettings={tempSettings} />
					{/each}
				{:else if tabId === 'keyboard'}
					{#each keyboardSettings as item (item.setting)}
						<SettingField {item} bind:tempSettings={tempSettings} />
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

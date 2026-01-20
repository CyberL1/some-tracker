<script lang="ts">
	import { themeStore } from '../../stores/theme.svelte';
	import { themeService } from '../../services/theme/theme-service';
	import { themeEditorStore } from '../../stores/theme-editor.svelte';
	import { open } from '../../services/modal/modal-service';
	import SettingsModal from '../Settings/SettingsModal.svelte';
	import ThemeListItem from '../Theme/ThemeListItem.svelte';
	import Button from '../Button/Button.svelte';
	import IconCarbonAdd from '~icons/carbon/add';
	import IconCarbonDocumentImport from '~icons/carbon/document-import';
	import { downloadFile } from '../../utils/file-download';
	import { appearanceSettings } from '../../config/settings';
	import { settingsStore } from '../../stores/settings.svelte';
	import type { Settings } from './types';
	import SettingField from './SettingField.svelte';

	let { onCloseSettings, tempSettings = $bindable() } = $props<{
		onCloseSettings?: () => void;
		tempSettings: Settings;
	}>();

	const allThemes = $derived(themeStore.getAllThemes());
	const activeThemeId = $derived(themeStore.state.activeThemeId);
	const customThemes = $derived(themeStore.getCustomThemes());

	let isReopening = $state(false);

	const reopenSettings = async () => {
		if (isReopening) return;
		isReopening = true;
		try {
			await open(SettingsModal, { initialTabId: 'appearance' });
		} finally {
			isReopening = false;
		}
	};

	function handleThemeSelect(themeId: string) {
		themeStore.setActiveTheme(themeId);
		const theme = themeStore.getActiveTheme();
		if (theme) {
			themeService.applyTheme(theme);
		}
	}

	function handleCreateTheme() {
		const defaultTheme = themeStore.getActiveTheme();
		if (!defaultTheme) return;

		const newTheme = {
			...defaultTheme,
			id: `custom-${Date.now()}`,
			name: `Custom Theme ${customThemes.length + 1}`,
			isCustom: true
		};

		onCloseSettings?.();
		themeEditorStore.setEditingTheme(newTheme, true, reopenSettings);
	}

	function handleEditTheme(theme: typeof allThemes[0]) {
		onCloseSettings?.();
		if (theme.isCustom) {
			themeEditorStore.setEditingTheme({ ...theme }, false, reopenSettings);
		} else {
			const newTheme = {
				...theme,
				id: `custom-${Date.now()}`,
				name: `${theme.name} (Copy)`,
				isCustom: true
			};
			themeEditorStore.setEditingTheme(newTheme, true, reopenSettings);
		}
	}

	function handleDeleteTheme(themeId: string) {
		themeStore.deleteCustomTheme(themeId);
		const activeTheme = themeStore.getActiveTheme();
		if (activeTheme) {
			themeService.applyTheme(activeTheme);
		}
	}

	function handleExportTheme(themeId: string) {
		const exportData = themeStore.exportTheme(themeId);
		if (!exportData) return;

		const theme = themeStore.getAllThemes().find((t) => t.id === themeId);
		if (!theme) return;

		const filename = `${theme.name.replace(/\s+/g, '-').toLowerCase()}.json`;
		const blob = new Blob([exportData], { type: 'application/json' });
		downloadFile(blob, filename);
	}

	async function handleImportTheme() {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.json';
		input.onchange = async (e) => {
			const file = (e.target as HTMLInputElement).files?.[0];
			if (!file) return;

			try {
				const text = await file.text();
				const theme = themeStore.importTheme(text);
				if (!theme) {
					alert('Failed to import theme. Invalid format.');
					return;
				}

				themeStore.addCustomTheme(theme);
				handleThemeSelect(theme.id);
			} catch (error) {
				alert('Failed to import theme: ' + (error as Error).message);
			}
		};
		input.click();
	}
</script>

<div class="flex flex-col gap-4">
	{#if appearanceSettings.length > 0}
		<div class="flex flex-col gap-4">
			{#each appearanceSettings as item (item.setting)}
				<SettingField {item} bind:tempSettings={tempSettings} />
			{/each}
		</div>
	{/if}

	<div class="flex items-center justify-between">
		<h3 class="text-sm font-semibold text-[var(--color-app-text-primary)]">Themes</h3>
		<div class="flex gap-2">
			<Button variant="secondary" onclick={handleImportTheme}>
				{#snippet children()}
					<div class="flex items-center gap-2">
						<IconCarbonDocumentImport class="h-4 w-4" />
						<span>Import</span>
					</div>
				{/snippet}
			</Button>
			<Button variant="primary" onclick={handleCreateTheme}>
				{#snippet children()}
					<div class="flex items-center gap-2">
						<IconCarbonAdd class="h-4 w-4" />
						<span>Create Theme</span>
					</div>
				{/snippet}
			</Button>
		</div>
	</div>

	<div class="flex flex-col gap-2">
		{#each allThemes as theme (theme.id)}
			<ThemeListItem
				{theme}
				isActive={theme.id === activeThemeId}
				onSelect={() => handleThemeSelect(theme.id)}
				onEdit={() => handleEditTheme(theme)}
				onDelete={theme.isCustom ? () => handleDeleteTheme(theme.id) : undefined}
				onExport={() => handleExportTheme(theme.id)} />
		{/each}
	</div>
</div>

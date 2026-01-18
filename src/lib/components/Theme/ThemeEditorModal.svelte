<script lang="ts">
	import type { Theme, ThemeColors } from '../../types/theme';
	import { themeStore } from '../../stores/theme.svelte';
	import { themeService } from '../../services/theme/theme-service';
	import { darkenColor } from '../../utils/colors';
	import Button from '../Button/Button.svelte';
	import Input from '../Input/Input.svelte';
	import { FormField } from '../FormField';
	import Portal from '../Modal/Portal.svelte';

	let { theme, isNew, resolve, dismiss, onSave } = $props<{
		theme: Theme;
		isNew: boolean;
		resolve?: (value?: any) => void;
		dismiss?: (error?: any) => void;
		onSave?: () => void;
	}>();

	let editedTheme = $state<Theme>({ ...theme });
	let editedColors = $state<ThemeColors>({ ...theme.colors });

	const patternEditorFields: Array<{ key: keyof ThemeColors; label: string }> = [
		{ key: 'patternBg', label: 'Pattern Background' },
		{ key: 'patternText', label: 'Pattern Text' },
		{ key: 'patternEmpty', label: 'Empty Cell Background' },
		{ key: 'patternEmptySelected', label: 'Empty Selected Cell' },
		{ key: 'patternNote', label: 'Note Value' },
		{ key: 'patternInstrument', label: 'Instrument Value' },
		{ key: 'patternEffect', label: 'Effect Value' },
		{ key: 'patternEnvelope', label: 'Envelope Value' },
		{ key: 'patternNoise', label: 'Noise Value' },
		{ key: 'patternHeader', label: 'Header Row Background' },
		{ key: 'patternSelected', label: 'Selected Row Background' },
		{ key: 'patternCellSelected', label: 'Selected Cell Background' },
		{ key: 'patternRowNum', label: 'Row Number' },
		{ key: 'patternAlternate', label: 'Alternate Row Background' },
		{ key: 'patternAlternateEmpty', label: 'Alternate Empty Cell' },
		{ key: 'patternTable', label: 'Table Value' },
		{ key: 'patternRowNumAlternate', label: 'Alternate Row Number' },
		{ key: 'patternEditing', label: 'Editing Cell Indicator' }
	];

	const patternOrderFields: Array<{ key: keyof ThemeColors; label: string }> = [
		{ key: 'orderBg', label: 'Pattern Order Background' },
		{ key: 'orderText', label: 'Pattern Order Text' },
		{ key: 'orderEmpty', label: 'Empty Pattern Cell' },
		{ key: 'orderSelected', label: 'Selected Pattern Cell' },
		{ key: 'orderHovered', label: 'Hovered Pattern Cell' },
		{ key: 'orderAlternate', label: 'Alternate Row Background' },
		{ key: 'orderBorder', label: 'Pattern Order Borders' }
	];

	const appFields: Array<{ key: keyof ThemeColors; label: string }> = [
		{ key: 'appBackground', label: 'Background 1' },
		{ key: 'appSurface', label: 'Surface 1' },
		{ key: 'appSurfaceSecondary', label: 'Surface 2' },
		{ key: 'appSurfaceHover', label: 'Surface 3' },
		{ key: 'appSurfaceActive', label: 'Surface 4' },
		{ key: 'appTextPrimary', label: 'Text 1' },
		{ key: 'appTextSecondary', label: 'Text 2' },
		{ key: 'appTextTertiary', label: 'Text 3' },
		{ key: 'appTextMuted', label: 'Text 4' },
		{ key: 'appBorder', label: 'Border 1' },
		{ key: 'appBorderHover', label: 'Border 2' },
		{ key: 'appPrimary', label: 'Primary 1' },
		{ key: 'appPrimaryHover', label: 'Primary 2' },
		{ key: 'appSecondary', label: 'Secondary 1' },
		{ key: 'appSecondaryHover', label: 'Secondary 2' }
	];

	let rafId: number | null = null;

	$effect(() => {
		editedTheme.colors = editedColors;

		const colors = editedColors;
		const patternNote = colors.patternNote;
		const patternTable = colors.patternTable;
		
		const previewColors: ThemeColors = {
			patternBg: colors.patternBg,
			patternText: colors.patternText,
			patternEmpty: colors.patternEmpty,
			patternEmptySelected: colors.patternEmptySelected,
			patternNote: colors.patternNote,
			patternInstrument: colors.patternInstrument,
			patternEffect: colors.patternEffect,
			patternEnvelope: colors.patternEnvelope,
			patternNoise: colors.patternNoise,
			patternHeader: colors.patternHeader,
			patternSelected: colors.patternSelected,
			patternCellSelected: colors.patternCellSelected,
			patternRowNum: colors.patternRowNum,
			patternAlternate: colors.patternAlternate,
			patternAlternateEmpty: colors.patternAlternateEmpty,
			patternTable: colors.patternTable,
			patternRowNumAlternate: colors.patternRowNumAlternate,
			patternEditing: colors.patternEditing,
			patternNoteOff: darkenColor(patternNote, 60),
			patternTableOff: darkenColor(patternTable, 60),
			orderBg: colors.orderBg,
			orderText: colors.orderText,
			orderEmpty: colors.orderEmpty,
			orderSelected: colors.orderSelected,
			orderHovered: colors.orderHovered,
			orderAlternate: colors.orderAlternate,
			orderBorder: colors.orderBorder,
			appBackground: colors.appBackground,
			appSurface: colors.appSurface,
			appSurfaceSecondary: colors.appSurfaceSecondary,
			appSurfaceHover: colors.appSurfaceHover,
			appSurfaceActive: colors.appSurfaceActive,
			appTextPrimary: colors.appTextPrimary,
			appTextSecondary: colors.appTextSecondary,
			appTextTertiary: colors.appTextTertiary,
			appTextMuted: colors.appTextMuted,
			appBorder: colors.appBorder,
			appBorderHover: colors.appBorderHover,
			appPrimary: colors.appPrimary,
			appPrimaryHover: colors.appPrimaryHover,
			appSecondary: colors.appSecondary,
			appSecondaryHover: colors.appSecondaryHover
		};

		if (rafId !== null) {
			cancelAnimationFrame(rafId);
		}

		rafId = requestAnimationFrame(() => {
			themeService.applyPreviewColors(previewColors);
			rafId = null;
		});

		return () => {
			if (rafId !== null) {
				cancelAnimationFrame(rafId);
				rafId = null;
			}
		};
	});

	function handleSave() {
		editedTheme.colors = {
			...editedColors,
			patternNoteOff: darkenColor(editedColors.patternNote, 60),
			patternTableOff: darkenColor(editedColors.patternTable, 60)
		};
		themeStore.addCustomTheme(editedTheme);
		themeStore.setActiveTheme(editedTheme.id);
		themeService.applyTheme(editedTheme);
		themeService.applyPreviewColors(null);
		onSave?.();
		resolve?.();
	}

	function handleCancel() {
		themeService.applyPreviewColors(null);
		const activeTheme = themeStore.getActiveTheme();
		if (activeTheme) {
			themeService.applyTheme(activeTheme);
		}
		dismiss?.();
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			handleCancel();
		}
	}
</script>

<Portal>
	<div
		class="fixed inset-0 z-50 flex items-start justify-end p-4 pointer-events-none"
		role="dialog"
		aria-modal="true"
		tabindex="-1"
		onkeydown={handleKeyDown}>
		<div
			class="pointer-events-auto w-[400px] max-h-[90vh] overflow-y-auto rounded-sm border border-[var(--color-app-border)] bg-[var(--color-app-surface)] shadow-xl"
			role="presentation"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}>
			<div class="border-b border-[var(--color-app-border)] bg-[var(--color-app-surface)] px-4 py-3">
				<h2 class="text-sm font-bold text-[var(--color-app-text-primary)]">
					{isNew ? 'Create Theme' : 'Edit Theme'}
				</h2>
			</div>

			<div class="overflow-y-auto p-4">
				<FormField label="Theme Name">
					<Input bind:value={editedTheme.name} />
				</FormField>

				<div class="mt-6 first:mt-0">
					<h3 class="mb-4 text-sm font-bold text-[var(--color-app-text-primary)]">Pattern Editor Colors</h3>
					<div class="flex flex-col gap-3">
						{#each patternEditorFields as field}
							<FormField label={field.label}>
								<div class="flex items-center gap-2">
									<input
										type="color"
										bind:value={editedColors[field.key]}
										class="h-8 w-16 cursor-pointer rounded border border-[var(--color-app-border)]" />
									<Input
										bind:value={editedColors[field.key]}
										class="flex-1"
										placeholder="#000000" />
								</div>
							</FormField>
						{/each}
					</div>
				</div>

				<div class="mt-6 border-t border-[var(--color-app-border)] pt-6">
					<h3 class="mb-4 text-sm font-bold text-[var(--color-app-text-primary)]">Pattern Order Colors</h3>
					<div class="flex flex-col gap-3">
						{#each patternOrderFields as field}
							<FormField label={field.label}>
								<div class="flex items-center gap-2">
									<input
										type="color"
										bind:value={editedColors[field.key]}
										class="h-8 w-16 cursor-pointer rounded border border-[var(--color-app-border)]" />
									<Input
										bind:value={editedColors[field.key]}
										class="flex-1"
										placeholder="#000000" />
								</div>
							</FormField>
						{/each}
					</div>
				</div>

				<div class="mt-6 border-t border-[var(--color-app-border)] pt-6">
					<h3 class="mb-4 text-sm font-bold text-[var(--color-app-text-primary)]">Application Colors</h3>
					<div class="flex flex-col gap-3">
						{#each appFields as field}
							<FormField label={field.label}>
								<div class="flex items-center gap-2">
									<input
										type="color"
										bind:value={editedColors[field.key]}
										class="h-8 w-16 cursor-pointer rounded border border-[var(--color-app-border)]" />
									<Input
										bind:value={editedColors[field.key]}
										class="flex-1"
										placeholder="#000000" />
								</div>
							</FormField>
						{/each}
					</div>
				</div>
			</div>

			<div class="flex justify-end gap-2 border-t border-[var(--color-app-border)] bg-[var(--color-app-surface)] px-4 py-3">
				<Button variant="secondary" onclick={handleCancel}>Cancel</Button>
				<Button variant="primary" onclick={handleSave}>Save</Button>
			</div>
		</div>
	</div>
</Portal>

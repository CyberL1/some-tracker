<script lang="ts">
	import type { Theme, ThemeColors } from '../../types/theme';
	import { themeStore } from '../../stores/theme.svelte';
	import { themeService } from '../../services/theme/theme-service';
	import Button from '../Button/Button.svelte';
	import Input from '../Input/Input.svelte';
	import { FormField } from '../FormField';
	import Portal from '../Modal/Portal.svelte';
	import {
		PATTERN_EDITOR_COLOR_KEYS,
		PATTERN_ORDER_COLOR_KEYS,
		APP_COLOR_KEYS
	} from '../../config/theme-colors';

	let { theme, isNew, resolve, dismiss, onSave } = $props<{
		theme: Theme;
		isNew: boolean;
		resolve?: (value?: any) => void;
		dismiss?: (error?: any) => void;
		onSave?: () => void;
	}>();

	let editedTheme = $state<Theme>({ ...theme });
	let editedColors = $state<ThemeColors>({ ...theme.colors });

	const colorLabels: Record<string, string> = {
		patternBg: 'Pattern Background',
		patternText: 'Pattern Text',
		patternEmpty: 'Empty Cell Background',
		patternEmptySelected: 'Empty Selected Cell',
		patternNote: 'Note Value',
		patternInstrument: 'Instrument Value',
		patternEffect: 'Effect Value',
		patternEnvelope: 'Envelope Value',
		patternNoise: 'Noise Value',
		patternSelected: 'Selected Row Background',
		patternCellSelected: 'Selected Cell Background',
		patternRowNum: 'Row Number',
		patternAlternate: 'Alternate Row Background',
		patternAlternateEmpty: 'Alternate Empty Cell',
		patternTable: 'Table Value',
		patternRowNumAlternate: 'Alternate Row Number',
		patternNoteOff: 'Note Off Value',
		patternTableOff: 'Table Off Value',
		orderBg: 'Pattern Order Background',
		orderText: 'Pattern Order Text',
		orderEmpty: 'Empty Pattern Cell',
		orderSelected: 'Selected Pattern Cell',
		orderHovered: 'Hovered Pattern Cell',
		orderAlternate: 'Alternate Row Background',
		orderBorder: 'Pattern Order Borders',
		appBackground: 'Background 1',
		appSurface: 'Surface 1',
		appSurfaceSecondary: 'Surface 2',
		appSurfaceHover: 'Surface 3',
		appSurfaceActive: 'Surface 4',
		appTextPrimary: 'Text 1',
		appTextSecondary: 'Text 2',
		appTextTertiary: 'Text 3',
		appTextMuted: 'Text 4',
		appBorder: 'Border 1',
		appBorderHover: 'Border 2',
		appPrimary: 'Primary 1',
		appPrimaryHover: 'Primary 2',
		appSecondary: 'Secondary 1',
		appSecondaryHover: 'Secondary 2'
	};

	const patternEditorFields = PATTERN_EDITOR_COLOR_KEYS.map((key) => ({
		key: key as keyof ThemeColors,
		label: colorLabels[key]
	}));

	const patternOrderFields = PATTERN_ORDER_COLOR_KEYS.map((key) => ({
		key: key as keyof ThemeColors,
		label: colorLabels[key]
	}));

	const appFields = APP_COLOR_KEYS.map((key) => ({
		key: key as keyof ThemeColors,
		label: colorLabels[key]
	}));

	let rafId: number | null = null;

	$effect(() => {
		editedTheme.colors = editedColors;

		const colors = editedColors;
		
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
			patternSelected: colors.patternSelected,
			patternCellSelected: colors.patternCellSelected,
			patternRowNum: colors.patternRowNum,
			patternAlternate: colors.patternAlternate,
			patternAlternateEmpty: colors.patternAlternateEmpty,
			patternTable: colors.patternTable,
			patternRowNumAlternate: colors.patternRowNumAlternate,
			patternNoteOff: colors.patternNoteOff,
			patternTableOff: colors.patternTableOff,
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
		editedTheme.colors = { ...editedColors };
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

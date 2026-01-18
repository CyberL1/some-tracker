<script lang="ts">
	import type { Theme } from '../../types/theme';
	import IconCarbonDownload from '~icons/carbon/download';
	import IconCarbonEdit from '~icons/carbon/edit';
	import IconCarbonTrashCan from '~icons/carbon/trash-can';

	let {
		theme,
		isActive,
		onSelect,
		onEdit,
		onDelete,
		onExport
	}: {
		theme: Theme;
		isActive: boolean;
		onSelect: () => void;
		onEdit?: () => void;
		onDelete?: () => void;
		onExport?: () => void;
	} = $props();

	const previewColors = $derived([
		theme.colors.patternNote,
		theme.colors.patternInstrument,
		theme.colors.patternEffect,
		theme.colors.patternEnvelope
	]);
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="flex items-center gap-3 rounded border p-3 transition-colors cursor-pointer hover:bg-[var(--color-app-surface-hover)]"
	class:border-[var(--color-app-primary)]={isActive}
	class:border-[var(--color-app-border)]={!isActive}
	onclick={onSelect}
>
	<input type="radio" checked={isActive} onchange={onSelect} class="cursor-pointer" />

	<div class="flex gap-1">
		{#each previewColors as color}
			<div class="h-6 w-6 rounded border border-[var(--color-app-border)]" style="background-color: {color}"></div>
		{/each}
	</div>

	<span class="flex-1 text-sm text-[var(--color-app-text-primary)]">{theme.name}</span>

	{#if onExport}
		<button
			aria-label="Export theme"
			onclick={(e) => {
				e.stopPropagation();
				onExport?.();
			}}
			class="cursor-pointer rounded p-1  text-[var(--color-app-text-primary)]"
			title="Export theme"
		>
			<IconCarbonDownload class="h-4 w-4" />
		</button>
	{/if}

	{#if theme.isCustom && onEdit}
		<button
			aria-label="Edit theme"
			onclick={(e) => {
				e.stopPropagation();
				onEdit?.();
			}}
			class="cursor-pointer rounded p-1  text-[var(--color-app-text-primary)]"
			title="Edit theme"
		>
			<IconCarbonEdit class="h-4 w-4" />
		</button>
	{/if}

	{#if theme.isCustom && onDelete}
		<button
			aria-label="Delete theme"
			onclick={(e) => {
				e.stopPropagation();
				onDelete?.();
			}}
			class="cursor-pointer rounded p-1 text-[var(--color-pattern-note-off)]"
			title="Delete theme"
		>
			<IconCarbonTrashCan class="h-4 w-4" />
		</button>
	{/if}
</div>

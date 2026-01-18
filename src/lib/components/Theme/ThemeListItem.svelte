<script lang="ts">
	import type { Theme } from '../../types/theme';

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
			class="cursor-pointer rounded p-1 hover:bg-[var(--color-app-surface-hover)] text-[var(--color-app-text-primary)]"
			title="Export theme"
		>
			<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
				/>
			</svg>
		</button>
	{/if}

	{#if theme.isCustom && onEdit}
		<button
			aria-label="Edit theme"
			onclick={(e) => {
				e.stopPropagation();
				onEdit?.();
			}}
			class="cursor-pointer rounded p-1 hover:bg-[var(--color-app-surface-hover)] text-[var(--color-app-text-primary)]"
			title="Edit theme"
		>
			<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
				/>
			</svg>
		</button>
	{/if}

	{#if theme.isCustom && onDelete}
		<button
			aria-label="Delete theme"
			onclick={(e) => {
				e.stopPropagation();
				onDelete?.();
			}}
			class="cursor-pointer rounded p-1 hover:bg-[#45475a] text-[#f38ba8]"
			title="Delete theme"
		>
			<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
				/>
			</svg>
		</button>
	{/if}
</div>

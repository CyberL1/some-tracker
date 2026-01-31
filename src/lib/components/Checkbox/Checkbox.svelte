<script lang="ts">
	import type { ClassValue, HTMLInputAttributes } from 'svelte/elements';

	let {
		showStatus = true,
		checked = $bindable(),
		...rest
	}: HTMLInputAttributes & { showStatus?: boolean } = $props();
</script>

<label for={rest.id} class="flex cursor-pointer items-center gap-2 select-none {rest.class}">
	<input
		id={rest.id}
		type="checkbox"
		{...rest}
		bind:checked
		class="h-4 w-4 cursor-pointer rounded border-[var(--color-app-border)] bg-[var(--color-app-surface-secondary)] text-[var(--color-app-primary)] focus:ring-2 focus:ring-[var(--color-app-primary)]" />
	{#if showStatus}
		<span class="text-xs text-[var(--color-app-text-tertiary)]">
			{checked ? 'Enabled' : 'Disabled'}
		</span>
	{/if}
</label>

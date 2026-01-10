<script lang="ts">
	import type { ClassValue, HTMLInputAttributes } from 'svelte/elements';

	let {
		showStatus = true,
		checked = $bindable(),
		...rest
	}: HTMLInputAttributes & { showStatus?: boolean } = $props();
</script>

<label for={rest.id} class="flex cursor-pointer items-center gap-2 {rest.class}">
	<input
		id={rest.id}
		type="checkbox"
		{...rest}
		bind:checked
		class="h-4 w-4 cursor-pointer rounded border-neutral-600 bg-neutral-800 text-blue-500 focus:ring-2 focus:ring-blue-500" />
	{#if showStatus}
		<span class="text-xs text-neutral-300">
			{checked ? 'Enabled' : 'Disabled'}
		</span>
	{/if}
</label>

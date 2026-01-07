<script lang="ts">
	import type { ClassValue } from 'svelte/elements';

	let {
		checked = $bindable(),
		id,
		showStatus = true,
		class: className
	}: {
		checked: boolean;
		id?: string;
		showStatus?: boolean;
		class?: ClassValue;
	} = $props();
</script>

<label for={id} class="flex cursor-pointer items-center gap-2 {className}">
	<input
		{id}
		type="checkbox"
		bind:checked
		class="h-4 w-4 cursor-pointer rounded border-neutral-600 bg-neutral-800 text-blue-500 focus:ring-2 focus:ring-blue-500" />
	{#if showStatus}
		<span class="text-xs text-neutral-300">
			{checked ? 'Enabled' : 'Disabled'}
		</span>
	{/if}
</label>


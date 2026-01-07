<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	let { value = $bindable(), class: className, ...rest }: HTMLInputAttributes = $props();
</script>

<input
	bind:value
	class="min-w-0 flex-1 overflow-x-auto rounded border border-neutral-600 bg-neutral-900 px-2 py-1
	text-neutral-200 placeholder-neutral-500 focus:border-neutral-500 focus:outline-none {className}"
	{...rest} />

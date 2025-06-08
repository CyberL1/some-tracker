<script lang="ts">
	import type { Snippet } from 'svelte';

	const { label, children }: { label: string; children: Snippet } = $props();
</script>

<div class="flex flex-col gap-0.5">
	<span class="text-[10px] text-neutral-300">{label}:</span>
	{@render children()}
</div>

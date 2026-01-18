<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ClassValue } from 'svelte/elements';

	let {
		id,
		label,
		description,
		children,
		class: className
	}: {
		id?: string;
		label?: string;
		description?: string;
		children: Snippet;
		class?: ClassValue;
	} = $props();
</script>

<div class="mb-4 last:mb-0 {className}">
	{#if label}
		<label for={id} class="mb-1 block text-xs font-medium text-[var(--color-app-text-secondary)]">{label}</label>
	{/if}
	{#if description}
		<p class="mb-2 text-xs text-[var(--color-app-text-muted)]">{description}</p>
	{/if}
	{@render children()}
</div>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ClassValue } from 'svelte/elements';

	let {
		children,
		onclick,
		variant = 'default',
		class: className
	}: {
		children: Snippet;
		onclick: () => void;
		variant?: 'default' | 'primary' | 'secondary';
		class?: ClassValue;
	} = $props();

	const variantClasses = $derived(
		variant === 'primary'
			? 'border-blue-600 bg-blue-600 text-neutral-100 hover:bg-blue-700'
			: variant === 'secondary'
				? 'border-neutral-600 bg-neutral-800 text-neutral-200 hover:bg-neutral-700'
				: 'border-neutral-600 bg-[var(--pattern-bg)] hover:bg-[var(--pattern-selected)]'
	);
</script>

<button
	{onclick}
	class="cursor-pointer rounded-sm border px-4 py-1.5 text-xs transition-colors focus:border-transparent focus:ring-1 focus:ring-blue-500 focus:outline-none {variantClasses} {className}">
	{@render children()}
</button>

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
		onclick: (e: MouseEvent) => void;
		variant?: 'default' | 'primary' | 'secondary';
		class?: ClassValue;
	} = $props();

	const variantClasses = $derived(
		variant === 'primary'
			? 'border-[var(--color-app-primary)] bg-[var(--color-app-primary)] text-[var(--color-app-text-primary)] hover:bg-[var(--color-app-primary-hover)]'
			: variant === 'secondary'
				? 'border-[var(--color-app-border)] bg-[var(--color-app-surface-secondary)] text-[var(--color-app-text-secondary)] hover:bg-[var(--color-app-surface-hover)]'
				: 'border-[var(--color-app-border)] bg-[var(--color-pattern-bg)] hover:bg-[var(--color-pattern-selected)]'
	);
</script>

<button
	{onclick}
	class="cursor-pointer rounded-sm border px-4 py-1.5 text-xs transition-colors focus:border-transparent focus:ring-1
		focus:ring-blue-500 focus:outline-none {variantClasses} {className}">
	{@render children()}
</button>

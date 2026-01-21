<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	let { value = $bindable(), class: className, ...rest }: HTMLInputAttributes = $props();
</script>

<input
	bind:value
	class="min-w-0 flex-1 overflow-x-auto rounded border border-[var(--color-app-border)] bg-[var(--color-app-surface)] px-2 py-1
	text-[var(--color-app-text-secondary)] placeholder-[var(--color-app-text-muted)] accent-[var(--color-app-primary)] focus:border-[var(--color-app-primary)]
	focus:outline-none {className}"
	{...rest} />

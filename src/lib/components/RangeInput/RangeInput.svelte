<script lang="ts">
	import type { ClassValue } from 'svelte/elements';

	let {
		value = $bindable(),
		min = 0,
		max = 100,
		step = 1,
		showValue = true,
		class: className,
		id,
		label
	}: {
		value: number;
		min?: number;
		max?: number;
		step?: number;
		showValue?: boolean;
		class?: ClassValue;
		id?: string;
		label?: string;
	} = $props();
</script>

<div class="flex items-center gap-3 {className}">
	{#if label}
		<label for={id} class="text-xs font-medium text-neutral-200">{label}</label>
	{/if}
	<input
		{id}
		type="range"
		{min}
		{max}
		{step}
		bind:value
		class="flex-1 cursor-pointer" />
	{#if showValue}
		<span class="w-12 text-right text-xs text-neutral-300">{value}</span>
	{/if}
</div>


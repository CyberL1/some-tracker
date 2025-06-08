<script lang="ts">
	import type { Snippet, Component } from 'svelte';
	import type { ClassValue } from 'svelte/elements';

	const props: {
		title: string;
		icon?: Component;
		class?: ClassValue;
		children?: Snippet;
		fullHeight?: boolean;
	} = $props();
</script>

<div class="w-full {props.fullHeight ? 'flex h-full flex-col' : ''}">
	<h2
		class="flex items-center justify-between rounded-t-sm border border-neutral-600 bg-neutral-900 px-2 py-1 font-bold {props.fullHeight
			? 'flex-shrink-0'
			: ''}">
		{props.title}
		{#if props.icon}
			<props.icon />
		{/if}
	</h2>
	<div class="rounded-b-sm bg-neutral-700 {props.fullHeight ? 'min-h-0 flex-1' : ''}">
		<div class="p-4 {props.fullHeight ? 'h-full' : ''} {props.class}">
			{@render props.children?.()}
		</div>
	</div>
</div>

<script lang="ts">
	import type { Snippet, Component } from 'svelte';
	import type { ClassValue } from 'svelte/elements';

	const props: {
		title: string;
		icon?: Component;
		class?: ClassValue;
		children?: Snippet;
		fullHeight?: boolean;
		actions?: {
			label: string;
			icon: Component;
			onClick: () => void;
		}[];
	} = $props();
</script>

<div class="w-full {props.fullHeight ? 'flex h-full flex-col' : ''}">
	<h2
		class="flex items-center justify-between rounded-t-sm border border-neutral-600 bg-neutral-900 px-2 py-1 font-bold {props.fullHeight
			? 'flex-shrink-0'
			: ''}">
		<div class="flex items-center gap-2">
			{props.title}
			{#if props.icon}
				<props.icon />
			{/if}
		</div>
		{#if props.actions}
			<div class="flex items-center gap-1">
				{#each props.actions as action}
					<button
						class="flex items-center gap-1 rounded px-2 py-1 text-xs text-neutral-400 transition-colors duration-200 hover:bg-neutral-700/80 hover:text-neutral-200 active:bg-neutral-600"
						onclick={action.onClick}
						title={action.label}>
						<action.icon class="h-3 w-3" />
						<span class="font-medium">{action.label}</span>
					</button>
				{/each}
			</div>
		{/if}
	</h2>
	<div class="flex-1 rounded-b-sm bg-neutral-700">
		<div class="h-full {props.class}">
			{@render props.children?.()}
		</div>
	</div>
</div>

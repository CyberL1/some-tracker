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
			class?: ClassValue;
		}[];
	} = $props();
</script>

<div class={props.fullHeight ? 'flex h-full flex-col' : 'w-full'}>
	<h2
		class="relative z-10 flex items-center justify-between rounded-t-sm border border-[var(--color-app-border)] bg-[var(--color-app-surface)] px-2 py-1 font-bold {props.fullHeight
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
						class="flex cursor-pointer items-center gap-1 rounded px-2 py-1 text-xs text-[var(--color-app-text-muted)] transition-colors duration-200 hover:bg-[var(--color-app-surface-hover)] hover:text-[var(--color-app-text-secondary)] active:bg-[var(--color-app-surface-active)] {action.class ||
							''}"
						onclick={action.onClick}
						title={action.label}>
						<action.icon class="h-3 w-3" />
						<span class="font-medium">{action.label}</span>
					</button>
				{/each}
			</div>
		{/if}
	</h2>
	<div class="{props.fullHeight ? 'flex-1 overflow-hidden' : ''} rounded-b-sm bg-[var(--color-app-surface)]">
		<div class="{props.fullHeight ? 'h-full' : ''} {props.class}">
			{@render props.children?.()}
		</div>
	</div>
</div>

<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Tab {
		id: string;
		label: string;
		icon?: any;
	}

	let {
		tabs,
		activeTabId = $bindable(tabs[0]?.id),
		children,
		headerActions
	}: {
		tabs: Tab[];
		activeTabId?: string;
		children: Snippet<[string]>;
		headerActions?: Snippet;
	} = $props();

	function selectTab(tabId: string) {
		activeTabId = tabId;
	}
</script>

<div class="flex h-full flex-col">
	<div class="flex items-center justify-between border-b border-[var(--color-app-border)] bg-[var(--color-app-surface-secondary)]">
		<div class="flex">
			{#each tabs as tab}
				<button
					class="group relative flex cursor-pointer text-sm items-center gap-2 px-4 py-1 transition-colors {activeTabId ===
					tab.id
						? 'text-[var(--color-app-text-primary)]'
						: 'text-[var(--color-app-text-muted)] hover:text-[var(--color-app-text-secondary)]'}"
					onclick={() => selectTab(tab.id)}>
					{#if tab.icon}
						{@const Icon = tab.icon}
						<Icon class="h-4 w-4" />
					{/if}
					<span>{tab.label}</span>
					{#if activeTabId === tab.id}
						<div class="absolute right-0 bottom-0 left-0 h-0.5 bg-[var(--color-app-primary)]"></div>
					{/if}
				</button>
			{/each}
		</div>
		{#if headerActions}
			<div class="flex items-center pr-2">
				{@render headerActions()}
			</div>
		{/if}
	</div>

	<div class="min-h-0 flex-1 overflow-hidden">
		{@render children(activeTabId)}
	</div>
</div>

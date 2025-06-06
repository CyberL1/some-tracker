<script lang="ts">
	import { playbackStore } from '../../stores/playback.svelte';
	import MenuButton from './MenuButton.svelte';
	import type { MenuItem } from './types';
	import IconCarbonPlayFilledAlt from '~icons/carbon/play-filled-alt';
	import IconCarbonPauseFilled from '~icons/carbon/pause-filled';

	let activeMenu = $state('');
	let {
		menuItems = [],
		onAction
	}: {
		menuItems: MenuItem[];
		onAction?: (data: { action: string }) => void;
	} = $props();

	function handleMenuOpen(data: { label: string }) {
		activeMenu = data.label;
	}

	function handleMenuClose(data: { label?: string; all?: boolean }) {
		if (data.all) {
			activeMenu = '';
		} else if (data.label && activeMenu === data.label) {
			activeMenu = '';
		}
	}

	function handleAction(data: { action: string }) {
		onAction?.(data);
	}
</script>

<div class="flex w-full items-center border-b border-neutral-600 bg-neutral-700 px-2 text-center">
	{#each menuItems as item}
		<MenuButton
			label={item.label}
			items={item.items || []}
			{activeMenu}
			onAction={handleAction}
			onMenuOpen={handleMenuOpen}
			onMenuClose={handleMenuClose} />
	{/each}

	<button
		class=" absolute top-3.5 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-sm border border-neutral-400 bg-neutral-600 p-2 transition-colors hover:cursor-pointer hover:bg-neutral-500"
		onclick={() => {
			playbackStore.isPlaying = !playbackStore.isPlaying;
		}}>
		{#if !playbackStore.isPlaying}
			<IconCarbonPlayFilledAlt class="h-4 w-4" />
		{:else}
			<IconCarbonPauseFilled class="h-4 w-4" />
		{/if}
	</button>
</div>

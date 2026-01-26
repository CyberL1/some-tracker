<script lang="ts">
	import MenuPanel from './MenuPanel.svelte';
	import type { MenuItem } from './types';

	let {
		position,
		items,
		onAction,
		onClose
	}: {
		position: { x: number; y: number } | null;
		items: MenuItem[];
		onAction?: (data: { action: string }) => void;
		onClose?: () => void;
	} = $props();

	function handleClose(): void {
		onClose?.();
	}
</script>

{#if position}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-40"
		onclick={handleClose}
		oncontextmenu={(e) => {
			e.preventDefault();
			handleClose();
		}}>
	</div>
	<div
		class="fixed z-50"
		style="left: {position.x}px; top: {position.y}px;">
		<MenuPanel
			isFirst={true}
			{items}
			{onAction}
			onMenuClose={handleClose} />
	</div>
{/if}

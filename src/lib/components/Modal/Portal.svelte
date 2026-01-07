<script lang="ts">
	import { onMount, onDestroy, type Snippet } from 'svelte';

	let { children } = $props<{
		children?: Snippet;
	}>();

	let contentElement: HTMLElement | null = $state(null);

	onMount(() => {
		const modalRoot = document.getElementById('modal-root');
		const target = modalRoot || document.body;

		if (contentElement) {
			target.appendChild(contentElement);
		}
	});

	onDestroy(() => {
		if (contentElement && contentElement.parentNode) {
			contentElement.parentNode.removeChild(contentElement);
		}
	});
</script>

{#if children}
	<div bind:this={contentElement}>
		{@render children()}
	</div>
{/if}

<script lang="ts">
	import type { Snippet } from 'svelte';
	import Portal from './Portal.svelte';

	let {
		open = $bindable(false),
		onClose,
		children
	} = $props<{
		open?: boolean;
		onClose?: () => void;
		children: Snippet;
	}>();

	let modalElement: HTMLElement | null = $state(null);

	$effect(() => {
		if (open && modalElement) {
			modalElement.focus();
		}
	});

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			onClose?.();
		}
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			onClose?.();
		}
	}
</script>

{#if open}
	<Portal>
		<div
			class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-200"
			role="dialog"
			aria-modal="true"
			tabindex="-1"
			onclick={handleBackdropClick}
			onkeydown={handleKeyDown}>
			<div
				bind:this={modalElement}
				class="max-h-[90vh] max-w-[90vw] overflow-auto rounded-sm border border-neutral-600 bg-neutral-900 shadow-xl transition-transform duration-200"
				onclick={(e) => e.stopPropagation()}
				onkeydown={(e) => e.stopPropagation()}
				role="presentation"
				tabindex="-1"
				style="animation: slideUp 0.2s ease-out;">
				{@render children?.()}
			</div>
		</div>
	</Portal>
{/if}

<style>
	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(10px) scale(0.95);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}
</style>

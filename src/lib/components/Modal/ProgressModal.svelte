<script lang="ts">
	import IconCarbonDownload from '~icons/carbon/download';
	import Modal from './Modal.svelte';

	let {
		open = $bindable(false),
		progress = $bindable(0),
		message = $bindable(''),
		onClose
	} = $props<{
		open?: boolean;
		progress?: number;
		message?: string;
		onClose?: () => void;
	}>();

	const progressPercent = $derived(Math.min(100, Math.max(0, progress)));
</script>

<Modal {open} {onClose}>
	<div class="flex items-center gap-2 border-b border-neutral-600 bg-neutral-900 px-2 py-1">
		<h2 id="progress-modal-title" class="text-xs font-bold text-neutral-100">Exporting WAV</h2>
		<IconCarbonDownload class="h-3 w-3 text-blue-400" />
	</div>

	<div class="p-3">
		{#if message}
			<p class="mb-3 text-xs text-neutral-400">{message}</p>
		{/if}

		<div class="relative h-1.5 w-full overflow-hidden rounded-full bg-neutral-800">
			<div
				class="h-full bg-blue-500 transition-all duration-300 ease-out"
				style="width: {progressPercent}%">
				<div
					class="absolute inset-0 bg-blue-400 opacity-30"
					style="width: 100%; animation: shimmer 1.5s ease-in-out infinite;">
				</div>
			</div>
		</div>
	</div>
</Modal>

<style>
	@keyframes shimmer {
		0%,
		100% {
			opacity: 0.3;
		}
		50% {
			opacity: 0.6;
		}
	}
</style>

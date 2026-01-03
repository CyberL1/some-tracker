<script lang="ts">
	import IconCarbonDownload from '~icons/carbon/download';

	let { progress = $bindable(0), message = $bindable('') } = $props<{
		progress?: number;
		message?: string;
	}>();

	const progressPercent = $derived(Math.min(100, Math.max(0, progress)));
</script>

<style>
	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

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

<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-200"
	role="dialog"
	aria-modal="true"
	aria-labelledby="progress-modal-title"
	style="animation: fadeIn 0.2s ease-out;">
	<div
		class="w-80 rounded-sm border border-neutral-600 bg-neutral-900 shadow-xl transition-transform duration-200"
		onclick={(e) => e.stopPropagation()}
		style="animation: slideUp 0.2s ease-out;">
		<div class="flex items-center gap-2 border-b border-neutral-600 bg-neutral-900 px-2 py-1">
			<h2 id="progress-modal-title" class="text-xs font-bold text-neutral-100">
				Exporting WAV
			</h2>
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
						style="width: 100%; animation: shimmer 1.5s ease-in-out infinite;"></div>
				</div>
			</div>
		</div>
	</div>
</div>


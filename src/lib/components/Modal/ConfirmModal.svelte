<script lang="ts">
	import Button from '../Button/Button.svelte';

	let { message, resolve, dismiss } = $props<{
		message: string;
		resolve?: (value?: any) => void;
		dismiss?: (error?: any) => void;
	}>();

	function handleConfirm() {
		resolve?.(true);
	}

	function handleCancel() {
		dismiss?.();
	}
</script>

<div class="w-96">
	<div class="flex items-center gap-2 border-b border-neutral-600 bg-neutral-900 px-4 py-3">
		<h2 class="text-sm font-bold text-neutral-100">Confirm</h2>
	</div>

	<div class="p-4">
		<p class="text-sm text-neutral-300">{message}</p>
	</div>

	<div class="flex justify-end gap-2 border-t border-neutral-600 bg-neutral-900 px-4 py-3">
		<Button variant="secondary" onclick={handleCancel}>Cancel</Button>
		<Button variant="primary" onclick={handleConfirm}>Confirm</Button>
	</div>
</div>


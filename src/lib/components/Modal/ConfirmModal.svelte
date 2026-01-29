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
		resolve?.(false);
	}
</script>

<div class="w-96">
	<div
		class="flex items-center gap-2 border-b border-[var(--color-app-border)] bg-[var(--color-app-surface)] px-3 py-2">
		<h2 class="font-bold text-[var(--color-app-text-primary)]">Confirm</h2>
	</div>

	<div class="p-3">
		<p class="text-[var(--color-app-text-tertiary)]">{message}</p>
	</div>

	<div
		class="flex justify-end gap-2 border-t border-[var(--color-app-border)] bg-[var(--color-app-surface)] px-3 py-2">
		<Button variant="secondary" onclick={handleCancel}>Cancel</Button>
		<Button variant="primary" onclick={handleConfirm}>Confirm</Button>
	</div>
</div>

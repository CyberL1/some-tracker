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
	<div class="flex items-center gap-2 border-b border-[var(--color-app-border)] bg-[var(--color-app-surface)] px-4 py-3">
		<h2 class="text-sm font-bold text-[var(--color-app-text-primary)]">Confirm</h2>
	</div>

	<div class="p-4">
		<p class="text-sm text-[var(--color-app-text-tertiary)]">{message}</p>
	</div>

	<div class="flex justify-end gap-2 border-t border-[var(--color-app-border)] bg-[var(--color-app-surface)] px-4 py-3">
		<Button variant="secondary" onclick={handleCancel}>Cancel</Button>
		<Button variant="primary" onclick={handleConfirm}>Confirm</Button>
	</div>
</div>


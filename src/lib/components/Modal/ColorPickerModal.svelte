<script lang="ts">
	import Button from '../Button/Button.svelte';

	let {
		initialColor = '#808080',
		resolve,
		dismiss
	}: {
		initialColor?: string;
		resolve?: (value: string) => void;
		dismiss?: () => void;
	} = $props();

	let selectedColor = $state(initialColor);
	let hexInputValue = $state(initialColor);

	function parseHex(input: string): string | null {
		const raw = input.replace(/^#/, '').trim();
		if (raw.length !== 6 || !/^[0-9a-fA-F]+$/.test(raw)) return null;
		return '#' + raw.toLowerCase();
	}

	function handleHexInput(e: Event) {
		const value = (e.target as HTMLInputElement).value;
		const hex = parseHex(value);
		if (hex !== null) {
			selectedColor = hex;
			hexInputValue = hex;
		} else {
			hexInputValue = value;
		}
	}

	function handleColorPickerInput(e: Event) {
		const value = (e.target as HTMLInputElement).value;
		selectedColor = value;
		hexInputValue = value;
	}

	function handleSave() {
		resolve?.(selectedColor);
	}

	function handleDismiss() {
		dismiss?.();
	}
</script>

<div class="w-80">
	<div
		class="flex items-center gap-2 border-b border-[var(--color-app-border)] bg-[var(--color-app-surface)] px-3 py-2">
		<h2 class="font-bold text-[var(--color-app-text-primary)]">Pattern order color</h2>
	</div>

	<div class="flex flex-col gap-3 p-3">
		<div class="flex items-center gap-3">
			<input
				type="color"
				value={selectedColor}
				oninput={handleColorPickerInput}
				class="h-10 w-14 cursor-pointer rounded border border-[var(--color-app-border)] bg-transparent p-0" />
			<input
				type="text"
				bind:value={hexInputValue}
				oninput={handleHexInput}
				placeholder="#000000"
				class="font-mono w-24 rounded border border-[var(--color-app-border)] bg-[var(--color-app-surface-secondary)] px-2 py-1.5 text-[var(--color-app-text-primary)] focus:border-[var(--color-app-primary)] focus:outline-none" />
		</div>
	</div>

	<div
		class="flex justify-end gap-2 border-t border-[var(--color-app-border)] bg-[var(--color-app-surface)] px-3 py-2">
		<Button variant="secondary" onclick={handleDismiss}>Dismiss</Button>
		<Button variant="primary" onclick={handleSave}>Save</Button>
	</div>
</div>

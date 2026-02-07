<script lang="ts">
	import { parseHexColor } from '../../utils/hex-color';

	let {
		value = $bindable(),
		class: className = '',
		placeholder = '#000000'
	}: {
		value: string;
		class?: string;
		placeholder?: string;
	} = $props();

	let hexInputValue = $state(value);

	$effect(() => {
		hexInputValue = value;
	});

	function handleHexInput(e: Event) {
		const raw = (e.target as HTMLInputElement).value;
		const hex = parseHexColor(raw);
		if (hex !== null) {
			value = hex;
			hexInputValue = hex;
		} else {
			hexInputValue = raw;
		}
	}

	function handleColorPickerInput(e: Event) {
		const v = (e.target as HTMLInputElement).value;
		value = v;
		hexInputValue = v;
	}
</script>

<div class="flex items-center gap-2 {className}">
	<input
		type="color"
		{value}
		oninput={handleColorPickerInput}
		class="h-8 w-16 cursor-pointer rounded border border-[var(--color-app-border)] bg-transparent p-0" />
	<input
		type="text"
		bind:value={hexInputValue}
		oninput={handleHexInput}
		{placeholder}
		class="min-w-0 flex-1 rounded border border-[var(--color-app-border)] bg-[var(--color-app-surface)] px-2 py-1 font-mono text-[var(--color-app-text-secondary)] placeholder-[var(--color-app-text-muted)] focus:border-[var(--color-app-primary)] focus:outline-none" />
</div>

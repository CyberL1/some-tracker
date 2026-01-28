<script lang="ts">
	import type { ChipSetting } from '../../chips/base/schema';
	import Input from '../Input/Input.svelte';
	import Select from '../AppLayout/Select.svelte';

	let {
		setting,
		value = $bindable(),
		onChange
	}: {
		setting: ChipSetting;
		value: unknown;
		onChange?: (key: string, newValue: unknown, setting: ChipSetting) => void;
	} = $props();

	function handleChange(newValue: unknown) {
		value = newValue;
		onChange?.(setting.key, newValue, setting);
	}

	$effect(() => {
		if (setting.type === 'text' || setting.type === 'select' || setting.type === 'number') {
			onChange?.(setting.key, value, setting);
		}
	});

	const selectOptions = $derived(
		setting.type === 'select' && setting.options
			? setting.options.map((opt) => ({
					label: opt.label,
					value: typeof opt.value === 'number' ? opt.value : parseFloat(String(opt.value))
				}))
			: []
	);
</script>

{#if setting.type === 'text'}
	<Input bind:value={value as string} />
{:else if setting.type === 'toggle' && setting.options}
	<button
		type="button"
		class="w-full cursor-pointer rounded border border-[var(--color-app-border)] bg-[var(--color-pattern-bg)] px-2 py-1 text-xs transition-colors hover:bg-[var(--color-pattern-selected)] focus:border-transparent focus:ring-1 focus:ring-blue-500 focus:outline-none"
		onclick={() => {
			const currentIndex = setting.options?.findIndex((opt) => opt.value === value) ?? 0;
			const nextIndex = (currentIndex + 1) % (setting.options?.length ?? 1);
			handleChange(setting.options?.[nextIndex]?.value);
		}}>
		{String(value)}
	</button>
{:else if setting.type === 'select' && setting.options}
	<Select bind:value={value as number} options={selectOptions} />
{:else if setting.type === 'number'}
	<Input bind:value={value as string} type="number" />
{/if}

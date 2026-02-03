<script lang="ts">
	import type { ChipSetting } from '../../chips/base/schema';
	import Input from '../Input/Input.svelte';
	import Select from '../AppLayout/Select.svelte';

	let {
		setting,
		value = $bindable(),
		onChange,
		context = {},
		hintOverride = undefined
	}: {
		setting: ChipSetting;
		value: unknown;
		onChange?: (key: string, newValue: unknown, setting: ChipSetting) => void;
		context?: Record<string, unknown>;
		hintOverride?: string | null;
	} = $props();

	function handleChange(newValue: unknown) {
		value = newValue;
		onChange?.(setting.key, newValue, setting);
	}

	const selectOptions = $derived.by(() => {
		if (setting.type !== 'select' || !setting.options) return [];
		const base = setting.options.map((opt) => ({
			label: opt.label,
			value: typeof opt.value === 'number' ? opt.value : parseFloat(String(opt.value))
		}));
		if (setting.dynamicOption) {
			base.push({
				label: setting.dynamicOption.label(context),
				value: setting.dynamicOption.value
			});
		}
		return base;
	});

	const visible = $derived(
		!setting.showWhen || context[setting.showWhen.key] == setting.showWhen.value
	);

	const hint = $derived(
		hintOverride !== undefined
			? hintOverride
			: setting.computedHint
				? setting.computedHint(value, context)
				: null
	);
</script>

{#if visible}
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
		<Select
			bind:value={value as number}
			options={selectOptions}
			showCustomOption={!setting.dynamicOption}
			onchange={() => onChange?.(setting.key, value, setting)} />
	{:else if setting.type === 'number'}
		<div class="flex items-center gap-2">
			<Input
				bind:value={value as string}
				type="number"
				min={setting.min}
				max={setting.max}
				step={setting.step}
				onchange={() => onChange?.(setting.key, value, setting)} />
			{#if hint}
				<span class="text-xs text-[var(--color-app-text-muted)]">{hint}</span>
			{/if}
		</div>
	{/if}
	{#if setting.type !== 'number' && hint}
		<span class="text-xs text-[var(--color-app-text-muted)]">{hint}</span>
	{/if}
{/if}

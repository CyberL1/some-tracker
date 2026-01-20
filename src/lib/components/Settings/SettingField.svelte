<script lang="ts">
	import type { SettingsItem } from './types';
	import type { Settings } from './types';
	import { RangeInput } from '../RangeInput';
	import { Checkbox } from '../Checkbox';
	import { FormField } from '../FormField';
	import Input from '../Input/Input.svelte';

	let { item, tempSettings = $bindable() }: {
		item: SettingsItem;
		tempSettings: Settings;
	} = $props();

	const settingId = `setting-${item.setting}`;
</script>

<FormField id={settingId} label={item.label} description={item.description}>
	{#if item.type === 'range'}
		<RangeInput
			id={settingId}
			bind:value={tempSettings[item.setting] as number}
			min={item.min ?? 0}
			max={item.max ?? 100}
			step={item.step ?? 1} />
	{:else if item.type === 'number'}
		<Input
			id={settingId}
			type="number"
			bind:value={tempSettings[item.setting]}
			min={item.min}
			max={item.max}
			step={item.step ?? 1}
			class="w-10 h-6 text-xs"
			onblur={(e) => {
				const value = Number(e.currentTarget.value);
				const min = item.min ?? -Infinity;
				const max = item.max ?? Infinity;
				if (!isNaN(value)) {
					(tempSettings as any)[item.setting] = Math.max(min, Math.min(max, value));
				} else if (item.defaultValue !== undefined) {
					(tempSettings as any)[item.setting] = item.defaultValue;
				}
			}} />
	{:else if item.type === 'select'}
		<select
			id={settingId}
			bind:value={tempSettings[item.setting]}
			class="w-40 cursor-pointer rounded border border-[var(--color-app-border)] bg-[var(--color-app-surface)] px-2 py-1 text-xs text-[var(--color-app-text-secondary)] focus:border-[var(--color-app-primary)] focus:outline-none">
			{#if item.options}
				{#each item.options as option}
					<option value={option.value}>{option.label}</option>
				{/each}
			{/if}
		</select>
	{:else if item.type === 'toggle'}
		<Checkbox
			id={settingId}
			bind:checked={tempSettings[item.setting] as boolean} />
	{/if}
</FormField>

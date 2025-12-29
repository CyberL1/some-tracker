<script lang="ts">
	import type { ChipProcessor } from '../../core/chip-processor';
	import type { ChipSetting } from '../../models/chips/schema';
	import Card from '../Card/Card.svelte';
	import CardElement from '../Card/CardElement.svelte';
	import DynamicField from './DynamicField.svelte';
	import IconCarbonChip from '~icons/carbon/chip';
	import IconCarbonFolders from '~icons/carbon/folders';
	import { getContext } from 'svelte';
	import type { AudioService } from '../../services/audio-service';

	let {
		chipProcessors,
		values = $bindable()
	}: {
		chipProcessors: ChipProcessor[];
		values: Record<string, unknown>;
	} = $props();

	const services: { audioService: AudioService } = getContext('container');
	const chip = $derived(chipProcessors[0]?.chip);
	const settings = $derived(chip?.schema.settings || []);

	const projectSettings = $derived(settings.filter((s) => s.group === 'project'));
	const chipSettings = $derived(settings.filter((s) => s.group === 'chip'));

	function handleSettingChange(key: string, value: unknown, setting: ChipSetting) {
		if (setting.notifyAudioService) {
			services.audioService.chipSettings.set(key, value);
		}
	}

	$effect(() => {
		settings
			.filter((s) => s.notifyAudioService && values[s.key] !== undefined)
			.forEach((s) => {
				services.audioService.chipSettings.set(s.key, values[s.key]);
			});
	});
</script>

<div class="mx-100 flex h-full flex-col gap-3 overflow-auto p-4">
	{#if projectSettings.length > 0}
		<Card title="Project Info" icon={IconCarbonFolders} class="flex w-full flex-col gap-2 p-3">
			{#each projectSettings as setting}
				<CardElement label={setting.label}>
					<DynamicField
						{setting}
						bind:value={values[setting.key]}
						onChange={handleSettingChange} />
				</CardElement>
			{/each}
		</Card>
	{/if}

	{#if chipSettings.length > 0 && chip}
		<Card
			title="{chip.name} Settings"
			icon={IconCarbonChip}
			class="flex w-full flex-col gap-2 p-3">
			<div class="flex gap-2">
				{#each chipSettings as setting}
					<div class={setting.type === 'toggle' ? '' : 'flex-1'}>
						<CardElement label={setting.label}>
							<DynamicField
								{setting}
								bind:value={values[setting.key]}
								onChange={handleSettingChange} />
						</CardElement>
					</div>
				{/each}
			</div>
		</Card>
	{/if}

	{#if settings.length === 0}
		<div class="flex h-full items-center justify-center">
			<p class="text-sm text-neutral-500">No settings available for this chip</p>
		</div>
	{/if}
</div>

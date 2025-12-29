<script lang="ts">
	import type { ChipProcessor } from '../../core/chip-processor';
	import type { ChipSetting } from '../../models/chips/schema';
	import { PROJECT_FIELDS } from '../../models/project-fields';
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

	const chipsByType = $derived.by(() => {
		const grouped = new Map<string, ChipProcessor[]>();
		for (const processor of chipProcessors) {
			const type = processor.chip.type;
			if (!grouped.has(type)) {
				grouped.set(type, []);
			}
			grouped.get(type)!.push(processor);
		}
		return Array.from(grouped.entries()).map(([type, processors]) => ({
			type,
			processors,
			chip: processors[0].chip,
			count: processors.length
		}));
	});

	const projectSettings = $derived([
		...PROJECT_FIELDS,
		...chipsByType.flatMap(
			(group) => group.chip.schema.settings?.filter((s) => s.group === 'project') || []
		)
	]);

	function handleSettingChange(key: string, value: unknown, setting: ChipSetting) {
		if (setting.notifyAudioService) {
			services.audioService.chipSettings.set(key, value);
		}
	}

	function handleChipSettingChange(
		chipType: string,
		key: string,
		value: unknown,
		setting: ChipSetting
	) {
		const processors = chipsByType.find((g) => g.type === chipType)?.processors || [];
		for (const processor of processors) {
			processor.updateParameter(key, value);
		}
		if (setting.notifyAudioService) {
			services.audioService.chipSettings.set(key, value);
		}
	}

	$effect(() => {
		chipsByType.forEach((group) => {
			const settings = group.chip.schema.settings || [];
			settings
				.filter((s) => s.notifyAudioService && values[s.key] !== undefined)
				.forEach((s) => {
					services.audioService.chipSettings.set(s.key, values[s.key]);
				});
		});
	});
</script>

<div class="mx-100 flex h-full flex-col gap-3 overflow-auto p-4">
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

	{#each chipsByType as group}
		{@const chipSettings = group.chip.schema.settings?.filter((s) => s.group === 'chip') || []}
		{#if chipSettings.length > 0}
			<Card
				title="{group.chip.name} Settings{group.count > 1 ? ` (${group.count})` : ''}"
				icon={IconCarbonChip}
				class="flex w-full flex-col gap-2 p-3">
				<div class="flex gap-2">
					{#each chipSettings as setting}
						<div class={setting.type === 'toggle' ? '' : 'flex-1'}>
							<CardElement label={setting.label}>
								<DynamicField
									{setting}
									bind:value={values[setting.key]}
									onChange={(key, value, s) => {
										handleChipSettingChange(group.type, key, value, s);
									}} />
							</CardElement>
						</div>
					{/each}
				</div>
			</Card>
		{/if}
	{/each}

	{#if chipsByType.length === 0 || chipsByType.every((g) => (g.chip.schema.settings?.filter((s) => s.group === 'chip') || []).length === 0)}
		{#if projectSettings.length === PROJECT_FIELDS.length}
			<div class="flex h-full items-center justify-center">
				<p class="text-sm text-neutral-500">No chip-specific settings available</p>
			</div>
		{/if}
	{/if}
</div>

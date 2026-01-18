<script lang="ts">
	import type { ChipProcessor } from '../../chips/base/processor';
	import type { ChipSetting } from '../../chips/base/schema';
	import type { Song } from '../../models/song';
	import { PROJECT_FIELDS } from '../../models/project-fields';
	import { getChipByType } from '../../chips/registry';
	import Card from '../Card/Card.svelte';
	import CardElement from '../Card/CardElement.svelte';
	import DynamicField from './DynamicField.svelte';
	import IconCarbonChip from '~icons/carbon/chip';
	import IconCarbonFolders from '~icons/carbon/folders';
	import { getContext } from 'svelte';
	import type { AudioService } from '../../services/audio/audio-service';

	let {
		chipProcessors,
		values = $bindable(),
		songs = []
	}: {
		chipProcessors: ChipProcessor[];
		values: Record<string, unknown>;
		songs?: Song[];
	} = $props();

	const services: { audioService: AudioService } = getContext('container');

	const songsByChipType = $derived.by(() => {
		const grouped = new Map<string, Song[]>();
		for (const song of songs) {
			if (!song.chipType) continue;
			if (!grouped.has(song.chipType)) {
				grouped.set(song.chipType, []);
			}
			grouped.get(song.chipType)!.push(song);
		}
		return Array.from(grouped.entries())
			.map(([chipType, songList]) => {
				const chip = getChipByType(chipType);
				return {
					chipType,
					songs: songList,
					chip,
					count: songList.length
				};
			})
			.filter((group) => group.chip !== null);
	});

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
		const songsOfType = songs.filter((s) => s.chipType === chipType);
		for (const song of songsOfType) {
			(song as unknown as Record<string, unknown>)[key] = value;
		}

		if (setting.notifyAudioService) {
			const processors = chipsByType.find((g) => g.type === chipType)?.processors || [];
			for (const processor of processors) {
				processor.updateParameter(key, value);
			}
			services.audioService.chipSettings.set(key, value);
		}
	}

	function getChipSettingValue(chipType: string, key: string): unknown {
		const songsOfType = songs.filter((s) => s.chipType === chipType);
		if (songsOfType.length === 0) return undefined;
		return (songsOfType[0] as unknown as Record<string, unknown>)[key];
	}

	$effect(() => {
		songsByChipType.forEach((group) => {
			if (!group.chip) return;
			const settings = group.chip.schema.settings || [];
			settings
				.filter((s) => s.group === 'chip' && s.notifyAudioService)
				.forEach((s) => {
					const value = getChipSettingValue(group.chipType, s.key);
					if (value !== undefined) {
						services.audioService.chipSettings.set(s.key, value);
					}
				});
		});
	});
</script>

<div class="flex h-full flex-col gap-3 overflow-auto p-4">
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

	{#each songsByChipType as group}
		{#if group.chip}
			{@const chipSettings =
				group.chip.schema.settings?.filter((s) => s.group === 'chip') || []}
			{#if chipSettings.length > 0}
				<Card
					title="{group.chip.name} Settings{group.count > 1
						? ` (${group.count} songs)`
						: ''}"
					icon={IconCarbonChip}
					class="flex w-full flex-col gap-2 p-3">
					<div class="flex gap-2">
						{#each chipSettings as setting}
							{@const currentValue =
								getChipSettingValue(group.chipType, setting.key) ??
								setting.defaultValue}
							<div class={setting.type === 'toggle' ? '' : 'flex-1'}>
								<CardElement label={setting.label}>
									<DynamicField
										{setting}
										value={currentValue}
										onChange={(key, value, s) => {
											handleChipSettingChange(group.chipType, key, value, s);
										}} />
								</CardElement>
							</div>
						{/each}
					</div>
				</Card>
			{/if}
		{/if}
	{/each}

	{#if chipsByType.length === 0 || chipsByType.every((g) => (g.chip.schema.settings?.filter((s) => s.group === 'chip') || []).length === 0)}
		{#if projectSettings.length === PROJECT_FIELDS.length}
			<div class="flex h-full items-center justify-center">
				<p class="text-sm text-[var(--color-app-text-muted)]">No chip-specific settings available</p>
			</div>
		{/if}
	{/if}
</div>

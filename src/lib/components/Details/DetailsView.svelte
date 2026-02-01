<script lang="ts">
	import type { ChipProcessor, TuningTableSupport } from '../../chips/base/processor';
	import type { ChipSetting } from '../../chips/base/schema';
	import { getDefaultSettingValue } from '../../chips/base/schema';
	import type { Song } from '../../models/song';
	import { PROJECT_FIELDS } from '../../models/project-fields';
	import { getChipByType } from '../../chips/registry';
	import {
		inferTuningTableSource,
		getTuningTableForSource,
		type TuningTableSource
	} from '../../models/pt3/tuning-tables';
	import Card from '../Card/Card.svelte';
	import CardElement from '../Card/CardElement.svelte';
	import DynamicField from './DynamicField.svelte';
	import IconCarbonChip from '~icons/carbon/chip';
	import IconCarbonFolders from '~icons/carbon/folders';
	import { getContext } from 'svelte';
	import type { AudioService } from '../../services/audio/audio-service';

	const DEFAULT_A4 = 440;

	function defaultChipFrequency(chipType: string): number {
		const schema = getChipByType(chipType)?.schema;
		const value = getDefaultSettingValue(schema, 'chipFrequency');
		return typeof value === 'number' ? value : 0;
	}

	let customA4ByChipType = $state<Record<string, number>>({});
	let tuningTableSourceByChipType = $state<Record<string, TuningTableSource>>({});

	$effect(() => {
		songs;
		tuningTableSourceByChipType = {};
		customA4ByChipType = {};
	});

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

	function pushTuningTableToProcessors(chipType: string): void {
		chipProcessors.forEach((processor, index) => {
			const song = songs[index];
			if (!song || song.chipType !== chipType) return;
			const withTuning = processor as ChipProcessor & TuningTableSupport;
			if (typeof withTuning.sendInitTuningTable === 'function') {
				withTuning.sendInitTuningTable(song.tuningTable);
			}
		});
	}

	function handleChipSettingChange(
		chipType: string,
		key: string,
		value: unknown,
		setting: ChipSetting
	) {
		const songsOfType = songs.filter((s) => s.chipType === chipType);
		if (key === 'tuningTableSource' && setting.type === 'tuningTable') {
			const source = value as TuningTableSource;
			tuningTableSourceByChipType[chipType] = source;
			const a4 = customA4ByChipType[chipType] ?? DEFAULT_A4;
			for (const song of songsOfType) {
				song.tuningTableSource = source;
				const clockHz = song.chipFrequency ?? defaultChipFrequency(chipType);
				song.tuningTable = getTuningTableForSource(source, clockHz, a4);
			}
			pushTuningTableToProcessors(chipType);
			return;
		}
		if (key === 'chipFrequency') {
			const clockHz = value as number;
			const a4 = customA4ByChipType[chipType] ?? DEFAULT_A4;
			for (const song of songsOfType) {
				(song as unknown as Record<string, unknown>)[key] = value;
				if (song.tuningTableSource === 'custom') {
					song.tuningTable = getTuningTableForSource('custom', clockHz, a4);
				}
			}
			pushTuningTableToProcessors(chipType);
			if (setting.notifyAudioService) {
				const processors = chipsByType.find((g) => g.type === chipType)?.processors || [];
				for (const processor of processors) {
					processor.updateParameter(key, value);
				}
				services.audioService.chipSettings.set(key, value);
			}
			return;
		}
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
		const song = songsOfType[0];
		if (key === 'tuningTableSource') {
			return song.tuningTableSource ?? inferTuningTableSource(song.tuningTable);
		}
		return (song as unknown as Record<string, unknown>)[key];
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
				{@const regularSettings = chipSettings.filter((s) => s.type !== 'tuningTable')}
				{@const tuningTableSetting = chipSettings.find((s) => s.type === 'tuningTable')}
				<Card
					title="{group.chip.name} Settings{group.count > 1
						? ` (${group.count} songs)`
						: ''}"
					icon={IconCarbonChip}
					class="flex w-full flex-col gap-2 p-3">
					<div class="flex flex-wrap gap-2">
						{#each regularSettings as setting}
							{@const currentValue =
								getChipSettingValue(group.chipType, setting.key) ??
								setting.defaultValue}
							<div class={setting.type === 'toggle' ? '' : 'flex-1 min-w-0'}>
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
					{#if tuningTableSetting?.options}
						{@const currentValue =
							tuningTableSourceByChipType[group.chipType] ??
							getChipSettingValue(group.chipType, tuningTableSetting.key) ??
							tuningTableSetting.defaultValue}
						{@const isCustom = (currentValue as string) === 'custom'}
						<CardElement label={tuningTableSetting.label}>
							<select
								class="w-full cursor-pointer rounded border border-[var(--color-app-border)] bg-[var(--color-app-surface)] px-2 py-1 pr-8 text-xs text-[var(--color-app-text-secondary)] focus:border-transparent focus:ring-1 focus:ring-[var(--color-app-primary)] focus:outline-none"
								value={currentValue as string}
								onchange={(e) => {
									const v = e.currentTarget.value as TuningTableSource;
									handleChipSettingChange(group.chipType, tuningTableSetting.key, v, tuningTableSetting);
								}}>
								{#each tuningTableSetting.options as opt}
									<option value={String(opt.value)}>{opt.label}</option>
								{/each}
							</select>
						</CardElement>
						<CardElement label="A4 (Hz)">
							<input
								type="number"
								min="220"
								max="880"
								value={customA4ByChipType[group.chipType] ?? DEFAULT_A4}
								disabled={!isCustom}
								class="w-full rounded border border-[var(--color-app-border)] bg-[var(--color-app-surface)] px-2 py-1 text-xs text-[var(--color-app-text-secondary)] focus:border-transparent focus:ring-1 focus:ring-[var(--color-app-primary)] focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
								oninput={(e) => {
									const v = parseInt((e.currentTarget as HTMLInputElement).value, 10);
									if (Number.isNaN(v) || v < 220 || v > 880) return;
									customA4ByChipType[group.chipType] = v;
									const songsOfType = songs.filter((s) => s.chipType === group.chipType);
									for (const song of songsOfType) {
										const clockHz = song.chipFrequency ?? defaultChipFrequency(group.chipType);
										song.tuningTable = getTuningTableForSource('custom', clockHz, v);
									}
									pushTuningTableToProcessors(group.chipType);
								}} />
						</CardElement>
					{/if}
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

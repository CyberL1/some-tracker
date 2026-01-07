<script lang="ts">
	import type { Instrument, Song } from '../../models/song';
	import IconCarbonWaveform from '~icons/carbon/waveform';
	import Card from '../Card/Card.svelte';

	let {
		songs = [],
		isExpanded = false
	}: {
		songs: Song[];
		isExpanded: boolean;
	} = $props();

	function formatMixerFlags(row: Instrument['rows'][0]): string {
		const parts: string[] = [];
		if (row.tone) parts.push('T');
		else parts.push('.');
		if (row.noise) parts.push('N');
		else parts.push('.');
		if (row.envelope) parts.push('E');
		else parts.push('.');
		return parts.join('');
	}

	function formatNumber(value: number, signed: boolean = false): string {
		if (signed) {
			if (value >= 0) return `+${value}`;
			return `${value}`;
		}
		return value.toString();
	}

	function getNumber(value: unknown, defaultValue: number = 0): number {
		return typeof value === 'number' ? value : defaultValue;
	}

	function formatHex(value: number, width: number = 2): string {
		return value.toString(16).toUpperCase().padStart(width, '0');
	}
</script>

<div class="flex h-full flex-col">
	<Card
		title="Instruments (Debug)"
		icon={IconCarbonWaveform}
		fullHeight={true}
		class="flex flex-col">
		{#snippet children()}
			<div class="flex-1 overflow-auto p-4">
				{#if songs.length === 0}
					<div class="flex h-full items-center justify-center">
						<p class="text-sm text-neutral-500">No songs loaded</p>
					</div>
				{:else}
					{#each songs as song, songIndex}
						<div class="mb-6">
							<h3 class="mb-2 text-sm font-semibold text-neutral-300">
								Song {songIndex + 1} ({song.instruments.length} instruments)
							</h3>
							{#if song.instruments.length === 0}
								<p class="text-xs text-neutral-500">No instruments</p>
							{:else}
								<div class="space-y-4">
									{#each song.instruments as instrument}
										<div
											class="rounded border border-neutral-700 bg-neutral-900/50 p-3">
											<div
												class="mb-2 flex items-center justify-between border-b border-neutral-800 pb-2">
												<div class="flex items-center gap-2">
													<span
														class="font-mono text-xs font-semibold text-blue-400">
														#{formatHex(instrument.id)}
													</span>
													<span class="text-xs text-neutral-400">
														ID: {instrument.id}
													</span>
												</div>
												<div class="text-xs text-neutral-500">
													Loop: {instrument.loop} | Rows: {instrument.rows
														.length}
												</div>
											</div>
											<div class="overflow-x-auto">
												<table class="w-full text-xs">
													<thead>
														<tr
															class="border-b border-neutral-800 text-neutral-400">
															<th class="px-2 py-1 text-left">#</th>
															<th class="px-2 py-1 text-left"
																>Mixer</th>
															<th class="px-2 py-1 text-right"
																>ToneAdd</th>
															<th class="px-2 py-1 text-right"
																>NoiseAdd</th>
															<th class="px-2 py-1 text-right"
																>Volume</th>
															<th class="px-2 py-1 text-center"
																>Loop</th>
														</tr>
													</thead>
													<tbody>
														{#each instrument.rows as row, rowIndex}
															{@const isLoopPoint =
																instrument.loop > 0 &&
																rowIndex === instrument.loop}
															{@const toneAdd = getNumber(
																row.toneAdd
															)}
															{@const noiseAdd = getNumber(
																row.noiseAdd
															)}
															{@const volume = getNumber(row.volume)}
															<tr
																class="border-b border-neutral-800/50 {isLoopPoint
																	? 'bg-blue-900/20'
																	: ''}">
																<td
																	class="px-2 py-1 font-mono text-neutral-400">
																	{rowIndex
																		.toString()
																		.padStart(2, '0')}
																	{#if isLoopPoint}
																		<span
																			class="ml-1 text-blue-400"
																			>↻</span>
																	{/if}
																</td>
																<td
																	class="px-2 py-1 font-mono {row.tone ||
																	row.noise ||
																	row.envelope
																		? 'text-green-400'
																		: 'text-neutral-600'}">
																	{formatMixerFlags(row)}
																</td>
																<td
																	class="px-2 py-1 text-right font-mono {toneAdd !==
																	0
																		? 'text-yellow-400'
																		: 'text-neutral-500'}">
																	<div
																		class="flex items-center justify-end gap-1">
																		{formatNumber(
																			toneAdd,
																			true
																		)}
																		{#if row.toneAccumulation}
																			<span
																				class="text-xs text-blue-400"
																				>↑</span>
																		{/if}
																	</div>
																</td>
																<td
																	class="px-2 py-1 text-right font-mono {noiseAdd !==
																	0
																		? 'text-yellow-400'
																		: 'text-neutral-500'}">
																	<div
																		class="flex items-center justify-end gap-1">
																		{formatNumber(
																			noiseAdd,
																			true
																		)}
																		{#if row.noiseAccumulation}
																			<span
																				class="text-xs text-blue-400"
																				>↑</span>
																		{/if}
																	</div>
																</td>
																<td
																	class="px-2 py-1 text-right font-mono {volume >
																	0
																		? 'text-cyan-400'
																		: 'text-neutral-500'}">
																	<div
																		class="flex items-center justify-end gap-1">
																		{row.volume}
																		{#if row.amplitudeSliding}
																			<span
																				class="text-xs {row.amplitudeSlideUp
																					? 'text-green-400'
																					: 'text-red-400'}">
																				{row.amplitudeSlideUp
																					? '↑'
																					: '↓'}
																			</span>
																		{/if}
																	</div>
																</td>
																<td class="px-2 py-1 text-center">
																	{#if row.loop}
																		<span class="text-blue-400"
																			>●</span>
																	{:else}
																		<span
																			class="text-neutral-700"
																			>○</span>
																	{/if}
																</td>
															</tr>
														{/each}
													</tbody>
												</table>
											</div>
										</div>
									{/each}
								</div>
							{/if}
						</div>
					{/each}
				{/if}
			</div>
		{/snippet}
	</Card>
</div>

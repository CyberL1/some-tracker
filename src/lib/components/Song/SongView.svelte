<script lang="ts">
	import type { Pattern, Instrument, Song } from '../../models/song';
	import type { ChipProcessor } from '../../core/chip-processor';
	import type { Chip } from '../../models/chips';
	import Card from '../Card/Card.svelte';
	import PatternEditor from './PatternEditor.svelte';
	import IconCarbonChip from '~icons/carbon/chip';

	let {
		songs = $bindable(),
		patternOrder = $bindable(),
		chipProcessors,
		patternEditor = $bindable()
	}: {
		songs: Song[];
		patternOrder: number[];
		chipProcessors: ChipProcessor[];
		patternEditor?: PatternEditor | null;
	} = $props();
</script>

<div class="flex h-full justify-center overflow-hidden">
	{#each songs as song, i}
		<Card
			title={`${chipProcessors[i].chip.name} - (${i + 1})`}
			fullHeight={true}
			icon={IconCarbonChip}
			class="p-0">
			<PatternEditor
				bind:this={patternEditor}
				bind:patterns={song.patterns}
				bind:patternOrder
				speed={song.initialSpeed}
				tuningTable={song.tuningTable}
				instruments={song.instruments}
				chip={chipProcessors[i].chip}
				chipProcessor={chipProcessors[i]} />
		</Card>
	{/each}
</div>

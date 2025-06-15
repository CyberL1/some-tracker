<script lang="ts">
	import Card from '../Card/Card.svelte';
	import type { Ornament } from '../../models/project';
	import IconCarbonMusic from '~icons/carbon/music';
	import IconCarbonHexagonSolid from '~icons/carbon/hexagon-solid';
	import IconCarbonHexagonOutline from '~icons/carbon/hexagon-outline';
	import IconCarbonAdd from '~icons/carbon/add';
	import IconCarbonTrashCan from '~icons/carbon/trash-can';
	import OrnamentEditor from './OrnamentEditor.svelte';
	import { getContext } from 'svelte';
	import type { AudioService } from '../../services/audio-service';

	const services: { audioService: AudioService } = getContext('container');

	let asHex = $state(false);
	let selectedOrnamentIndex = $state(0);

	let ornamentEditor: OrnamentEditor | null = $state(null);

	let {
		ornaments = $bindable()
	}: {
		ornaments: Ornament[];
	} = $props();

	$effect(() => {
		if (selectedOrnamentIndex >= ornaments.length) selectedOrnamentIndex = 0;
	});
</script>

<Card
	title="Ornaments (Arpeggios)"
	icon={IconCarbonMusic}
	fullHeight={true}
	class="relative flex w-full flex-col"
	actions={[
		{
			label: 'Add Row',
			icon: IconCarbonAdd,
			onClick: () => ornamentEditor?.addRowExternal?.()
		},
		{
			label: 'Remove Row',
			icon: IconCarbonTrashCan,
			onClick: () => ornamentEditor?.removeLastRowExternal?.()
		},
		{
			label: 'Hex',
			icon: asHex ? IconCarbonHexagonSolid : IconCarbonHexagonOutline,
			onClick: () => (asHex = !asHex)
		}
	]}>
	{#if ornaments.length}
		<div class="relative h-16">
			<div
				class="absolute inset-0 flex items-center overflow-x-scroll overflow-y-hidden border-neutral-600/50 bg-neutral-800">
				{#each ornaments as ornament, index}
					<button
						class="group flex shrink-0 cursor-pointer flex-col items-center p-2 transition-colors"
						onclick={() => (selectedOrnamentIndex = index)}>
						<span
							class="font-mono text-xs {selectedOrnamentIndex === index
								? 'text-neutral-100'
								: 'text-neutral-400 group-hover:text-neutral-200'}">
							{(ornament.id + 1).toString(16).toUpperCase().padStart(2, '0')}
						</span>
						<span
							class="text-xs {selectedOrnamentIndex === index
								? 'text-neutral-300'
								: 'text-neutral-500 group-hover:text-neutral-400'}">
							{ornament.name}
						</span>
					</button>
				{/each}
			</div>
		</div>
	{/if}
	<div class="grow-1 overflow-y-auto">
		{#if ornaments.length}
			{#key ornaments[selectedOrnamentIndex].id}
				<OrnamentEditor
					bind:this={ornamentEditor}
					ornament={ornaments[selectedOrnamentIndex]}
					{asHex}
					onOrnamentChange={(ornament) => {
						ornaments[selectedOrnamentIndex] = { ...ornament };
						ornaments = [...ornaments];
						services.audioService.updateOrnaments(ornaments);
					}} />
			{/key}
		{:else}
			<p class="p-4 text-neutral-500">No ornaments yet.</p>
		{/if}
	</div>
</Card>

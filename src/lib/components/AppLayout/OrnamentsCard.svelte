<script lang="ts">
	import Card from '../Card/Card.svelte';
	import type { Ornament } from '../../models/song';
	import IconCarbonMusic from '~icons/carbon/music';
	import IconCarbonHexagonSolid from '~icons/carbon/hexagon-solid';
	import IconCarbonHexagonOutline from '~icons/carbon/hexagon-outline';

	let asHex = $state(false);
	let selectedOrnamentIndex = $state(0);

	let {
		ornaments = $bindable()
	}: {
		ornaments: Ornament[]
	} = $props();
</script>

<Card
	title="Ornaments (Arpeggios)"
	icon={IconCarbonMusic}
	fullHeight={true}
	class="flex flex-col w-full relative"
	actions={[
		{
			label: 'Hex',
			icon: asHex ? IconCarbonHexagonSolid : IconCarbonHexagonOutline,
			onClick: () => (asHex = !asHex)
		}
	]}>
	{#if ornaments.length}
		<div class="h-16 relative">
			<div class="absolute inset-0 overflow-x-scroll overflow-y-hidden flex items-center border-neutral-600/50 bg-neutral-800">
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
							class="text-sm {selectedOrnamentIndex === index
							? 'text-neutral-300'
							: 'text-neutral-500 group-hover:text-neutral-400'}">
						{ornament.name}
					</span>
					</button>
				{/each}
			</div>
		</div>
	{/if}
	<div class="grow-1 flex flex-col justify-center items-center">
		INSERT Ornament editor here
	</div>
</Card>

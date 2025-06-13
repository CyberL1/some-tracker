<script lang="ts">
	import Card from '../Card/Card.svelte';
	import Input from '../Input/Input.svelte';
	import type { Ornament } from '../../models/song';
	import IconCarbonMusic from '~icons/carbon/music';
	import IconCarbonHexagonSolid from '~icons/carbon/hexagon-solid';
	import IconCarbonHexagonOutline from '~icons/carbon/hexagon-outline';

	let asHex = $state(false);

	let {
		ornaments = $bindable()
	}: {
		ornaments: Ornament[];
	} = $props();

	function handleOrnamentChange(event: Event, ornament: Ornament, index: number) {
		const target = event.target as HTMLInputElement;
		const value = target.value;
		ornaments[index].rows = value
			.split(' ')
			.map((row) => (asHex ? parseInt(row, 16) || 0 : parseInt(row, 10) || 0));
	}

	function handleLoopPointChange(event: Event, ornament: Ornament) {
		const target = event.target as HTMLInputElement;
		const value = parseInt(target.value);
		ornament.loop = isNaN(value) ? 0 : value;
	}
</script>

<Card
	title="Ornaments (Arpeggios)"
	icon={IconCarbonMusic}
	fullHeight={true}
	actions={[
		{
			label: 'Hex',
			icon: asHex ? IconCarbonHexagonSolid : IconCarbonHexagonOutline,
			onClick: () => (asHex = !asHex)
		}
	]}>
	<div class="relative h-full">
		<div class="absolute inset-0 overflow-y-auto p-2">
			<div class="grid gap-1.5">
				{#each ornaments as ornament, index}
					<div
						class="grid grid-cols-[1.75rem_minmax(4rem,1fr)_minmax(6rem,1.5fr)_1.75rem] items-center gap-1.5 rounded-lg border border-neutral-600/50 p-1.5">
						<span class="font-mono text-xs text-neutral-400">
							{(ornament.id + 1).toString(16).toUpperCase().padStart(2, '0')}
						</span>
						<Input
							value={ornament.name}
							props={{ placeholder: 'Enter ornament name' }} />
						<Input
							value={ornament.rows
								.flat()
								.map((row) =>
									asHex ? row.toString(16).toUpperCase() : row.toString(10)
								)
								.join(' ')}
							class="font-mono"
							props={{
								placeholder: asHex ? 'Enter hex values' : 'Enter decimal values',
								onchange: (event) => handleOrnamentChange(event, ornament, index)
							}} />
						<Input
							value={ornament.loop.toString()}
							class="font-mono text-xs"
							props={{
								placeholder: 'L',
								type: 'number',
								min: 0,
								max: 9,
								onchange: (event) => handleLoopPointChange(event, ornament)
							}} />
					</div>
				{/each}
			</div>
		</div>
	</div>
</Card>

<script lang="ts">
	import Card from '../Card/Card.svelte';
	import type { Table } from '../../models/project';
	import IconCarbonMusic from '~icons/carbon/music';
	import IconCarbonHexagonSolid from '~icons/carbon/hexagon-solid';
	import IconCarbonHexagonOutline from '~icons/carbon/hexagon-outline';
	import IconCarbonAdd from '~icons/carbon/add';
	import IconCarbonTrashCan from '~icons/carbon/trash-can';
	import TableEditor from './TableEditor.svelte';
	import { getContext } from 'svelte';
	import type { AudioService } from '../../services/audio-service';

	const services: { audioService: AudioService } = getContext('container');

	let asHex = $state(false);
	let selectedTableIndex = $state(0);

	let tableEditor: TableEditor | null = $state(null);

	let {
		tables = $bindable()
	}: {
		tables: Table[];
	} = $props();

	$effect(() => {
		if (selectedTableIndex >= tables.length) selectedTableIndex = 0;
	});
</script>

<Card
	title="Tables (Arpeggios)"
	icon={IconCarbonMusic}
	fullHeight={true}
	class="relative flex w-full flex-col"
	actions={[
		{
			label: 'Add Row',
			icon: IconCarbonAdd,
			onClick: () => tableEditor?.addRowExternal?.()
		},
		{
			label: 'Remove Row',
			icon: IconCarbonTrashCan,
			onClick: () => tableEditor?.removeLastRowExternal?.()
		},
		{
			label: 'Hex',
			icon: asHex ? IconCarbonHexagonSolid : IconCarbonHexagonOutline,
			onClick: () => (asHex = !asHex)
		}
	]}>
	{#if tables.length}
		<div class="relative h-16">
			<div
				class="absolute inset-0 flex items-center overflow-x-scroll overflow-y-hidden border-neutral-600/50 bg-neutral-800">
				{#each tables as table, index}
					<button
						class="group flex shrink-0 cursor-pointer flex-col items-center p-2 transition-colors"
						onclick={() => (selectedTableIndex = index)}>
						<span
							class="font-mono text-xs {selectedTableIndex === index
								? 'text-neutral-100'
								: 'text-neutral-400 group-hover:text-neutral-200'}">
							{(table.id + 1).toString(16).toUpperCase().padStart(2, '0')}
						</span>
						<span
							class="text-xs {selectedTableIndex === index
								? 'text-neutral-300'
								: 'text-neutral-500 group-hover:text-neutral-400'}">
							{table.name}
						</span>
					</button>
				{/each}
			</div>
		</div>
	{/if}
	<div class="grow-1 overflow-y-auto">
		{#if tables.length}
			{#key tables[selectedTableIndex].id}
				<TableEditor
					bind:this={tableEditor}
					table={tables[selectedTableIndex]}
					{asHex}
					onTableChange={(table) => {
						tables[selectedTableIndex] = { ...table };
						tables = [...tables];
						services.audioService.updateTables(tables);
					}} />
			{/key}
		{:else}
			<p class="p-4 text-neutral-500">No tables yet.</p>
		{/if}
	</div>
</Card>

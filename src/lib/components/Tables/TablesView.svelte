<script lang="ts">
	import type { Table } from '../../models/project';
	import IconCarbonHexagonSolid from '~icons/carbon/hexagon-solid';
	import IconCarbonHexagonOutline from '~icons/carbon/hexagon-outline';
	import IconCarbonDataTable from '~icons/carbon/data-table';
	import TableEditor from './TableEditor.svelte';
	import Card from '../Card/Card.svelte';
	import { getContext } from 'svelte';
	import type { AudioService } from '../../services/audio-service';

	const services: { audioService: AudioService } = getContext('container');

	let {
		tables = $bindable()
	}: {
		tables: Table[];
	} = $props();

	let asHex = $state(false);
	let selectedTableIndex = $state(0);
	let tableEditor: TableEditor | null = $state(null);

	function handleTableChange(table: Table): void {
		tables[selectedTableIndex] = { ...table };
		tables = [...tables];
		services.audioService.updateTables(tables);
	}

	$effect(() => {
		if (selectedTableIndex >= tables.length) selectedTableIndex = 0;
	});

	const hexIcon = $derived(asHex ? IconCarbonHexagonSolid : IconCarbonHexagonOutline);

	const cardActions = $derived([
		{
			label: 'Hex',
			icon: hexIcon,
			onClick: () => (asHex = !asHex),
			class: asHex ? 'text-blue-400' : ''
		}
	]);
</script>

<div class="mx-80 flex h-full flex-col">
	<Card
		title="Tables (Arpeggios)"
		icon={IconCarbonDataTable}
		fullHeight={true}
		actions={cardActions}
		class="flex flex-col">
		{#snippet children()}
			{#if tables.length}
				<div class="border-b border-neutral-700 bg-neutral-800">
					<div class="flex overflow-x-auto">
						{#each tables as table, index}
							<button
								class="group flex shrink-0 cursor-pointer flex-col items-center border-r border-neutral-700 p-3 transition-colors {selectedTableIndex ===
								index
									? 'bg-neutral-900'
									: 'hover:bg-neutral-700/50'}"
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

				<div class="flex-1 overflow-auto p-4">
					{#key tables[selectedTableIndex].id}
						<TableEditor
							bind:this={tableEditor}
							table={tables[selectedTableIndex]}
							{asHex}
							onTableChange={handleTableChange} />
					{/key}
				</div>
			{:else}
				<div class="flex flex-1 items-center justify-center">
					<p class="text-sm text-neutral-500">No tables yet.</p>
				</div>
			{/if}
		{/snippet}
	</Card>
</div>

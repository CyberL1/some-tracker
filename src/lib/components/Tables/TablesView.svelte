<script lang="ts">
	import type { Table } from '../../models/project';
	import { Table as TableModel } from '../../models/project';
	import IconCarbonHexagonSolid from '~icons/carbon/hexagon-solid';
	import IconCarbonHexagonOutline from '~icons/carbon/hexagon-outline';
	import IconCarbonDataTable from '~icons/carbon/data-table';
	import TableEditor from './TableEditor.svelte';
	import Card from '../Card/Card.svelte';
	import { getContext } from 'svelte';
	import type { AudioService } from '../../services/audio/audio-service';

	const services: { audioService: AudioService } = getContext('container');
	const TOTAL_TABLES = 32;

	let {
		tables = $bindable(),
		isExpanded = false
	}: {
		tables: Table[];
		isExpanded: boolean;
	} = $props();

	let asHex = $state(false);
	let selectedTableIndex = $state(0);
	let tableEditor: TableEditor | null = $state(null);

	function isTableUsed(table: Table): boolean {
		if (table.rows.length === 0) return false;
		if (table.rows.length === 1 && table.rows[0] === 0 && table.loop === 0) return false;
		return true;
	}

	function handleTableChange(table: Table): void {
		tables[selectedTableIndex] = { ...table };
		tables = [...tables];
		services.audioService.updateTables(tables);
	}

	$effect(() => {
		if (tables.length !== TOTAL_TABLES) {
			const newTables = [...tables];
			while (newTables.length < TOTAL_TABLES) {
				const id = newTables.length;
				newTables.push(new TableModel(id, [], 0, `Table ${id + 1}`));
			}
			if (newTables.length > TOTAL_TABLES) {
				newTables.splice(TOTAL_TABLES);
			}
			tables = newTables;
		}
	});

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

<div class="flex h-full flex-col">
	<Card
		title="Tables (Arpeggios)"
		icon={IconCarbonDataTable}
		fullHeight={true}
		actions={cardActions}
		class="flex flex-col">
		{#snippet children()}
			<div class="border-b border-neutral-700 bg-neutral-800">
				<div class="flex overflow-x-auto">
					{#each tables as table, index}
						{@const isUsed = isTableUsed(table)}
						{@const isSelected = selectedTableIndex === index}
						<button
							class="group relative flex shrink-0 cursor-pointer flex-col items-center border-r border-neutral-700 p-3 {isSelected
								? 'bg-blue-900/30'
								: isUsed
									? 'bg-neutral-800/40 hover:bg-neutral-800/70'
									: 'bg-neutral-950/60 hover:bg-neutral-950/80'}"
							onclick={() => (selectedTableIndex = index)}>
							<span
								class="font-mono text-xs font-semibold {isSelected
									? 'text-blue-200'
									: isUsed
										? 'text-neutral-300 group-hover:text-neutral-100'
										: 'text-neutral-700 group-hover:text-neutral-600'}">
								{(table.id + 1).toString(16).toUpperCase().padStart(2, '0')}
							</span>
							<span
								class="text-xs {isSelected
									? 'text-blue-300/90'
									: isUsed
										? 'text-neutral-400 group-hover:text-neutral-300'
										: 'text-neutral-800 group-hover:text-neutral-700'}">
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
						{isExpanded}
						onTableChange={handleTableChange} />
				{/key}
			</div>
		{/snippet}
	</Card>
</div>

<script lang="ts">
	import type { Table } from '../../models/project';
	import IconCarbonHexagonSolid from '~icons/carbon/hexagon-solid';
	import IconCarbonHexagonOutline from '~icons/carbon/hexagon-outline';
	import IconCarbonAdd from '~icons/carbon/add';
	import IconCarbonTrashCan from '~icons/carbon/trash-can';
	import TableEditor from './TableEditor.svelte';
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

	$effect(() => {
		if (selectedTableIndex >= tables.length) selectedTableIndex = 0;
	});
</script>

<div class="flex h-full flex-col bg-neutral-900">
	<div class="flex items-center justify-between border-b border-neutral-700 bg-neutral-800 px-4 py-2">
		<h2 class="text-sm font-medium text-neutral-100">Tables (Arpeggios)</h2>
		<div class="flex gap-1">
			<button
				class="group flex items-center gap-1.5 rounded px-2 py-1 text-xs text-neutral-400 transition-colors hover:bg-neutral-700 hover:text-neutral-200"
				onclick={() => tableEditor?.addRowExternal?.()}
				title="Add Row">
				<IconCarbonAdd class="h-3.5 w-3.5" />
				<span>Add Row</span>
			</button>
			<button
				class="group flex items-center gap-1.5 rounded px-2 py-1 text-xs text-neutral-400 transition-colors hover:bg-neutral-700 hover:text-neutral-200"
				onclick={() => tableEditor?.removeLastRowExternal?.()}
				title="Remove Row">
				<IconCarbonTrashCan class="h-3.5 w-3.5" />
				<span>Remove Row</span>
			</button>
			<button
				class="group flex items-center gap-1.5 rounded px-2 py-1 text-xs transition-colors hover:bg-neutral-700 {asHex
					? 'text-blue-400'
					: 'text-neutral-400 hover:text-neutral-200'}"
				onclick={() => (asHex = !asHex)}
				title="Toggle Hexadecimal">
				{#if asHex}
					<IconCarbonHexagonSolid class="h-3.5 w-3.5" />
				{:else}
					<IconCarbonHexagonOutline class="h-3.5 w-3.5" />
				{/if}
				<span>Hex</span>
			</button>
		</div>
	</div>

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
					onTableChange={(table) => {
						tables[selectedTableIndex] = { ...table };
						tables = [...tables];
						services.audioService.updateTables(tables);
					}} />
			{/key}
		</div>
	{:else}
		<div class="flex flex-1 items-center justify-center">
			<p class="text-sm text-neutral-500">No tables yet.</p>
		</div>
	{/if}
</div>



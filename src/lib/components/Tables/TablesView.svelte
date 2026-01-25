<script lang="ts">
	import type { Table } from '../../models/project';
	import { Table as TableModel } from '../../models/project';
	import IconCarbonHexagonSolid from '~icons/carbon/hexagon-solid';
	import IconCarbonHexagonOutline from '~icons/carbon/hexagon-outline';
	import IconCarbonDataTable from '~icons/carbon/data-table';
	import IconCarbonMaximize from '~icons/carbon/maximize';
	import IconCarbonMinimize from '~icons/carbon/minimize';
	import TableEditor from './TableEditor.svelte';
	import Card from '../Card/Card.svelte';
	import { getContext } from 'svelte';
	import type { AudioService } from '../../services/audio/audio-service';

	const services: { audioService: AudioService } = getContext('container');
	const TOTAL_TABLES = 35;

	let {
		tables = $bindable(),
		isExpanded = $bindable(false)
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
				newTables.push(new TableModel(id, [], 0, `Table ${(id + 1).toString(36).toUpperCase()}`));
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
	const expandIcon = $derived(isExpanded ? IconCarbonMinimize : IconCarbonMaximize);

	const cardActions = $derived([
		{
			label: 'Hex',
			icon: hexIcon,
			onClick: () => (asHex = !asHex),
			class: asHex ? 'text-[var(--color-app-primary)]' : ''
		},
		{
			label: isExpanded ? 'Collapse panel' : 'Expand panel',
			icon: expandIcon,
			onClick: () => (isExpanded = !isExpanded),
			class: ''
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
			<div class="border-b border-[var(--color-app-border)] bg-[var(--color-app-surface-secondary)]">
				<div class="flex overflow-x-auto">
					{#each tables as table, index}
						{@const isUsed = isTableUsed(table)}
						{@const isSelected = selectedTableIndex === index}
						<button
							class="group relative flex shrink-0 cursor-pointer flex-col items-center border-r border-[var(--color-app-border)] p-3 {isSelected
								? 'bg-[var(--color-app-primary)]'
								: isUsed
									? 'bg-[var(--color-app-surface-secondary)]/40 hover:bg-[var(--color-app-surface-secondary)]/70'
									: 'bg-[var(--color-app-background)]/60 hover:bg-[var(--color-app-background)]/80'}"
							onclick={() => (selectedTableIndex = index)}>
							<span
								class="font-mono text-xs font-semibold {isSelected
									? 'text-[var(--color-app-text-secondary)]'
									: isUsed
										? 'text-[var(--color-app-text-tertiary)] group-hover:text-[var(--color-app-text-primary)]'
										: 'text-[var(--color-app-text-muted)] group-hover:text-[var(--color-app-text-tertiary)]'}">
								{(table.id + 1).toString(36).toUpperCase()}
							</span>
							<span
								class="text-xs {isSelected
									? 'text-[var(--color-app-text-secondary)]'
									: isUsed
										? 'text-[var(--color-app-text-muted)] group-hover:text-[var(--color-app-text-tertiary)]'
										: 'text-[var(--color-app-text-muted)] group-hover:text-[var(--color-app-text-muted)]'}">
								{table.name}
							</span>
						</button>
					{/each}
				</div>
			</div>

			<div class="flex-1 overflow-auto p-4">
				{#if tables[selectedTableIndex]}
					{#key tables[selectedTableIndex].id}
						<TableEditor
							bind:this={tableEditor}
							table={tables[selectedTableIndex]}
							{asHex}
							{isExpanded}
							onTableChange={handleTableChange} />
					{/key}
				{/if}
			</div>
		{/snippet}
	</Card>
</div>

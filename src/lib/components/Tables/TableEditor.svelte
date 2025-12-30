<script lang="ts">
	import type { Table } from '../../models/project';
	import IconCarbonTrashCan from '~icons/carbon/trash-can';
	import IconCarbonDelete from '~icons/carbon/delete';
	import Input from '../Input/Input.svelte';

	let {
		table,
		asHex = false,
		onTableChange
	}: {
		table: Table;
		asHex: boolean;
		onTableChange: (table: Table) => void;
	} = $props();

	const PITCH_VALUES = Array.from({ length: 23 }, (_, i) => i - 11);
	const SHIFT_VALUES = Array.from({ length: 9 }, (_, i) => i - 4);

	let rows = $state([...table.rows]);
	let loopRow = $state(table.loop);
	let name = $state(table.name);
	let pitches = $state<number[]>([]);
	let shifts = $state<number[]>([]);

	let isDragging = $state(false);
	let dragMode: 'pitch' | 'shift' | null = null;
	let offsetInputRefs: (HTMLInputElement | null)[] = $state([]);
	let lastSyncedTable = $state(table);

	function initRowRepresentations() {
		pitches = rows.map((offset) => offsetToPitch(offset));
		shifts = rows.map((offset, idx) => Math.trunc((offset - pitches[idx]) / 12));
	}

	function offsetToPitch(offset: number): number {
		let pitch = offset % 12;
		if (pitch > 11) pitch -= 12;
		if (pitch < -11) pitch += 12;
		return pitch;
	}

	function pitchShiftToOffset(pitch: number, shift: number) {
		return pitch + shift * 12;
	}

	function recalcRow(index: number) {
		rows[index] = pitchShiftToOffset(pitches[index], shifts[index]);
		rows = [...rows];
	}

	function updateTable(updates: Partial<Table>) {
		onTableChange({ ...table, ...updates });
	}

	function setPitch(index: number, pitch: number) {
		pitches[index] = pitch;
		recalcRow(index);
		updateTable({ rows });
	}

	function setShift(index: number, shift: number) {
		shifts[index] = shift;
		recalcRow(index);
		updateTable({ rows });
	}

	function adjustRowOffset(index: number, newOffset: number) {
		rows[index] = newOffset;
		pitches[index] = offsetToPitch(newOffset);
		shifts[index] = Math.trunc((newOffset - pitches[index]) / 12);
		rows = [...rows];
	}

	function formatNum(value: number): string {
		if (asHex) {
			const sign = value < 0 ? '-' : '';
			return sign + Math.abs(value).toString(16).toUpperCase();
		}
		return value.toString();
	}

	const formatOffset = formatNum;

	function onOffsetInput(index: number, event: Event) {
		const inputEl = event.target as HTMLInputElement;
		let text = inputEl.value.trim();
		const allowedPattern = asHex ? /[^0-9a-fA-F-]/g : /[^0-9-]/g;
		text = text.replace(/\+/g, '').replace(allowedPattern, '');
		if (text !== inputEl.value) inputEl.value = text;
		let parsed: number | null = null;
		if (asHex) {
			let sign = 1;
			let temp = text;
			if (temp.startsWith('-')) {
				sign = -1;
				temp = temp.slice(1);
			}
			if (/^[0-9a-fA-F]+$/.test(temp) && temp !== '') {
				parsed = sign * parseInt(temp, 16);
			}
		} else {
			if (/^-?\d+$/.test(text)) {
				parsed = parseInt(text, 10);
			}
		}
		if (parsed !== null) {
			adjustRowOffset(index, parsed);
		}

		updateTable({ rows });
	}

	function focusInputInRow(row: HTMLTableRowElement | null) {
		if (!row) return;
		const input = row.querySelector('input[type="text"]') as HTMLInputElement | null;
		if (input) {
			input.focus();
			input.select();
		}
	}

	function handleOffsetKeyDown(index: number, event: KeyboardEvent) {
		const key = event.key;

		if (key === 'ArrowDown') {
			event.preventDefault();
			const nextIndex = index + 1;
			if (nextIndex < rows.length) {
				const currentRow = (event.target as HTMLInputElement).closest('tr');
				focusInputInRow(currentRow?.nextElementSibling as HTMLTableRowElement | null);
			} else if (nextIndex === rows.length) {
				addRow();
				setTimeout(() => {
					const currentRow = (event.target as HTMLInputElement).closest('tr');
					focusInputInRow(currentRow?.nextElementSibling as HTMLTableRowElement | null);
				}, 0);
			}
			return;
		}

		if (key === 'ArrowUp') {
			event.preventDefault();
			const prevIndex = index - 1;
			if (prevIndex >= 0) {
				const currentRow = (event.target as HTMLInputElement).closest('tr');
				focusInputInRow(currentRow?.previousElementSibling as HTMLTableRowElement | null);
			}
			return;
		}

		if (key.length > 1) return;
		const pattern = asHex ? /^[0-9a-fA-F-]$/ : /^[0-9-]$/;
		if (!pattern.test(key)) event.preventDefault();
	}

	function updateArraysAfterRowChange(newRows: number[]) {
		rows = newRows;
		pitches = rows.map((offset) => offsetToPitch(offset));
		shifts = rows.map((offset, idx) => Math.trunc((offset - pitches[idx]) / 12));
		if (loopRow >= rows.length) loopRow = rows.length - 1;
		updateTable({ rows });
	}

	function addRow() {
		updateArraysAfterRowChange([...rows, 0]);
	}

	function removeRow(index: number) {
		if (rows.length === 1) return;
		updateArraysAfterRowChange(rows.filter((_, i) => i !== index));
	}

	function removeRowsFromBottom(index: number) {
		if (rows.length === 1) return;
		const rowsToKeep = index + 1;
		if (rowsToKeep >= rows.length) return;
		updateArraysAfterRowChange(rows.slice(0, rowsToKeep));
	}

	function setLoop(index: number) {
		loopRow = index;
		updateTable({ loop: loopRow });
	}

	export function addRowExternal() {
		addRow();
	}

	export function removeLastRowExternal() {
		removeRow(rows.length - 1);
	}

	function beginDrag(mode: 'pitch' | 'shift', index: number, value: number) {
		isDragging = true;
		dragMode = mode;
		if (mode === 'pitch') {
			setPitch(index, value);
		} else {
			setShift(index, value);
		}
	}

	function dragOver(mode: 'pitch' | 'shift', index: number, value: number) {
		if (isDragging && dragMode === mode) {
			if (mode === 'pitch') {
				setPitch(index, value);
			} else {
				setShift(index, value);
			}
		}
	}

	initRowRepresentations();

	$effect(() => {
		if (
			table.id !== lastSyncedTable.id ||
			table.rows.length !== lastSyncedTable.rows.length ||
			table.rows.some((row, i) => row !== lastSyncedTable.rows[i]) ||
			table.loop !== lastSyncedTable.loop ||
			table.name !== lastSyncedTable.name
		) {
			lastSyncedTable = table;
			rows = [...table.rows];
			loopRow = table.loop;
			name = table.name;
			initRowRepresentations();
		}
	});

	$effect(() => {
		if (name !== table.name) {
			updateTable({ name });
		}
	});

	$effect(() => {
		if (offsetInputRefs.length !== rows.length) {
			const newRefs = new Array(rows.length).fill(null);
			for (let i = 0; i < Math.min(offsetInputRefs.length, rows.length); i++) {
				newRefs[i] = offsetInputRefs[i];
			}
			offsetInputRefs = newRefs;
		}
	});

	$effect(() => {
		const stop = () => {
			isDragging = false;
			dragMode = null;
		};
		window.addEventListener('mouseup', stop);
		return () => window.removeEventListener('mouseup', stop);
	});
</script>

<div class="w-full overflow-x-auto">
	<div class="mt-2 mb-2 ml-2 flex items-center gap-2">
		<span class="text-xs text-neutral-400">Name:</span>
		<Input class="w-48 text-xs" bind:value={name} />
	</div>

	<div class="flex gap-2 overflow-x-auto">
		<table class="table-fixed border-collapse bg-neutral-900 font-mono text-xs select-none">
			<thead>
				<tr>
					<th class="px-2 py-1.5">row</th>
					<th class="w-8 px-1.5"></th>
					<th class="w-6 px-1.5">loop</th>
					<th class="w-14 px-1.5">offset</th>
					<th colspan="25" class="px-2">note key offset</th>
				</tr>
				<tr>
					<th></th>
					<th></th>
					<th></th>
					<th></th>
					{#each PITCH_VALUES as p}
						<th class="w-6 min-w-6 bg-neutral-800 text-center" title={String(p)}></th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each rows as offset, index}
					<tr class="h-8">
						<td class="border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-right"
							>{index}</td>
						<td class="border border-neutral-700 bg-neutral-800 px-1.5">
							<div class="flex items-center justify-center gap-1">
								<button
									class="flex items-center justify-center rounded p-0.5 text-neutral-400 transition-colors hover:bg-neutral-700 hover:text-red-400"
									onclick={(e) => {
										e.stopPropagation();
										removeRow(index);
									}}
									title="Remove this row">
									<IconCarbonTrashCan class="h-3.5 w-3.5" />
								</button>
								{#if index < rows.length - 1}
									<button
										class="flex items-center justify-center rounded p-0.5 text-neutral-400 transition-colors hover:bg-neutral-700 hover:text-red-500"
										onclick={(e) => {
											e.stopPropagation();
											removeRowsFromBottom(index);
										}}
										title="Remove all rows from bottom up to this one">
										<IconCarbonDelete class="h-3.5 w-3.5" />
									</button>
								{/if}
							</div>
						</td>
						<td
							class="w-6 cursor-pointer px-1.5 text-center text-sm"
							onclick={() => setLoop(index)}>
							{loopRow === index ? '>' : ''}
						</td>
						<td class="w-14 px-1.5">
							<input
								type="text"
								bind:this={offsetInputRefs[index]}
								class="w-full min-w-0 overflow-x-auto rounded border border-neutral-600 bg-neutral-900 px-2 py-1 text-xs text-neutral-200 placeholder-neutral-500 focus:border-neutral-500 focus:outline-none"
								value={formatOffset(offset)}
								onkeydown={(e) => handleOffsetKeyDown(index, e)}
								onfocus={(e) => (e.target as HTMLInputElement).select()}
								oninput={(e) => onOffsetInput(index, e)} />
						</td>
						{#each PITCH_VALUES as p}
							<td
								class={`group h-8 w-6 min-w-6 cursor-pointer border border-neutral-700 text-center text-[0.7rem] leading-none ${p === pitches[index] ? 'bg-neutral-600' : 'bg-neutral-900 hover:bg-neutral-800'}`}
								tabindex="0"
								title={String(p)}
								onmousedown={() => beginDrag('pitch', index, p)}
								onmouseover={() => dragOver('pitch', index, p)}
								onfocus={() => dragOver('pitch', index, p)}>
								{#if p === pitches[index]}
									{formatNum(p)}
								{:else}
									<span class="text-neutral-300 opacity-0 group-hover:opacity-100"
										>{formatNum(p)}</span>
								{/if}
							</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>

		<table class="table-fixed bg-neutral-900 font-mono text-xs select-none">
			<thead>
				<tr>
					<th class="px-2 py-1.5">row</th>
					<th class="w-8 px-1.5"></th>
					<th colspan="9" class="px-2">octave shift</th>
				</tr>
				<tr>
					<th></th>
					<th></th>
					{#each SHIFT_VALUES as s}
						<th class="w-6 min-w-6 bg-neutral-800 text-center" title={String(s)}></th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each rows as _, index}
					<tr class="h-8">
						<td class="border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-right"
							>{index}</td>
						<td class="border border-neutral-700 bg-neutral-800 px-1.5"></td>
						{#each SHIFT_VALUES as s}
							<td
								class={`group h-8 w-6 min-w-6 cursor-pointer border border-neutral-700 text-center text-[0.7rem] leading-none ${s === shifts[index] ? 'bg-neutral-600' : 'bg-neutral-900 hover:bg-neutral-800'}`}
								tabindex="0"
								title={String(s)}
								onmousedown={() => beginDrag('shift', index, s)}
								onmouseover={() => dragOver('shift', index, s)}
								onfocus={() => dragOver('shift', index, s)}>
								{#if s === shifts[index]}
									{formatNum(s)}
								{:else}
									<span class="text-neutral-300 opacity-0 group-hover:opacity-100"
										>{formatNum(s)}</span>
								{/if}
							</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

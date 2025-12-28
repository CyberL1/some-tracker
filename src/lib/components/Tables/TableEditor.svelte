<script lang="ts">
	import { getContext } from 'svelte';
	import type { Table } from '../../models/project';
	import type { AudioService } from '../../services/audio-service';

	let {
		table,
		asHex = false,
		onTableChange
	}: {
		table: Table;
		asHex: boolean;
		onTableChange: (table: Table) => void;
	} = $props();

	const PITCH_VALUES = Array.from({ length: 23 }, (_, i) => i - 11); // -11 … 11
	const SHIFT_VALUES = Array.from({ length: 9 }, (_, i) => i - 4); // -4 … 4

	let rows = $state([...table.rows]);
	let loopRow = $state(table.loop);
	let name = $state(table.name);
	let pitches = $state<number[]>([]);
	let shifts = $state<number[]>([]);

	let isDragging = $state(false);
	let dragMode: 'pitch' | 'shift' | null = null;

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

	function setPitch(index: number, pitch: number) {
		pitches[index] = pitch;
		recalcRow(index);
		onTableChange({ ...table, rows });
	}

	function setShift(index: number, shift: number) {
		shifts[index] = shift;
		recalcRow(index);
		onTableChange({ ...table, rows });
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

		onTableChange({ ...table, rows });
	}

	function handleOffsetKeyDown(event: KeyboardEvent) {
		const key = event.key;
		if (key.length > 1) return;
		const pattern = asHex ? /^[0-9a-fA-F-]$/ : /^[0-9-]$/;
		if (!pattern.test(key)) event.preventDefault();
	}

	function addRow() {
		rows = [...rows, 0];
		pitches = [...pitches, 0];
		shifts = [...shifts, 0];
		onTableChange({ ...table, rows });
	}

	function removeRow(index: number) {
		if (rows.length === 1) return;
		rows = rows.filter((_, i) => i !== index);
		pitches = pitches.filter((_, i) => i !== index);
		shifts = shifts.filter((_, i) => i !== index);
		if (loopRow >= rows.length) loopRow = rows.length - 1;
		onTableChange({ ...table, rows });
	}

	function setLoop(index: number) {
		loopRow = index;
		onTableChange({ ...table, loop: loopRow });
	}

	export function addRowExternal() {
		addRow();
	}

	export function removeLastRowExternal() {
		removeRow(rows.length - 1);
	}

	function beginPitchDrag(index: number, pitch: number) {
		isDragging = true;
		dragMode = 'pitch';
		setPitch(index, pitch);
	}

	function pitchDragOver(index: number, pitch: number) {
		if (isDragging && dragMode === 'pitch') {
			setPitch(index, pitch);
		}
	}

	function beginShiftDrag(index: number, shift: number) {
		isDragging = true;
		dragMode = 'shift';
		setShift(index, shift);
	}

	function shiftDragOver(index: number, shift: number) {
		if (isDragging && dragMode === 'shift') {
			setShift(index, shift);
		}
	}

	initRowRepresentations();

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
		<span class="text-sm text-neutral-400">Name:</span>
		<input
			class="w-48 rounded bg-neutral-800 px-2 py-1 text-neutral-200 outline-none"
			value={name}
			oninput={(e) => {
				name = (e.target as HTMLInputElement).value;
				onTableChange({ ...table, name });
			}} />
	</div>

	<div class="flex gap-2 overflow-x-auto">
		<table class="table-fixed border-collapse bg-neutral-900 font-mono text-xs select-none">
			<thead>
				<tr>
					<th class="px-2">row</th>
					<th class="w-1 px-1">loop</th>
					<th class="w-12 px-1">offset</th>
					<th colspan="25" class="px-2">note key offset</th>
				</tr>
				<tr>
					<th></th>
					<th></th>
					<th></th>
					{#each PITCH_VALUES as p}
						<th
							class="w-[1.25rem] min-w-[1.25rem] bg-neutral-800 text-center"
							title={String(p)}></th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each rows as offset, index}
					<tr class="h-6">
						<td class="border border-neutral-700 bg-neutral-800 px-2 text-right"
							>{index}</td>
						<td
							class="w-6 cursor-pointer px-1 text-center"
							onclick={() => setLoop(index)}>
							{loopRow === index ? '>' : ''}
						</td>
						<td class="w-12 px-1">
							<input
								type="text"
								class="w-full rounded bg-neutral-800 px-1 text-neutral-100 outline-none"
								value={formatOffset(offset)}
								onkeydown={handleOffsetKeyDown}
								oninput={(e) => onOffsetInput(index, e)} />
						</td>
						{#each PITCH_VALUES as p}
							<td
								class={`group h-6 w-[1.25rem] min-w-[1.25rem] cursor-pointer border border-neutral-700 text-center text-[0.6rem] leading-none ${p === pitches[index] ? 'bg-neutral-600' : 'bg-neutral-900 hover:bg-neutral-800'}`}
								tabindex="0"
								title={String(p)}
								onmousedown={() => beginPitchDrag(index, p)}
								onmouseover={() => pitchDragOver(index, p)}
								onfocus={() => pitchDragOver(index, p)}>
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
					<th class="px-2">row</th>
					<th colspan="9" class="px-2">octave shift</th>
				</tr>
				<tr>
					<th></th>
					{#each SHIFT_VALUES as s}
						<th
							class="w-[1.25rem] min-w-[1.25rem] bg-neutral-800 text-center"
							title={String(s)}></th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each rows as _, index}
					<tr class="h-6">
						<td class="border border-neutral-700 bg-neutral-800 px-2 text-right"
							>{index}</td>
						{#each SHIFT_VALUES as s}
							<td
								class={`group h-6 w-[1.25rem] min-w-[1.25rem] cursor-pointer border border-neutral-700 text-center text-[0.6rem] leading-none ${s === shifts[index] ? 'bg-neutral-600' : 'bg-neutral-900 hover:bg-neutral-800'}`}
								tabindex="0"
								title={String(s)}
								onmousedown={() => beginShiftDrag(index, s)}
								onmouseover={() => shiftDragOver(index, s)}
								onfocus={() => shiftDragOver(index, s)}>
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

<script lang="ts">
	import Button from '../Button/Button.svelte';
	import type { UserScript } from '../../services/user-scripts/types';
	import { settingsStore } from '../../stores/settings.svelte';

	let { script, isNew = false, resolve, dismiss } = $props<{
		script?: UserScript;
		isNew?: boolean;
		resolve?: (script?: UserScript) => void;
		dismiss?: () => void;
	}>();

	let name = $state(script?.name ?? '');
	let description = $state(script?.description ?? '');
	let code = $state(script?.code ?? '');
	let error = $state('');

	function generateId(name: string): string {
		return name
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-|-$/g, '') + '-' + Date.now();
	}

	function handleSave() {
		if (!name.trim()) {
			error = 'Name is required';
			return;
		}
		if (!code.trim()) {
			error = 'Code is required';
			return;
		}

		const savedScript: UserScript = {
			id: script?.id ?? generateId(name),
			name: name.trim(),
			description: description.trim(),
			code: code
		};

		resolve?.(savedScript);
	}

	function handleCancel() {
		resolve?.(undefined);
	}

	const monoFont = $derived(settingsStore.state.patternEditorFontFamily || 'monospace');
</script>

<div class="w-[700px]">
	<div
		class="flex items-center gap-2 border-b border-[var(--color-app-border)] bg-[var(--color-app-surface)] px-4 py-3">
		<h2 class="text-sm font-bold text-[var(--color-app-text-primary)]">
			{isNew ? 'New Script' : 'Edit Script'}
		</h2>
	</div>

	<div class="flex flex-col gap-3 p-4">
		{#if error}
			<div class="rounded bg-red-900/20 px-3 py-2 text-xs text-red-400">
				{error}
			</div>
		{/if}

		<div>
			<label class="mb-1 block text-xs text-[var(--color-app-text-tertiary)]">Name</label>
			<input
				type="text"
				bind:value={name}
				placeholder="Script name"
				class="w-full rounded border border-[var(--color-app-border)] bg-[var(--color-app-surface-secondary)] px-2 py-1.5 text-xs text-[var(--color-app-text-primary)] placeholder-[var(--color-app-text-tertiary)] focus:border-[var(--color-app-accent)] focus:outline-none" />
		</div>

		<div>
			<label class="mb-1 block text-xs text-[var(--color-app-text-tertiary)]">Description</label>
			<input
				type="text"
				bind:value={description}
				placeholder="What does this script do?"
				class="w-full rounded border border-[var(--color-app-border)] bg-[var(--color-app-surface-secondary)] px-2 py-1.5 text-xs text-[var(--color-app-text-primary)] placeholder-[var(--color-app-text-tertiary)] focus:border-[var(--color-app-accent)] focus:outline-none" />
		</div>

		<div>
			<label class="mb-1 block text-xs text-[var(--color-app-text-tertiary)]">Code</label>
			<textarea
				bind:value={code}
				placeholder="-- Your Lua script here"
				rows="12"
				style="font-family: {monoFont}, monospace;"
				class="w-full resize-none rounded border border-[var(--color-app-border)] bg-[var(--color-app-surface-secondary)] px-2 py-1.5 text-xs text-[var(--color-app-text-primary)] placeholder-[var(--color-app-text-tertiary)] focus:border-[var(--color-app-accent)] focus:outline-none"></textarea>
		</div>

		<div class="rounded bg-[var(--color-app-surface-secondary)] p-3 text-xs text-[var(--color-app-text-tertiary)] max-h-48 overflow-y-auto">
			<div class="font-medium mb-2">Lua scripting - Available variables:</div>
			<div class="space-y-1">
				<div><code class="text-[var(--color-app-text-secondary)]">rows</code> - table of all rows in selection</div>
				<div><code class="text-[var(--color-app-text-secondary)]">selection</code> - table with minRow, maxRow, minCol, maxCol</div>
				<div><code class="text-[var(--color-app-text-secondary)]">patternLength</code> - total rows in pattern</div>
				<div><code class="text-[var(--color-app-text-secondary)]">channelCount</code> - number of channels</div>
			</div>
			<div class="font-medium mt-3 mb-2">Row properties (AY/YM chip):</div>
			<div class="grid grid-cols-2 gap-x-4 gap-y-1">
				<div><code>row.rowIndex</code> - position (0-based)</div>
				<div><code>row.channelIndex</code> - 0, 1, or 2</div>
				<div><code>row.note</code> - "C-4", "---", "OFF"</div>
				<div><code>row.volume</code> - 0-15</div>
				<div><code>row.instrument</code> - number</div>
				<div><code>row.table</code> - number</div>
				<div><code>row.envelopeShape</code> - 0-15</div>
				<div><code>row.envelopeValue</code> - 0-65535</div>
				<div><code>row.envelopeEffect</code> - nil or table</div>
				<div><code>row.effect</code> - nil or table</div>
			</div>
			<div class="font-medium mt-3 mb-2">Effect table (if not nil):</div>
			<div><code>effect.effect</code>, <code>effect.delay</code>, <code>effect.parameter</code></div>
			<div class="font-medium mt-3 mb-2">Envelope Effect table (if not nil):</div>
			<div><code>envelopeEffect.effect</code>, <code>envelopeEffect.delay</code>, <code>envelopeEffect.parameter</code></div>
			<div class="font-medium mt-3 mb-2">Example (Fade In):</div>
			<pre style="font-family: {monoFont}, monospace;" class="text-[10px] bg-[var(--color-app-surface)] p-2 rounded whitespace-pre overflow-x-auto">local minRow = selection.minRow
local maxRow = selection.maxRow
local totalRows = maxRow - minRow + 1

for i, row in ipairs(rows) do
    local relativeRow = row.rowIndex - minRow
    local progress = 1
    if totalRows > 1 then
        progress = relativeRow / (totalRows - 1)
    end
    row.volume = math.floor(progress * 15 + 0.5)
end</pre>
		</div>
	</div>

	<div
		class="flex justify-end gap-2 border-t border-[var(--color-app-border)] bg-[var(--color-app-surface)] px-4 py-3">
		<Button variant="secondary" onclick={handleCancel}>Cancel</Button>
		<Button variant="primary" onclick={handleSave}>Save</Button>
	</div>
</div>

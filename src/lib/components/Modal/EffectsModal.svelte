<script lang="ts">
	import Button from '../Button/Button.svelte';

	let { resolve } = $props<{
		resolve?: (value?: any) => void;
	}>();

	function handleClose() {
		resolve?.();
	}

	const COLOR = {
		code: 'var(--color-pattern-effect)',
		delay: 'var(--color-pattern-envelope)',
		parameter: 'var(--color-pattern-note)',
		literal: 'var(--color-app-text-muted)',
		table: 'var(--color-pattern-table)'
	} as const;

	type Segment = { char: string; color: string };

	function getFormatSegments(value: string): Segment[] {
		if (value.length === 4 && value[2] === 'T') {
			return [
				{ char: value[0], color: COLOR.code },
				{ char: value[1], color: COLOR.delay },
				{ char: value[2], color: COLOR.literal },
				{ char: value[3], color: COLOR.parameter }
			];
		}
		if (value.length === 4) {
			return [
				{ char: value[0], color: COLOR.code },
				{ char: value[1], color: COLOR.delay },
				{ char: value[2], color: COLOR.parameter },
				{ char: value[3], color: COLOR.parameter }
			];
		}
		return [{ char: value, color: 'var(--color-app-text-secondary)' }];
	}

	const effects = [
		{
			code: 'A',
			name: 'Arpeggio',
			description: 'Rapidly alternates between the current note and two additional notes.',
			format: 'AXYZ',
			formatWithTable: 'AXTY',
			tableDescription:
				'where Y is table id (0-9, A-Z). Will replace semitone offsets with table values.',
			delay: 'X - time in ticks between arpeggio steps (0-F)',
			parameter: 'Y is semitone offset 1 (0-F), Z is semitone offset 2 (0-F)',
			example: 'A137 - Arpeggio with delay 1, offsets +3 and +7 semitones (minor chord)'
		},
		{
			code: 'V',
			name: 'Vibrato',
			description: 'Modulates the pitch up and down to create a vibrato effect.',
			format: 'VXYZ',
			formatWithTable: 'VXTY',
			delay: 'X - delay between vibrato steps (0-F)',
			tableDescription:
				'where Y is table id (0-9, A-Z). Will replace speed and depth with table values proceding each tick.',
			parameter: 'Y is speed (0-F), Z is depth (0-F)',
			example: 'V158 - Vibrato with delay 1, speed 5, depth 8'
		},
		{
			code: '1',
			name: 'Slide Up',
			description: 'Gradually increases the pitch of the note.',
			format: '1XYZ',
			formatWithTable: '1XTY',
			delay: 'X - delay between slide steps (0-F)',
			tableDescription:
				'where Y is table id (0-9, A-Z). Will replace slide step size with table values proceding each tick.',
			parameter: 'YZ - slide step size in hex (00-FF)',
			example:
				'1130 - Slide up with delay 1, step size 30. You can use "." for delay (0) and then slide will work only for 1 tick'
		},
		{
			code: '2',
			name: 'Slide Down',
			description: 'Gradually decreases the pitch of the note.',
			format: '2XYZ',
			formatWithTable: '2XTY',
			delay: 'X - delay between slide steps (0-F)',
			tableDescription:
				'where Y is table id (0-9, A-Z). Will replace slide step size with table values proceding each tick.',
			parameter: 'YZ - slide step size in hex (00-FF)',
			example:
				'2150 - Slide down with delay 0, step size 50. You can use "." for delay (0) and then slide will work only for 1 tick'
		},
		{
			code: 'P',
			name: 'Portamento',
			description: 'Smoothly slides from the previous note to the current note.',
			tableDescription:
				'where Y is table id (0-9, A-Z). Will replace portamento speed with table values proceding each tick.',
			format: 'PXYZ',
			formatWithTable: 'PXTY',
			delay: 'X - delay between portamento steps (0-F)',
			parameter: 'YZ - portamento speed in hex (00-FF)',
			example: 'P30F - Portamento with delay 3, speed 0x0F'
		},
		{
			code: '6',
			name: 'On/Off',
			description: 'Alternates between playing the note and muting it.',
			tableDescription:
				'where Y is table id (0-9, A-Z). Will replace on duration and off duration with table values proceding each tick.',
			format: '6XYZ',
			formatWithTable: '6XTY',
			delay: 'X - delay before effect starts (0-F)',
			parameter: 'YZ - Y is on duration (0-F), Z is off duration (0-F)',
			example: '6.24 - On/Off with delay 0, on duration 2, off duration 4'
		},
		{
			code: 'S',
			name: 'Speed',
			description: 'Changes the playback speed of the song.',
			tableDescription:
				'where Y is table id (0-9, A-Z). Will replace new speed value with table values proceding each pattern row.',
			format: 'S.XY',
			formatWithTable: 'SXTY',
			delay: 'N/A',
			parameter: 'XY - new speed value (01-FF)',
			example: 'S.03 - Set speed to 3'
		}
	];
</script>

<div class="flex max-h-[90vh] w-[700px] flex-col">
	<div
		class="flex items-center gap-2 border-b border-[var(--color-app-border)] bg-[var(--color-app-surface)] px-4 py-3">
		<h2 class="text-sm font-bold text-[var(--color-app-text-primary)]">Effects Reference</h2>
	</div>

	<div class="overflow-y-auto p-6">
		<div class="mb-4 text-xs text-[var(--color-app-text-secondary)]">
			<p class="mb-2">
				Effects are entered in the effect column using the format:
				<code class="rounded bg-[var(--color-app-surface-secondary)] px-1 py-0.5 font-mono">
					{#each getFormatSegments('AXYZ') as seg}
						<span style="color: {seg.color}">{seg.char}</span>
					{/each}
				</code>
				(code, delay, parameter).
			</p>
			<p class="mb-2">
				Effects can also use tables:
				<code class="rounded bg-[var(--color-app-surface-secondary)] px-1 py-0.5 font-mono">
					{#each getFormatSegments('AXTY') as seg}
						<span style="color: {seg.color}">{seg.char}</span>
					{/each}
				</code>
				(code, delay, T, table).
			</p>
			<p>
				All values are in hexadecimal (0-9, A-F). Use <code
					class="rounded bg-[var(--color-app-surface-secondary)] px-1 py-0.5 font-mono"
					>.</code> for 0.
			</p>
		</div>

		<div class="space-y-4">
			{#each effects as effect}
				<div
					class="rounded border border-[var(--color-app-border)] bg-[var(--color-app-surface-secondary)] p-4">
					<div class="mb-2 flex items-center gap-2">
						<code
							class="rounded bg-[var(--color-app-surface)] px-2 py-1 font-mono text-sm font-bold text-[var(--color-app-text-primary)]">
							{effect.code}
						</code>
						<h3 class="text-sm font-bold text-[var(--color-app-text-primary)]">
							{effect.name}
						</h3>
					</div>
					<p class="mb-3 text-xs text-[var(--color-app-text-secondary)]">
						{effect.description}
					</p>

					<div class="mb-2 space-y-1 text-xs">
						<div>
							<span class="font-medium text-[var(--color-app-text-primary)]"
								>Format:</span>
							<code class="ml-2 font-mono"
								>{#each getFormatSegments(effect.format) as seg}
									<span style="color: {seg.color}">{seg.char}</span>{/each}</code>
						</div>

						<div>
							<span class="font-medium text-[var(--color-app-text-primary)]"
								>Delay:</span>
							<span class="ml-2 text-[var(--color-app-text-secondary)]"
								>{effect.delay}</span>
						</div>
						<div>
							<span class="font-medium text-[var(--color-app-text-primary)]"
								>Parameter:</span>
							<span class="ml-2 text-[var(--color-app-text-secondary)]"
								>{effect.parameter}</span>
						</div>
						<div>
							<span class="font-medium text-[var(--color-app-text-primary)]"
								>Example:</span>
							<code class="ml-2 font-mono text-[var(--color-app-text-secondary)]"
								>{effect.example}</code>
						</div>
						<div>
							<span class="font-medium text-[var(--color-app-text-primary)]"
								>With Table:</span>
							<code class="ml-2 font-mono text-[var(--color-app-text-secondary)]"
								>{#each getFormatSegments(effect.formatWithTable) as seg}
									<span style="color: {seg.color}">{seg.char}</span>{/each}</code>
							<span class="font-medium text-[var(--color-app-text-secondary)]"
								>{effect.tableDescription}</span>
						</div>
					</div>
				</div>
			{/each}
		</div>

		<div
			class="mt-6 rounded border border-[var(--color-app-border)] bg-[var(--color-app-surface-secondary)] p-4">
			<h3 class="mb-2 text-sm font-bold text-[var(--color-app-text-primary)]">
				Envelope Effects
			</h3>
			<p class="mb-2 text-xs text-[var(--color-app-text-secondary)]">
				Envelope effects use the same effect codes as regular effects but are entered in the
				envelope effect column.
			</p>
			<p class="text-xs text-[var(--color-app-text-secondary)]">
				Format:
				<code class="rounded bg-[var(--color-app-surface)] px-1 py-0.5 font-mono">
					{#each getFormatSegments('AXYZ') as seg}
						<span style="color: {seg.color}">{seg.char}</span>
					{/each}
				</code>
				or
				<code class="rounded bg-[var(--color-app-surface)] px-1 py-0.5 font-mono">
					{#each getFormatSegments('AXTY') as seg}
						<span style="color: {seg.color}">{seg.char}</span>
					{/each}
				</code>
			</p>
		</div>
	</div>

	<div class="border-t border-[var(--color-app-border)] bg-[var(--color-app-surface)] px-4 py-3">
		<div class="flex justify-end">
			<Button variant="primary" onclick={handleClose}>Close</Button>
		</div>
	</div>
</div>

<script lang="ts">
	import { waveformStore } from '../../stores/waveform.svelte';

	let {
		channelLabels = ['A', 'B', 'C'],
		height = 80,
		zoom = 1,
		amplify = 1,
		escapeBoundary = false
	}: {
		channelLabels?: string[];
		height?: number;
		zoom?: number;
		amplify?: number;
		escapeBoundary?: boolean;
	} = $props();

	const channels = $derived(waveformStore.channels);
	let canvasEls: (HTMLCanvasElement | null)[] = $state([]);

	function dcOffset(samples: Float32Array): number {
		if (samples.length === 0) return 0;
		let min = samples[0];
		let max = samples[0];
		for (let i = 1; i < samples.length; i++) {
			const v = samples[i];
			if (v < min) min = v;
			if (v > max) max = v;
		}
		return (min + max) / 2;
	}

	function findFirstDownwardDCCrossing(samples: Float32Array, dc: number): number | null {
		for (let i = 0; i < samples.length - 1; i++) {
			const a = samples[i];
			const b = samples[i + 1];
			if (a >= dc && b < dc) {
				const frac = a === b ? 0 : (a - dc) / (a - b);
				return i + frac;
			}
		}
		return null;
	}

	function shiftBufferToDCCrossing(samples: Float32Array): Float32Array {
		const dc = dcOffset(samples);
		const crossing = findFirstDownwardDCCrossing(samples, dc);
		if (crossing === null) return samples;
		const n = samples.length;
		const out = new Float32Array(n);
		for (let i = 0; i < n; i++) {
			const pos = (crossing + i) % n;
			const lo = Math.floor(pos);
			const hi = (lo + 1) % n;
			const frac = pos - lo;
			out[i] = samples[lo] * (1 - frac) + samples[hi] * frac;
		}
		return out;
	}

	function resampleToWidth(samples: Float32Array, outWidth: number): Float32Array {
		if (samples.length < 2 || outWidth < 2) return samples;
		const out = new Float32Array(outWidth);
		const scale = (samples.length - 1) / (outWidth - 1);
		for (let i = 0; i < outWidth; i++) {
			const srcIdx = i * scale;
			const lo = Math.floor(srcIdx);
			const hi = Math.min(lo + 1, samples.length - 1);
			const frac = srcIdx - lo;
			out[i] = samples[lo] * (1 - frac) + samples[hi] * frac;
		}
		return out;
	}

	function drawChannel(
		ctx: CanvasRenderingContext2D,
		samples: Float32Array,
		width: number,
		height: number,
		strokeColor: string
	) {
		if (samples.length === 0) return;
		ctx.clearRect(0, 0, width, height);
		const midY = height / 2;
		const halfHeight = (height / 2) * 0.85;
		const outWidth = Math.max(2, width - 2);
		const aligned = shiftBufferToDCCrossing(samples);
		const resampled = resampleToWidth(aligned, outWidth);
		let min = resampled[0];
		let max = resampled[0];
		for (let i = 1; i < resampled.length; i++) {
			const v = resampled[i];
			if (v < min) min = v;
			if (v > max) max = v;
		}
		const dcOff = (min + max) / 2;
		const stepX = width / (resampled.length - 1);

		ctx.strokeStyle = strokeColor;
		ctx.lineWidth = 1;
		ctx.beginPath();
		for (let i = 0; i < resampled.length; i++) {
			let val = resampled[i] - dcOff;
			if (val < -0.5) val = -0.5;
			if (val > 0.5) val = 0.5;
			val *= amplify * 2;
			let y = midY - val * halfHeight * zoom;
			if (!escapeBoundary) {
				y = Math.max(0, Math.min(height, y));
			}
			const x = i * stepX;
			if (i === 0) ctx.moveTo(x, y);
			else ctx.lineTo(x, y);
		}
		ctx.stroke();
	}

	$effect(() => {
		const ch = channels;
		canvasEls.forEach((canvas, index) => {
			if (!canvas) return;
			const rect = canvas.getBoundingClientRect();
			const dpr = window.devicePixelRatio ?? 1;
			const w = Math.floor(rect.width * dpr);
			const h = Math.floor(rect.height * dpr);
			if (canvas.width !== w || canvas.height !== h) {
				canvas.width = w;
				canvas.height = h;
			}
			const ctx = canvas.getContext('2d');
			if (!ctx) return;
			if (ch.length === 0 || index >= ch.length) {
				ctx.clearRect(0, 0, w, h);
				return;
			}
			const samples = ch[index];
			if (!samples) {
				ctx.clearRect(0, 0, w, h);
				return;
			}
			const strokeColor =
				getComputedStyle(document.documentElement)
					.getPropertyValue('--color-pattern-note')
					.trim() || '#89b4fa';
			drawChannel(ctx, samples, w, h, strokeColor);
		});
	});
</script>

<div
	class="flex shrink-0 gap-px border-t border-[var(--color-app-border)] bg-[var(--color-app-surface-secondary)]"
	style="height: {height}px">
	{#each channelLabels as label, i}
		<div class="flex min-w-0 flex-1 flex-col overflow-hidden">
			<div class="text-center text-xs text-[var(--color-app-text-muted)]">{label}</div>
			<canvas
				bind:this={canvasEls[i]}
				class="block h-full w-full"
				style="height: {height - 20}px"></canvas>
		</div>
	{/each}
</div>

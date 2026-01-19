<script lang="ts">
	import Button from '../Button/Button.svelte';

	let { resolve } = $props<{
		resolve?: (value?: any) => void;
	}>();

	const version = 'alpha-0.0.1';
	const commitHash = import.meta.env.VITE_COMMIT_HASH || 'dev';
	const buildDate = import.meta.env.VITE_BUILD_DATE || new Date().toISOString().split('T')[0];

	function handleClose() {
		resolve?.();
	}
</script>

<div class="flex w-[400px] flex-col">
	<div class="flex items-center gap-2 border-b border-[var(--color-app-border)] bg-[var(--color-app-surface)] px-4 py-3">
		<h2 class="text-sm font-bold text-[var(--color-app-text-primary)]">About</h2>
	</div>

	<div class="flex flex-col items-center gap-4 p-6">
		<img src="logo.svg" alt="Bitphase Logo" class="h-24 w-24" />

		<div class="text-center">
			<h1 class="text-2xl font-bold text-[var(--color-app-text-primary)]">Bitphase</h1>

		</div>

		<div class="w-full space-y-2 rounded border border-[var(--color-app-border)] bg-[var(--color-app-surface-secondary)] p-4 text-xs">
			<div class="flex justify-between">
				<span class="text-[var(--color-app-text-muted)]">Version:</span>
				<span class="font-mono text-[var(--color-app-text-primary)]">{version}</span>
			</div>
			<div class="flex justify-between">
				<span class="text-[var(--color-app-text-muted)]">Commit:</span>
				<span class="font-mono text-[var(--color-app-text-primary)]">{commitHash}</span>
			</div>
			<div class="flex justify-between">
				<span class="text-[var(--color-app-text-muted)]">Build Date:</span>
				<span class="font-mono text-[var(--color-app-text-primary)]">{buildDate}</span>
			</div>
		</div>

		<div class="flex flex-col items-center gap-2">
			<p class="text-center text-xs text-[var(--color-app-text-muted)]">
				Bitphase by Pator and contributors<br />
				Ayumi emulator by Peter Sovietov
			</p>
			<a
				href="https://github.com/paator/bitphase"
				target="_blank"
				rel="noopener noreferrer"
				class="text-xs text-[var(--color-app-text-secondary)] hover:text-[var(--color-app-text-primary)] hover:underline"
			>
				View on GitHub
			</a>
		</div>
		<Button variant="primary" onclick={handleClose}>Close</Button>
	</div>
</div>

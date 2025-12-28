<script lang="ts">
	import MenuBar from './lib/components/Menu/MenuBar.svelte';
	import './app.css';
	import { menuItems } from './lib/config/app-menu';
	import { handleFileImport } from './lib/services/file-import';
	import { Project } from './lib/models/project';
	import PatternEditor from './lib/components/Song/PatternEditor.svelte';
	import { setContext } from 'svelte';
	import { AudioService } from './lib/services/audio-service';
	import { AY_CHIP } from './lib/models/chips';
	import { TabView } from './lib/components/TabView';
	import SongView from './lib/components/Song/SongView.svelte';
	import { TablesView } from './lib/components/Tables';
	import { playbackStore } from './lib/stores/playback.svelte';
	import IconCarbonMusic from '~icons/carbon/music';
	import IconCarbonChip from '~icons/carbon/chip';
	import IconCarbonWaveform from '~icons/carbon/waveform';
	import IconCarbonInformationSquare from '~icons/carbon/information-square';

	let container: { audioService: AudioService } = $state({
		audioService: new AudioService()
	});

	container.audioService.addChipProcessor(AY_CHIP);

	const newProject = new Project();

	let title = $state(newProject.name);
	let author = $state(newProject.author);
	let aymChipType = $state(newProject.aymChipType);
	let songs = $state(newProject.songs);
	let patternOrder = $state(newProject.patternOrder);
	let aymFrequency = $state(newProject.aymFrequency);
	let intFrequency = $state(newProject.intFrequency);
	let tables = $state(newProject.tables);

	$effect(() => {
		container.audioService.chipSettings.set('aymFrequency', aymFrequency);
	});

	$effect(() => {
		container.audioService.chipSettings.set('intFrequency', intFrequency);
	});

	$effect(() => {
		container.audioService.updateTables(tables);
	});

	let patternEditor: PatternEditor | null = $state(null);
	let activeTabId = $state('song');

	const tabs = [
		{ id: 'song', label: 'Song', icon: IconCarbonChip },
		{ id: 'tables', label: 'Tables', icon: IconCarbonMusic },
		{ id: 'instruments', label: 'Instruments', icon: IconCarbonWaveform },
		{ id: 'details', label: 'Details', icon: IconCarbonInformationSquare }
	];

	async function handleMenuAction(data: { action: string }) {
		try {
			if (data.action === 'playFromBeginning') {
				if (playbackStore.isPlaying) {
					playbackStore.isPlaying = false;
					container.audioService.stop();
				}

				if (patternEditor) {
					playbackStore.isPlaying = true;
					patternEditor.resetToBeginning();
					patternEditor.togglePlayback();
				}

				return;
			}

			if (data.action === 'playFromCursor') {
				if (playbackStore.isPlaying) {
					return;
				}

				if (patternEditor) {
					playbackStore.isPlaying = true;
					patternEditor.playFromCursor();
				}

				return;
			}

			if (data.action === 'togglePlayback') {
				playbackStore.isPlaying = !playbackStore.isPlaying;

				if (playbackStore.isPlaying) {
					patternEditor?.togglePlayback();
				} else {
					container.audioService.stop();
				}
				return;
			}

			const importedProject = await handleFileImport(data.action);
			if (importedProject) {
				title = importedProject.name;
				author = importedProject.author;
				aymChipType = importedProject.aymChipType;
				songs = importedProject.songs;
				patternOrder = importedProject.patternOrder;
				aymFrequency = importedProject.aymFrequency;
				intFrequency = importedProject.intFrequency;
				tables = importedProject.tables;

				playbackStore.isPlaying = false;
				container.audioService.stop();
				patternEditor?.resetToBeginning();
			}
		} catch (error) {
			console.error('Failed to handle menu action:', error);
		}
	}

	setContext('container', container);
</script>

<main
	class="flex h-screen flex-col gap-1 overflow-hidden bg-neutral-800 font-sans text-xs text-neutral-100">
	<MenuBar {menuItems} onAction={handleMenuAction} />
	<div class="flex-1 overflow-hidden">
		<TabView {tabs} bind:activeTabId>
			{#snippet children(tabId)}
				{#if tabId === 'song'}
					<SongView
						bind:songs
						bind:patternOrder
						bind:patternEditor
						chipProcessors={container.audioService.chipProcessors} />
				{:else if tabId === 'tables'}
					<TablesView bind:tables />
				{:else if tabId === 'instruments'}
					<div class="flex h-full items-center justify-center">
						<p class="text-sm text-neutral-500">Instruments editor coming soon...</p>
					</div>
				{:else if tabId === 'details'}
					<div class="flex h-full items-center justify-center">
						<p class="text-sm text-neutral-500">Project details coming soon...</p>
					</div>
				{/if}
			{/snippet}
		</TabView>
	</div>
</main>

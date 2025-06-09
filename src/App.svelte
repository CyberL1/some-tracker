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
	import { ProjectCard, OrnamentsCard } from './lib/components/AppLayout';
	import Card from './lib/components/Card/Card.svelte';
	import IconCarbonChip from '~icons/carbon/chip';
	import { playbackStore } from './lib/stores/playback.svelte';

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

	$effect(() => {
		container.audioService.updateAyFrequency(aymFrequency);
		container.audioService.updateIntFrequency(intFrequency);
	});

	let patternEditor: PatternEditor | null = $state(null);

	async function handleMenuAction(data: { action: string }) {
		try {
			if (data.action === 'playFromBeginning') {
				if (playbackStore.isPlaying) {
					playbackStore.isPlaying = false;
					await container.audioService.stop();
				}

				if (patternEditor) {
					patternEditor.resetToBeginning();
				}

				playbackStore.isPlaying = true;
				return;
			}

			if (data.action === 'togglePlayback') {
				playbackStore.isPlaying = !playbackStore.isPlaying;
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
				patternEditor?.onSongChange();
			}
		} catch (error) {
			console.error('Failed to handle menu action:', error);
		}
	}

	setContext('container', container);
</script>

<main
	class="flex h-screen flex-col overflow-x-hidden bg-neutral-800 font-sans text-xs text-neutral-100">
	<MenuBar {menuItems} onAction={handleMenuAction} />
	<div class="flex min-h-0 flex-1 gap-3 overflow-x-auto p-3">
		<div class="flex-1">
			<ProjectCard
				bind:title
				bind:author
				bind:aymChipType
				bind:aymFrequency
				bind:intFrequency />
		</div>
		<div class="flex-shrink-0">
			{#each songs as song, i}
				<Card
					title={`${container.audioService.chipProcessors[i].chip.name} - (${i + 1})`}
					fullHeight
					icon={IconCarbonChip}
					class="p-0">
					<PatternEditor
						bind:this={patternEditor}
						bind:patterns={song.patterns}
						bind:patternOrder
						speed={song.initialSpeed}
						tuningTable={song.tuningTable}
						ornaments={song.ornaments}
						instruments={song.instruments}
						ayProcessor={container.audioService.chipProcessors[i]}
						{aymFrequency}
						{intFrequency} />
				</Card>
			{/each}
		</div>
		<div class="flex-1">
			<OrnamentsCard bind:ornaments={songs[0].ornaments} />
		</div>
	</div>
</main>

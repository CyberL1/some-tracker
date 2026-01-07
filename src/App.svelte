<script lang="ts">
	import MenuBar from './lib/components/Menu/MenuBar.svelte';
	import './app.css';
	import { menuItems } from './lib/config/app-menu';
	import { handleFileImport } from './lib/services/file/file-import';
	import { handleFileExport } from './lib/services/file/file-export';
	import { Project } from './lib/models/project';
	import PatternEditor from './lib/components/Song/PatternEditor.svelte';
	import ModalContainer from './lib/components/Modal/ModalContainer.svelte';
	import ProgressModal from './lib/components/Modal/ProgressModal.svelte';
	import { open } from './lib/services/modal/modal-service';
	import { setContext } from 'svelte';
	import { AudioService } from './lib/services/audio/audio-service';
	import { ProjectService } from './lib/services/project/project-service';
	import { AY_CHIP } from './lib/chips/ay';
	import { applySchemaDefaults } from './lib/chips/base/schema';
	import SongView from './lib/components/Song/SongView.svelte';
	import { playbackStore } from './lib/stores/playback.svelte';
	import { settingsStore } from './lib/stores/settings.svelte';
	import Settings from './lib/components/Settings/Settings.svelte';
	import { undoRedoStore } from './lib/stores/undo-redo.svelte';

	settingsStore.init();

	let container: { audioService: AudioService } = $state({
		audioService: new AudioService()
	});

	const projectService = new ProjectService(container.audioService);

	container.audioService.addChipProcessor(AY_CHIP);

	const newProject = new Project();
	if (newProject.songs.length > 0) {
		const song = newProject.songs[0];
		song.chipType = AY_CHIP.type;
		applySchemaDefaults(song, AY_CHIP.schema);
	}

	let songs = $state(newProject.songs);
	let patternOrder = $state(newProject.patternOrder);
	let tables = $state(newProject.tables);

	let projectSettings = $state({
		title: newProject.name,
		author: newProject.author
	});

	$effect(() => {
		container.audioService.updateTables(tables);
	});

	let patternEditor: PatternEditor | null = $state(null);
	let showSettings = $state(false);

	async function handleMenuAction(data: { action: string }) {
		try {
			if (data.action === 'undo') {
				undoRedoStore.undo();
				return;
			}

			if (data.action === 'redo') {
				undoRedoStore.redo();
				return;
			}

			if (data.action === 'copy') {
				const event = new KeyboardEvent('keydown', {
					key: 'c',
					ctrlKey: true,
					bubbles: true
				});
				patternEditor?.handleKeyDownFromMenu?.(event);
				return;
			}

			if (data.action === 'cut') {
				const event = new KeyboardEvent('keydown', {
					key: 'x',
					ctrlKey: true,
					bubbles: true
				});
				patternEditor?.handleKeyDownFromMenu?.(event);
				return;
			}

			if (data.action === 'paste') {
				const event = new KeyboardEvent('keydown', {
					key: 'v',
					ctrlKey: true,
					bubbles: true
				});
				patternEditor?.handleKeyDownFromMenu?.(event);
				return;
			}

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

			if (data.action === 'new-project') {
				playbackStore.isPlaying = false;
				container.audioService.stop();

				const newProject = await projectService.resetProject(AY_CHIP);

				projectSettings = {
					title: newProject.name,
					author: newProject.author
				};
				songs = newProject.songs;
				patternOrder = newProject.patternOrder;
				tables = newProject.tables;

				patternEditor?.resetToBeginning();
				return;
			}

			if (data.action === 'new-song-ay') {
				playbackStore.isPlaying = false;
				container.audioService.stop();

				const newSong = await projectService.createNewSong(AY_CHIP);
				songs = [...songs, newSong];

				patternEditor?.resetToBeginning();
				return;
			}

			if (data.action === 'settings') {
				showSettings = !showSettings;
				return;
			}

			if (data.action === 'save' || data.action === 'save-as') {
				const currentProject = new Project(
					projectSettings.title,
					projectSettings.author,
					songs,
					0,
					patternOrder,
					tables
				);
				await handleFileExport(data.action, currentProject);
				return;
			}

			if (data.action === 'export-wav') {
				const currentProject = new Project(
					projectSettings.title,
					projectSettings.author,
					songs,
					0,
					patternOrder,
					tables
				);

				await open(ProgressModal, { project: currentProject });
				return;
			}

			const importedProject = await handleFileImport(data.action);
			if (importedProject) {
				playbackStore.isPlaying = false;
				container.audioService.stop();

				container.audioService.clearChipProcessors();

				for (const _song of importedProject.songs) {
					await container.audioService.addChipProcessor(AY_CHIP);
				}

				projectSettings = {
					title: importedProject.name,
					author: importedProject.author
				};
				songs = importedProject.songs;
				patternOrder = importedProject.patternOrder;
				tables = importedProject.tables;

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
		{#if showSettings}
			<Settings />
		{:else}
			<SongView
				bind:songs
				bind:patternOrder
				bind:patternEditor
				bind:tables
				bind:projectSettings
				chipProcessors={container.audioService.chipProcessors} />
		{/if}
	</div>
	<ModalContainer />
</main>

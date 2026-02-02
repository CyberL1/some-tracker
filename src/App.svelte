<script lang="ts">
	import MenuBar from './lib/components/Menu/MenuBar.svelte';
	import './app.css';
	import { menuItems } from './lib/config/app-menu';
	import { handleFileImport } from './lib/services/file/file-import';
	import { handleFileExport } from './lib/services/file/file-export';
	import { Project, Table } from './lib/models/project';
	import type { Song } from './lib/models/song';
	import PatternEditor from './lib/components/Song/PatternEditor.svelte';
	import ModalContainer from './lib/components/Modal/ModalContainer.svelte';
	import ConfirmModal from './lib/components/Modal/ConfirmModal.svelte';
	import ProgressModal from './lib/components/Modal/ProgressModal.svelte';
	import WavExportSettingsModal from './lib/components/Modal/WavExportSettingsModal.svelte';
	import { open } from './lib/services/modal/modal-service';
	import { setContext } from 'svelte';
	import { AudioService } from './lib/services/audio/audio-service';
	import { ProjectService } from './lib/services/project/project-service';
	import { PatternService } from './lib/services/pattern/pattern-service';
	import { AY_CHIP } from './lib/chips/ay';
	import { getChipByType } from './lib/chips/registry';
	import SongView from './lib/components/Song/SongView.svelte';
	import { playbackStore } from './lib/stores/playback.svelte';
	import { settingsStore } from './lib/stores/settings.svelte';
	import SettingsModal from './lib/components/Settings/SettingsModal.svelte';
	import AboutModal from './lib/components/Modal/AboutModal.svelte';
	import EffectsModal from './lib/components/Modal/EffectsModal.svelte';
	import { undoRedoStore } from './lib/stores/undo-redo.svelte';
	import { editorStateStore } from './lib/stores/editor-state.svelte';
	import { themeStore } from './lib/stores/theme.svelte';
	import { themeService } from './lib/services/theme/theme-service';
	import { themeEditorStore } from './lib/stores/theme-editor.svelte';
	import ThemeEditorModal from './lib/components/Theme/ThemeEditorModal.svelte';
	import UserScriptsModal from './lib/components/Modal/UserScriptsModal.svelte';
	import { tick } from 'svelte';

	import { userScriptsStore } from './lib/stores/user-scripts.svelte';
	import { keybindingsStore } from './lib/stores/keybindings.svelte';
	import { ShortcutString } from './lib/utils/shortcut-string';
	import { ACTION_APPLY_SCRIPT } from './lib/config/keybindings';

	settingsStore.init();
	keybindingsStore.init();
	editorStateStore.init();
	themeStore.init(themeService);
	userScriptsStore.init();

	let lastAppliedThemeId = $state<string | null>(null);

	$effect(() => {
		const activeThemeId = themeStore.state.activeThemeId;
		if (activeThemeId === lastAppliedThemeId) return;

		const activeTheme = themeStore.getActiveTheme();
		if (activeTheme) {
			lastAppliedThemeId = activeThemeId;
			themeService.applyTheme(activeTheme);
		}
	});

	let container: { audioService: AudioService } = $state({
		audioService: new AudioService()
	});

	const projectService = new ProjectService(container.audioService);

	container.audioService.addChipProcessor(AY_CHIP);

	$effect(() => {
		const volume = settingsStore.state.volume;
		container.audioService.setVolume(volume);
	});

	$effect(() => {
		const envelopeAsNote = settingsStore.state.envelopeAsNote;
		editorStateStore.setEnvelopeAsNote(envelopeAsNote);
	});

	$effect(() => {
		const uiFontFamily = settingsStore.state.uiFontFamily;
		if (uiFontFamily) {
			document.documentElement.style.setProperty(
				'--font-sans',
				`"${uiFontFamily}", sans-serif`
			);
			document.documentElement.style.setProperty(
				'--font-mono',
				`"${uiFontFamily}", monospace`
			);
		}
	});

	let songs = $state<Song[]>([]);
	let patternOrder = $state<number[]>([]);
	let tables = $state<Table[]>([]);
	let activeSongIndex = $state(0);

	let projectSettings = $state({
		title: '',
		author: '',
		initialSpeed: 3
	});

	let projectInitialized = $state(false);

	$effect(() => {
		if (projectInitialized) return;

		(async () => {
			const newProject = await projectService.resetProject(AY_CHIP);

			projectSettings = {
				title: newProject.name,
				author: newProject.author,
				initialSpeed: newProject.songs[0]?.initialSpeed ?? 3
			};
			songs = newProject.songs;
			patternOrder = newProject.patternOrder;
			tables = newProject.tables;

			projectInitialized = true;
		})();
	});

	$effect(() => {
		container.audioService.updateTables(tables);
	});

	$effect(() => {
		if (songs.length === 0) return;

		const grouped = new Map<string, Song[]>();
		for (const song of songs) {
			if (!song.chipType) continue;
			if (!grouped.has(song.chipType)) {
				grouped.set(song.chipType, []);
			}
			grouped.get(song.chipType)!.push(song);
		}

		grouped.forEach((songsOfType, chipType) => {
			if (songsOfType.length === 0) return;

			const firstSong = songsOfType[0] as unknown as Record<string, unknown>;
			const chip = getChipByType(chipType);
			if (!chip) return;

			const settings = chip.schema.settings || [];
			settings
				.filter((s) => s.group === 'chip' && s.notifyAudioService)
				.forEach((s) => {
					const value = firstSong[s.key] ?? s.defaultValue;
					if (value !== undefined) {
						container.audioService.chipSettings.set(s.key, value);
					}
				});
		});
	});

	let patternEditor: PatternEditor | null = $state(null);

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

			if (data.action === 'paste-without-erasing') {
				const event = new KeyboardEvent('keydown', {
					key: 'v',
					ctrlKey: true,
					shiftKey: true,
					bubbles: true
				});
				patternEditor?.handleKeyDownFromMenu?.(event);
				return;
			}

			if (data.action === 'increment-value') {
				const event = new KeyboardEvent('keydown', {
					key: '+',
					bubbles: true
				});
				patternEditor?.handleKeyDownFromMenu?.(event);
				return;
			}

			if (data.action === 'decrement-value') {
				const event = new KeyboardEvent('keydown', {
					key: '-',
					bubbles: true
				});
				patternEditor?.handleKeyDownFromMenu?.(event);
				return;
			}

			if (data.action === 'transpose-octave-up') {
				const event = new KeyboardEvent('keydown', {
					key: '+',
					shiftKey: true,
					bubbles: true
				});
				patternEditor?.handleKeyDownFromMenu?.(event);
				return;
			}

			if (data.action === 'transpose-octave-down') {
				const event = new KeyboardEvent('keydown', {
					key: '-',
					shiftKey: true,
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

			if (data.action === 'playPattern') {
				if (playbackStore.isPlaying) {
					playbackStore.isPlaying = false;
					container.audioService.stop();
				}

				if (patternEditor) {
					playbackStore.isPlaying = true;
					patternEditor.playPattern();
				}
				return;
			}

			if (data.action === 'new-project') {
				playbackStore.isPlaying = false;
				container.audioService.stop();

				const newProject = await projectService.resetProject(AY_CHIP);

				projectSettings = {
					title: newProject.name,
					author: newProject.author,
					initialSpeed: newProject.songs[0]?.initialSpeed ?? 3
				};
				songs = newProject.songs;
				patternOrder = newProject.patternOrder;
				tables = newProject.tables;

				patternEditor?.resetToBeginning();
				return;
			}

			if (
				data.action === 'remove-song' &&
				typeof (data as unknown as { songIndex?: number }).songIndex === 'number'
			) {
				const index = (data as unknown as { songIndex: number }).songIndex;
				if (songs.length <= 1 || index < 0 || index >= songs.length) return;
				const confirmed = await open(ConfirmModal, {
					message: `Remove song (${index + 1})? This cannot be undone.`
				});
				if (!confirmed) return;
				playbackStore.isPlaying = false;
				container.audioService.stop();
				songs = songs.filter((_, i) => i !== index);
				container.audioService.removeChipProcessor(index);
				activeSongIndex = Math.min(activeSongIndex, Math.max(0, songs.length - 1));
				patternEditor?.resetToBeginning();
				return;
			}

			if (data.action === 'new-song-ay') {
				playbackStore.isPlaying = false;
				container.audioService.stop();

				const newSong = await projectService.createNewSong(AY_CHIP);
				if (songs.length > 0 && patternOrder.length > 0) {
					const firstPatternId = patternOrder[0];
					const firstPattern = songs[0].patterns.find((p) => p.id === firstPatternId);
					const refLength = firstPattern?.length ?? 64;
					if (newSong.patterns[0].length !== refLength) {
						const schema = container.audioService.chipProcessors[0].chip.schema;
						const resized = PatternService.resizePattern(
							newSong.patterns[0],
							refLength,
							schema
						);
						newSong.patterns = PatternService.updatePatternInArray(
							newSong.patterns,
							resized
						);
					}
				}
				songs = [...songs, newSong];

				patternEditor?.resetToBeginning();
				return;
			}

			if (data.action === 'settings') {
				await open(SettingsModal, {});
				return;
			}

			if (data.action === 'appearance') {
				await open(SettingsModal, { initialTabId: 'appearance' });
				return;
			}

			if (data.action === 'about') {
				await open(AboutModal, {});
				return;
			}

			if (data.action === 'effects') {
				await open(EffectsModal, {});
				return;
			}

			if (data.action === ACTION_APPLY_SCRIPT) {
				const hasSelection = patternEditor?.hasSelection?.() ?? false;
				const result = await open(UserScriptsModal, { hasSelection });
				if (result && patternEditor?.applyScript) {
					patternEditor.applyScript(result);
				}
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

				const wavSettings = await open(WavExportSettingsModal, { project: currentProject });
				if (wavSettings) {
					await open(ProgressModal, {
						project: currentProject,
						exportType: 'wav',
						wavSettings
					});
				}
				return;
			}

			if (data.action === 'export-psg') {
				const currentProject = new Project(
					projectSettings.title,
					projectSettings.author,
					songs,
					0,
					patternOrder,
					tables
				);

				await open(ProgressModal, { project: currentProject, exportType: 'psg' });
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
					author: importedProject.author,
					initialSpeed: importedProject.songs[0]?.initialSpeed ?? 3
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

	function handleGlobalKeyDown(event: KeyboardEvent) {
		if (event.defaultPrevented) return;
		const target = event.target as HTMLElement;
		if (
			target?.closest?.('input, textarea') ||
			target?.getAttribute?.('contenteditable') === 'true'
		) {
			return;
		}
		const shortcut = ShortcutString.fromEvent(event);
		const action = keybindingsStore.getActionForShortcut(shortcut);
		if (action === ACTION_APPLY_SCRIPT) {
			event.preventDefault();
			handleMenuAction({ action: ACTION_APPLY_SCRIPT });
		}
	}
</script>

<svelte:window onkeydown={handleGlobalKeyDown} />

<main
	class="flex h-screen flex-col gap-1 overflow-hidden bg-[var(--color-app-surface-secondary)] font-sans text-xs text-[var(--color-app-text-primary)]">
	<MenuBar {menuItems} onAction={handleMenuAction} {songs} />
	<div class="flex-1 overflow-hidden">
		<SongView
			bind:songs
			bind:patternOrder
			bind:patternEditor
			bind:activeEditorIndex={activeSongIndex}
			bind:tables
			bind:projectSettings
			onaction={handleMenuAction}
			chipProcessors={container.audioService.chipProcessors} />
	</div>
	<ModalContainer />

	{#if themeEditorStore.editingTheme}
		<ThemeEditorModal
			theme={themeEditorStore.editingTheme.theme}
			isNew={themeEditorStore.editingTheme.isNew}
			resolve={async () => {
				const callback = themeEditorStore.onSaveCallback;
				themeEditorStore.setEditingTheme(null, false);
				await tick();
				callback?.();
			}}
			dismiss={() => {
				themeEditorStore.setEditingTheme(null, false);
			}} />
	{/if}
</main>

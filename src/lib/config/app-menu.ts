import type { MenuItem } from '../components/Menu/types';
import { undoRedoStore } from '../stores/undo-redo.svelte';
import { clipboardStore } from '../stores/clipboard.svelte';

const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().includes('MAC');
const modKey = isMac ? 'Cmd' : 'Ctrl';

export const menuItems: MenuItem[] = [
	{
		label: 'File',
		items: [
			{
				label: 'New',
				type: 'expandable',
				items: [
					{ label: 'Project', type: 'normal', icon: '📁', action: 'new-project' },
					{
						label: 'Song',
						type: 'expandable',
						icon: '📁',
						items: [{ label: 'AY/YM', type: 'normal', action: 'new-song-ay' }]
					}
				]
			},
			{ label: 'Open', type: 'normal', action: 'open' },
			{
				label: 'Import',
				type: 'expandable',
				items: [{ label: 'VT2 Module', type: 'normal', action: 'import-vt2' }]
			},
			{ label: 'Save', type: 'normal', action: 'save' },
			{
				label: 'Export',
				type: 'expandable',
				items: [
					{ label: 'WAV', type: 'normal', action: 'export-wav' },
					{ label: 'PSG', type: 'normal', action: 'export-psg' }
				]
			},
			{ label: 'Settings', type: 'normal', action: 'settings' }
		]
	},
	{
		label: 'Edit',
		items: [
			{
				label: 'Undo',
				type: 'normal',
				action: 'undo',
				shortcut: `${modKey}+Z`,
				disabled: () => !undoRedoStore.canUndo
			},
			{
				label: 'Redo',
				type: 'normal',
				action: 'redo',
				shortcut: `${modKey}+${isMac ? 'Shift+Z' : 'Y'}`,
				disabled: () => !undoRedoStore.canRedo
			},
			{
				label: 'Copy',
				type: 'normal',
				action: 'copy',
				shortcut: `${modKey}+C`
			},
			{
				label: 'Cut',
				type: 'normal',
				action: 'cut',
				shortcut: `${modKey}+X`
			},
			{
				label: 'Paste',
				type: 'normal',
				action: 'paste',
				shortcut: `${modKey}+V`,
				disabled: () => !clipboardStore.hasData
			},
			{
				label: 'Magic paste',
				type: 'normal',
				action: 'paste-without-erasing',
				shortcut: `${modKey}+Shift+V`,
				disabled: () => !clipboardStore.hasData
			}
		]
	},
	{
		label: 'View',
		items: [
			{
				label: 'Appearance',
				type: 'normal',
				action: 'appearance'
			}
		]
	},
	{
		label: 'Help',
		items: [
			{ label: 'Documentation', type: 'normal' },
			{ label: 'About', type: 'normal', action: 'about' },
			{
				label: 'Support',
				type: 'expandable',
				items: [
					{ label: 'FAQ', type: 'normal' },
					{
						label: 'Contact',
						type: 'normal'
					}
				]
			}
		]
	}
];

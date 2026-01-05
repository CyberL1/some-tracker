import type { MenuItem } from '../components/Menu/types';

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
						items: [
							{ label: 'AY/YM', type: 'normal', action: 'new-song-ay' }
						]
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
			{ label: 'Save As', type: 'normal', action: 'save-as' },
			{
				label: 'Export',
				type: 'expandable',
				items: [{ label: 'WAV', type: 'normal', action: 'export-wav' }]
			},
			{ label: 'Settings', type: 'normal', action: 'settings' },
			{ label: 'Exit', type: 'normal' }
		]
	},
	{
		label: 'Edit',
		items: [
			{ label: 'Undo', type: 'normal' },
			{ label: 'Redo', type: 'normal' }
		]
	},
	{
		label: 'View',
		items: [
			{
				label: 'Appearance',
				type: 'normal'
			}
		]
	},
	{
		label: 'Help',
		items: [
			{ label: 'Documentation', type: 'normal' },
			{ label: 'About', type: 'normal' },
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

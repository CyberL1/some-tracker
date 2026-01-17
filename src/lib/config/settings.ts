import type { SettingsItem } from '../components/Settings/types';

export const settingsItems: SettingsItem[] = [
	{
		label: 'Volume',
		description: 'Changes the volume, duh',
		type: 'range',
		defaultValue: 100,
		setting: 'volume',
		category: 'general'
	},
	{
		label: 'Show Visual Grid',
		description: 'Show offset and octave grids in table editor when expanded',
		type: 'toggle',
		defaultValue: true,
		setting: 'showVisualGrid',
		category: 'general'
	},
	{
		label: 'Envelope as Note',
		description: 'Enable envelope input as note for AY chips',
		type: 'toggle',
		defaultValue: false,
		setting: 'envelopeAsNote',
		category: 'general'
	}
];

export const generalSettings = settingsItems.filter((item) => item.category === 'general');
export const keyboardSettings = settingsItems.filter((item) => item.category === 'keyboard');

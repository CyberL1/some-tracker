import type { SettingsItem } from '../components/Settings/types';

export const settingsItems: SettingsItem[] = [
	{
		label: 'Volume',
		description: 'Changes the master volume of the audio output',
		type: 'range',
		defaultValue: 60,
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
	},
	{
		label: 'Pattern Editor Font Size',
		description: 'Adjust the font size in the pattern editor',
		type: 'number',
		defaultValue: 14,
		setting: 'patternEditorFontSize',
		category: 'appearance',
		min: 8,
		max: 30,
		step: 1
	}
];

export const generalSettings = settingsItems.filter((item) => item.category === 'general');
export const keyboardSettings = settingsItems.filter((item) => item.category === 'keyboard');
export const appearanceSettings = settingsItems.filter((item) => item.category === 'appearance');

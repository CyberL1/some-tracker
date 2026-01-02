import type { SettingsItem } from '../components/Settings/types';

export const settingsItems: SettingsItem[] = [
	{
		label: 'Volume',
		description: 'Changes the volume, duh',
		type: 'range',
		defaultValue: 100,
		setting: 'volume'
	},
	{
		label: 'Show Visual Grid',
		description: 'Show offset and octave grids in table editor when expanded',
		type: 'toggle',
		defaultValue: true,
		setting: 'showVisualGrid'
	}
];

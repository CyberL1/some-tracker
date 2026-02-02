import type { ChipSetting } from '../chips/base/schema';

export const PROJECT_FIELDS: ChipSetting[] = [
	{
		key: 'title',
		label: 'Title',
		type: 'text',
		group: 'project'
	},
	{
		key: 'author',
		label: 'Author',
		type: 'text',
		group: 'project'
	},
	{
		key: 'initialSpeed',
		label: 'Initial Speed',
		type: 'number',
		defaultValue: 3,
		group: 'project',
		min: 1,
		max: 255,
		step: 1,
		fullWidth: true,
		dependsOn: ['interruptFrequency'],
		computedHint: (speed, context) => {
			const freq = Number(context?.interruptFrequency ?? 50);
			const s = Math.max(1, Number(speed) || 1);
			const bpm = Math.round((freq * 60) / (s * 4));
			return `${Math.round(bpm / 2)} / ${bpm} BPM`;
		}
	}
];

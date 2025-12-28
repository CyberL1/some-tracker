import type { ChipSchema } from './schema';

export const AY_CHIP_SCHEMA: ChipSchema = {
	chipType: 'ay',
	globalTemplate: '{envelopeValue} {envelopeEffect} {noiseValue}',
	globalFields: {
		envelopeValue: { key: 'envelopeValue', type: 'hex', length: 4, color: 'patternEnvelope' },
		envelopeEffect: { key: 'envelopeEffect', type: 'hex', length: 4, color: 'patternEffect' },
		noiseValue: { key: 'noiseValue', type: 'hex', length: 2, color: 'patternNoise' }
	},
	template: '{note} {instrument}{envelopeShape}{table}{volume} {effect}',
	fields: {
		note: { key: 'note', type: 'note', length: 3, color: 'patternNote', selectable: 'atomic' },
		instrument: {
			key: 'instrument',
			type: 'symbol',
			length: 2,
			color: 'patternInstrument',
			selectable: 'character'
		},
		envelopeShape: {
			key: 'envelopeShape',
			type: 'hex',
			length: 1,
			color: 'patternEnvelope',
			selectable: 'character'
		},
		table: {
			key: 'table',
			type: 'symbol',
			length: 2,
			color: 'patternTable',
			selectable: 'character'
		},
		volume: {
			key: 'volume',
			type: 'hex',
			length: 1,
			color: 'patternText',
			selectable: 'character'
		},
		effect: {
			key: 'effect',
			type: 'hex',
			length: 4,
			color: 'patternEffect',
			selectable: 'character'
		}
	},
	settings: [
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
			key: 'aymChipType',
			label: 'Chip Type',
			type: 'toggle',
			options: [
				{ label: 'AY', value: 'AY' },
				{ label: 'YM', value: 'YM' }
			],
			defaultValue: 'AY',
			group: 'chip'
		},
		{
			key: 'aymFrequency',
			label: 'Chip Frequency',
			type: 'select',
			options: [
				{ label: 'Sinclair QL (0.75 MHz)', value: 750000 },
				{ label: 'Amstrad CPC (1 MHz)', value: 1000000 },
				{ label: 'ZX Spectrum (1.7734 MHz)', value: 1773400 },
				{ label: 'Pentagon (1.75 MHz)', value: 1750000 },
				{ label: 'MSX (1.7897 MHz)', value: 1789700 },
				{ label: 'Atari ST (2 MHz)', value: 2000000 }
			],
			defaultValue: 1773400,
			group: 'chip',
			notifyAudioService: true
		},
		{
			key: 'intFrequency',
			label: 'Interrupt Frequency',
			type: 'select',
			options: [
				{ label: 'Pentagon (48.828 Hz)', value: 48.828 },
				{ label: 'PAL (50 Hz)', value: 50 },
				{ label: 'NTSC (60 Hz)', value: 60 }
			],
			defaultValue: 50,
			group: 'chip',
			notifyAudioService: true
		}
	]
};

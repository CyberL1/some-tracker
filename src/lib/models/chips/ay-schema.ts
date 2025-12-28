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
	}
};

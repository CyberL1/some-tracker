import type { ChipSchema } from '../base/schema';
import {
	getTuningTableForSource,
	type TuningTableSource
} from '../../models/pt3/tuning-tables';

const DEFAULT_AY_CLOCK = 1773400;

export const AY_CHIP_SCHEMA: ChipSchema = {
	chipType: 'ay',
	defaultTuningTable: getTuningTableForSource('pt3-2', DEFAULT_AY_CLOCK),
	defaultTuningTableSource: 'pt3-2',
	defaultChipVariant: 'AY',
	globalTemplate: '{envelopeValue} {envelopeEffect} {noiseValue}',
	globalFields: {
		envelopeValue: {
			key: 'envelopeValue',
			type: 'hex',
			length: 4,
			color: 'patternEnvelope',
			allowZeroValue: true
		},
		envelopeEffect: { key: 'envelopeEffect', type: 'hex', length: 4, color: 'patternEffect' },
		noiseValue: {
			key: 'noiseValue',
			type: 'hex',
			length: 2,
			color: 'patternNoise',
			allowZeroValue: true
		}
	},
	channelLabels: ['A', 'B', 'C'],
	template: '{note} {instrument}{envelopeShape}{table}{volume} {effect}',
	fields: {
		note: { key: 'note', type: 'note', length: 3, color: 'patternNote', selectable: 'atomic' },
		instrument: {
			key: 'instrument',
			type: 'symbol',
			length: 2,
			color: 'patternInstrument',
			selectable: 'character',
			allowZeroValue: false
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
			length: 1,
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
			key: 'chipVariant',
			label: 'Chip Type',
			type: 'toggle',
			options: [
				{ label: 'AY', value: 'AY' },
				{ label: 'YM', value: 'YM' }
			],
			defaultValue: 'AY',
			group: 'chip',
			notifyAudioService: true
		},
		{
			key: 'chipFrequency',
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
			key: 'interruptFrequency',
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
		},
		{
			key: 'stereoLayout',
			label: 'Stereo',
			type: 'toggle',
			options: [
				{ label: 'ABC', value: 'ABC' },
				{ label: 'ACB', value: 'ACB' },
				{ label: 'CAB', value: 'CAB' },
				{ label: 'Mono', value: 'mono' }
			],
			defaultValue: 'ABC',
			group: 'chip',
			notifyAudioService: true
		},
		{
			key: 'tuningTableSource',
			label: 'Tuning Table',
			type: 'tuningTable',
			options: [
				{ label: 'PT3 Table 0', value: 'pt3-0' as TuningTableSource },
				{ label: 'PT3 Table 1', value: 'pt3-1' as TuningTableSource },
				{ label: 'PT3 Table 2', value: 'pt3-2' as TuningTableSource },
				{ label: 'PT3 Table 3', value: 'pt3-3' as TuningTableSource },
				{ label: 'Custom (12TET from frequency)', value: 'custom' as TuningTableSource }
			],
			defaultValue: 'pt3-2',
			group: 'chip'
		}
	]
};

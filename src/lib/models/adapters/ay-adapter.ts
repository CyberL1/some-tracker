import { Pattern as AYPattern, Note, Effect } from '../song';
import type { PatternConverter } from './pattern-converter';
import type { Pattern } from '../song';
import type { GenericPattern, GenericRow, GenericPatternRow } from '../song/generic';
import { formatNoteFromEnum, parseNoteFromString } from '../../utils/note-utils';

export class AYConverter implements PatternConverter {
	toGeneric(chipPattern: Pattern): GenericPattern {
		const ayPattern = chipPattern as AYPattern;
		const generic: GenericPattern = {
			id: ayPattern.id,
			length: ayPattern.length,
			channels: [],
			patternRows: []
		};

		for (let i = 0; i < ayPattern.channels.length; i++) {
			generic.channels.push({ rows: [] });
		}

		for (let rowIndex = 0; rowIndex < ayPattern.length; rowIndex++) {
			const ayPatternRow = ayPattern.patternRows[rowIndex];
			const genericPatternRow: GenericPatternRow = {
				envelopeValue: ayPatternRow.envelopeValue,
				noiseValue: ayPatternRow.noiseValue,
				envelopeEffect: ayPatternRow.envelopeEffect
					? ({
							effect: ayPatternRow.envelopeEffect.effect,
							delay: ayPatternRow.envelopeEffect.delay,
							parameter: ayPatternRow.envelopeEffect.parameter
						} as unknown as string | number | null | undefined)
					: null
			};
			generic.patternRows.push(genericPatternRow);

			for (let channelIndex = 0; channelIndex < ayPattern.channels.length; channelIndex++) {
				const ayRow = ayPattern.channels[channelIndex].rows[rowIndex];
				const genericRow: GenericRow = {
					note: formatNoteFromEnum(ayRow.note.name, ayRow.note.octave),
					instrument: ayRow.instrument,
					volume: ayRow.volume,
					table: ayRow.table,
					envelopeShape: ayRow.envelopeShape,
					effect: ayRow.effects[0]
						? ({
								effect: ayRow.effects[0].effect,
								delay: ayRow.effects[0].delay,
								parameter: ayRow.effects[0].parameter
							} as unknown as string | number | null | undefined)
						: null
				};
				generic.channels[channelIndex].rows.push(genericRow);
			}
		}

		return generic;
	}

	fromGeneric(generic: GenericPattern): Pattern {
		const ayPattern = new AYPattern(generic.id, generic.length);

		for (let rowIndex = 0; rowIndex < generic.length; rowIndex++) {
			const genericPatternRow = generic.patternRows[rowIndex];
			const ayPatternRow = ayPattern.patternRows[rowIndex];

			ayPatternRow.envelopeValue = (genericPatternRow.envelopeValue as number) || 0;
			ayPatternRow.noiseValue = (genericPatternRow.noiseValue as number) || 0;
			if (genericPatternRow.envelopeEffect) {
				const effect = genericPatternRow.envelopeEffect as unknown as {
					effect: number;
					delay: number;
					parameter: number;
				};
				ayPatternRow.envelopeEffect = new Effect(
					effect.effect,
					effect.delay,
					effect.parameter
				);
			}

			for (let channelIndex = 0; channelIndex < generic.channels.length; channelIndex++) {
				const genericChannel = generic.channels[channelIndex];
				const genericRow = genericChannel.rows[rowIndex];
				const ayRow = ayPattern.channels[channelIndex].rows[rowIndex];

				if (genericRow.note) {
					const noteStr = genericRow.note as string;
					const { noteName, octave } = parseNoteFromString(noteStr);
					ayRow.note = new Note(noteName, octave);
				}

				ayRow.instrument = (genericRow.instrument as number) || 0;
				ayRow.volume = (genericRow.volume as number) || 0;
				ayRow.table = (genericRow.table as number) || 0;
				ayRow.envelopeShape = (genericRow.envelopeShape as number) || 0;

				if (genericRow.effect) {
					const effect = genericRow.effect as unknown as {
						effect: number;
						delay: number;
						parameter: number;
					};
					ayRow.effects[0] = new Effect(effect.effect, effect.delay, effect.parameter);
				}
			}
		}

		return ayPattern;
	}
}

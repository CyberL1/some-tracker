import { Pattern as AYPattern, Note, Effect } from '../../models/song';
import type { PatternConverter } from '../base/adapter';
import type { Pattern } from '../../models/song';
import type { GenericPattern, GenericRow, GenericPatternRow } from '../../models/song/generic';
import { formatNoteFromEnum, parseNoteFromString } from '../../utils/note-utils';
import { isEffectLike, isNumber, isString, toNumber } from '../../utils/type-guards';

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
			const envelopeEffectValue = ayPatternRow.envelopeEffect;
			const envelopeEffect = isEffectLike(envelopeEffectValue) ? envelopeEffectValue : null;
			const genericPatternRow: GenericPatternRow = {
				envelopeValue: toNumber(ayPatternRow.envelopeValue),
				noiseValue: toNumber(ayPatternRow.noiseValue),
				envelopeEffect: envelopeEffect
					? ({
							effect: envelopeEffect.effect,
							delay: envelopeEffect.delay,
							parameter: envelopeEffect.parameter
						} as Record<string, unknown>)
					: null
			};
			generic.patternRows.push(genericPatternRow);

			for (let channelIndex = 0; channelIndex < ayPattern.channels.length; channelIndex++) {
				const ayRow = ayPattern.channels[channelIndex].rows[rowIndex];
				const effectValue = ayRow.effects[0];
				const effect = isEffectLike(effectValue) ? effectValue : null;
				const genericRow: GenericRow = {
					note: formatNoteFromEnum(ayRow.note.name, ayRow.note.octave),
					instrument: toNumber(ayRow.instrument),
					volume: toNumber(ayRow.volume),
					table: toNumber(ayRow.table),
					envelopeShape: toNumber(ayRow.envelopeShape),
					effect: effect
						? ({
								effect: effect.effect,
								delay: effect.delay,
								parameter: effect.parameter
							} as Record<string, unknown>)
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

			ayPatternRow.envelopeValue = toNumber(genericPatternRow.envelopeValue);
			ayPatternRow.noiseValue = toNumber(genericPatternRow.noiseValue);
			if (
				genericPatternRow.envelopeEffect &&
				isEffectLike(genericPatternRow.envelopeEffect)
			) {
				ayPatternRow.envelopeEffect = new Effect(
					genericPatternRow.envelopeEffect.effect,
					genericPatternRow.envelopeEffect.delay,
					genericPatternRow.envelopeEffect.parameter
				);
			}

			for (let channelIndex = 0; channelIndex < generic.channels.length; channelIndex++) {
				const genericChannel = generic.channels[channelIndex];
				const genericRow = genericChannel.rows[rowIndex];
				const ayRow = ayPattern.channels[channelIndex].rows[rowIndex];

				if (genericRow.note && isString(genericRow.note)) {
					const { noteName, octave } = parseNoteFromString(genericRow.note);
					ayRow.note = new Note(noteName, octave);
				}

				ayRow.instrument = toNumber(genericRow.instrument);
				ayRow.volume = toNumber(genericRow.volume);
				ayRow.table = toNumber(genericRow.table);
				ayRow.envelopeShape = toNumber(genericRow.envelopeShape);

				if (genericRow.effect && isEffectLike(genericRow.effect)) {
					ayRow.effects[0] = new Effect(
						genericRow.effect.effect,
						genericRow.effect.delay,
						genericRow.effect.parameter
					);
				}
			}
		}

		return ayPattern;
	}
}

import type { Effect, Pattern } from '../models/song';
import { NoteName } from '../models/song';

export function formatNote(noteName: NoteName, octave: number): string {
	const notes = [
		'---',
		'R--',
		'C-',
		'C#',
		'D-',
		'D#',
		'E-',
		'F-',
		'F#',
		'G-',
		'G#',
		'A-',
		'A#',
		'B-'
	];
	if (noteName === NoteName.None) return '---';
	if (noteName === NoteName.Off) return 'R--';
	return notes[noteName] + octave;
}

export function formatHex(value: number, digits: number): string {
	if (value === 0) return '.'.repeat(digits);
	return value.toString(16).toUpperCase().padStart(digits, '0');
}

export function formatInstrument(value: number): string {
	return value === 0 ? '..' : value.toString(16).toUpperCase().padStart(2, '0');
}

export function formatEffect(effect: Effect | null): string {
	if (!effect) return '....';
	const type = effect.effect === 0 ? '.' : effect.effect.toString(16).toUpperCase();
	const delay = effect.delay === 0 ? '.' : effect.delay.toString(16).toUpperCase();
	const param = formatHex(effect.parameter, 2);
	return type + delay + param;
}

export function formatOrnamentHex(value: number): string {
	return value === 0 ? '..' : value.toString(16).toUpperCase().padStart(2, '0');
}

export type NoteParameterFieldType = 'instrument' | 'shape' | 'ornament' | 'volume';

export interface NoteParameterField {
	type: NoteParameterFieldType;
	value: string;
}

export interface RowPart {
	type: 'rowNum' | 'envelope' | 'envEffect' | 'noise' | 'note' | 'noteParameters' | 'fx';
	value: string | NoteParameterField[];
}

export function getRowDataStructured(pattern: Pattern, rowIndex: number): RowPart[] {
	const row = pattern.patternRows[rowIndex];
	const rowNum = rowIndex.toString(16).toUpperCase().padStart(2, '0');
	const envelope = formatHex(row.envelopeValue, 4);
	const envEffect = formatEffect(row.envelopeEffect);
	const noise = formatHex(row.noiseValue, 2);

	const parts: RowPart[] = [
		{ type: 'rowNum', value: rowNum },
		{ type: 'envelope', value: envelope },
		{ type: 'envEffect', value: envEffect },
		{ type: 'noise', value: noise }
	];

	for (let i = 0; i < pattern.channels.length; i++) {
		const ch = pattern.channels[i].rows[rowIndex];
		const note = formatNote(ch.note.name, ch.note.octave);
		const inst = formatInstrument(ch.instrument); // 2 chars
		const shape = ch.envelopeShape === 0 ? '.' : ch.envelopeShape.toString(16).toUpperCase(); // 1 char
		const orn = formatOrnamentHex(ch.ornament); // 2 chars
		const vol = ch.volume === 0 ? '.' : ch.volume.toString(16).toUpperCase(); // 1 char
		const fx = formatEffect(ch.effects[0]);

		const noteParams: NoteParameterField[] = [
			{ type: 'instrument', value: inst },
			{ type: 'shape', value: shape },
			{ type: 'ornament', value: orn },
			{ type: 'volume', value: vol }
		];

		parts.push({ type: 'note', value: note });
		parts.push({ type: 'noteParameters', value: noteParams });
		parts.push({ type: 'fx', value: fx });
	}

	return parts;
}

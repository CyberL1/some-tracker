import { NoteName } from '../../../models/song';
import { formatNoteFromEnum, parseNoteFromString } from '../../../utils/note-utils';
import type { EditingContext, FieldInfo } from './editing-context';
import type { Pattern } from '../../../models/song';
import { PatternValueUpdates } from './pattern-value-updates';

export class PatternNoteInput {
	private static readonly FIXED_OCTAVE = 4;

	private static readonly PIANO_KEYBOARD_MAP: Record<
		string,
		{ noteName: NoteName; octave: number }
	> = {
		q: { noteName: NoteName.C, octave: 4 },
		'2': { noteName: NoteName.CSharp, octave: 4 },
		w: { noteName: NoteName.D, octave: 4 },
		'3': { noteName: NoteName.DSharp, octave: 4 },
		e: { noteName: NoteName.E, octave: 4 },
		r: { noteName: NoteName.F, octave: 4 },
		'5': { noteName: NoteName.FSharp, octave: 4 },
		t: { noteName: NoteName.G, octave: 4 },
		'6': { noteName: NoteName.GSharp, octave: 4 },
		y: { noteName: NoteName.A, octave: 4 },
		'7': { noteName: NoteName.ASharp, octave: 4 },
		u: { noteName: NoteName.B, octave: 4 },
		i: { noteName: NoteName.C, octave: 5 },
		'9': { noteName: NoteName.CSharp, octave: 5 },
		o: { noteName: NoteName.D, octave: 5 },
		'0': { noteName: NoteName.DSharp, octave: 5 },
		p: { noteName: NoteName.E, octave: 5 },
		'[': { noteName: NoteName.F, octave: 5 },
		']': { noteName: NoteName.G, octave: 5 },
		z: { noteName: NoteName.C, octave: 3 },
		s: { noteName: NoteName.CSharp, octave: 3 },
		x: { noteName: NoteName.D, octave: 3 },
		d: { noteName: NoteName.DSharp, octave: 3 },
		c: { noteName: NoteName.E, octave: 3 },
		v: { noteName: NoteName.F, octave: 3 },
		f: { noteName: NoteName.FSharp, octave: 3 },
		b: { noteName: NoteName.G, octave: 3 },
		g: { noteName: NoteName.GSharp, octave: 3 },
		n: { noteName: NoteName.A, octave: 3 },
		h: { noteName: NoteName.ASharp, octave: 3 },
		m: { noteName: NoteName.B, octave: 3 },
		',': { noteName: NoteName.C, octave: 4 },
		j: { noteName: NoteName.CSharp, octave: 4 },
		'.': { noteName: NoteName.D, octave: 4 },
		k: { noteName: NoteName.DSharp, octave: 4 },
		'/': { noteName: NoteName.E, octave: 4 },
		l: { noteName: NoteName.FSharp, octave: 4 },
		';': { noteName: NoteName.GSharp, octave: 4 },
		"'": { noteName: NoteName.ASharp, octave: 4 }
	};

	private static readonly LETTER_NOTE_MAP: Record<string, NoteName> = {
		C: NoteName.C,
		D: NoteName.D,
		E: NoteName.E,
		F: NoteName.F,
		G: NoteName.G,
		B: NoteName.B
	};

	static handleNoteInput(
		context: EditingContext,
		fieldInfo: FieldInfo,
		key: string
	): { updatedPattern: Pattern; shouldMoveNext: boolean } | null {
		if (fieldInfo.isGlobal || fieldInfo.channelIndex < 0) {
			return null;
		}

		const upperKey = key.toUpperCase();
		if (upperKey === 'O' || upperKey === 'A') {
			const updatedPattern = PatternValueUpdates.updateFieldValue(context, fieldInfo, 'OFF');
			return { updatedPattern, shouldMoveNext: false };
		}

		const keyboardNote = this.mapKeyboardKeyToNote(key);
		if (keyboardNote) {
			const noteStr = formatNoteFromEnum(keyboardNote.noteName, keyboardNote.octave);
			const updatedPattern = PatternValueUpdates.updateFieldValue(
				context,
				fieldInfo,
				noteStr
			);
			return { updatedPattern, shouldMoveNext: false };
		}

		if (this.LETTER_NOTE_MAP[upperKey]) {
			const noteStr = formatNoteFromEnum(this.LETTER_NOTE_MAP[upperKey], this.FIXED_OCTAVE);
			const updatedPattern = PatternValueUpdates.updateFieldValue(
				context,
				fieldInfo,
				noteStr
			);
			return { updatedPattern, shouldMoveNext: false };
		}

		if (this.isOctaveDigit(key)) {
			return this.handleOctaveChange(context, fieldInfo, key);
		}

		return null;
	}

	private static mapKeyboardKeyToNote(
		key: string
	): { noteName: NoteName; octave: number } | null {
		const lowerKey = key.toLowerCase();
		return this.PIANO_KEYBOARD_MAP[lowerKey] || null;
	}

	private static isOctaveDigit(key: string): boolean {
		return /^[0-9]$/.test(key);
	}

	private static handleOctaveChange(
		context: EditingContext,
		fieldInfo: FieldInfo,
		key: string
	): { updatedPattern: Pattern; shouldMoveNext: boolean } | null {
		const octave = parseInt(key, 10);
		if (octave < 0 || octave > 9) {
			return null;
		}

		const currentNoteStr =
			(PatternValueUpdates.getFieldValue(context, fieldInfo) as string) || '---';
		if (currentNoteStr === '---' || currentNoteStr === 'OFF') {
			return null;
		}

		const parsed = parseNoteFromString(currentNoteStr);
		if (parsed.noteName === NoteName.None || parsed.noteName === NoteName.Off) {
			return null;
		}

		const noteStr = formatNoteFromEnum(parsed.noteName, octave);
		const updatedPattern = PatternValueUpdates.updateFieldValue(context, fieldInfo, noteStr);
		return { updatedPattern, shouldMoveNext: false };
	}
}

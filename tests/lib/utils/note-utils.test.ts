import { describe, it, expect } from 'vitest';
import { formatNoteFromEnum, parseNoteFromString } from '../../../src/lib/utils/note-utils';
import { NoteName } from '../../../src/lib/models/song';

describe('note-utils', () => {
	describe('formatNoteFromEnum', () => {
		it('should format NoteName.None as ---', () => {
			expect(formatNoteFromEnum(NoteName.None, 0)).toBe('---');
		});

		it('should format NoteName.Off as OFF', () => {
			expect(formatNoteFromEnum(NoteName.Off, 0)).toBe('OFF');
		});

		it('should format C note with octave', () => {
			expect(formatNoteFromEnum(NoteName.C, 4)).toBe('C-4');
		});

		it('should format sharp notes correctly', () => {
			expect(formatNoteFromEnum(NoteName.CSharp, 3)).toBe('C#3');
			expect(formatNoteFromEnum(NoteName.DSharp, 5)).toBe('D#5');
			expect(formatNoteFromEnum(NoteName.FSharp, 2)).toBe('F#2');
			expect(formatNoteFromEnum(NoteName.GSharp, 6)).toBe('G#6');
			expect(formatNoteFromEnum(NoteName.ASharp, 1)).toBe('A#1');
		});

		it('should format natural notes correctly', () => {
			expect(formatNoteFromEnum(NoteName.D, 4)).toBe('D-4');
			expect(formatNoteFromEnum(NoteName.E, 3)).toBe('E-3');
			expect(formatNoteFromEnum(NoteName.F, 5)).toBe('F-5');
			expect(formatNoteFromEnum(NoteName.G, 2)).toBe('G-2');
			expect(formatNoteFromEnum(NoteName.A, 6)).toBe('A-6');
			expect(formatNoteFromEnum(NoteName.B, 1)).toBe('B-1');
		});
	});

	describe('parseNoteFromString', () => {
		it('should parse --- as NoteName.None', () => {
			const result = parseNoteFromString('---');
			expect(result.noteName).toBe(NoteName.None);
			expect(result.octave).toBe(0);
		});

		it('should parse OFF as NoteName.Off', () => {
			const result = parseNoteFromString('OFF');
			expect(result.noteName).toBe(NoteName.Off);
			expect(result.octave).toBe(0);
		});

		it('should parse R-- as NoteName.Off', () => {
			const result = parseNoteFromString('R--');
			expect(result.noteName).toBe(NoteName.Off);
			expect(result.octave).toBe(0);
		});

		it('should parse C notes correctly', () => {
			const result = parseNoteFromString('C-4');
			expect(result.noteName).toBe(NoteName.C);
			expect(result.octave).toBe(4);
		});

		it('should parse sharp notes correctly', () => {
			let result = parseNoteFromString('C#3');
			expect(result.noteName).toBe(NoteName.CSharp);
			expect(result.octave).toBe(3);

			result = parseNoteFromString('D#5');
			expect(result.noteName).toBe(NoteName.DSharp);
			expect(result.octave).toBe(5);

			result = parseNoteFromString('F#2');
			expect(result.noteName).toBe(NoteName.FSharp);
			expect(result.octave).toBe(2);
		});

		it('should parse natural notes correctly', () => {
			let result = parseNoteFromString('D-4');
			expect(result.noteName).toBe(NoteName.D);
			expect(result.octave).toBe(4);

			result = parseNoteFromString('E-3');
			expect(result.noteName).toBe(NoteName.E);
			expect(result.octave).toBe(3);

			result = parseNoteFromString('F-5');
			expect(result.noteName).toBe(NoteName.F);
			expect(result.octave).toBe(5);
		});

		it('should return NoteName.None for invalid input', () => {
			const result = parseNoteFromString('INVALID');
			expect(result.noteName).toBe(NoteName.None);
			expect(result.octave).toBe(0);
		});

		it('should return NoteName.None for notes without octave', () => {
			const result = parseNoteFromString('C-');
			expect(result.noteName).toBe(NoteName.None);
			expect(result.octave).toBe(0);
		});

		it('should return NoteName.None for invalid note names', () => {
			const result = parseNoteFromString('H-4');
			expect(result.noteName).toBe(NoteName.None);
			expect(result.octave).toBe(0);
		});
	});
});

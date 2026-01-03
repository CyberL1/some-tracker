import { NoteName } from '../models/song';

export function formatNoteFromEnum(noteName: NoteName, octave: number): string {
	const notes = [
		'---',
		'OFF',
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
	if (noteName === NoteName.Off) return 'OFF';
	return notes[noteName] + octave;
}

export function parseNoteFromString(noteStr: string): { noteName: NoteName; octave: number } {
	if (noteStr === '---') {
		return { noteName: NoteName.None, octave: 0 };
	}
	if (noteStr === 'OFF' || noteStr === 'R--') {
		return { noteName: NoteName.Off, octave: 0 };
	}

	const noteMatch = noteStr.match(/^([A-G]#?)-(\d)$/);
	if (noteMatch) {
		const noteName = parseNoteName(noteMatch[1]);
		const octave = parseInt(noteMatch[2], 10);
		return { noteName, octave };
	}

	return { noteName: NoteName.None, octave: 0 };
}

function parseNoteName(noteStr: string): NoteName {
	const notes: Record<string, NoteName> = {
		'C-': NoteName.C,
		'C#': NoteName.CSharp,
		'D-': NoteName.D,
		'D#': NoteName.DSharp,
		'E-': NoteName.E,
		'F-': NoteName.F,
		'F#': NoteName.FSharp,
		'G-': NoteName.G,
		'G#': NoteName.GSharp,
		'A-': NoteName.A,
		'A#': NoteName.ASharp,
		'B-': NoteName.B
	};
	return notes[noteStr] || NoteName.None;
}


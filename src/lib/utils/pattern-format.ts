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
	if (value === 0) return '.';
	return value <= 9 ? value.toString() : String.fromCharCode(65 + value - 10);
}

export function formatEffect(effect: Effect | null): string {
	if (!effect) return '....';
	const type = effect.effect === 0 ? '.' : effect.effect.toString(16).toUpperCase();
	const delay = effect.delay === 0 ? '.' : effect.delay.toString(16).toUpperCase();
	const param = formatHex(effect.parameter, 2);
	return type + delay + param;
}

export function getRowData(pattern: Pattern, rowIndex: number): string {
	const row = pattern.patternRows[rowIndex];
	const rowNum = rowIndex.toString(16).toUpperCase().padStart(2, '0');
	const envelope = formatHex(row.envelopeValue, 4);
	const envEffect = formatEffect(row.envelopeEffect);
	const noise = formatHex(row.noiseValue, 2);

	let channelData = '';
	for (let i = 0; i < pattern.channels.length; i++) {
		const ch = pattern.channels[i].rows[rowIndex];
		const note = formatNote(ch.note.name, ch.note.octave);
		const inst = formatInstrument(ch.instrument);
		const shape = ch.envelopeShape === 0 ? '.' : ch.envelopeShape.toString(16).toUpperCase();
		const orn = formatInstrument(ch.ornament);
		const vol = ch.volume === 0 ? '.' : ch.volume.toString(16).toUpperCase();
		const fx = formatEffect(ch.effects[0]);
		channelData += ` ${note} ${inst}${shape}${orn}${vol} ${fx}`;
	}

	return `${rowNum} ${envelope} ${envEffect} ${noise}${channelData}`;
}

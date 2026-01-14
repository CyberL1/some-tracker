import type { PreviewNoteSupport } from '../../chips/base/processor';
import type { Pattern } from '../../models/song';
import { NoteName } from '../../models/song';
import type { ChipSchema } from '../../chips/base/schema';

export class PreviewService {
	playFromContext(
		processor: PreviewNoteSupport,
		pattern: Pattern,
		channelIndex: number,
		currentRow: number,
		schema: ChipSchema,
		useCurrentRowNote: boolean = false
	): void {
		const noteInfo = this.getNoteAtPosition(pattern, channelIndex, currentRow, useCurrentRowNote);
		if (!noteInfo) return;

		const noteNumber = this.calculateNoteNumber(noteInfo.noteName, noteInfo.octave);
		if (noteNumber === null) return;

		const rowData = this.collectRowData(pattern, channelIndex, currentRow, schema);

		processor.playPreviewNote(noteNumber, channelIndex, rowData);
	}

	stopNote(processor: PreviewNoteSupport, channel: number): void {
		processor.stopPreviewNote(channel);
	}

	private getNoteAtPosition(
		pattern: Pattern,
		channelIndex: number,
		currentRow: number,
		useCurrentRowOnly: boolean = false
	): { noteName: NoteName; octave: number } | null {
		const startRow = useCurrentRowOnly ? currentRow : currentRow;
		const endRow = useCurrentRowOnly ? currentRow : 0;

		for (let row = startRow; row >= endRow; row--) {
			const rowData = pattern.channels[channelIndex].rows[row];
			const note = rowData['note'];

			if (note && typeof note === 'object' && 'name' in note && 'octave' in note) {
				const noteName = note.name as NoteName;
				const octave = note.octave as number;

				if (noteName !== NoteName.None && noteName !== NoteName.Off) {
					return { noteName, octave };
				}
			}
		}

		return null;
	}

	private collectRowData(
		pattern: Pattern,
		channelIndex: number,
		currentRow: number,
		schema: ChipSchema
	): Record<string, unknown> {
		const result: Record<string, unknown> = {};

		for (const [fieldKey, fieldDef] of Object.entries(schema.fields || {})) {
			if (fieldKey === 'note') continue;

			for (let row = currentRow; row >= 0; row--) {
				const rowData = pattern.channels[channelIndex].rows[row];
				const value = rowData[fieldKey];

				if (this.isValidFieldValue(value)) {
					result[fieldKey] = value;
					break;
				}
			}
		}

		return result;
	}

	private isValidFieldValue(value: unknown): boolean {
		if (value === undefined || value === null || value === 0) return false;
		if (typeof value === 'string' && (value === '' || value === '..' || value.trim() === '')) return false;
		return true;
	}

	private calculateNoteNumber(noteName: NoteName, octave: number): number | null {
		if (noteName === NoteName.None || noteName === NoteName.Off) {
			return null;
		}

		return (noteName - 2) + (octave - 1) * 12;
	}
}

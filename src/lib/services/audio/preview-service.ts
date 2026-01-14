import type { PreviewNoteSupport } from '../../chips/base/processor';
import type { Pattern } from '../../models/song';
import { NoteName } from '../../models/song';

export class PreviewService {
	playNote(
		processor: PreviewNoteSupport,
		pattern: Pattern,
		note: { noteName: NoteName; octave: number },
		channelIndex: number,
		currentRow: number
	): void {
		const instrumentId = this.getInstrumentAtPosition(pattern, channelIndex, currentRow);
		const volume = this.getVolumeAtPosition(pattern, channelIndex, currentRow);
		const table = this.getTableAtPosition(pattern, channelIndex, currentRow);
		const noteNumber = this.calculateNoteNumber(note.noteName, note.octave);

		if (noteNumber !== null) {
			processor.playPreviewNote(noteNumber, instrumentId, channelIndex, volume, table);
		}
	}

	stopNote(processor: PreviewNoteSupport): void {
		processor.stopPreviewNote();
	}

	private getInstrumentAtPosition(
		pattern: Pattern,
		channelIndex: number,
		currentRow: number
	): string {
		for (let row = currentRow; row >= 0; row--) {
			const rowData = pattern.channels[channelIndex].rows[row];
			const instrument = rowData['instrument'];

			if (instrument !== undefined && instrument !== null && instrument !== 0) {
				if (typeof instrument === 'string') {
					return instrument;
				} else if (typeof instrument === 'number') {
					return instrument.toString().padStart(2, '0');
				}
			}
		}

		return '01';
	}

	private getVolumeAtPosition(
		pattern: Pattern,
		channelIndex: number,
		currentRow: number
	): number {
		for (let row = currentRow; row >= 0; row--) {
			const rowData = pattern.channels[channelIndex].rows[row];
			const volume = rowData['volume'];

			if (volume !== undefined && volume !== null && volume !== 0) {
				if (typeof volume === 'number') {
					return volume;
				} else if (typeof volume === 'string') {
					return parseInt(volume, 16);
				}
			}
		}

		return 0xf;
	}

	private getTableAtPosition(
		pattern: Pattern,
		channelIndex: number,
		currentRow: number
	): number | null {
		for (let row = currentRow; row >= 0; row--) {
			const rowData = pattern.channels[channelIndex].rows[row];
			const table = rowData['table'];

			if (table !== undefined && table !== null && table !== 0) {
				if (typeof table === 'number') {
					return table;
				} else if (typeof table === 'string') {
					return parseInt(table, 10);
				}
			}
		}

		return null;
	}

	private calculateNoteNumber(noteName: NoteName, octave: number): number | null {
		if (noteName === NoteName.None || noteName === NoteName.Off) {
			return null;
		}

		return (noteName - 2) + (octave - 1) * 12;
	}
}

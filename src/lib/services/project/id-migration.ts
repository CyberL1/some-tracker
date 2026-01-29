import type { Song, Row } from '../../models/song';
import { toNumber } from '../../utils/type-guards';
import { instrumentIdToNumber, normalizeInstrumentId } from '../../utils/instrument-id';

function getRowInstrumentNumeric(row: Row): number {
	const v = row.instrument;
	if (typeof v === 'number') return v;
	if (typeof v === 'string') {
		const parsed = parseInt(normalizeInstrumentId(v), 36);
		return isNaN(parsed) ? 0 : parsed;
	}
	return 0;
}

export function migrateInstrumentIdInSong(song: Song, oldId: string, newId: string): void {
	const oldNum = instrumentIdToNumber(oldId);
	const newNum = instrumentIdToNumber(newId);
	if (oldNum === newNum) return;

	for (const pattern of song.patterns) {
		for (const channel of pattern.channels) {
			for (const row of channel.rows) {
				if (getRowInstrumentNumeric(row) === oldNum) {
					row.instrument = newNum;
				}
			}
		}
	}
}

const TABLE_ROW_OFFSET = 1;

export function migrateTableIdInSongs(songs: Song[], oldTableId: number, newTableId: number): void {
	if (oldTableId === newTableId) return;

	const oldValue = oldTableId + TABLE_ROW_OFFSET;
	const newValue = newTableId + TABLE_ROW_OFFSET;

	for (const song of songs) {
		for (const pattern of song.patterns) {
			for (const channel of pattern.channels) {
				for (const row of channel.rows) {
					if (toNumber(row.table, -1) === oldValue) {
						row.table = newValue;
					}
				}
			}
		}
	}
}

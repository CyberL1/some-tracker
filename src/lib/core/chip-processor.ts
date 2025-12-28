import type { Chip } from '../models/chips';
import type { Pattern, Instrument } from '../models/song';
import type { Table } from '../models/project';
import type { ChipSettings } from '../services/chip-settings';

export interface ChipProcessor {
	chip: Chip;
	initialize(wasmBuffer: ArrayBuffer, audioNode: AudioWorkletNode): void;
	play(): void;
	playFromRow(row: number): void;
	stop(): void;
	updateOrder(order: number[]): void;
	sendInitPattern(pattern: Pattern, patternOrderIndex: number): void;
	sendRequestedPattern(pattern: Pattern): void;
	sendInitTables(tables: Table[]): void;
	setCallbacks(
		onPositionUpdate: (currentRow: number, currentPatternOrderIndex?: number) => void,
		onPatternRequest: (patternOrderIndex: number) => void
	): void;
	isAudioNodeAvailable(): boolean;
	sendInitSpeed(speed: number): void;
	updateParameter(parameter: string, value: unknown): void;
}

export interface SettingsSubscriber {
	subscribeToSettings(chipSettings: ChipSettings): void;
	unsubscribeFromSettings(): void;
}

export interface TuningTableSupport {
	sendInitTuningTable(tuningTable: number[]): void;
}

export interface InstrumentSupport {
	sendInitInstruments(instruments: Instrument[]): void;
}

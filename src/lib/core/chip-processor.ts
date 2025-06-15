import type { Chip } from '../models/chips';
import type { Pattern, Instrument } from '../models/song';
import type { Ornament } from '../models/project';

export interface ChipProcessor {
	chip: Chip;
	initialize(wasmBuffer: ArrayBuffer, audioNode: AudioWorkletNode): void;
	play(): void;
	playFromRow(row: number): void;
	stop(): void;
	updateOrder(order: number[]): void;
	sendInitPattern(pattern: Pattern, patternOrderIndex: number): void;
	sendRequestedPattern(pattern: Pattern): void;
	sendInitTuningTable(tuningTable: number[]): void;
	sendInitOrnaments(ornaments: Ornament[]): void;
	sendInitInstruments(instruments: Instrument[]): void;
	setCallbacks(
		onPositionUpdate: (currentRow: number, currentPatternOrderIndex?: number) => void,
		onPatternRequest: (patternOrderIndex: number) => void
	): void;
	isAudioNodeAvailable(): boolean;
	sendInitSpeed(speed: number): void;
	sendUpdateAyFrequency(aymFrequency: number): void;
	sendUpdateIntFrequency(intFrequency: number): void;
}

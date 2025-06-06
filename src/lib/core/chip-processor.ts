import type { Chip } from '../models/chips';
import type { Pattern, Ornament } from '../models/song';

export interface ChipProcessor {
	chip: Chip;
	initialize(wasmBuffer: ArrayBuffer, audioNode: AudioWorkletNode): void;
	play(): void;
	stop(): void;
	updateOrder(order: number[]): void;
	sendInitPattern(pattern: Pattern, patternOrderIndex: number): void;
	sendRequestedPattern(pattern: Pattern): void;
	sendInitTuningTable(tuningTable: number[]): void;
	sendInitOrnaments(ornaments: Ornament[]): void;
	setCallbacks(
		onPositionUpdate: (currentRow: number, currentPatternOrderIndex?: number) => void,
		onPatternRequest: (patternOrderIndex: number) => void
	): void;
	isAudioNodeAvailable(): boolean;
	sendInitSpeed(speed: number): void;
}

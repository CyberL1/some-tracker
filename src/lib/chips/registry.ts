import type { Chip } from './types';
import * as ayChip from './ay';

const chips: Map<string, Chip> = new Map();

function initializeChipRegistry(): void {
	const chipExports = [ayChip.AY_CHIP];

	for (const chip of chipExports) {
		if (
			typeof chip === 'object' &&
			chip !== null &&
			'type' in chip &&
			'name' in chip &&
			'wasmUrl' in chip
		) {
			chips.set(chip.type, chip);
		}
	}
}

initializeChipRegistry();

export function getChipByType(chipType: string): Chip | null {
	return chips.get(chipType) || null;
}

export function registerChip(chip: Chip): void {
	chips.set(chip.type, chip);
}

export function getAllChips(): Chip[] {
	return Array.from(chips.values());
}

export function getConverter(chip: Chip) {
	if (chip.type === 'ay') {
		return new ayChip.AYConverter();
	}
	throw new Error(`No converter found for chip type: ${chip.type}`);
}

export function getFormatter(chip: Chip) {
	if (chip.type === 'ay') {
		return new ayChip.AYFormatter();
	}
	throw new Error(`No formatter found for chip type: ${chip.type}`);
}

export async function createRenderer(chip: Chip) {
	if (chip.type === 'ay') {
		return new ayChip.AYChipRenderer();
	}
	if (chip.type === 'fm') {
		throw new Error('FM chip renderer not implemented yet');
	}
	return null;
}


import type { Chip } from '../models/chips';
import * as chipsModule from '../models/chips';

const chips: Map<string, Chip> = new Map();

function initializeChipRegistry(): void {
	const chipExports = Object.values(chipsModule).filter(
		(exported): exported is Chip =>
			typeof exported === 'object' &&
			exported !== null &&
			'type' in exported &&
			'name' in exported &&
			'wasmUrl' in exported
	);

	for (const chip of chipExports) {
		chips.set(chip.type, chip);
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


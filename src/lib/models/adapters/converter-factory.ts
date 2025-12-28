import type { PatternConverter } from './pattern-converter';
import type { Chip } from '../chips';
import { AYConverter } from './ay-adapter';

const converters: Map<string, PatternConverter> = new Map([['ay', new AYConverter()]]);

export function getConverter(chip: Chip): PatternConverter {
	const converter = converters.get(chip.type);
	if (!converter) {
		throw new Error(`No converter found for chip type: ${chip.type}`);
	}
	return converter;
}

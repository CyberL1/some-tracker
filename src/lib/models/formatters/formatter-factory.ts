import type { PatternFormatter } from './pattern-formatter';
import type { Chip } from '../chips';
import { AYFormatter } from './ay-formatter';

const formatters: Map<string, PatternFormatter> = new Map([['ay', new AYFormatter()]]);

export function getFormatter(chip: Chip): PatternFormatter {
	const formatter = formatters.get(chip.type);
	if (!formatter) {
		throw new Error(`No formatter found for chip type: ${chip.type}`);
	}
	return formatter;
}

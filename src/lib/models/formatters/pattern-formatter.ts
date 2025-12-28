import type { ChipSchema } from '../chips/schema';
import type { GenericRow, GenericPatternRow } from '../song/generic';

export interface PatternFormatter {
	formatRow(patternRow: GenericPatternRow, channels: GenericRow[], rowIndex: number, schema: ChipSchema): string;
	parseRow(rowString: string, schema: ChipSchema): {
		patternRow: GenericPatternRow;
		channels: GenericRow[];
	};
	getColorForField(fieldKey: string, schema: ChipSchema): string;
}


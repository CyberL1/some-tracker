import type { ChipProcessor } from './base/processor';
import type { ChipSchema } from './base/schema';

export interface Chip {
	type: 'ay' | 'fm' | 'sid';
	name: string;
	wasmUrl: string;
	processorName: string;
	processorMap: () => ChipProcessor;
	schema: ChipSchema;
}


import { AYProcessor } from './processor';
import type { ChipProcessor } from '../base/processor';
import type { ChipSchema } from '../base/schema';
import { AY_CHIP_SCHEMA } from './schema';

export interface Chip {
	type: 'ay' | 'fm' | 'sid';
	name: string;
	wasmUrl: string;
	processorName: string;
	processorMap: () => ChipProcessor;
	schema: ChipSchema;
}

export const AY_CHIP: Chip = {
	type: 'ay',
	name: 'AY-3-8910 / YM2149F',
	wasmUrl: 'ayumi.wasm',
	processorName: 'ayumi-processor',
	processorMap: () => new AYProcessor(),
	schema: AY_CHIP_SCHEMA
};

export { AYProcessor } from './processor';
export { AYConverter } from './adapter';
export { AYFormatter } from './formatter';
export { AYChipRenderer } from './renderer';


import { AYProcessor } from '../core/ay-processor';
import type { ChipProcessor } from '../core/chip-processor';

export interface Chip {
	type: 'ay' | 'fm';
	name: string;
	wasmUrl: string;
	processorName: string;
	processorMap: () => ChipProcessor;
}

export const AY_CHIP: Chip = {
	type: 'ay',
	name: 'AY-3-8910 / YM2149F',
	wasmUrl: 'ayumi.wasm',
	processorName: 'ayumi-processor',
	processorMap: () => new AYProcessor()
};

//TODO: implement FM chip
export const FM_CHIP: Chip = {
	type: 'fm',
	name: 'FM',
	wasmUrl: 'fm.wasm',
	processorName: 'fm-processor',
	processorMap: () => {
		throw new Error('FM processor not implemented yet');
	}
};

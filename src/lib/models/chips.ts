import { AYProcessor, type ChipProcessor } from '../core/ay-processor';

export interface Chip {
	type: 'ay' | 'fm';
	wasmUrl: string;
	processorName: string;
	processorMap: () => ChipProcessor;
}

export const AY_CHIP: Chip = {
	type: 'ay',
	wasmUrl: 'ayumi.wasm',
	processorName: 'ayumi-processor',
	processorMap: () => new AYProcessor()
};

//TODO: implement FM chip
export const FM_CHIP: Chip = {
	type: 'fm',
	wasmUrl: 'fm.wasm',
	processorName: 'fm-processor',
	processorMap: () => {
		throw new Error('FM processor not implemented yet');
	}
};

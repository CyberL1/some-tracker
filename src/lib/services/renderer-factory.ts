import type { Chip } from '../models/chips';
import type { ChipRenderer } from './wav-export';

export class RendererFactory {
	async createRenderer(chip: Chip): Promise<ChipRenderer | null> {
		if (chip.type === 'ay') {
			const module = await import('./renderers/ay-renderer');
			return new module.AYChipRenderer();
		}
		if (chip.type === 'fm') {
			throw new Error('FM chip renderer not implemented yet');
		}
		return null;
	}
}


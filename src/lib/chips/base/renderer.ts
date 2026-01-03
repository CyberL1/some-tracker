import type { Project } from '../../models/project';

export interface ChipRenderer {
	render(
		project: Project,
		songIndex: number,
		onProgress?: (progress: number, message: string) => void
	): Promise<Float32Array[]>;
}


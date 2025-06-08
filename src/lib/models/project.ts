import { Song } from './song';

class Project {
	constructor(
		public name: string = '',
		public author: string = '',
		public songs: Song[] = [new Song()],
		public loopPointId: number = 0,
		public patternOrder: number[] = [0],
		public aymChipType: 'AY' | 'YM' = 'AY',
		public aymFrequency: number = 1773400,
		public intFrequency: number = 50
	) {}
}

export { Project };

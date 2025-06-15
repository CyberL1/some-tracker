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
		public intFrequency: number = 50,
		public ornaments: Ornament[] = []
	) {}
}

class Ornament {
	id: number;
	rows: number[];
	loop: number;
	name: string;

	constructor(id: number, rows: number[], loop: number, name: string = `Ornament ${id + 1}`) {
		this.id = id;
		this.rows = rows;
		this.loop = loop;
		this.name = name;
	}
}

export { Project, Ornament };

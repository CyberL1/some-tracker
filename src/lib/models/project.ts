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
		public tables: Table[] = Array.from({ length: 32 }, (_, i) => new Table(i, [], 0, `Table ${i + 1}`))
	) {}
}

class Table {
	id: number;
	rows: number[];
	loop: number;
	name: string;

	constructor(id: number, rows: number[], loop: number, name: string = `Table ${id + 1}`) {
		this.id = id;
		this.rows = rows;
		this.loop = loop;
		this.name = name;
	}
}

export { Project, Table };

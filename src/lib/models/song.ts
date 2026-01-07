import { PT3TuneTables } from './pt3/tuning-tables';

enum NoteName {
	None = 0,
	Off,
	C,
	CSharp,
	D,
	DSharp,
	E,
	F,
	FSharp,
	G,
	GSharp,
	A,
	ASharp,
	B
}

enum EffectType {
	Arpeggio = 0,
	SlideUp = 1,
	SlideDown = 2,
	Portamento = 'P'.charCodeAt(0),
	Vibrato = 4,
	Speed = 'S'.charCodeAt(0)
}

type ChannelLabel = 'A' | 'B' | 'C';

class Note {
	name: NoteName;
	octave: number;

	constructor(name: NoteName = NoteName.None, octave: number = 0) {
		this.name = name;
		this.octave = octave;
	}
}

class Instrument {
	id: number;
	rows: InstrumentRow[] = [];
	loop: number = 0;

	constructor(id: number, rows: InstrumentRow[], loop: number = 0) {
		this.id = id;
		this.rows = rows;
		this.loop = loop;
	}
}

class InstrumentRow {
	[key: string]: unknown;

	constructor(data: Record<string, unknown> = {}) {
		Object.assign(this, data);
	}
}

class Effect {
	effect: number;
	delay: number;
	parameter: number;

	constructor(effect: number, delay: number = 0, parameter: number = 0) {
		this.effect = effect;
		this.delay = delay;
		this.parameter = parameter;
	}
}

class Row {
	note: Note;
	effects: (Effect | null)[];
	[key: string]: unknown;

	constructor(data: Partial<Row> = {}) {
		this.note = data.note || new Note();
		this.effects = data.effects || [null];
		this.instrument = data.instrument ?? 0;
		this.volume = data.volume ?? 0;
		this.table = data.table ?? 0;
		this.envelopeShape = data.envelopeShape ?? 0;
		Object.keys(data).forEach((key) => {
			if (
				key !== 'note' &&
				key !== 'effects' &&
				key !== 'instrument' &&
				key !== 'volume' &&
				key !== 'table' &&
				key !== 'envelopeShape'
			) {
				this[key] = data[key as keyof Row];
			}
		});
	}
}

class PatternRow {
	[key: string]: unknown;

	constructor(data: Record<string, unknown> = {}) {
		Object.assign(this, data);
	}
}

class Channel {
	rows: Row[];
	label: ChannelLabel;

	constructor(rowCount: number = 64, label: ChannelLabel) {
		this.rows = Array.from({ length: rowCount }, () => new Row());
		this.label = label;
	}
}

class Pattern {
	id: number;
	length: number;
	channels: [Channel, Channel, Channel];
	patternRows: PatternRow[];

	constructor(id: number, length: number = 64) {
		this.id = id;
		this.length = length;
		this.channels = [
			new Channel(length, 'A'),
			new Channel(length, 'B'),
			new Channel(length, 'C')
		];
		this.patternRows = Array.from({ length }, () => new PatternRow());
	}
}

class Song {
	public patterns: Pattern[];
	public tuningTable: number[];
	public initialSpeed: number;
	public instruments: Instrument[];
	public chipType?: 'ay' | 'fm' | 'sid';
	public chipVariant?: string;
	public chipFrequency?: number;
	public interruptFrequency: number;

	constructor() {
		this.initialSpeed = 3;
		this.patterns = [new Pattern(0)];
		this.tuningTable = PT3TuneTables[2];
		this.instruments = [];
		this.chipVariant = 'AY';
		this.interruptFrequency = 50;
	}

	addPattern(): Pattern {
		const newId = this.patterns.length;
		const pattern = new Pattern(newId);
		this.patterns.push(pattern);
		return pattern;
	}
}

export {
	Song,
	Pattern,
	Channel,
	Row,
	Note,
	Effect,
	NoteName,
	EffectType,
	Instrument,
	InstrumentRow
};

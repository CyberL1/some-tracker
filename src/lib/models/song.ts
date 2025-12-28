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
	Vibrato = 1,
	Portamento = 2,
	Glissando = 3,
	EnvelopeSlide = 4,
	Speed = 5
	// etc...
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
	tone: boolean = false;
	noise: boolean = false;
	envelope: boolean = false;
	toneAdd: number = 0;
	noiseAdd: number = 0;
	volume: number = 0;
	loop: boolean = false;

	constructor(
		tone: boolean,
		noise: boolean,
		envelope: boolean,
		toneAdd: number,
		noiseAdd: number,
		volume: number,
		loop: boolean
	) {
		this.tone = tone;
		this.noise = noise;
		this.envelope = envelope;
		this.toneAdd = toneAdd;
		this.noiseAdd = noiseAdd;
		this.volume = volume;
		this.loop = loop;
	}
}

class Effect {
	effect: EffectType;
	delay: number;
	parameter: number;

	constructor(effect: EffectType, delay: number = 0, parameter: number = 0) {
		this.effect = effect;
		this.delay = delay;
		this.parameter = parameter;
	}
}

class Row {
	note: Note;
	instrument: number;
	volume: number;
	table: number;
	envelopeShape: number;
	effects: (Effect | null)[];

	constructor() {
		this.note = new Note();
		this.instrument = 0;
		this.volume = 0;
		this.table = 0;
		this.envelopeShape = 0;
		this.effects = [null];
	}
}

class PatternRow {
	envelopeValue: number;
	envelopeEffect: Effect | null;
	noiseValue: number;

	constructor() {
		this.envelopeValue = 0;
		this.envelopeEffect = null;
		this.noiseValue = 0;
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

	constructor() {
		this.initialSpeed = 3;
		this.patterns = [new Pattern(0)];
		this.tuningTable = PT3TuneTables[2]; // Default to most common table from VT2 nowadays
		this.instruments = [];
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

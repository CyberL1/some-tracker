import { loadVT2File } from './vt-converter';
import { Project, Table } from '../../models/project';
import {
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
} from '../../models/song';

function reconstructProject(data: any): Project {
	const songs = data.songs?.map((songData: any) => reconstructSong(songData)) || [];
	const tables = data.tables?.map((tableData: any) => reconstructTable(tableData)) || [];

	return new Project(
		data.name || '',
		data.author || '',
		songs.length > 0 ? songs : [new Song()],
		data.loopPointId || 0,
		data.patternOrder || [0],
		tables.length > 0 ? tables : Array.from({ length: 32 }, (_, i) => new Table(i, [], 0, `Table ${i + 1}`))
	);
}

function reconstructTable(data: any): Table {
	return new Table(data.id ?? 0, data.rows || [], data.loop || 0, data.name || `Table ${(data.id ?? 0) + 1}`);
}

function reconstructSong(data: any): Song {
	const song = new Song();
	song.patterns = data.patterns?.map((patternData: any) => reconstructPattern(patternData)) || [new Pattern(0)];
	song.tuningTable = data.tuningTable || song.tuningTable;
	song.initialSpeed = data.initialSpeed ?? 3;
	song.instruments = data.instruments?.map((instData: any) => reconstructInstrument(instData)) || [];
	song.chipType = data.chipType;
	song.chipVariant = data.chipVariant;
	song.chipFrequency = data.chipFrequency;
	song.interruptFrequency = data.interruptFrequency ?? 50;
	return song;
}

function reconstructPattern(data: any): Pattern {
	const length = data.length ?? 64;
	const pattern = new Pattern(data.id ?? 0, length);
	if (data.channels) {
		pattern.channels = data.channels.map((channelData: any, index: number) =>
			reconstructChannel(channelData, ['A', 'B', 'C'][index] as 'A' | 'B' | 'C')
		) as [Channel, Channel, Channel];
	}
	if (data.patternRows && data.patternRows.length > 0) {
		pattern.patternRows = data.patternRows.map((rowData: any) => reconstructPatternRow(rowData));
	}
	return pattern;
}

function reconstructChannel(data: any, label: 'A' | 'B' | 'C'): Channel {
	const channel = new Channel(data.rows?.length || 64, label);
	if (data.rows) {
		channel.rows = data.rows.map((rowData: any) => reconstructRow(rowData));
	}
	return channel;
}

function reconstructRow(data: any): Row {
	const row = new Row();
	row.note = data.note ? reconstructNote(data.note) : new Note();
	row.instrument = data.instrument ?? 0;
	row.volume = data.volume ?? 0;
	row.table = data.table ?? 0;
	row.envelopeShape = data.envelopeShape ?? 0;
	row.effects = data.effects?.map((effectData: any) =>
		effectData ? reconstructEffect(effectData) : null
	) || [null];
	return row;
}

function reconstructNote(data: any): Note {
	return new Note(data.name ?? NoteName.None, data.octave ?? 0);
}

function reconstructEffect(data: any): Effect {
	return new Effect(data.effect ?? 0, data.delay ?? 0, data.parameter ?? 0);
}

function reconstructPatternRow(data: any): any {
	return {
		envelopeValue: data.envelopeValue ?? 0,
		envelopeEffect: data.envelopeEffect ? reconstructEffect(data.envelopeEffect) : null,
		noiseValue: data.noiseValue ?? 0
	};
}

function reconstructInstrument(data: any): Instrument {
	const instrument = new Instrument(data.id ?? 0, [], data.loop ?? 0);
	if (data.rows) {
		instrument.rows = data.rows.map((rowData: any) => reconstructInstrumentRow(rowData));
	}
	return instrument;
}

function reconstructInstrumentRow(data: any): InstrumentRow {
	return new InstrumentRow({
		tone: data.tone ?? false,
		noise: data.noise ?? false,
		envelope: data.envelope ?? false,
		toneAdd: data.toneAdd ?? 0,
		noiseAdd: data.noiseAdd ?? 0,
		volume: data.volume ?? 0,
		loop: data.loop ?? false,
		amplitudeSliding: data.amplitudeSliding ?? false,
		amplitudeSlideUp: data.amplitudeSlideUp ?? false,
		toneAccumulation: data.toneAccumulation ?? false,
		noiseAccumulation: data.noiseAccumulation ?? false
	});
}

export class FileImportService {
	static async importVT2(): Promise<Project | null> {
		try {
			const input = document.createElement('input');
			input.type = 'file';
			input.accept = '.vt2';
			input.style.display = 'none';

			document.body.appendChild(input);

			return new Promise((resolve, reject) => {
				input.onchange = async (event) => {
					const target = event.target as HTMLInputElement;
					const file = target.files?.[0];

					document.body.removeChild(input);

					if (!file) {
						resolve(null);
						return;
					}

					try {
						const project = await loadVT2File(file);
						resolve(project);
					} catch (error) {
						console.error('Error loading VT2 file:', error);
						reject(error);
					}
				};

				input.oncancel = () => {
					document.body.removeChild(input);
					resolve(null);
				};

				input.click();
			});
		} catch (error) {
			console.error('Error importing VT2 file:', error);
			throw error;
		}
	}

	static async importJSON(): Promise<Project | null> {
		try {
			const input = document.createElement('input');
			input.type = 'file';
			input.accept = '.json';
			input.style.display = 'none';

			document.body.appendChild(input);

			return new Promise((resolve, reject) => {
				input.onchange = async (event) => {
					const target = event.target as HTMLInputElement;
					const file = target.files?.[0];

					document.body.removeChild(input);

					if (!file) {
						resolve(null);
						return;
					}

					try {
						const text = await file.text();
						const data = JSON.parse(text);
						const project = reconstructProject(data);
						resolve(project);
					} catch (error) {
						console.error('Error loading JSON file:', error);
						reject(error);
					}
				};

				input.oncancel = () => {
					document.body.removeChild(input);
					resolve(null);
				};

				input.click();
			});
		} catch (error) {
			console.error('Error importing JSON file:', error);
			throw error;
		}
	}

	static async handleMenuAction(action: string): Promise<Project | null> {
		switch (action) {
			case 'open':
			case 'import-json':
				return await this.importJSON();
			case 'import-vt2':
				return await this.importVT2();
			default:
				console.warn('Unknown import action:', action);
				return null;
		}
	}
}

export async function handleFileImport(action: string): Promise<Project | null> {
	return FileImportService.handleMenuAction(action);
}

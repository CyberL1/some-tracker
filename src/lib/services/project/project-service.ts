import { Project } from '../../models/project';
import { Song } from '../../models/song';
import type { Chip } from '../../chips/types';
import type { AudioService } from '../audio/audio-service';
import { applySchemaDefaults, type ChipSchema } from '../../chips/base/schema';

export class ProjectService {
	constructor(private audioService: AudioService) {}

	createNewProject(): Project {
		return new Project();
	}

	async resetProject(chip: Chip): Promise<Project> {
		this.audioService.clearChipProcessors();
		const newProject = this.createNewProject();
		const song = new Song(chip.schema);
		song.chipType = chip.type;
		applySchemaDefaults(song, chip.schema);
		this.applyChipDefaults(song, chip.schema);
		newProject.songs = [song];
		await this.audioService.addChipProcessor(chip);
		return newProject;
	}

	async createNewSong(chip: Chip): Promise<Song> {
		const newSong = new Song(chip.schema);
		newSong.chipType = chip.type;
		applySchemaDefaults(newSong, chip.schema);
		this.applyChipDefaults(newSong, chip.schema);
		await this.audioService.addChipProcessor(chip);
		return newSong;
	}

	private applyChipDefaults(song: Song, schema: ChipSchema): void {
		if (schema.resolveTuningTable) {
			const record = song as unknown as Record<string, unknown>;
			song.tuningTable = schema.resolveTuningTable(record);
		} else if (schema.defaultTuningTable) {
			song.tuningTable = schema.defaultTuningTable;
		}
		if (schema.defaultChipVariant !== undefined) {
			song.chipVariant = schema.defaultChipVariant;
		}
	}
}

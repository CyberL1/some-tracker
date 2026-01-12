import { Project } from '../../models/project';
import { Song } from '../../models/song';
import type { Chip } from '../../chips/types';
import type { AudioService } from '../audio/audio-service';
import { applySchemaDefaults } from '../../chips/base/schema';

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
		newProject.songs = [song];
		await this.audioService.addChipProcessor(chip);
		return newProject;
	}

	async createNewSong(chip: Chip): Promise<Song> {
		const newSong = new Song(chip.schema);
		newSong.chipType = chip.type;
		applySchemaDefaults(newSong, chip.schema);
		await this.audioService.addChipProcessor(chip);
		return newSong;
	}
}

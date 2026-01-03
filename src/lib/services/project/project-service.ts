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
		if (newProject.songs.length > 0) {
			const song = newProject.songs[0];
			song.chipType = chip.type;
			applySchemaDefaults(song, chip.schema);
		}
		await this.audioService.addChipProcessor(chip);
		return newProject;
	}

	async createNewSong(chip: Chip): Promise<Song> {
		const newSong = new Song();
		newSong.chipType = chip.type;
		applySchemaDefaults(newSong, chip.schema);
		await this.audioService.addChipProcessor(chip);
		return newSong;
	}
}

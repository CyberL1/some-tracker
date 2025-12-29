import { Project } from '../models/project';
import { Song } from '../models/song';
import type { Chip } from '../models/chips';
import type { AudioService } from './audio-service';

export class ProjectService {
	constructor(private audioService: AudioService) {}

	createNewProject(): Project {
		return new Project();
	}

	async resetProject(chip: Chip): Promise<Project> {
		this.audioService.clearChipProcessors();
		const newProject = this.createNewProject();
		await this.audioService.addChipProcessor(chip);
		return newProject;
	}

	async createNewSong(chip: Chip): Promise<Song> {
		const newSong = new Song();
		await this.audioService.addChipProcessor(chip);
		return newSong;
	}
}


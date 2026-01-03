import type { Project } from '../../models/project';
import { downloadFile, sanitizeFilename } from '../../utils/file-download';

export class FileExportService {
	static serializeProject(project: Project): string {
		return JSON.stringify(project, null, 2);
	}

	static async saveProject(project: Project): Promise<void> {
		const serialized = this.serializeProject(project);
		const blob = new Blob([serialized], { type: 'text/plain' });
		const filename = project.name || 'project';
		const sanitizedFilename = sanitizeFilename(filename);
		downloadFile(blob, `${sanitizedFilename}.json`);
	}

	static async saveProjectAs(project: Project): Promise<void> {
		await this.saveProject(project);
	}
}

export async function handleFileExport(action: string, project: Project): Promise<void> {
	switch (action) {
		case 'save':
			await FileExportService.saveProject(project);
			break;
		case 'save-as':
			await FileExportService.saveProjectAs(project);
			break;
		default:
			console.warn('Unknown export action:', action);
	}
}

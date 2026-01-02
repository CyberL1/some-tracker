import type { Project } from '../models/project';

export class FileExportService {
	static serializeProject(project: Project): string {
		return JSON.stringify(project, null, 2);
	}

	static downloadProject(project: Project, filename: string = 'project.json'): void {
		const serialized = this.serializeProject(project);
		const blob = new Blob([serialized], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = filename;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	}

	static async saveProject(project: Project): Promise<void> {
		const filename = project.name || 'project';
		const sanitizedFilename = filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
		this.downloadProject(project, `${sanitizedFilename}.json`);
	}

	static async saveProjectAs(project: Project): Promise<void> {
		const filename = project.name || 'project';
		const sanitizedFilename = filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
		this.downloadProject(project, `${sanitizedFilename}.json`);
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

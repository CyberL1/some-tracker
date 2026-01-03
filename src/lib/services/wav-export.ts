import type { Project } from '../models/project';
import type { Chip } from '../models/chips';
import { getChipByType } from './chip-registry';
import { RendererFactory } from './renderer-factory';
import { mixAudioChannels } from '../utils/audio-mixer';
import { downloadFile, sanitizeFilename } from '../utils/file-download';

const SAMPLE_RATE = 44100;
const RENDERING_PROGRESS_MAX = 90;
const ENCODING_PROGRESS = 92;
const DOWNLOAD_PROGRESS = 99;
const COMPLETE_PROGRESS = 100;

function writeString(view: DataView, offset: number, string: string) {
	for (let i = 0; i < string.length; i++) {
		view.setUint8(offset + i, string.charCodeAt(i));
	}
}

function encodeWAV(samples: Float32Array[], sampleRate: number): ArrayBuffer {
	const numChannels = samples.length;
	const length = samples[0].length;
	const bytesPerSample = 2;
	const blockAlign = numChannels * bytesPerSample;
	const byteRate = sampleRate * blockAlign;
	const dataSize = length * blockAlign;
	const buffer = new ArrayBuffer(44 + dataSize);
	const view = new DataView(buffer);

	writeString(view, 0, 'RIFF');
	view.setUint32(4, 36 + dataSize, true);
	writeString(view, 8, 'WAVE');
	writeString(view, 12, 'fmt ');
	view.setUint32(16, 16, true);
	view.setUint16(20, 1, true);
	view.setUint16(22, numChannels, true);
	view.setUint32(24, sampleRate, true);
	view.setUint32(28, byteRate, true);
	view.setUint16(32, blockAlign, true);
	view.setUint16(34, 16, true);
	writeString(view, 36, 'data');
	view.setUint32(40, dataSize, true);

	const output = new Int16Array(buffer, 44);
	for (let i = 0; i < length; i++) {
		for (let channel = 0; channel < numChannels; channel++) {
			const offset = i * numChannels + channel;
			const s = Math.max(-1, Math.min(1, samples[channel][i]));
			output[offset] = s < 0 ? s * 0x8000 : s * 0x7fff;
		}
	}

	return buffer;
}

export interface ChipRenderer {
	render(
		project: Project,
		songIndex: number,
		onProgress?: (progress: number, message: string) => void
	): Promise<Float32Array[]>;
}

class WavExportService {
	private rendererFactory = new RendererFactory();

	private getChipForSong(project: Project, songIndex: number): Chip {
		const song = project.songs[songIndex];

		if (song?.chipType) {
			const chip = getChipByType(song.chipType);
			if (chip) {
				return chip;
			}
		}

		const defaultChip = getChipByType('ay');
		if (!defaultChip) {
			throw new Error('No chip available');
		}
		return defaultChip;
	}

	private calculateSongProgressRange(
		songIndex: number,
		totalSongs: number
	): { start: number; end: number } {
		return {
			start: (songIndex / totalSongs) * RENDERING_PROGRESS_MAX,
			end: ((songIndex + 1) / totalSongs) * RENDERING_PROGRESS_MAX
		};
	}

	private async renderSong(
		project: Project,
		songIndex: number,
		totalSongs: number,
		onProgress?: (progress: number, message: string) => void
	): Promise<Float32Array[]> {
		const song = project.songs[songIndex];
		if (!song || song.patterns.length === 0) {
			const progress = (songIndex / totalSongs) * RENDERING_PROGRESS_MAX;
			onProgress?.(progress, `Skipping empty song ${songIndex + 1}/${totalSongs}...`);
			throw new Error('Song is empty');
		}

		const { start: progressStart, end: progressEnd } = this.calculateSongProgressRange(
			songIndex,
			totalSongs
		);

		onProgress?.(
			progressStart,
			`Rendering song ${songIndex + 1}/${totalSongs} (${song.chipType || 'unknown chip'})...`
		);

		const chip = this.getChipForSong(project, songIndex);
		onProgress?.(
			progressStart + 2,
			`Loading ${chip.name} renderer for song ${songIndex + 1}...`
		);

		const renderer = await this.rendererFactory.createRenderer(chip);
		if (!renderer) {
			throw new Error(`No renderer available for chip: ${chip.name} (song ${songIndex + 1})`);
		}

		onProgress?.(progressStart + 5, `Rendering song ${songIndex + 1}/${totalSongs}...`);

		return renderer.render(project, songIndex, (progress, message) => {
			const mappedProgress =
				progressStart + 5 + (progress / 100) * (progressEnd - progressStart - 5);
			onProgress?.(mappedProgress, `Song ${songIndex + 1}/${totalSongs}: ${message}`);
		});
	}

	async export(
		project: Project,
		onProgress?: (progress: number, message: string) => void
	): Promise<void> {
		onProgress?.(0, 'Preparing export...');

		if (project.songs.length === 0) {
			throw new Error('Project has no songs');
		}

		const totalSongs = project.songs.length;
		const renderedSongs: Float32Array[][] = [];

		for (let i = 0; i < project.songs.length; i++) {
			try {
				const channels = await this.renderSong(project, i, totalSongs, onProgress);
				renderedSongs.push(channels);
			} catch (error) {
				if (error instanceof Error && error.message === 'Song is empty') {
					continue;
				}
				throw error;
			}
		}

		if (renderedSongs.length === 0) {
			throw new Error('No audio data to export');
		}

		onProgress?.(RENDERING_PROGRESS_MAX, 'Mixing songs...');
		const [mixedLeft, mixedRight] = mixAudioChannels(renderedSongs);

		onProgress?.(ENCODING_PROGRESS, 'Encoding WAV file...');
		const wavBuffer = encodeWAV([mixedLeft, mixedRight], SAMPLE_RATE);
		const blob = new Blob([wavBuffer], { type: 'audio/wav' });

		onProgress?.(DOWNLOAD_PROGRESS, 'Downloading...');
		const filename = project.name || 'export';
		const sanitizedFilename = sanitizeFilename(filename);
		downloadFile(blob, `${sanitizedFilename}.wav`);

		onProgress?.(COMPLETE_PROGRESS, 'Complete!');
	}
}

const wavExportService = new WavExportService();

export async function exportToWAV(
	project: Project,
	songIndex: number = 0,
	onProgress?: (progress: number, message: string) => void
): Promise<void> {
	try {
		await wavExportService.export(project, onProgress);
	} catch (error) {
		console.error('Failed to export WAV:', error);
		onProgress?.(0, `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
		throw error;
	}
}

import type { ChipProcessor } from '../core/chip-processor';
import type { Chip } from '../models/chips';
import type { Ornament } from '../models/project';

export class AudioService {
	private _audioContext: AudioContext | null = new AudioContext();
	private _isPlaying = false;

	//for example 1x FM chip processor, 2x AY chip processors for TSFM track
	//they will all be mixed together in single audio context
	chipProcessors: ChipProcessor[] = [];

	constructor() {
		// Web browsers like to disable audio contexts when they first exist to prevent auto-play video/audio ads.
		// We explicitly re-enable it whenever the user does something on the page.
		if (this._audioContext) {
			document.addEventListener('keydown', () => this._audioContext?.resume(), {
				once: true
			});
			document.addEventListener('mousedown', () => this._audioContext?.resume(), {
				once: true
			});
			document.addEventListener('touchstart', () => this._audioContext?.resume(), {
				once: true
			});
			document.addEventListener('touchend', () => this._audioContext?.resume(), {
				once: true
			});
		}
	}

	async addChipProcessor(chip: Chip) {
		if (!this._audioContext) {
			throw new Error('Audio context not initialized');
		}

		const processor = this.createChipProcessor(chip);
		this.chipProcessors.push(processor);

		const response = await fetch(import.meta.env.BASE_URL + chip.wasmUrl);
		const wasmBuffer = await response.arrayBuffer();

		await this._audioContext.audioWorklet.addModule(
			import.meta.env.BASE_URL + chip.processorName + '.js'
		);

		const audioNode = this.createAudioNode();

		processor.initialize(wasmBuffer, audioNode);
	}

	play() {
		if (this._isPlaying) return;

		this._isPlaying = true;

		this.chipProcessors.forEach((chipProcessor) => {
			chipProcessor.play();
		});
	}

	playFromRow(row: number) {
		if (this._isPlaying) return;

		this._isPlaying = true;

		this.chipProcessors.forEach((chipProcessor) => {
			chipProcessor.playFromRow(row);
		});
	}

	stop() {
		if (!this._isPlaying) return;

		this._isPlaying = false;

		this.chipProcessors.forEach((chipProcessor) => {
			chipProcessor.stop();
		});
	}

	updateOrder(order: number[]) {
		this.chipProcessors.forEach((chipProcessor) => {
			chipProcessor.updateOrder(order);
		});
	}

	updateAyFrequency(aymFrequency: number) {
		this.chipProcessors.forEach((chipProcessor) => {
			chipProcessor.sendUpdateAyFrequency(aymFrequency);
		});
	}

	updateIntFrequency(intFrequency: number) {
		this.chipProcessors.forEach((chipProcessor) => {
			chipProcessor.sendUpdateIntFrequency(intFrequency);
		});
	}

	updateOrnaments(ornaments: Ornament[]) {
		this.chipProcessors.forEach((chipProcessor) => {
			chipProcessor.sendInitOrnaments(ornaments);
		});
	}

	async dispose() {
		if (this._isPlaying) {
			this.stop();
		}

		if (this._audioContext) {
			await this._audioContext.close();
			this._audioContext = null;
		}

		this.chipProcessors = [];
	}

	get playing() {
		return this._isPlaying;
	}

	private createAudioNode() {
		if (!this._audioContext) {
			throw new Error('Audio context not initialized');
		}

		const audioNode = new AudioWorkletNode(
			this._audioContext,
			this.chipProcessors[0].chip.processorName,
			{
				outputChannelCount: [2]
			}
		);

		audioNode.connect(this._audioContext.destination);

		return audioNode;
	}

	private createChipProcessor(chip: Chip): ChipProcessor {
		const createProcessor = chip.processorMap;
		if (!createProcessor) {
			throw new Error(`Unsupported chip: ${chip}`);
		}

		return createProcessor();
	}
}

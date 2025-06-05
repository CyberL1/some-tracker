import type { ChipProcessor } from '../core/chip-processor';
import type { Chip } from '../models/chips';

export class AudioService {
	private _audioContext: AudioContext | null = new AudioContext();
	private _isPlaying = false;

	//for example 1x FM chip processor, 2x AY chip processors for TSFM track
	//they will all be mixed together in single audio context
	chipProcessors: ChipProcessor[] = [];

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

		if (this._audioContext?.state === 'suspended') {
			return this._audioContext.resume();
		}
	}

	stop() {
		if (!this._isPlaying) return;

		this._isPlaying = false;

		this.chipProcessors.forEach((chipProcessor) => {
			chipProcessor.stop();
		});

		return this._audioContext?.suspend();
	}

	updateOrder(order: number[]) {
		this.chipProcessors.forEach((chipProcessor) => {
			chipProcessor.updateOrder(order);
		});
	}

	async dispose() {
		if (this._isPlaying) {
			await this.stop();
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

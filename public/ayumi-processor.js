import {
	AYUMI_STRUCT_SIZE,
	AYUMI_STRUCT_LEFT_OFFSET,
	AYUMI_STRUCT_RIGHT_OFFSET,
	PAN_SETTINGS,
	DEFAULT_AYM_FREQUENCY
} from './ayumi-constants.js';
import AyumiState from './ayumi-state.js';
import AyumiPatternProcessor from './ayumi-pattern-processor.js';

class AyumiProcessor extends AudioWorkletProcessor {
	constructor() {
		super();
		this.initialized = false;
		this.state = new AyumiState();
		this.patternProcessor = new AyumiPatternProcessor(this.state);
		this.port.onmessage = this.handleMessage.bind(this);
		this.aymFrequency = 1773400;
		this.paused = false;
		this.fadeInSamples = 0;
		this.fadeInDuration = 0.01; // 10ms fade-in
	}

	async handleMessage(event) {
		const { type, ...data } = event.data;

		switch (type) {
			case 'init':
				await this.handleInit(data);
				break;
			case 'play':
				this.handlePlay(data);
				break;
			case 'play_from_row':
				this.handlePlayFromRow(data);
				break;
			case 'stop':
				this.handleStop();
				break;
			case 'init_pattern':
				this.handleInitPattern(data);
				break;
			case 'update_order':
				this.handleUpdateOrder(data);
				break;
			case 'set_pattern_data':
				this.handleSetPatternData(data);
				break;
			case 'init_tuning_table':
				this.handleInitTuningTable(data);
				break;
			case 'init_speed':
				this.handleInitSpeed(data);
				break;
			case 'init_tables':
				this.handleInitTables(data);
				break;
			case 'update_ay_frequency':
				this.handleUpdateAyFrequency(data);
				break;
			case 'update_int_frequency':
				this.handleUpdateIntFrequency(data);
				break;
		}
	}

	async handleInit({ wasmBuffer }) {
		if (!wasmBuffer) return;

		try {
			const result = await WebAssembly.instantiate(wasmBuffer, {
				env: { emscripten_notify_memory_growth: () => {} }
			});

			const wasmModule = result.instance.exports;
			const ayumiPtr = wasmModule.malloc(AYUMI_STRUCT_SIZE);

			this.aymFrequency = this.state.aymFrequency ?? DEFAULT_AYM_FREQUENCY;
			wasmModule.ayumi_configure(ayumiPtr, 0, this.aymFrequency, sampleRate);

			PAN_SETTINGS.forEach(({ channel, left, right }) => {
				wasmModule.ayumi_set_pan(ayumiPtr, channel, left, right);
			});

			this.state.setWasmModule(wasmModule, ayumiPtr, wasmBuffer);
			this.state.updateSamplesPerTick(sampleRate);
			this.initialized = true;
		} catch (error) {
			console.error('Failed to initialize Ayumi:', error);
		}
	}

	handleInitTuningTable(data) {
		this.state.setTuningTable(data.tuningTable);
	}

	handleInitSpeed(data) {
		this.state.setSpeed(data.speed);
	}

	handleInitTables(data) {
		this.state.setTables(data.tables);
	}

	handleInitPattern(data) {
		this.state.setPattern(data.pattern, data.patternOrderIndex);
	}

	handleUpdateOrder(data) {
		this.state.setPatternOrder(data.order);
	}

	handleSetPatternData(data) {
		this.state.setPattern(data.pattern);
	}

	handleUpdateAyFrequency(data) {
		this.state.setAymFrequency(data.aymFrequency);
		this.handleInit({ wasmBuffer: this.state.wasmBuffer });
	}

	handleUpdateIntFrequency(data) {
		this.state.setIntFrequency(data.intFrequency, sampleRate);
	}

	handlePlay({ startPatternOrderIndex, initialSpeed }) {
		if (!this.state.wasmModule || !this.initialized) {
			console.warn('Play aborted: wasmModule not initialized');
			return;
		}

		this.paused = false;
		this.fadeInSamples = Math.floor(sampleRate * this.fadeInDuration);
		for (let i = 0; i < 3; i++) {
			this.state.wasmModule.ayumi_set_mixer(this.state.ayumiPtr, i, 1, 1, 0);
		}

		this.state.reset();

		if (startPatternOrderIndex !== undefined) {
			this.state.currentPatternOrderIndex = startPatternOrderIndex;
		}
		if (initialSpeed !== undefined) {
			this.state.setSpeed(initialSpeed);
		}
	}

	handlePlayFromRow({ row }) {
		if (!this.state.wasmModule || !this.initialized) {
			console.warn('Play aborted: wasmModule not initialized');
			return;
		}

		this.paused = false;
		this.fadeInSamples = Math.floor(sampleRate * this.fadeInDuration);
		for (let i = 0; i < 3; i++) {
			this.state.wasmModule.ayumi_set_mixer(this.state.ayumiPtr, i, 1, 1, 0);
		}

		this.state.reset();
		this.state.currentRow = row;
	}

	handleStop() {
		this.paused = true;
		const { wasmModule, ayumiPtr } = this.state;
		for (let i = 0; i < 3; i++) {
			wasmModule.ayumi_set_mixer(ayumiPtr, i, 1, 1, 0);
			wasmModule.ayumi_set_volume(ayumiPtr, i, 0);
		}
		this.state.channelVolumes = [0, 0, 0];
		this.state.channelTables = [-1, -1, -1];
		this.state.tablePositions = [0, 0, 0];
		this.state.tableCounters = [0, 0, 0];
		this.state.channelBaseNotes = [0, 0, 0];
	}

	process(_inputs, outputs, _parameters) {
		if (!this.initialized || !this.state.wasmModule || !this.state.ayumiPtr) {
			console.error('Processor not initialized or missing dependencies');
			return true;
		}

		if (outputs.length > 0 && outputs[0].length > 1) {
			const output = outputs[0];
			const leftChannel = output[0];
			const rightChannel = output[1];
			const numSamples = leftChannel.length;

			// Fill output with silence if paused
			if (this.paused) {
				for (let i = 0; i < numSamples; i++) {
					leftChannel[i] = 0;
					rightChannel[i] = 0;
				}
				return true;
			}

			for (let i = 0; i < numSamples; i++) {
				if (
					this.state.currentPattern &&
					this.state.currentPattern.length > 0 &&
					this.state.sampleCounter >= this.state.samplesPerTick
				) {
					if (this.state.currentTick === 0) {
						this.patternProcessor.parsePatternRow(
							this.state.currentPattern,
							this.state.currentRow
						);

						this.port.postMessage({
							type: 'position_update',
							currentRow: this.state.currentRow,
							currentTick: this.state.currentTick,
							currentPatternOrderIndex: this.state.currentPatternOrderIndex
						});
					}

					this.patternProcessor.processTables();

					const needsPatternChange = this.state.advancePosition();
					if (needsPatternChange) {
						this.port.postMessage({
							type: 'request_pattern',
							patternOrderIndex: this.state.currentPatternOrderIndex
						});
					}

					this.state.sampleCounter = 0;
				}

				const { wasmModule, ayumiPtr } = this.state;
				wasmModule.ayumi_process(ayumiPtr);
				wasmModule.ayumi_remove_dc(ayumiPtr);

				const leftOffset = ayumiPtr + AYUMI_STRUCT_LEFT_OFFSET;
				const rightOffset = ayumiPtr + AYUMI_STRUCT_RIGHT_OFFSET;

				const leftValue = new Float64Array(wasmModule.memory.buffer, leftOffset, 1)[0];
				const rightValue = new Float64Array(wasmModule.memory.buffer, rightOffset, 1)[0];

				// Apply fade-in if needed
				if (this.fadeInSamples > 0) {
					const fadeInFactor =
						1 - this.fadeInSamples / (sampleRate * this.fadeInDuration);
					leftChannel[i] = leftValue * fadeInFactor;
					rightChannel[i] = rightValue * fadeInFactor;
					this.fadeInSamples--;
				} else {
					leftChannel[i] = leftValue;
					rightChannel[i] = rightValue;
				}

				this.state.sampleCounter++;
			}
		} else {
			console.error('Invalid output configuration');
		}
		return true;
	}
}

registerProcessor('ayumi-processor', AyumiProcessor);

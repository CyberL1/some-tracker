import {
	AYUMI_STRUCT_SIZE,
	AYUMI_STRUCT_LEFT_OFFSET,
	AYUMI_STRUCT_RIGHT_OFFSET,
	PAN_SETTINGS,
	DEFAULT_AYM_FREQUENCY
} from './ayumi-constants.js';
import AyumiState from './ayumi-state.js';
import TrackerPatternProcessor from './tracker-pattern-processor.js';
import AYAudioDriver from './ay-audio-driver.js';

class AyumiProcessor extends AudioWorkletProcessor {
	constructor() {
		super();
		this.initialized = false;
		this.state = new AyumiState();
		this.audioDriver = null;
		this.patternProcessor = null;
		this.port.onmessage = this.handleMessage.bind(this);
		this.aymFrequency = 1773400;
		this.paused = false;
		this.fadeInSamples = 0;
		this.fadeInDuration = 0.01;
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
			case 'init_instruments':
				this.handleInitInstruments(data);
				break;
			case 'update_ay_frequency':
				this.handleUpdateAyFrequency(data);
				break;
			case 'update_int_frequency':
				this.handleUpdateIntFrequency(data);
				break;
		case 'set_channel_mute':
			this.handleSetChannelMute(data);
			break;
		case 'change_pattern_during_playback':
			this.handleChangePatternDuringPlayback(data);
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
			this.audioDriver = new AYAudioDriver(wasmModule, ayumiPtr);
			this.patternProcessor = new TrackerPatternProcessor(
				this.state,
				this.audioDriver,
				this.port
			);
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

	handleInitInstruments(data) {
		this.state.setInstruments(data.instruments);
	}

	handleInitPattern(data) {
		if (
			data.patternOrderIndex !== undefined &&
			this.state.currentPatternOrderIndex !== data.patternOrderIndex
		) {
			this.state.currentPattern = null;
		}
		this.state.setPattern(data.pattern, data.patternOrderIndex);
	}

	handleUpdateOrder(data) {
		this.state.setPatternOrder(data.order);
	}

	handleSetPatternData(data) {
		this.state.setPattern(data.pattern, data.patternOrderIndex);
	}

	handleUpdateAyFrequency(data) {
		this.state.setAymFrequency(data.aymFrequency);
		this.handleInit({ wasmBuffer: this.state.wasmBuffer });
	}

	handleUpdateIntFrequency(data) {
		this.state.setIntFrequency(data.intFrequency, sampleRate);
	}

	handleSetChannelMute({ channelIndex, muted }) {
		if (channelIndex >= 0 && channelIndex < 3) {
			this.state.channelMuted[channelIndex] = muted;
			if (this.state.wasmModule && this.state.ayumiPtr) {
				if (muted) {
					this.state.wasmModule.ayumi_set_volume(this.state.ayumiPtr, channelIndex, 0);
					this.state.wasmModule.ayumi_set_mixer(
						this.state.ayumiPtr,
						channelIndex,
						1,
						1,
						0
					);
					this.state.channelEnvelopeEnabled[channelIndex] = false;
				}
			}
		}
	}

	handleChangePatternDuringPlayback({ row, patternOrderIndex, pattern, speed }) {
		if (!this.state.wasmModule || !this.initialized || this.paused) {
			return;
		}

		if (patternOrderIndex !== undefined) {
			const patternOrderChanged = this.state.currentPatternOrderIndex !== patternOrderIndex;
			this.state.currentPatternOrderIndex = patternOrderIndex;

			if (pattern) {
				this.state.setPattern(pattern, patternOrderIndex);
			} else if (patternOrderChanged && !this.state.currentPattern) {
				this.port.postMessage({
					type: 'request_pattern',
					patternOrderIndex: patternOrderIndex
				});
			}
		} else if (pattern) {
			this.state.setPattern(pattern, this.state.currentPatternOrderIndex);
		}

		if (row !== undefined) {
			this.state.currentRow = row;
			this.state.currentTick = 0;
			this.state.sampleCounter = this.state.samplesPerTick;
		}

		if (speed !== undefined && speed !== null && speed > 0) {
			this.state.setSpeed(speed);
		}
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
		if (!this.audioDriver || !this.patternProcessor) {
			this.audioDriver = new AYAudioDriver(this.state.wasmModule, this.state.ayumiPtr);
			this.patternProcessor = new TrackerPatternProcessor(
				this.state,
				this.audioDriver,
				this.port
			);
		}

		this.enforceMuteState();

		if (startPatternOrderIndex !== undefined) {
			this.state.currentPatternOrderIndex = startPatternOrderIndex;
		}
		if (initialSpeed !== undefined) {
			this.state.setSpeed(initialSpeed);
		}
	}

	handlePlayFromRow({ row, patternOrderIndex, speed }) {
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
		if (!this.audioDriver || !this.patternProcessor) {
			this.audioDriver = new AYAudioDriver(this.state.wasmModule, this.state.ayumiPtr);
			this.patternProcessor = new TrackerPatternProcessor(
				this.state,
				this.audioDriver,
				this.port
			);
		}

		this.enforceMuteState();

		if (patternOrderIndex !== undefined) {
			if (this.state.currentPatternOrderIndex !== patternOrderIndex) {
				this.state.currentPattern = null;
			}
			this.state.currentPatternOrderIndex = patternOrderIndex;
			this.port.postMessage({
				type: 'request_pattern',
				patternOrderIndex: patternOrderIndex
			});
		}
		this.state.currentRow = row;
		if (speed !== undefined && speed !== null && speed > 0) {
			this.state.setSpeed(speed);
		}
	}

	enforceMuteState() {
		for (let ch = 0; ch < 3; ch++) {
			if (this.state.channelMuted[ch]) {
				this.state.wasmModule.ayumi_set_volume(this.state.ayumiPtr, ch, 0);
				this.state.wasmModule.ayumi_set_mixer(this.state.ayumiPtr, ch, 1, 1, 0);
				this.state.channelEnvelopeEnabled[ch] = false;
			}
		}
	}

	handleStop() {
		this.paused = true;
		const { wasmModule, ayumiPtr } = this.state;
		for (let i = 0; i < 3; i++) {
			wasmModule.ayumi_set_mixer(ayumiPtr, i, 1, 1, 0);
			wasmModule.ayumi_set_volume(ayumiPtr, i, 0);
		}
		this.state.reset();
		this.state.currentPattern = null;
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

					this.enforceMuteState();

					this.patternProcessor.processTables();
					this.patternProcessor.processSlides();
					this.audioDriver.processInstruments(this.state);

					this.enforceMuteState();

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

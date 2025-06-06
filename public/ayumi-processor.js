import {
	AYUMI_STRUCT_SIZE,
	AYUMI_STRUCT_LEFT_OFFSET,
	AYUMI_STRUCT_RIGHT_OFFSET,
	PAN_SETTINGS
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
	}

	async handleMessage(event) {
		const { type, ...data } = event.data;

		switch (type) {
			case 'init':
				console.log('Initializing Ayumi processor');
				await this.handleInit(data);
				break;
			case 'play':
				console.log('Starting playback');
				this.handlePlay(data);
				break;
			case 'stop':
				console.log('Stopping playback');
				this.handleStop();
				break;
			case 'init_pattern':
				console.log('Initializing pattern');
				this.handleInitPattern(data);
				break;
			case 'update_order':
				console.log('Updating pattern order');
				this.handleUpdateOrder(data);
				break;
			case 'set_pattern_data':
				console.log('Setting pattern data');
				this.handleSetPatternData(data);
				break;
			case 'init_tuning_table':
				console.log('Initializing tuning table');
				this.handleInitTuningTable(data);
				break;
			case 'init_speed':
				console.log('Initializing speed');
				this.handleInitSpeed(data);
				break;
			case 'init_ornaments':
				console.log('Initializing ornaments');
				this.handleInitOrnaments(data);
				break;
		}
	}

	async handleInit({ wasmBuffer }) {
		if (!wasmBuffer || this.state.wasmModule) return;

		try {
			const result = await WebAssembly.instantiate(wasmBuffer, {
				env: { emscripten_notify_memory_growth: () => {} }
			});

			const wasmModule = result.instance.exports;
			const ayumiPtr = wasmModule.malloc(AYUMI_STRUCT_SIZE);

			wasmModule.ayumi_configure(ayumiPtr, 0, 1773400, sampleRate);

			PAN_SETTINGS.forEach(({ channel, left, right }) => {
				wasmModule.ayumi_set_pan(ayumiPtr, channel, left, right);
			});

			this.state.setWasmModule(wasmModule, ayumiPtr);
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

	handleInitOrnaments(data) {
		this.state.setOrnaments(data.ornaments);
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

	handlePlay({ startPatternOrderIndex, initialSpeed }) {
		if (!this.state.wasmModule || !this.initialized) return;

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

	handleStop() {
		const { wasmModule, ayumiPtr } = this.state;
		for (let i = 0; i < 3; i++) {
			wasmModule.ayumi_set_mixer(ayumiPtr, i, 1, 1, 0);
			wasmModule.ayumi_set_volume(ayumiPtr, i, 0);
		}
		this.state.reset();
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

					this.patternProcessor.processOrnaments();

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

				leftChannel[i] = leftValue;
				rightChannel[i] = rightValue;

				this.state.sampleCounter++;
			}
		} else {
			console.log('Invalid output configuration');
		}
		return true;
	}
}

registerProcessor('ayumi-processor', AyumiProcessor);

import { DEFAULT_AYM_FREQUENCY } from './ayumi-constants.js';
import TrackerState from './tracker-state.js';

class AyumiState extends TrackerState {
	constructor() {
		super(3);
		this.wasmModule = null;
		this.ayumiPtr = null;
		this.aymFrequency = DEFAULT_AYM_FREQUENCY;
		this.wasmBuffer = null;

		this.instruments = [];
		this.channelInstruments = Array(3).fill(0);
		this.instrumentPositions = Array(3).fill(0);
		this.channelInstrumentVolumes = Array(3).fill(0);
		this.channelToneAccumulator = Array(3).fill(0);
		this.channelNoiseAccumulator = Array(3).fill(0);
		this.channelEnvelopeAccumulator = Array(3).fill(0);
		this.channelAmplitudeSliding = Array(3).fill(0);
		this.channelEnvelopeEnabled = Array(3).fill(false);
		this.channelMuted = Array(3).fill(false);
	}

	setWasmModule(module, ptr, wasmBuffer) {
		this.wasmModule = module;
		this.ayumiPtr = ptr;
		this.wasmBuffer = wasmBuffer;
	}

	setAymFrequency(frequency) {
		this.aymFrequency = frequency;
	}

	setInstruments(instruments) {
		this.instruments = instruments;
	}

	reset() {
		super.reset();
		this.channelInstruments.fill(0);
		this.instrumentPositions.fill(0);
		this.channelInstrumentVolumes.fill(0);
		this.channelToneAccumulator.fill(0);
		this.channelNoiseAccumulator.fill(0);
		this.channelEnvelopeAccumulator.fill(0);
		this.channelAmplitudeSliding.fill(0);
		this.channelEnvelopeEnabled.fill(false);
	}
}

export default AyumiState;

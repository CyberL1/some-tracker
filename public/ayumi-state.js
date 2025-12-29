import { DEFAULT_AYM_FREQUENCY } from './ayumi-constants.js';
import TrackerState from './tracker-state.js';

class AyumiState extends TrackerState {
	constructor() {
		super(3);
		this.wasmModule = null;
		this.ayumiPtr = null;
		this.aymFrequency = DEFAULT_AYM_FREQUENCY;
		this.wasmBuffer = null;
	}

	setWasmModule(module, ptr, wasmBuffer) {
		this.wasmModule = module;
		this.ayumiPtr = ptr;
		this.wasmBuffer = wasmBuffer;
	}

	setAymFrequency(frequency) {
		this.aymFrequency = frequency;
	}
}

export default AyumiState;

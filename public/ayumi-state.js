import { DEFAULT_SONG_HZ, DEFAULT_SPEED, DEFAULT_CHANNEL_VOLUMES } from './ayumi-constants.js';

class AyumiState {
	constructor() {
		this.wasmModule = null;
		this.ayumiPtr = null;
		this.currentPattern = null;
		this.currentTuningTable = [];

		this.patternOrder = [];
		this.currentPatternOrderIndex = 0;

		this.songHz = DEFAULT_SONG_HZ;
		this.samplesPerTick = 0;
		this.sampleCounter = 0;
		this.currentRow = 0;
		this.currentTick = 0;
		this.currentSpeed = DEFAULT_SPEED;

		this.channelVolumes = [...DEFAULT_CHANNEL_VOLUMES];

		this.ornaments = [];
		this.channelOrnaments = [null, null, null];
		this.ornamentPositions = [0, 0, 0];
		this.ornamentCounters = [0, 0, 0];
		this.channelBaseNotes = [0, 0, 0];
	}

	reset() {
		this.sampleCounter = 0;
		this.currentRow = 0;
		this.currentTick = 0;
		this.channelVolumes = [0, 0, 0];
		this.channelOrnaments = [null, null, null];
		this.ornamentPositions = [0, 0, 0];
		this.ornamentCounters = [0, 0, 0];
		this.channelBaseNotes = [0, 0, 0];
	}

	updateSamplesPerTick(sampleRate) {
		this.samplesPerTick = Math.floor(sampleRate / this.songHz);
	}

	setWasmModule(module, ptr) {
		this.wasmModule = module;
		this.ayumiPtr = ptr;
	}

	setPattern(pattern, orderIndex) {
		this.currentPattern = pattern;
		if (orderIndex !== undefined) {
			this.currentPatternOrderIndex = orderIndex;
		}
	}

	setTuningTable(table) {
		this.currentTuningTable = table;
	}

	setSpeed(speed) {
		this.currentSpeed = speed;
	}

	setPatternOrder(order) {
		this.patternOrder = order;
	}

	setOrnaments(ornaments) {
		this.ornaments = ornaments;
	}

	advancePosition() {
		this.currentTick++;
		if (this.currentTick >= this.currentSpeed) {
			this.currentTick = 0;
			this.currentRow++;
			if (this.currentRow >= this.currentPattern.length) {
				this.currentRow = 0;
				this.currentPatternOrderIndex++;
				if (this.currentPatternOrderIndex >= this.patternOrder.length) {
					this.currentPatternOrderIndex = 0;
				}
				return true; // Pattern change needed
			}
		}
		return false;
	}
}

export default AyumiState;

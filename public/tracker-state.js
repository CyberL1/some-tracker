const DEFAULT_SONG_HZ = 50;
const DEFAULT_SPEED = 3;
const DEFAULT_CHANNEL_VOLUMES = [0, 0, 0];

class TrackerState {
	constructor(channelCount = 3) {
		this.currentPattern = null;
		this.currentTuningTable = [];

		this.patternOrder = [];
		this.currentPatternOrderIndex = 0;

		this.intFrequency = DEFAULT_SONG_HZ;
		this.samplesPerTick = 0;
		this.sampleCounter = 0;
		this.currentRow = 0;
		this.currentTick = 0;
		this.currentSpeed = DEFAULT_SPEED;

		this.channelPatternVolumes = Array(channelCount).fill(0);

		this.tables = [];
		this.channelTables = Array(channelCount).fill(-1);
		this.tablePositions = Array(channelCount).fill(0);
		this.tableCounters = Array(channelCount).fill(0);
		this.channelBaseNotes = Array(channelCount).fill(0);
		this.channelCurrentNotes = Array(channelCount).fill(0);
		this.channelToneSliding = Array(channelCount).fill(0);
		this.channelSlideStep = Array(channelCount).fill(0);
	}

	reset() {
		this.sampleCounter = 0;
		this.currentRow = 0;
		this.currentTick = 0;
		this.channelPatternVolumes.fill(0);
		this.channelTables.fill(-1);
		this.tablePositions.fill(0);
		this.tableCounters.fill(0);
		this.channelBaseNotes.fill(0);
		this.channelCurrentNotes.fill(0);
		this.channelToneSliding.fill(0);
		this.channelSlideStep.fill(0);
	}

	setTuningTable(table) {
		this.currentTuningTable = table;
	}

	updateSamplesPerTick(sampleRate) {
		this.samplesPerTick = Math.floor(sampleRate / this.intFrequency);
	}

	setPattern(pattern, orderIndex) {
		this.currentPattern = pattern;
		if (orderIndex !== undefined) {
			this.currentPatternOrderIndex = orderIndex;
		}
	}

	setSpeed(speed) {
		this.currentSpeed = speed;
	}

	setPatternOrder(order) {
		this.patternOrder = order;
	}

	setTables(tables) {
		this.tables = tables;
	}

	setIntFrequency(frequency, sampleRate) {
		this.intFrequency = frequency;
		this.updateSamplesPerTick(sampleRate);
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
				return true;
			}
		}
		return false;
	}
}

export default TrackerState;

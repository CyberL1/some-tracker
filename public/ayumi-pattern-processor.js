class AyumiPatternProcessor {
	constructor(state) {
		this.state = state;
	}

	parsePatternRow(pattern, rowIndex) {
		if (!pattern || rowIndex >= pattern.length || rowIndex < 0) return;

		const patternRow = pattern.patternRows[rowIndex];
		if (!patternRow) return;

		const { wasmModule, ayumiPtr, currentTuningTable, channelVolumes } = this.state;

		for (let channelIndex = 0; channelIndex < pattern.channels.length; channelIndex++) {
			const channel = pattern.channels[channelIndex];
			const row = channel.rows[rowIndex];

			this._processNote(channelIndex, row);
			this._processMixer(channelIndex);
			this._processVolume(channelIndex, row);

			if (patternRow.noiseValue > 0) {
				wasmModule.ayumi_set_noise(ayumiPtr, patternRow.noiseValue);
			}

			if (patternRow.envelopeValue > 0) {
				wasmModule.ayumi_set_envelope(ayumiPtr, patternRow.envelopeValue);
			}

			this._processEffects(row);
		}
	}

	_processNote(channelIndex, row) {
		const { wasmModule, ayumiPtr, currentTuningTable } = this.state;

		if (row.note.name === 1) {
			wasmModule.ayumi_set_tone(ayumiPtr, channelIndex, 0);
		} else if (row.note.name !== 0) {
			// NoteName enum starts at 2 for C, so subtract 2 to get correct semitone offset
			const noteValue = row.note.name - 2 + (row.note.octave - 1) * 12;

			if (noteValue >= 0 && noteValue < currentTuningTable.length) {
				const regValue = currentTuningTable[noteValue];
				wasmModule.ayumi_set_tone(ayumiPtr, channelIndex, regValue);
			}
		}
	}

	_processMixer(channelIndex) {
		const { wasmModule, ayumiPtr } = this.state;
		wasmModule.ayumi_set_mixer(ayumiPtr, channelIndex, 0, 1, 0);
	}

	_processVolume(channelIndex, row) {
		const { wasmModule, ayumiPtr, channelVolumes } = this.state;

		if (row.volume > 0) {
			wasmModule.ayumi_set_volume(ayumiPtr, channelIndex, row.volume);
			channelVolumes[channelIndex] = row.volume;
		} else {
			wasmModule.ayumi_set_volume(ayumiPtr, channelIndex, channelVolumes[channelIndex]);
		}
	}

	_processEffects(row) {
		// Check for speed effect (Effect type 5 - ehhh change it later..)
		if (row.effects[0] && row.effects[0].effect === 5) {
			const newSpeed = row.effects[0].parameter;
			if (newSpeed > 0) {
				this.state.setSpeed(newSpeed);
			}
		}
	}
}

export default AyumiPatternProcessor;

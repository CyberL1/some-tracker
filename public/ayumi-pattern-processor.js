class AyumiPatternProcessor {
	constructor(state) {
		this.state = state;
	}

	parsePatternRow(pattern, rowIndex) {
		if (!pattern || rowIndex >= pattern.length || rowIndex < 0) return;

		const patternRow = pattern.patternRows[rowIndex];
		if (!patternRow) return;

		const { wasmModule, ayumiPtr } = this.state;

		for (let channelIndex = 0; channelIndex < pattern.channels.length; channelIndex++) {
			const channel = pattern.channels[channelIndex];
			const row = channel.rows[rowIndex];

			this._processNote(channelIndex, row);
			this._processOrnament(channelIndex, row);
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

	processOrnaments() {
		const { wasmModule, ayumiPtr, currentTuningTable } = this.state;

		for (let channelIndex = 0; channelIndex < 3; channelIndex++) {
			const ornamentIndex = this.state.channelOrnaments[channelIndex];
			if (ornamentIndex < 0) continue;

			const ornament = this.state.ornaments[ornamentIndex];
			if (!ornament || !ornament.rows || ornament.rows.length === 0) continue;

			const baseNote = this.state.channelBaseNotes[channelIndex];
			if (baseNote === 0) continue;

			const ornamentOffset = ornament.rows[this.state.ornamentPositions[channelIndex]];
			const finalNote = baseNote + ornamentOffset;

			if (finalNote >= 0 && finalNote < currentTuningTable.length) {
				const regValue = currentTuningTable[finalNote];
				wasmModule.ayumi_set_tone(ayumiPtr, channelIndex, regValue);
			}

			this.state.ornamentCounters[channelIndex]++;
			if (this.state.ornamentCounters[channelIndex] >= 1) {
				this.state.ornamentCounters[channelIndex] = 0;
				this.state.ornamentPositions[channelIndex]++;

				if (this.state.ornamentPositions[channelIndex] >= ornament.rows.length) {
					if (ornament.loop > 0 && ornament.loop < ornament.rows.length) {
						this.state.ornamentPositions[channelIndex] = ornament.loop;
					} else {
						this.state.ornamentPositions[channelIndex] = 0;
					}
				}
			}
		}
	}

	_processNote(channelIndex, row) {
		const { wasmModule, ayumiPtr, currentTuningTable } = this.state;

		if (row.note.name === 1) {
			wasmModule.ayumi_set_tone(ayumiPtr, channelIndex, 0);
			this.state.channelOrnaments[channelIndex] = -1;
			this.state.channelBaseNotes[channelIndex] = 0;
		} else if (row.note.name !== 0) {
			const noteValue = row.note.name - 2 + (row.note.octave - 1) * 12;
			this.state.channelBaseNotes[channelIndex] = noteValue;

			if (noteValue >= 0 && noteValue < currentTuningTable.length) {
				const regValue = currentTuningTable[noteValue];
				wasmModule.ayumi_set_tone(ayumiPtr, channelIndex, regValue);
			}
		}
	}

	_processOrnament(channelIndex, row) {
		if (row.ornament > 0) {
			const ornamentIndex = row.ornament - 1;
			if (this.state.ornaments[ornamentIndex]) {
				this.state.channelOrnaments[channelIndex] = ornamentIndex;
				this.state.ornamentPositions[channelIndex] = 0;
				this.state.ornamentCounters[channelIndex] = 0;
			}
		} else if (row.ornament === 0 && row.note.name !== 0) {
			// Clear ornament when ornament 0 is specified with a note
			this.state.channelOrnaments[channelIndex] = -1;
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

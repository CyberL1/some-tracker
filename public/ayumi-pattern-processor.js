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
			this._processTable(channelIndex, row);
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

	processTables() {
		const { wasmModule, ayumiPtr, currentTuningTable } = this.state;

		for (let channelIndex = 0; channelIndex < 3; channelIndex++) {
			const tableIndex = this.state.channelTables[channelIndex];
			if (tableIndex < 0) continue;

			const table = this.state.tables[tableIndex];
			if (!table || !table.rows || table.rows.length === 0) continue;

			const baseNote = this.state.channelBaseNotes[channelIndex];
			if (baseNote === 0) continue;

			const tableOffset = table.rows[this.state.tablePositions[channelIndex]];
			const finalNote = baseNote + tableOffset;

			if (finalNote >= 0 && finalNote < currentTuningTable.length) {
				const regValue = currentTuningTable[finalNote];
				wasmModule.ayumi_set_tone(ayumiPtr, channelIndex, regValue);
			}

			this.state.tableCounters[channelIndex]++;
			if (this.state.tableCounters[channelIndex] >= 1) {
				this.state.tableCounters[channelIndex] = 0;
				this.state.tablePositions[channelIndex]++;

				if (this.state.tablePositions[channelIndex] >= table.rows.length) {
					if (table.loop > 0 && table.loop < table.rows.length) {
						this.state.tablePositions[channelIndex] = table.loop;
					} else {
						this.state.tablePositions[channelIndex] = 0;
					}
				}
			}
		}
	}

	_processNote(channelIndex, row) {
		const { wasmModule, ayumiPtr, currentTuningTable } = this.state;

		if (row.note.name === 1) {
			wasmModule.ayumi_set_tone(ayumiPtr, channelIndex, 0);
			this.state.channelTables[channelIndex] = -1;
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

	_processTable(channelIndex, row) {
		if (row.table > 0) {
			const tableIndex = row.table - 1;
			if (this.state.tables[tableIndex]) {
				this.state.channelTables[channelIndex] = tableIndex;
				this.state.tablePositions[channelIndex] = 0;
				this.state.tableCounters[channelIndex] = 0;
			}
		} else if (row.table === 0 && row.note.name !== 0) {
			//todo:  Clear table
			// this.state.channelTables[channelIndex] = -1;
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

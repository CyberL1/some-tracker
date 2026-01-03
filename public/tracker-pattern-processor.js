class TrackerPatternProcessor {
	constructor(state, chipAudioDriver, port) {
		this.state = state;
		this.chipAudioDriver = chipAudioDriver;
		this.port = port;
	}

	parsePatternRow(pattern, rowIndex) {
		if (!pattern || rowIndex >= pattern.length || rowIndex < 0) return;

		const patternRow = pattern.patternRows[rowIndex];
		if (!patternRow) return;

		for (let channelIndex = 0; channelIndex < pattern.channels.length; channelIndex++) {
			const channel = pattern.channels[channelIndex];
			const row = channel.rows[rowIndex];

			this._processNote(channelIndex, row);
			this._processTable(channelIndex, row);
			this._processVolume(channelIndex, row);
			this._processEffects(row);
		}

		this.chipAudioDriver.processPatternRow(this.state, pattern, rowIndex, patternRow);
	}

	processTables() {
		for (let channelIndex = 0; channelIndex < this.state.channelTables.length; channelIndex++) {
			const tableIndex = this.state.channelTables[channelIndex];
			const baseNote = this.state.channelBaseNotes[channelIndex];

			if (tableIndex < 0) {
				this.state.channelCurrentNotes[channelIndex] = baseNote;
				continue;
			}

			const table = this.state.tables[tableIndex];
			if (!table || !table.rows || table.rows.length === 0) {
				this.state.channelCurrentNotes[channelIndex] = baseNote;
				continue;
			}

			if (baseNote < 0 || baseNote >= this.state.currentTuningTable.length) {
				this.state.channelCurrentNotes[channelIndex] = baseNote;
				continue;
			}

			const tableOffset = table.rows[this.state.tablePositions[channelIndex]];
			let finalNote = baseNote + tableOffset;

			if (finalNote < 0) finalNote = 0;
			if (finalNote > 95) finalNote = 95;

			this.state.channelCurrentNotes[channelIndex] = finalNote;

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
		if (row.note.name === 1) {
			this.state.channelTables[channelIndex] = -1;
			this.state.channelBaseNotes[channelIndex] = 0;
			this.state.channelCurrentNotes[channelIndex] = 0;
		} else if (row.note.name !== 0) {
			const noteValue = row.note.name - 2 + (row.note.octave - 1) * 12;
			this.state.channelBaseNotes[channelIndex] = noteValue;
			this.state.channelCurrentNotes[channelIndex] = noteValue;
		}
	}

	_processTable(channelIndex, row) {
		if (row.envelopeShape === 15 && row.table === 0) {
			this.state.channelTables[channelIndex] = -1;
			this.state.tablePositions[channelIndex] = 0;
			this.state.tableCounters[channelIndex] = 0;
		} else if (row.table > 0) {
			const tableIndex = row.table - 1;
			if (this.state.tables[tableIndex]) {
				this.state.channelTables[channelIndex] = tableIndex;
				this.state.tablePositions[channelIndex] = 0;
				this.state.tableCounters[channelIndex] = 0;
			}
		} else if (row.table === 0 && row.note.name !== 0) {
		}
	}

	_processVolume(channelIndex, row) {
		if (row.volume > 0) {
			this.state.channelPatternVolumes[channelIndex] = row.volume;
		}
	}

	_processEffects(row) {
		if (row.effects[0] && row.effects[0].effect === 'S'.charCodeAt(0)) {
			const newSpeed = row.effects[0].parameter;
			if (newSpeed > 0) {
				this.state.setSpeed(newSpeed);
				this.port.postMessage({ type: 'speed_update', speed: newSpeed });
			}
		}
	}
}

export default TrackerPatternProcessor;

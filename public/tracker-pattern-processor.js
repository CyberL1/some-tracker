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
			this._processEffects(channelIndex, row);
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

			const maxNote = this.state.currentTuningTable.length - 1;
			if (finalNote < 0) finalNote = 0;
			if (finalNote > maxNote) finalNote = maxNote;

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
		const hasSlideCommand =
			row.effects[0] && (row.effects[0].effect === 1 || row.effects[0].effect === 2);

		if (!this.state.channelSlideAlreadyApplied) {
			this.state.channelSlideAlreadyApplied = [];
		}

		if (row.note.name === 1) {
			this.state.channelTables[channelIndex] = -1;
			this.state.channelBaseNotes[channelIndex] = 0;
			this.state.channelCurrentNotes[channelIndex] = 0;
			this.state.tablePositions[channelIndex] = 0;
			this.state.tableCounters[channelIndex] = 0;
			this.state.channelToneSliding[channelIndex] = 0;
			this.state.channelSlideStep[channelIndex] = 0;
			this.state.channelSlideAlreadyApplied[channelIndex] = false;
		} else if (row.note.name !== 0) {
			const noteValue = row.note.name - 2 + (row.note.octave - 1) * 12;
			this.state.channelBaseNotes[channelIndex] = noteValue;
			this.state.channelCurrentNotes[channelIndex] = noteValue;

			if (this.state.channelTables[channelIndex] >= 0) {
				this.state.tablePositions[channelIndex] = 0;
				this.state.tableCounters[channelIndex] = 0;
			}

			this.state.channelToneSliding[channelIndex] = 0;
			if (!hasSlideCommand) {
				this.state.channelSlideStep[channelIndex] = 0;
				this.state.channelSlideAlreadyApplied[channelIndex] = false;
			}
		}
	}

	_processTable(channelIndex, row) {
		const TABLE_OFF = -1;

		if (row.table === TABLE_OFF) {
			this._disableTable(channelIndex);
		} else if (row.table > 0) {
			this._enableTable(channelIndex, row.table - 1);
		}
	}

	_disableTable(channelIndex) {
		this.state.channelTables[channelIndex] = -1;
		this.state.tablePositions[channelIndex] = 0;
		this.state.tableCounters[channelIndex] = 0;
	}

	_enableTable(channelIndex, tableIndex) {
		if (this.state.tables[tableIndex]) {
			this.state.channelTables[channelIndex] = tableIndex;
			this.state.tablePositions[channelIndex] = 0;
			this.state.tableCounters[channelIndex] = 0;
		}
	}

	_processVolume(channelIndex, row) {
		if (row.volume > 0) {
			this.state.channelPatternVolumes[channelIndex] = row.volume;
		}
	}

	_processEffects(channelIndex, row) {
		if (!row.effects[0]) return;

		const effect = row.effects[0];
		const SLIDE_UP = 1;
		const SLIDE_DOWN = 2;
		const SPEED = 'S'.charCodeAt(0);

		if (effect.effect === SPEED) {
			const newSpeed = effect.parameter;
			if (newSpeed > 0) {
				this.state.setSpeed(newSpeed);
				this.port.postMessage({ type: 'speed_update', speed: newSpeed });
			}
		} else if (effect.effect === SLIDE_UP) {
			this.state.channelSlideStep[channelIndex] = effect.parameter;
			if (row.note.name !== 0 && row.note.name !== 1) {
				this.state.channelToneSliding[channelIndex] = effect.parameter;
				this.state.channelSlideAlreadyApplied[channelIndex] = true;
			} else {
				this.state.channelSlideAlreadyApplied[channelIndex] = false;
			}
		} else if (effect.effect === SLIDE_DOWN) {
			this.state.channelSlideStep[channelIndex] = -effect.parameter;
			if (row.note.name !== 0 && row.note.name !== 1) {
				this.state.channelToneSliding[channelIndex] = -effect.parameter;
				this.state.channelSlideAlreadyApplied[channelIndex] = true;
			} else {
				this.state.channelSlideAlreadyApplied[channelIndex] = false;
			}
		}
	}

	processSlides() {
		if (!this.state.channelSlideAlreadyApplied) {
			this.state.channelSlideAlreadyApplied = [];
		}
		for (
			let channelIndex = 0;
			channelIndex < this.state.channelSlideStep.length;
			channelIndex++
		) {
			const slideStep = this.state.channelSlideStep[channelIndex];
			if (slideStep !== 0) {
				if (!this.state.channelSlideAlreadyApplied[channelIndex]) {
					this.state.channelToneSliding[channelIndex] += slideStep;
				} else {
					this.state.channelSlideAlreadyApplied[channelIndex] = false;
				}
			}
		}
	}
}

export default TrackerPatternProcessor;

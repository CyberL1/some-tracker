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
		const hasPortamentoCommand = row.effects[0] && row.effects[0].effect === 'P'.charCodeAt(0);

		if (!this.state.channelSlideAlreadyApplied) {
			this.state.channelSlideAlreadyApplied = [];
		}

		if (row.note.name === 1) {
			if (this.state.channelSoundEnabled) {
				this.state.channelSoundEnabled[channelIndex] = false;
			}
			this.state.channelTables[channelIndex] = -1;
			this.state.channelBaseNotes[channelIndex] = 0;
			this.state.channelCurrentNotes[channelIndex] = 0;
			this.state.tablePositions[channelIndex] = 0;
			this.state.tableCounters[channelIndex] = 0;
			this.state.channelToneSliding[channelIndex] = 0;
			this.state.channelSlideStep[channelIndex] = 0;
			this.state.channelSlideAlreadyApplied[channelIndex] = false;
			this.state.channelPortamentoActive[channelIndex] = false;
		} else if (row.note.name !== 0) {
			if (this.state.channelSoundEnabled) {
				this.state.channelSoundEnabled[channelIndex] = true;
			}
			const noteValue = row.note.name - 2 + (row.note.octave - 1) * 12;

			this.state.channelPreviousNotes[channelIndex] =
				this.state.channelBaseNotes[channelIndex];

			this.state.channelBaseNotes[channelIndex] = noteValue;
			this.state.channelCurrentNotes[channelIndex] = noteValue;

			if (this.state.channelTables[channelIndex] >= 0) {
				this.state.tablePositions[channelIndex] = 0;
				this.state.tableCounters[channelIndex] = 0;
			}

			if (!hasPortamentoCommand) {
				this.state.channelToneSliding[channelIndex] = 0;
			}
			if (!hasSlideCommand && !hasPortamentoCommand) {
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
		const PORTAMENTO = 'P'.charCodeAt(0);
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
		} else if (effect.effect === PORTAMENTO) {
			if (row.note.name !== 0 && row.note.name !== 1) {
				const currentNote = this.state.channelBaseNotes[channelIndex];
				const previousNote = this.state.channelPreviousNotes[channelIndex];

				if (
					previousNote >= 0 &&
					previousNote < this.state.currentTuningTable.length &&
					currentNote >= 0 &&
					currentNote < this.state.currentTuningTable.length
				) {
					const previousTone = this.state.currentTuningTable[previousNote];
					const currentTone = this.state.currentTuningTable[currentNote];
					const delta = currentTone - previousTone;

					const currentSliding = this.state.channelToneSliding
						? this.state.channelToneSliding[channelIndex]
						: 0;

					this.state.channelPortamentoTarget[channelIndex] = currentNote;
					this.state.channelPortamentoDelta[channelIndex] = delta;
					this.state.channelPortamentoActive[channelIndex] = true;

					this.state.channelBaseNotes[channelIndex] = previousNote;
					this.state.channelCurrentNotes[channelIndex] = previousNote;

					this.state.channelSlideStep[channelIndex] = effect.parameter;
					if (delta - currentSliding < 0) {
						this.state.channelSlideStep[channelIndex] = -effect.parameter;
					}

					if (this.state.channelToneSliding) {
						this.state.channelToneSliding[channelIndex] = currentSliding;
					}

					let delay = effect.delay || 1;
					if (delay === 0) {
						delay = 1;
					}
					this.state.channelPortamentoDelay[channelIndex] = delay;
					this.state.channelPortamentoCount[channelIndex] = delay;
				}
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
				if (this.state.channelPortamentoActive[channelIndex]) {
					if (this.state.channelPortamentoCount[channelIndex] > 0) {
						this.state.channelPortamentoCount[channelIndex]--;
						if (this.state.channelPortamentoCount[channelIndex] === 0) {
							this.state.channelPortamentoCount[channelIndex] =
								this.state.channelPortamentoDelay[channelIndex];
							this.state.channelToneSliding[channelIndex] += slideStep;

							const delta = this.state.channelPortamentoDelta[channelIndex];
							const currentSliding = this.state.channelToneSliding[channelIndex];

							if (
								(slideStep < 0 && currentSliding <= delta) ||
								(slideStep >= 0 && currentSliding >= delta)
							) {
								const targetNote = this.state.channelPortamentoTarget[channelIndex];
								this.state.channelBaseNotes[channelIndex] = targetNote;
								this.state.channelCurrentNotes[channelIndex] = targetNote;
								this.state.channelToneSliding[channelIndex] = 0;
								this.state.channelSlideStep[channelIndex] = 0;
								this.state.channelPortamentoActive[channelIndex] = false;
							}
						}
					}
				} else {
					if (!this.state.channelSlideAlreadyApplied[channelIndex]) {
						this.state.channelToneSliding[channelIndex] += slideStep;
					} else {
						this.state.channelSlideAlreadyApplied[channelIndex] = false;
					}
				}
			}
		}
	}
}

export default TrackerPatternProcessor;

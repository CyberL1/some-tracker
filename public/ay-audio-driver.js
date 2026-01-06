const PT3_VOL = [
	[
		0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
		0x00
	],
	[
		0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01,
		0x01
	],
	[
		0x00, 0x00, 0x00, 0x00, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x02, 0x02, 0x02,
		0x02
	],
	[
		0x00, 0x00, 0x00, 0x01, 0x01, 0x01, 0x01, 0x01, 0x02, 0x02, 0x02, 0x02, 0x02, 0x03, 0x03,
		0x03
	],
	[
		0x00, 0x00, 0x01, 0x01, 0x01, 0x01, 0x02, 0x02, 0x02, 0x02, 0x03, 0x03, 0x03, 0x03, 0x04,
		0x04
	],
	[
		0x00, 0x00, 0x01, 0x01, 0x01, 0x02, 0x02, 0x02, 0x03, 0x03, 0x03, 0x04, 0x04, 0x04, 0x05,
		0x05
	],
	[
		0x00, 0x00, 0x01, 0x01, 0x02, 0x02, 0x02, 0x03, 0x03, 0x04, 0x04, 0x04, 0x05, 0x05, 0x06,
		0x06
	],
	[
		0x00, 0x00, 0x01, 0x01, 0x02, 0x02, 0x03, 0x03, 0x04, 0x04, 0x05, 0x05, 0x06, 0x06, 0x07,
		0x07
	],
	[
		0x00, 0x01, 0x01, 0x02, 0x02, 0x03, 0x03, 0x04, 0x04, 0x05, 0x05, 0x06, 0x06, 0x07, 0x07,
		0x08
	],
	[
		0x00, 0x01, 0x01, 0x02, 0x02, 0x03, 0x04, 0x04, 0x05, 0x05, 0x06, 0x07, 0x07, 0x08, 0x08,
		0x09
	],
	[
		0x00, 0x01, 0x01, 0x02, 0x03, 0x03, 0x04, 0x05, 0x05, 0x06, 0x07, 0x07, 0x08, 0x09, 0x09,
		0x0a
	],
	[
		0x00, 0x01, 0x01, 0x02, 0x03, 0x04, 0x04, 0x05, 0x06, 0x07, 0x07, 0x08, 0x09, 0x0a, 0x0a,
		0x0b
	],
	[
		0x00, 0x01, 0x02, 0x02, 0x03, 0x04, 0x05, 0x06, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0a, 0x0b,
		0x0c
	],
	[
		0x00, 0x01, 0x02, 0x03, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0a, 0x0b, 0x0c,
		0x0d
	],
	[
		0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d,
		0x0e
	],
	[0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f]
];

class AYAudioDriver {
	constructor(wasmModule, ayumiPtr) {
		this.wasmModule = wasmModule;
		this.ayumiPtr = ayumiPtr;
		this.channelMixerState = [
			{ tone: true, noise: true, envelope: false },
			{ tone: true, noise: true, envelope: false },
			{ tone: true, noise: true, envelope: false }
		];
	}

	setTone(channelIndex, regValue) {
		this.wasmModule.ayumi_set_tone(this.ayumiPtr, channelIndex, regValue);
	}

	setVolume(channelIndex, volume) {
		this.wasmModule.ayumi_set_volume(this.ayumiPtr, channelIndex, volume);
	}

	calculateVolume(
		patternVolume,
		instrumentVolume,
		amplitudeSliding,
		instrumentEnvelopeEnabled,
		channelEnvelopeEnabled,
		channelMuted
	) {
		if (channelMuted) {
			return 0;
		}

		let vol = instrumentVolume + amplitudeSliding;
		if (vol < 0) vol = 0;
		if (vol > 15) vol = 15;

		let finalVolume = PT3_VOL[patternVolume][vol];

		if (instrumentEnvelopeEnabled && channelEnvelopeEnabled) {
			finalVolume = finalVolume | 16;
		}

		return finalVolume;
	}

	setMixer(channelIndex) {
		const state = this.channelMixerState[channelIndex];
		this.wasmModule.ayumi_set_mixer(
			this.ayumiPtr,
			channelIndex,
			state.tone ? 0 : 1,
			state.noise ? 0 : 1,
			state.envelope ? 1 : 0
		);
	}

	setMixerTone(channelIndex, enabled) {
		this.channelMixerState[channelIndex].tone = enabled;
		this.setMixer(channelIndex);
	}

	setMixerNoise(channelIndex, enabled) {
		this.channelMixerState[channelIndex].noise = enabled;
		this.setMixer(channelIndex);
	}

	setMixerEnvelope(channelIndex, enabled) {
		this.channelMixerState[channelIndex].envelope = enabled;
		this.setMixer(channelIndex);
	}

	setNoise(noiseValue) {
		this.wasmModule.ayumi_set_noise(this.ayumiPtr, noiseValue);
	}

	setEnvelope(shape, period) {
		this.wasmModule.ayumi_set_envelope_shape(this.ayumiPtr, shape);
		this.wasmModule.ayumi_set_envelope(this.ayumiPtr, period);
	}

	resetInstrumentAccumulators(state, channelIndex) {
		state.channelToneAccumulator[channelIndex] = 0;
		state.channelNoiseAccumulator[channelIndex] = 0;
		state.channelEnvelopeAccumulator[channelIndex] = 0;
		state.channelAmplitudeSliding[channelIndex] = 0;
		if (state.channelToneSliding) {
			const hasActiveSlide =
				state.channelSlideStep && state.channelSlideStep[channelIndex] !== 0;
			const hasActivePortamento =
				state.channelPortamentoActive && state.channelPortamentoActive[channelIndex];
			if (!hasActiveSlide && !hasActivePortamento) {
				state.channelToneSliding[channelIndex] = 0;
			}
		}
	}

	processPatternRow(state, pattern, rowIndex, patternRow) {
		if (patternRow.noiseValue > 0) {
			this.wasmModule.ayumi_set_noise(this.ayumiPtr, patternRow.noiseValue);
		}

		for (let channelIndex = 0; channelIndex < pattern.channels.length; channelIndex++) {
			const channel = pattern.channels[channelIndex];
			const row = channel.rows[rowIndex];
			const isMuted = state.channelMuted[channelIndex];

			if (isMuted) {
				this.setVolume(channelIndex, 0);
				this.setMixer(channelIndex, 1, 1, 0);
				state.channelEnvelopeEnabled[channelIndex] = false;
			} else {
				this._processNote(state, channelIndex, row);
				this._processInstrument(state, channelIndex, row);
				this._processEnvelope(state, channelIndex, row, patternRow);
			}
		}
	}

	_processNote(state, channelIndex, row) {
		if (state.channelMuted[channelIndex]) return;

		if (row.note.name === 1) {
			state.channelSoundEnabled[channelIndex] = false;
			this.setTone(channelIndex, 0);
			this.resetInstrumentAccumulators(state, channelIndex);
			state.instrumentPositions[channelIndex] = 0;
		} else if (row.note.name !== 0) {
			state.channelSoundEnabled[channelIndex] = true;
			const noteValue = row.note.name - 2 + (row.note.octave - 1) * 12;
			if (noteValue >= 0 && noteValue < state.currentTuningTable.length) {
				const regValue = state.currentTuningTable[noteValue];
				this.setTone(channelIndex, regValue);
			}
			if (state.instrumentPositions) {
				state.instrumentPositions[channelIndex] = 0;
			}
			this.resetInstrumentAccumulators(state, channelIndex);
		}
	}

	_processInstrument(state, channelIndex, row) {
		if (!state.channelInstruments || !state.instruments) return;
		if (state.channelMuted[channelIndex]) return;

		if (row.instrument > 0) {
			const instrumentIndex = state.instrumentIdToIndex.get(row.instrument);
			if (instrumentIndex !== undefined && state.instruments[instrumentIndex]) {
				state.channelInstruments[channelIndex] = instrumentIndex;
				state.instrumentPositions[channelIndex] = 0;
				this.resetInstrumentAccumulators(state, channelIndex);
			}
		}

		if (state.channelInstruments[channelIndex] < 0) {
			state.channelInstruments[channelIndex] = 0;
		}
	}

	_processEnvelope(state, channelIndex, row, patternRow) {
		if (!state.channelEnvelopeEnabled) return;
		if (state.channelMuted[channelIndex]) return;

		if (row.envelopeShape !== 0 && row.envelopeShape !== 15) {
			if (patternRow.envelopeValue > 0) {
				state.envelopeBaseValue = patternRow.envelopeValue;
				state.envelopeSlideCurrent = 0;
				state.envelopeSlideDelta = 0;
				state.envelopeSlideDelay = 0;
				state.envelopeSlideDelayCounter = 0;
				const finalEnvelopeValue = patternRow.envelopeValue;
				this.setEnvelope(row.envelopeShape, finalEnvelopeValue);
				state.channelEnvelopeEnabled[channelIndex] = true;
				this.setMixerEnvelope(channelIndex, true);
			}
		} else if (row.envelopeShape === 15) {
			state.channelEnvelopeEnabled[channelIndex] = false;
			this.setMixerEnvelope(channelIndex, false);
		}

		this._processEnvelopeEffects(state, channelIndex, row);
	}

	_processEnvelopeEffects(state, channelIndex, row) {
		if (!row.effects[0]) return;

		const effect = row.effects[0];
		const ENVELOPE_SLIDE_UP = 9;
		const ENVELOPE_SLIDE_DOWN = 10;

		if (effect.effect === ENVELOPE_SLIDE_UP) {
			state.envelopeSlideDelay = 1;
			state.envelopeSlideDelayCounter = 1;
			state.envelopeSlideDelta = effect.parameter;
		} else if (effect.effect === ENVELOPE_SLIDE_DOWN) {
			state.envelopeSlideDelay = 1;
			state.envelopeSlideDelayCounter = 1;
			state.envelopeSlideDelta = -effect.parameter;
		}
	}

	processInstruments(state) {
		this.processEnvelopeSlide(state);
		this.updateEnvelopeWithSlide(state);

		for (let channelIndex = 0; channelIndex < state.channelInstruments.length; channelIndex++) {
			const isMuted = state.channelMuted[channelIndex];
			const isSoundEnabled = state.channelSoundEnabled[channelIndex];

			if (isMuted || !isSoundEnabled) {
				this.setVolume(channelIndex, 0);
				this.setMixerTone(channelIndex, false);
				this.setMixerNoise(channelIndex, false);
				this.setMixerEnvelope(channelIndex, false);
				if (isMuted) {
					state.channelEnvelopeEnabled[channelIndex] = false;
				}
				continue;
			}

			const instrumentIndex = state.channelInstruments[channelIndex];
			const instrument = state.instruments[instrumentIndex];

			if (!instrument || !instrument.rows || instrument.rows.length === 0) {
				continue;
			}

			const instrumentRow = instrument.rows[state.instrumentPositions[channelIndex]];
			if (!instrumentRow) {
				state.instrumentPositions[channelIndex]++;
				if (state.instrumentPositions[channelIndex] >= instrument.rows.length) {
					if (instrument.loop > 0 && instrument.loop < instrument.rows.length) {
						state.instrumentPositions[channelIndex] = instrument.loop;
					} else {
						state.instrumentPositions[channelIndex] = 0;
					}
				}
				continue;
			}

			const currentNote = state.channelCurrentNotes[channelIndex];
			let noteTone = 0;
			if (currentNote >= 0 && currentNote < state.currentTuningTable.length) {
				noteTone = state.currentTuningTable[currentNote];
			}

			if (noteTone === 0) {
				state.instrumentPositions[channelIndex]++;
				if (state.instrumentPositions[channelIndex] >= instrument.rows.length) {
					if (instrument.loop > 0 && instrument.loop < instrument.rows.length) {
						state.instrumentPositions[channelIndex] = instrument.loop;
					} else {
						state.instrumentPositions[channelIndex] = 0;
					}
				}
				continue;
			}

			let sampleTone = state.channelToneAccumulator[channelIndex];
			if (instrumentRow.toneAdd !== 0) {
				sampleTone = sampleTone + instrumentRow.toneAdd;
			}

			if (instrumentRow.toneAccumulation) {
				state.channelToneAccumulator[channelIndex] = sampleTone;
			}

			const toneSliding = state.channelToneSliding
				? state.channelToneSliding[channelIndex] || 0
				: 0;
			const finalTone = (noteTone + sampleTone + toneSliding) & 0xfff;
			this.setTone(channelIndex, finalTone);

			if (instrumentRow.noiseAdd !== 0) {
				state.channelNoiseAccumulator[channelIndex] += instrumentRow.noiseAdd;
				if (instrumentRow.noiseAccumulation) {
				}
				const noiseValue = state.channelNoiseAccumulator[channelIndex] & 31;
				this.setNoise(noiseValue);
			}

			if (instrumentRow.volume >= 0) {
				state.channelInstrumentVolumes[channelIndex] = instrumentRow.volume;
			}

			if (instrumentRow.amplitudeSliding) {
				if (instrumentRow.amplitudeSlideUp) {
					if (state.channelAmplitudeSliding[channelIndex] < 15) {
						state.channelAmplitudeSliding[channelIndex]++;
					}
				} else {
					if (state.channelAmplitudeSliding[channelIndex] > -15) {
						state.channelAmplitudeSliding[channelIndex]--;
					}
				}
			}

			const patternVolume = state.channelPatternVolumes[channelIndex];
			const instrumentVolume = state.channelInstrumentVolumes[channelIndex];
			const amplitudeSliding = state.channelAmplitudeSliding[channelIndex];

			let finalVolume = this.calculateVolume(
				patternVolume,
				instrumentVolume,
				amplitudeSliding,
				instrumentRow.envelope,
				state.channelEnvelopeEnabled[channelIndex],
				false
			);

			this.setMixerTone(channelIndex, instrumentRow.tone);
			this.setMixerNoise(channelIndex, instrumentRow.noise);

			if (instrumentRow.envelope && state.channelEnvelopeEnabled[channelIndex]) {
				this.setMixerEnvelope(channelIndex, true);
			} else {
				this.setMixerEnvelope(channelIndex, false);
			}

			this.setVolume(channelIndex, finalVolume);

			state.instrumentPositions[channelIndex]++;
			if (state.instrumentPositions[channelIndex] >= instrument.rows.length) {
				if (instrument.loop > 0 && instrument.loop < instrument.rows.length) {
					state.instrumentPositions[channelIndex] = instrument.loop;
				} else {
					state.instrumentPositions[channelIndex] = 0;
				}
			}
		}

		for (let channelIndex = 0; channelIndex < state.channelInstruments.length; channelIndex++) {
			if (state.channelMuted[channelIndex]) {
				this.setVolume(channelIndex, 0);
				this.setMixer(channelIndex, 1, 1, 0);
				state.channelEnvelopeEnabled[channelIndex] = false;
			}
		}
	}

	processEnvelopeSlide(state) {
		if (state.envelopeSlideDelayCounter > 0) {
			state.envelopeSlideDelayCounter--;
			if (state.envelopeSlideDelayCounter === 0) {
				state.envelopeSlideDelayCounter = state.envelopeSlideDelay;
				state.envelopeSlideCurrent += state.envelopeSlideDelta;
			}
		}
	}

	updateEnvelopeWithSlide(state) {
		if (state.envelopeBaseValue > 0) {
			const finalEnvelopeValue = state.envelopeBaseValue + state.envelopeSlideCurrent;
			const clampedValue = Math.max(0, Math.min(0xffff, finalEnvelopeValue));
			this.wasmModule.ayumi_set_envelope(this.ayumiPtr, clampedValue);
		}
	}
}

export default AYAudioDriver;

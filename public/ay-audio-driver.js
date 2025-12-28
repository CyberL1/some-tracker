class AYAudioDriver {
	constructor(wasmModule, ayumiPtr) {
		this.wasmModule = wasmModule;
		this.ayumiPtr = ayumiPtr;
	}

	setTone(channelIndex, regValue) {
		this.wasmModule.ayumi_set_tone(this.ayumiPtr, channelIndex, regValue);
	}

	setVolume(channelIndex, volume) {
		this.wasmModule.ayumi_set_volume(this.ayumiPtr, channelIndex, volume);
	}

	setMixer(channelIndex) {
		this.wasmModule.ayumi_set_mixer(this.ayumiPtr, channelIndex, 0, 1, 0);
	}

	processPatternRow(patternRow) {
		if (patternRow.noiseValue > 0) {
			this.wasmModule.ayumi_set_noise(this.ayumiPtr, patternRow.noiseValue);
		}

		if (patternRow.envelopeValue > 0) {
			this.wasmModule.ayumi_set_envelope(this.ayumiPtr, patternRow.envelopeValue);
		}
	}
}

export default AYAudioDriver;

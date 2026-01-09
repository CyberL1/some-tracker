class AYChipRegisterState {
	constructor() {
		this.channels = [
			{ tone: 0, volume: 0, mixer: { tone: true, noise: true, envelope: false } },
			{ tone: 0, volume: 0, mixer: { tone: true, noise: true, envelope: false } },
			{ tone: 0, volume: 0, mixer: { tone: true, noise: true, envelope: false } }
		];
		this.noise = 0;
		this.envelopePeriod = 0;
		this.envelopeShape = 0;
	}

	reset() {
		for (let i = 0; i < 3; i++) {
			this.channels[i].tone = 0;
			this.channels[i].volume = 0;
			this.channels[i].mixer = { tone: true, noise: true, envelope: false };
		}
		this.noise = 0;
		this.envelopePeriod = 0;
		this.envelopeShape = 0;
	}

	copy() {
		const copy = new AYChipRegisterState();
		for (let i = 0; i < 3; i++) {
			copy.channels[i].tone = this.channels[i].tone;
			copy.channels[i].volume = this.channels[i].volume;
			copy.channels[i].mixer = {
				tone: this.channels[i].mixer.tone,
				noise: this.channels[i].mixer.noise,
				envelope: this.channels[i].mixer.envelope
			};
		}
		copy.noise = this.noise;
		copy.envelopePeriod = this.envelopePeriod;
		copy.envelopeShape = this.envelopeShape;
		return copy;
	}
}

export default AYChipRegisterState;


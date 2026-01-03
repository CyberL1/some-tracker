export function mixAudioChannels(channels: Float32Array[][]): Float32Array[] {
	if (channels.length === 0) {
		throw new Error('No channels to mix');
	}

	let maxLength = 0;
	for (const [leftChannel] of channels) {
		if (leftChannel.length > maxLength) {
			maxLength = leftChannel.length;
		}
	}

	const mixedLeft = new Float32Array(maxLength);
	const mixedRight = new Float32Array(maxLength);

	for (const [leftChannel, rightChannel] of channels) {
		for (let i = 0; i < leftChannel.length; i++) {
			mixedLeft[i] += leftChannel[i];
			mixedRight[i] += rightChannel[i];
		}
	}

	const normalizationFactor = 1 / channels.length;
	for (let i = 0; i < maxLength; i++) {
		mixedLeft[i] *= normalizationFactor;
		mixedRight[i] *= normalizationFactor;
	}

	return [mixedLeft, mixedRight];
}


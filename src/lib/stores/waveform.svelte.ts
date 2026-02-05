let channelDataByChip: Float32Array[][] = $state([]);

export const waveformStore = {
	get channels(): Float32Array[] {
		return channelDataByChip.flat();
	},

	setChannels(chipIndex: number, channels: Float32Array[]): void {
		while (channelDataByChip.length <= chipIndex) {
			channelDataByChip = [...channelDataByChip, []];
		}
		channelDataByChip = channelDataByChip.slice();
		channelDataByChip[chipIndex] = channels.map((buf) => buf.slice(0));
	},

	clear(): void {
		channelDataByChip = [];
	}
};

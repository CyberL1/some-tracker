const WAVEFORM_FRAME_SIZE = 512;
const WAVEFORM_DISPLAY_LENGTH = 1536;

let channelDataByChip: Float32Array[][] = $state([]);
let writeIndexByChip: number[] = $state([]);

export const waveformStore = {
	get channels(): Float32Array[] {
		return channelDataByChip.flatMap((chipBuffers, chipIndex) => {
			const writeIndex = writeIndexByChip[chipIndex] ?? 0;
			return chipBuffers.map((buf) => {
				const out = new Float32Array(buf.length);
				for (let i = 0; i < buf.length; i++) {
					out[i] = buf[(writeIndex + i) % buf.length];
				}
				return out;
			});
		});
	},

	setChannels(chipIndex: number, channels: Float32Array[]): void {
		while (channelDataByChip.length <= chipIndex) {
			channelDataByChip = [...channelDataByChip, []];
			writeIndexByChip = [...writeIndexByChip, 0];
		}
		const ringSize = WAVEFORM_DISPLAY_LENGTH;
		let writeIndex = writeIndexByChip[chipIndex] ?? 0;
		const existing = channelDataByChip[chipIndex];
		const newBuffers = channels.map((buf, ch) => {
			const ring = existing[ch]?.length === ringSize
				? existing[ch]
				: new Float32Array(ringSize);
			for (let i = 0; i < buf.length; i++) {
				ring[(writeIndex + i) % ringSize] = buf[i];
			}
			return ring;
		});
		writeIndex = (writeIndex + WAVEFORM_FRAME_SIZE) % ringSize;
		channelDataByChip = channelDataByChip.slice();
		channelDataByChip[chipIndex] = newBuffers;
		writeIndexByChip = writeIndexByChip.slice();
		writeIndexByChip[chipIndex] = writeIndex;
	},

	clear(): void {
		channelDataByChip = [];
		writeIndexByChip = [];
	}
};

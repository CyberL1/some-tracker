type ChannelMuteState = Map<number, boolean[]>;

let channelMuteState: ChannelMuteState = $state(new Map());

function ensureChipMutes(chipIndex: number): boolean[] {
	if (!channelMuteState.has(chipIndex)) {
		channelMuteState.set(chipIndex, []);
	}
	return channelMuteState.get(chipIndex)!;
}

export const channelMuteStore = {
	get isChannelMuted() {
		return (chipIndex: number, channelIndex: number): boolean => {
			const chipMutes = channelMuteState.get(chipIndex);
			return chipMutes ? (chipMutes[channelIndex] ?? false) : false;
		};
	},

	toggleChannel(chipIndex: number, channelIndex: number): void {
		const chipMutes = ensureChipMutes(chipIndex);
		chipMutes[channelIndex] = !(chipMutes[channelIndex] ?? false);
		channelMuteState = new Map(channelMuteState);
	},

	setChannelMuted(chipIndex: number, channelIndex: number, muted: boolean): void {
		const chipMutes = ensureChipMutes(chipIndex);
		chipMutes[channelIndex] = muted;
		channelMuteState = new Map(channelMuteState);
	},

	getAllMuteStates(): ChannelMuteState {
		return new Map(channelMuteState);
	},

	clear(): void {
		channelMuteState = new Map();
	}
};

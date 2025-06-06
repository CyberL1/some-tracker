let isPlaying = $state(false);

export const playbackStore = {
	get isPlaying() {
		return isPlaying;
	},
	set isPlaying(value: boolean) {
		isPlaying = value;
	}
};

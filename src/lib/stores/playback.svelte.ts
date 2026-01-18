class PlaybackStore {
	private _state = $state({
		isPlaying: false
	});

	get isPlaying(): boolean {
		return this._state.isPlaying;
	}

	set isPlaying(value: boolean) {
		this._state.isPlaying = value;
	}
}

export const playbackStore = new PlaybackStore();

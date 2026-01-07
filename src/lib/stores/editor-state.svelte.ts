let editorState = $state({
	octave: 4,
	step: 1
});

export const editorStateStore = {
	get state() {
		return editorState;
	},
	get: () => {
		return editorState;
	},
	setOctave: (octave: number) => {
		if (octave >= 0 && octave <= 9) {
			editorState = { ...editorState, octave };
		}
	},
	setStep: (step: number) => {
		if (step >= 1) {
			editorState = { ...editorState, step };
		}
	}
};

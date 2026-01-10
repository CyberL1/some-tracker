let editorState = $state({
	octave: 4,
	step: 1,
	envelopeAsNote: false
});

export const editorStateStore = {
	get state() {
		return editorState;
	},
	get: () => {
		return editorState;
	},
	setOctave: (octave: number) => {
		if (octave >= 0 && octave <= 8) {
			editorState = { ...editorState, octave };
		}
	},
	setStep: (step: number) => {
		editorState = { ...editorState, step };
	},
	setEnvelopeAsNote: (envelopeAsNote: boolean) => {
		editorState = { ...editorState, envelopeAsNote };
	}
};

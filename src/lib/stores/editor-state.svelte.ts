import { settingsStore } from './settings.svelte';

let editorState = $state({
	octave: 4,
	step: 1,
	envelopeAsNote: false,
	currentInstrument: '01'
});

export const editorStateStore = {
	init() {
		editorState = { ...editorState, envelopeAsNote: settingsStore.get().envelopeAsNote };
	},
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
		if (editorState.envelopeAsNote === envelopeAsNote) return;
		editorState = { ...editorState, envelopeAsNote };
		settingsStore.set('envelopeAsNote', envelopeAsNote);
	},
	setCurrentInstrument: (instrument: string) => {
		editorState = { ...editorState, currentInstrument: instrument };
	}
};

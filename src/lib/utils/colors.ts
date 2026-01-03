export function getColors() {
	const style = getComputedStyle(document.documentElement);

	return {
		patternBg: style.getPropertyValue('--color-pattern-bg').trim(),
		patternText: style.getPropertyValue('--color-pattern-text').trim(),
		patternEmpty: style.getPropertyValue('--color-pattern-empty').trim(),
		patternEmptySelected: style.getPropertyValue('--color-pattern-empty-selected').trim(),
		patternNote: style.getPropertyValue('--color-pattern-note').trim(),
		patternInstrument: style.getPropertyValue('--color-pattern-instrument').trim(),
		patternEffect: style.getPropertyValue('--color-pattern-effect').trim(),
		patternEnvelope: style.getPropertyValue('--color-pattern-envelope').trim(),
		patternNoise: style.getPropertyValue('--color-pattern-noise').trim(),
		patternHeader: style.getPropertyValue('--color-pattern-header').trim(),
		patternSelected: style.getPropertyValue('--color-pattern-selected').trim(),
		patternCellSelected: style.getPropertyValue('--color-pattern-cell-selected').trim(),
		patternRowNum: style.getPropertyValue('--color-pattern-row-num').trim(),
		patternAlternate: style.getPropertyValue('--color-pattern-alternate').trim(),
		patternAlternateEmpty: style.getPropertyValue('--color-pattern-alternate-empty').trim(),
		patternTable: style.getPropertyValue('--color-pattern-table').trim(),
		patternRowNumAlternate: style.getPropertyValue('--color-pattern-row-num-alternate').trim(),
		patternEditing: style.getPropertyValue('--color-pattern-editing').trim(),
		patternNoteOff: style.getPropertyValue('--color-pattern-note-off').trim()
	};
}

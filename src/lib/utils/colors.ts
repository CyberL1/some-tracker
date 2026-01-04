function darkenColor(hex: string, amount: number): string {
	const num = parseInt(hex.replace('#', ''), 16);
	const r = Math.max(0, ((num >> 16) & 0xff) - amount);
	const g = Math.max(0, ((num >> 8) & 0xff) - amount);
	const b = Math.max(0, (num & 0xff) - amount);
	return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export function getColors() {
	const style = getComputedStyle(document.documentElement);

	const patternNote = style.getPropertyValue('--color-pattern-note').trim();
	const patternTable = style.getPropertyValue('--color-pattern-table').trim();

	return {
		patternBg: style.getPropertyValue('--color-pattern-bg').trim(),
		patternText: style.getPropertyValue('--color-pattern-text').trim(),
		patternEmpty: style.getPropertyValue('--color-pattern-empty').trim(),
		patternEmptySelected: style.getPropertyValue('--color-pattern-empty-selected').trim(),
		patternNote: patternNote,
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
		patternTable: patternTable,
		patternRowNumAlternate: style.getPropertyValue('--color-pattern-row-num-alternate').trim(),
		patternEditing: style.getPropertyValue('--color-pattern-editing').trim(),
		patternNoteOff: darkenColor(patternNote, 60),
		patternTableOff: darkenColor(patternTable, 60)
	};
}

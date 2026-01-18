import type { PatternEditorColors } from '../types/theme';
import { PATTERN_EDITOR_COLOR_KEYS, CSS_VAR_MAP } from '../config/theme-colors';

export function darkenColor(hex: string, amount: number): string {
	const num = parseInt(hex.replace('#', ''), 16);
	const r = Math.max(0, ((num >> 16) & 0xff) - amount);
	const g = Math.max(0, ((num >> 8) & 0xff) - amount);
	const b = Math.max(0, (num & 0xff) - amount);
	return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export function getColors(): PatternEditorColors {
	const style = getComputedStyle(document.documentElement);

	const colors: Record<string, string> = {};

	for (const key of PATTERN_EDITOR_COLOR_KEYS) {
		colors[key] = style.getPropertyValue(CSS_VAR_MAP[key]).trim();
	}

	return colors as PatternEditorColors;
}

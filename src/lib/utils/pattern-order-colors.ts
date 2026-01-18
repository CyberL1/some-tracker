import type { PatternOrderColors } from '../types/theme';
import { PATTERN_ORDER_COLOR_KEYS, CSS_VAR_MAP } from '../config/theme-colors';

export function getPatternOrderColors(): PatternOrderColors {
	const style = getComputedStyle(document.documentElement);

	const getColor = (varName: string, fallback: string): string => {
		const value = style.getPropertyValue(varName).trim();
		const isValid = value &&
			value.length > 0 &&
			value !== 'undefined' &&
			value !== 'null' &&
			!value.startsWith('undefined') &&
			!value.startsWith('null');
		return isValid ? value : fallback;
	};

	const colors: Record<string, string> = {};
	const fallbacks: Record<string, string> = {
		orderBg: '#1e1e2e',
		orderText: '#cdd6f4',
		orderEmpty: '#313244',
		orderSelected: '#45475a',
		orderHovered: '#313244',
		orderAlternate: '#181825',
		orderBorder: '#45475a'
	};

	for (const key of PATTERN_ORDER_COLOR_KEYS) {
		colors[key] = getColor(CSS_VAR_MAP[key], fallbacks[key]);
	}

	return colors as PatternOrderColors;
}

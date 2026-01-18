export function getPatternOrderColors() {
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

	return {
		orderBg: getColor('--color-order-bg', '#1e1e2e'),
		orderText: getColor('--color-order-text', '#cdd6f4'),
		orderEmpty: getColor('--color-order-empty', '#313244'),
		orderSelected: getColor('--color-order-selected', '#45475a'),
		orderHovered: getColor('--color-order-hovered', '#313244'),
		orderAlternate: getColor('--color-order-alternate', '#181825'),
		orderBorder: getColor('--color-order-border', '#45475a')
	};
}

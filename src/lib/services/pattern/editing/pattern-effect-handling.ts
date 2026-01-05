import { formatHex } from '../../../chips/base/field-formatters';

export class PatternEffectHandling {
	static formatEffectAsString(
		effect: { effect: number; delay: number; parameter: number } | null | undefined
	): string {
		if (!effect) return '...';
		let type: string;
		if (effect.effect === 0) {
			type = '.';
		} else if (effect.effect === 'S'.charCodeAt(0)) {
			type = 'S';
		} else if (effect.effect >= 1 && effect.effect <= 15) {
			type = effect.effect.toString(16).toUpperCase();
		} else {
			type = effect.effect.toString(16).toUpperCase();
		}
		const param = formatHex(effect.parameter, 2);
		return type + param;
	}

	static parseEffectFromString(value: string): {
		effect: number;
		delay: number;
		parameter: number;
	} {
		let type: number;
		const typeChar = value[0] || '.';
		if (typeChar === '.') {
			type = 0;
		} else if (typeChar === 'S' || typeChar === 's') {
			type = 'S'.charCodeAt(0);
		} else {
			type = parseInt(typeChar, 16) || 0;
		}
		const param = parseInt((value.slice(1, 3) || '00').replace(/\./g, '0'), 16) || 0;
		return { effect: type, delay: 0, parameter: param };
	}
}

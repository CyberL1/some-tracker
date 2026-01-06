import {
	formatHex,
	parseHex,
	formatSymbol,
	parseSymbol
} from '../../../chips/base/field-formatters';

export interface FieldStrategy {
	format(value: number | string, length: number): string;
	parse(value: string, length: number): number;
}

class HexFieldStrategy implements FieldStrategy {
	format(value: number | string, length: number): string {
		return formatHex(value, length).replace(/\./g, '0');
	}

	parse(value: string, length: number): number {
		return parseHex(value, length);
	}
}

class DecFieldStrategy implements FieldStrategy {
	format(value: number | string, length: number): string {
		const numValue = typeof value === 'number' ? value : parseInt(String(value), 10) || 0;
		return numValue.toString().padStart(length, '0');
	}

	parse(value: string, length: number): number {
		return parseInt(value, 10) || 0;
	}
}

class SymbolFieldStrategy implements FieldStrategy {
	format(value: number | string, length: number): string {
		return formatSymbol(value, length).replace(/\./g, '0');
	}

	parse(value: string, length: number): number {
		return parseSymbol(value, length);
	}
}

export class FieldStrategyFactory {
	private static strategies: Record<string, FieldStrategy> = {
		hex: new HexFieldStrategy(),
		dec: new DecFieldStrategy(),
		symbol: new SymbolFieldStrategy()
	};

	static getStrategy(fieldType: string): FieldStrategy {
		const strategy = this.strategies[fieldType];
		if (!strategy) {
			throw new Error(`Unknown field type: ${fieldType}`);
		}
		return strategy;
	}

	static isSupported(fieldType: string): boolean {
		return fieldType in this.strategies;
	}
}

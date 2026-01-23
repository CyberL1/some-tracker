import {
	formatHex,
	parseHex,
	formatSymbol,
	parseSymbol
} from '../../../chips/base/field-formatters';

export interface FieldStrategy {
	format(value: number | string | null, length: number, allowZeroValue?: boolean): string;
	parse(value: string, length: number, allowZeroValue?: boolean): number | null;
}

class HexFieldStrategy implements FieldStrategy {
	format(value: number | string | null, length: number, allowZeroValue?: boolean): string {
		return formatHex(value, length, allowZeroValue).replace(/\./g, '0');
	}

	parse(value: string, length: number, allowZeroValue?: boolean): number | null {
		return parseHex(value, length, allowZeroValue);
	}
}

class DecFieldStrategy implements FieldStrategy {
	format(value: number | string | null, length: number, allowZeroValue?: boolean): string {
		if (value === null || value === undefined) return '.'.repeat(length);
		const numValue = typeof value === 'number' ? value : parseInt(String(value), 10) || 0;
		return numValue.toString().padStart(length, '0');
	}

	parse(value: string, length: number, allowZeroValue?: boolean): number | null {
		if (value === '.'.repeat(length)) return null;
		return parseInt(value, 10) || 0;
	}
}

class SymbolFieldStrategy implements FieldStrategy {
	format(value: number | string | null, length: number, allowZeroValue?: boolean): string {
		return formatSymbol(value, length).replace(/\./g, '0');
	}

	parse(value: string, length: number, allowZeroValue?: boolean): number | null {
		if (value === '.'.repeat(length)) return null;
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

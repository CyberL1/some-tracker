import type { EditingContext, FieldInfo } from './editing-context';
import type { Pattern } from '../../../models/song';
import { PatternFieldDetection } from './pattern-field-detection';
import { PatternValueUpdates } from './pattern-value-updates';
import { formatHex, parseHex, formatSymbol, parseSymbol } from '../../../chips/base/field-formatters';
import { PatternEffectHandling } from './pattern-effect-handling';

export class PatternDeleteHandler {
	static handleDelete(
		context: EditingContext
	): { updatedPattern: Pattern; shouldMoveNext: boolean } | null {
		const fieldInfo = PatternFieldDetection.detectFieldAtCursor(context);
		if (!fieldInfo) {
			return null;
		}

		const field = PatternValueUpdates.getFieldDefinition(context, fieldInfo.fieldKey);
		if (!field) return null;

		const isEffectField =
			fieldInfo.fieldKey === 'effect' || fieldInfo.fieldKey === 'envelopeEffect';

		if (field.type === 'note') {
			if (fieldInfo.isGlobal) {
				return null;
			}
			const updatedPattern = PatternValueUpdates.updateFieldValue(context, fieldInfo, '---');
			return { updatedPattern, shouldMoveNext: false };
		}

		if (isEffectField) {
			return this.handleEffectFieldDelete(context, fieldInfo);
		}

		if (field.type === 'hex' || field.type === 'dec' || field.type === 'symbol') {
			return this.handleNumericFieldDelete(context, fieldInfo, field);
		}

		if (field.type === 'text') {
			const currentValue = PatternValueUpdates.getFieldValue(context, fieldInfo);
			const currentStr =
				typeof currentValue === 'number' ? currentValue.toString() : String(currentValue);
			const newStr = this.replaceCharAtOffset(currentStr, fieldInfo.charOffset, '');
			const updatedPattern = PatternValueUpdates.updateFieldValue(context, fieldInfo, newStr);
			return { updatedPattern, shouldMoveNext: false };
		}

		const updatedPattern = PatternValueUpdates.updateFieldValue(context, fieldInfo, '');
		return { updatedPattern, shouldMoveNext: false };
	}

	private static handleNumericFieldDelete(
		context: EditingContext,
		fieldInfo: FieldInfo,
		field: { key: string; type: string; length: number }
	): { updatedPattern: Pattern; shouldMoveNext: boolean } | null {
		const currentValue = PatternValueUpdates.getFieldValue(context, fieldInfo);

		let currentStr: string;
		let parseFn: (str: string, len: number) => number;
		const TABLE_OFF_VALUE = -1;

		if (field.type === 'hex') {
			currentStr = formatHex(currentValue, field.length).replace(/\./g, '0');
			parseFn = parseHex;
		} else if (field.type === 'dec') {
			const numValue =
				typeof currentValue === 'number'
					? currentValue
					: parseInt(String(currentValue), 10) || 0;
			currentStr = numValue.toString().padStart(field.length, '0');
			parseFn = (str: string) => parseInt(str, 10) || 0;
		} else {
			currentStr = formatSymbol(currentValue, field.length).replace(/\./g, '0');
			parseFn = parseSymbol;
		}

		if (fieldInfo.charOffset < 0 || fieldInfo.charOffset >= currentStr.length) {
			return null;
		}

		const charAtOffset = currentStr[fieldInfo.charOffset];
		
		if (field.type === 'symbol' && currentValue === TABLE_OFF_VALUE) {
			const updatedPattern = PatternValueUpdates.updateFieldValue(context, fieldInfo, 0);
			return { updatedPattern, shouldMoveNext: false };
		}

		if (charAtOffset === '0' || charAtOffset === '.') {
			return null;
		}

		const newStr = this.replaceCharAtOffset(currentStr, fieldInfo.charOffset, '0');
		
		const isAllZeros = /^0+$/.test(newStr);
		const newValue = isAllZeros ? 0 : parseFn(newStr, field.length);

		const updatedPattern = PatternValueUpdates.updateFieldValue(context, fieldInfo, newValue);
		return { updatedPattern, shouldMoveNext: false };
	}

	private static handleEffectFieldDelete(
		context: EditingContext,
		fieldInfo: FieldInfo
	): { updatedPattern: Pattern; shouldMoveNext: boolean } | null {
		const currentValue = PatternValueUpdates.getFieldValue(context, fieldInfo);
		const effectObj =
			typeof currentValue === 'object' && currentValue !== null
				? (currentValue as { effect: number; delay: number; parameter: number })
				: null;
		const currentStr = PatternEffectHandling.formatEffectAsString(effectObj);

		if (fieldInfo.charOffset < 0 || fieldInfo.charOffset >= currentStr.length) {
			return null;
		}

		const charAtOffset = currentStr[fieldInfo.charOffset];
		
		if (charAtOffset === '.' || (fieldInfo.charOffset > 0 && charAtOffset === '0')) {
			return null;
		}

		let replacementChar: string;
		if (fieldInfo.charOffset === 0) {
			replacementChar = '.';
		} else {
			replacementChar = '0';
		}

		const newStr = this.replaceCharAtOffset(currentStr, fieldInfo.charOffset, replacementChar);
		const newEffectObj = PatternEffectHandling.parseEffectFromString(newStr);

		const updatedPattern = PatternValueUpdates.updateFieldValue(
			context,
			fieldInfo,
			newEffectObj as unknown as string | number
		);
		return { updatedPattern, shouldMoveNext: false };
	}

	private static replaceCharAtOffset(str: string, offset: number, char: string): string {
		return str.substring(0, offset) + char + str.substring(offset + 1);
	}
}

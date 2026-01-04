import {
	formatHex,
	parseHex,
	formatSymbol,
	parseSymbol
} from '../../../chips/base/field-formatters';
import type { EditingContext, FieldInfo } from './editing-context';
import type { Pattern } from '../../../models/song';
import { PatternValueUpdates } from './pattern-value-updates';
import { PatternEffectHandling } from './pattern-effect-handling';

export class PatternFieldInput {
	static handleHexInput(
		context: EditingContext,
		fieldInfo: FieldInfo,
		key: string
	): { updatedPattern: Pattern; shouldMoveNext: boolean } | null {
		const upperKey = key.toUpperCase();
		const isEffectField =
			fieldInfo.fieldKey === 'effect' || fieldInfo.fieldKey === 'envelopeEffect';

		if (isEffectField) {
			if (!/^[0-9A-FS\.]$/i.test(key)) {
				return null;
			}
		} else {
			if (!/^[0-9A-F]$/.test(upperKey)) {
				return null;
			}
		}

		const field = PatternValueUpdates.getFieldDefinition(context, fieldInfo.fieldKey);
		if (!field) return null;

		if (isEffectField) {
			return this.handleEffectFieldInput(context, fieldInfo, upperKey);
		}

		const currentValue = PatternValueUpdates.getFieldValue(context, fieldInfo);
		const currentStr = formatHex(currentValue, field.length).replace(/\./g, '0');
		const newStr = this.replaceCharAtOffset(currentStr, fieldInfo.charOffset, upperKey);
		const newValue = parseHex(newStr, field.length);

		const updatedPattern = PatternValueUpdates.updateFieldValue(context, fieldInfo, newValue);
		return { updatedPattern, shouldMoveNext: false };
	}

	static handleDecInput(
		context: EditingContext,
		fieldInfo: FieldInfo,
		key: string
	): { updatedPattern: Pattern; shouldMoveNext: boolean } | null {
		if (!/^[0-9]$/.test(key)) {
			return null;
		}

		const field = PatternValueUpdates.getFieldDefinition(context, fieldInfo.fieldKey);
		if (!field) return null;

		const currentValue = PatternValueUpdates.getFieldValue(context, fieldInfo);
		const numValue =
			typeof currentValue === 'number'
				? currentValue
				: parseInt(String(currentValue), 10) || 0;
		const currentStr = numValue.toString().padStart(field.length, '0');
		const newStr = this.replaceCharAtOffset(currentStr, fieldInfo.charOffset, key);
		const newValue = parseInt(newStr, 10);

		const updatedPattern = PatternValueUpdates.updateFieldValue(context, fieldInfo, newValue);
		return { updatedPattern, shouldMoveNext: false };
	}

	static handleSymbolInput(
		context: EditingContext,
		fieldInfo: FieldInfo,
		key: string
	): { updatedPattern: Pattern; shouldMoveNext: boolean } | null {
		const upperKey = key.toUpperCase();
		const isTableField = fieldInfo.fieldKey === 'table';

		if (isTableField && (upperKey === 'A' || upperKey === 'O')) {
			const updatedPattern = PatternValueUpdates.updateFieldValue(context, fieldInfo, -1);
			return { updatedPattern, shouldMoveNext: false };
		}
		if (!/^[A-Z0-9]$/i.test(key)) {
			return null;
		}

		const field = PatternValueUpdates.getFieldDefinition(context, fieldInfo.fieldKey);
		if (!field) return null;

		const currentValue = PatternValueUpdates.getFieldValue(context, fieldInfo);
		const currentStr = formatSymbol(currentValue, field.length).replace(/\./g, '0');
		const newStr = this.replaceCharAtOffset(currentStr, fieldInfo.charOffset, upperKey);
		const newValue = parseSymbol(newStr, field.length);

		const updatedPattern = PatternValueUpdates.updateFieldValue(context, fieldInfo, newValue);
		return { updatedPattern, shouldMoveNext: false };
	}

	static handleTextInput(
		context: EditingContext,
		fieldInfo: FieldInfo,
		key: string
	): { updatedPattern: Pattern; shouldMoveNext: boolean } | null {
		if (key.length !== 1) {
			return null;
		}

		const field = PatternValueUpdates.getFieldDefinition(context, fieldInfo.fieldKey);
		if (!field) return null;

		const currentValue = PatternValueUpdates.getFieldValue(context, fieldInfo);
		const currentStr =
			typeof currentValue === 'number' ? currentValue.toString() : String(currentValue);
		const newStr = this.replaceCharAtOffset(currentStr, fieldInfo.charOffset, key);

		const updatedPattern = PatternValueUpdates.updateFieldValue(context, fieldInfo, newStr);
		return { updatedPattern, shouldMoveNext: false };
	}

	private static handleEffectFieldInput(
		context: EditingContext,
		fieldInfo: FieldInfo,
		key: string
	): { updatedPattern: Pattern; shouldMoveNext: boolean } | null {
		const currentValue = PatternValueUpdates.getFieldValue(context, fieldInfo);
		const effectObj =
			typeof currentValue === 'object' && currentValue !== null
				? (currentValue as { effect: number; delay: number; parameter: number })
				: null;
		const currentStr = PatternEffectHandling.formatEffectAsString(effectObj);
		const newStr = this.replaceCharAtOffset(currentStr, fieldInfo.charOffset, key);
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

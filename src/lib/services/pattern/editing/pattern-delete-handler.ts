import type { EditingContext, FieldInfo } from './editing-context';
import type { Pattern } from '../../../models/song';
import { PatternFieldDetection } from './pattern-field-detection';
import { PatternValueUpdates } from './pattern-value-updates';
import { StringManipulation } from './string-manipulation';
import { FieldStrategyFactory } from './field-strategies';
import { EffectField } from './effect-field';

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

		const isEffectField = EffectField.isEffectField(fieldInfo.fieldKey);

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
			const newStr = StringManipulation.replaceCharAtOffset(currentStr, fieldInfo.charOffset, '');
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
		const TABLE_OFF_VALUE = -1;

		if (!FieldStrategyFactory.isSupported(field.type)) {
			return null;
		}

		const strategy = FieldStrategyFactory.getStrategy(field.type);
		const currentStr = strategy.format(currentValue, field.length);

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

		const newStr = StringManipulation.replaceCharAtOffset(currentStr, fieldInfo.charOffset, '0');

		const isAllZeros = /^0+$/.test(newStr);
		const newValue = isAllZeros ? 0 : strategy.parse(newStr, field.length);

		const updatedPattern = PatternValueUpdates.updateFieldValue(context, fieldInfo, newValue);
		return { updatedPattern, shouldMoveNext: false };
	}

	private static handleEffectFieldDelete(
		context: EditingContext,
		fieldInfo: FieldInfo
	): { updatedPattern: Pattern; shouldMoveNext: boolean } | null {
		const currentValue = PatternValueUpdates.getFieldValue(context, fieldInfo);
		const currentStr = EffectField.formatValue(currentValue);

		if (fieldInfo.charOffset < 0 || fieldInfo.charOffset >= currentStr.length) {
			return null;
		}

		const charAtOffset = currentStr[fieldInfo.charOffset];

		if (charAtOffset === '.' || (fieldInfo.charOffset > 0 && charAtOffset === '0')) {
			return null;
		}

		const replacementChar = fieldInfo.charOffset === 0 ? '.' : '0';
		const newStr = StringManipulation.replaceCharAtOffset(currentStr, fieldInfo.charOffset, replacementChar);
		const newEffectObj = EffectField.parseValue(newStr);

		const updatedPattern = PatternValueUpdates.updateFieldValue(
			context,
			fieldInfo,
			newEffectObj as unknown as string | number
		);
		return { updatedPattern, shouldMoveNext: false };
	}
}

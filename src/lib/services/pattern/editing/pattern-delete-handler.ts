import type { EditingContext, FieldInfo } from './editing-context';
import type { Pattern } from '../../../models/song';
import { PatternFieldDetection } from './pattern-field-detection';
import { PatternValueUpdates } from './pattern-value-updates';

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

		let defaultValue: string | number | { effect: number; delay: number; parameter: number };
		if (field.type === 'note') {
			if (fieldInfo.isGlobal) {
				return null;
			}
			defaultValue = '---';
		} else if (isEffectField) {
			defaultValue = { effect: 0, delay: 0, parameter: 0 };
		} else {
			defaultValue =
				field.type === 'hex' || field.type === 'dec'
					? 0
					: field.type === 'symbol'
						? '00'
						: '';
		}

		const updatedPattern = PatternValueUpdates.updateFieldValue(
			context,
			fieldInfo,
			defaultValue as string | number
		);
		return { updatedPattern, shouldMoveNext: false };
	}
}

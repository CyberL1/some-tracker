import type { Pattern } from '../../../models/song';
import type { EditingContext, FieldInfo } from './editing-context';

export class PatternValueUpdates {
	static updateFieldValue(
		context: EditingContext,
		fieldInfo: FieldInfo,
		newValue: string | number
	): Pattern {
		const genericPattern = context.converter.toGeneric(context.pattern);
		if (fieldInfo.isGlobal) {
			genericPattern.patternRows[context.selectedRow][fieldInfo.fieldKey] = newValue;
		} else {
			genericPattern.channels[fieldInfo.channelIndex].rows[context.selectedRow][
				fieldInfo.fieldKey
			] = newValue;
		}
		return context.converter.fromGeneric(genericPattern);
	}

	static getFieldValue(context: EditingContext, fieldInfo: FieldInfo): string | number {
		const genericPattern = context.converter.toGeneric(context.pattern);
		if (fieldInfo.isGlobal) {
			const patternRow = genericPattern.patternRows[context.selectedRow];
			return (patternRow[fieldInfo.fieldKey] as string | number) || 0;
		} else {
			const channel = genericPattern.channels[fieldInfo.channelIndex];
			const row = channel.rows[context.selectedRow];
			return (row[fieldInfo.fieldKey] as string | number) || 0;
		}
	}

	static getFieldDefinition(
		context: EditingContext,
		fieldKey: string
	): { key: string; type: string; length: number } | null {
		const field = context.schema.fields[fieldKey] || context.schema.globalFields?.[fieldKey];
		return field ? { key: fieldKey, type: field.type, length: field.length } : null;
	}
}


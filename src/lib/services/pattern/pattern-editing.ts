import type { Pattern } from '../../models/song';
import type { EditingContext, FieldInfo } from './editing/editing-context';
import { PatternFieldDetection } from './editing/pattern-field-detection';
import { PatternNoteInput } from './editing/pattern-note-input';
import { PatternFieldInput } from './editing/pattern-field-input';
import { PatternDeleteHandler } from './editing/pattern-delete-handler';

export type { EditingContext, FieldInfo } from './editing/editing-context';

export class PatternEditingService {
	static getFieldAtCursor(context: EditingContext): FieldInfo | null {
		return PatternFieldDetection.detectFieldAtCursor(context);
	}

	static handleKeyInput(
		context: EditingContext,
		key: string
	): { updatedPattern: Pattern; shouldMoveNext: boolean } | null {
		if (key === 'Delete' || key === 'Backspace') {
			return PatternDeleteHandler.handleDelete(context);
		}

		const fieldInfo = this.getFieldAtCursor(context);
		if (!fieldInfo) {
			return null;
		}

		switch (fieldInfo.fieldType) {
			case 'note':
				return PatternNoteInput.handleNoteInput(context, fieldInfo, key);
			case 'hex':
				return PatternFieldInput.handleHexInput(context, fieldInfo, key);
			case 'dec':
				return PatternFieldInput.handleDecInput(context, fieldInfo, key);
			case 'symbol':
				return PatternFieldInput.handleSymbolInput(context, fieldInfo, key);
			case 'text':
				return PatternFieldInput.handleTextInput(context, fieldInfo, key);
			default:
				return null;
		}
	}
}

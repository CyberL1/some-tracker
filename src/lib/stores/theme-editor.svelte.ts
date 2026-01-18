import type { Theme } from '../types/theme';

let editingTheme = $state<{ theme: Theme; isNew: boolean } | null>(null);
let onSaveCallback = $state<(() => void) | null>(null);

export const themeEditorStore = {
	get editingTheme() {
		return editingTheme;
	},
	setEditingTheme(theme: Theme | null, isNew: boolean, onSave?: () => void) {
		editingTheme = theme ? { theme, isNew } : null;
		onSaveCallback = onSave || null;
	},
	get onSaveCallback() {
		return onSaveCallback;
	}
};

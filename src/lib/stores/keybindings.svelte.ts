import { BINDABLE_ACTIONS } from '../config/keybindings';
import { ShortcutString } from '../utils/shortcut-string';

const STORAGE_KEY = 'keybindings';

const defaults: Record<string, string> = Object.fromEntries(
	BINDABLE_ACTIONS.map((a) => [a.id, a.defaultShortcut])
);

let overridesState = $state<Record<string, string>>({});

const conflictingActionIds = $derived.by(() => {
	const byShortcut = new Map<string, string[]>();
	for (const action of BINDABLE_ACTIONS) {
		const shortcut = ShortcutString.normalizeForComparison(
			overridesState[action.id] ?? defaults[action.id] ?? ''
		);
		const list = byShortcut.get(shortcut) ?? [];
		list.push(action.id);
		byShortcut.set(shortcut, list);
	}
	const ids = new Set<string>();
	for (const list of byShortcut.values()) {
		if (list.length > 1) {
			for (const id of list) ids.add(id);
		}
	}
	return ids;
});

function loadOverrides(): Record<string, string> {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return {};
		const parsed = JSON.parse(raw) as Record<string, string>;
		return typeof parsed === 'object' && parsed !== null ? parsed : {};
	} catch {
		return {};
	}
}

function saveOverrides(overrides: Record<string, string>): void {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
}

export const keybindingsStore = {
	init() {
		overridesState = loadOverrides();
	},

	getShortcut(actionId: string): string {
		return overridesState[actionId] ?? defaults[actionId] ?? '';
	},

	setShortcut(actionId: string, shortcut: string): void {
		if (!(actionId in defaults)) return;
		overridesState = { ...overridesState, [actionId]: shortcut };
		saveOverrides(overridesState);
	},

	resetShortcut(actionId: string): void {
		const next = { ...overridesState };
		delete next[actionId];
		overridesState = next;
		saveOverrides(overridesState);
	},

	resetAll(): void {
		overridesState = {};
		saveOverrides(overridesState);
	},

	getActionForShortcut(shortcut: string): string | null {
		const normalized = ShortcutString.normalizeForComparison(shortcut);
		for (const action of BINDABLE_ACTIONS) {
			const effective = this.getShortcut(action.id);
			if (ShortcutString.normalizeForComparison(effective) === normalized) {
				return action.id;
			}
		}
		return null;
	},

	get conflictingActionIds(): Set<string> {
		return conflictingActionIds;
	}
};

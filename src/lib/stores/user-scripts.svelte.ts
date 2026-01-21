import type { UserScript } from '../services/user-scripts/types';
import { defaultUserScripts } from '../config/user-scripts';

const STORAGE_KEY = 'user-scripts';

let customScripts = $state<UserScript[]>([]);

function loadFromStorage(): UserScript[] {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			return JSON.parse(stored) as UserScript[];
		}
	} catch (e) {
		console.error('Failed to load user scripts from storage:', e);
	}
	return [];
}

function saveToStorage(scripts: UserScript[]): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(scripts));
	} catch (e) {
		console.error('Failed to save user scripts to storage:', e);
	}
}

export const userScriptsStore = {
	init() {
		customScripts = loadFromStorage();
	},

	get scripts(): UserScript[] {
		return [...defaultUserScripts, ...customScripts];
	},

	get customScripts(): UserScript[] {
		return customScripts;
	},

	get defaultScripts(): UserScript[] {
		return defaultUserScripts;
	},

	isBuiltIn(scriptId: string): boolean {
		return defaultUserScripts.some((s) => s.id === scriptId);
	},

	add(script: UserScript): void {
		const existingIndex = customScripts.findIndex((s) => s.id === script.id);
		if (existingIndex >= 0) {
			customScripts = [
				...customScripts.slice(0, existingIndex),
				script,
				...customScripts.slice(existingIndex + 1)
			];
		} else {
			customScripts = [...customScripts, script];
		}
		saveToStorage(customScripts);
	},

	update(script: UserScript): void {
		const index = customScripts.findIndex((s) => s.id === script.id);
		if (index >= 0) {
			customScripts = [
				...customScripts.slice(0, index),
				script,
				...customScripts.slice(index + 1)
			];
			saveToStorage(customScripts);
		}
	},

	remove(scriptId: string): void {
		customScripts = customScripts.filter((s) => s.id !== scriptId);
		saveToStorage(customScripts);
	},

	exportScript(script: UserScript): string {
		return JSON.stringify(script, null, 2);
	},

	exportAll(): string {
		return JSON.stringify(customScripts, null, 2);
	},

	importScript(json: string): UserScript | null {
		try {
			const script = JSON.parse(json) as UserScript;
			if (script.id && script.name && script.code) {
				return script;
			}
		} catch (e) {
			console.error('Failed to parse script JSON:', e);
		}
		return null;
	},

	importAll(json: string): UserScript[] {
		try {
			const scripts = JSON.parse(json) as UserScript[];
			if (Array.isArray(scripts)) {
				return scripts.filter((s) => s.id && s.name && s.code);
			}
		} catch (e) {
			console.error('Failed to parse scripts JSON:', e);
		}
		return [];
	}
};

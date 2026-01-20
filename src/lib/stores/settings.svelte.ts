import type { Settings } from '../components/Settings/types';
import { settingsItems } from '../config/settings';

const STORAGE_KEY = 'settings';
let settingsState = $state({} as Settings);

export const settingsStore = {
	init() {
		const settings = localStorage.getItem(STORAGE_KEY);

		const defaultSettings: Partial<Settings> = {};
		for (const item of settingsItems) {
			defaultSettings[item.setting] = item.defaultValue as never;
		}

		if (settings) {
			const parsedSettings = JSON.parse(settings) as Partial<Settings>;
			settingsState = { ...defaultSettings, ...parsedSettings } as Settings;
			localStorage.setItem(STORAGE_KEY, JSON.stringify(settingsState));
		} else {
			settingsState = defaultSettings as Settings;
			localStorage.setItem(STORAGE_KEY, JSON.stringify(settingsState));
		}
	},
	get state() {
		return settingsState;
	},
	get: (): Settings => {
		return settingsState;
	},
	set: <K extends keyof Settings>(key: K, value: Settings[K]) => {
		settingsState = { ...settingsState, [key]: value };
		localStorage.setItem(STORAGE_KEY, JSON.stringify(settingsState));
	}
};

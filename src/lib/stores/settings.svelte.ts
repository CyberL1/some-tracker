import type { Settings } from '../components/Settings/types';
import { settingsItems } from '../config/settings';

const STORAGE_KEY = 'settings';
let settingsState = $state({} as Settings);

export const settingsStore = {
	init() {
		const settings = localStorage.getItem(STORAGE_KEY);

		if (settings) {
			settingsState = JSON.parse(settings) as Settings;
		} else {
			const initialSettings: Partial<Settings> = {};
			for (const item of settingsItems) {
				initialSettings[item.setting] = item.defaultValue as never;
			}
			settingsState = initialSettings as Settings;
			localStorage.setItem(STORAGE_KEY, JSON.stringify(settingsState));
		}
	},
	get: (): Settings => {
		return settingsState;
	},
	set: <K extends keyof Settings>(key: K, value: Settings[K]) => {
		settingsState = { ...settingsState, [key]: value };
		localStorage.setItem(STORAGE_KEY, JSON.stringify(settingsState));
	}
};

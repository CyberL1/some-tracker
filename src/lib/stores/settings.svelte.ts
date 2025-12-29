import type { Settings } from "../components/Settings/types";
import { settingsItems } from "../config/settings";

const STORAGE_KEY = "settings";
let settingsState = $state({} as Settings);

export const settingsStore = {
  init() {
    const settings = localStorage.getItem(STORAGE_KEY);

    if (settings) {
      settingsState = JSON.parse(settings);
    } else {
      settingsItems.map((item) => settingsState[item.setting] = item.defaultValue);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settingsState));
    }
  },
  get: (): Settings => {
    return settingsState;
  },
  set: (key: keyof Settings, value: any) => {
    const settings = localStorage.getItem(STORAGE_KEY);

    if (settings) {
      settingsState[key] = value;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settingsState));
    }
  }
}

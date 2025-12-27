interface Settings {
  volume: number;
}

export const defaultSettings: Settings = {
  volume: 100
}

const STORAGE_KEY = "settings";
let settingsState = $state(defaultSettings);

export const settingsStore = {
  init() {
    const settings = localStorage.getItem(STORAGE_KEY);

    if (settings) {
      settingsState = JSON.parse(settings);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultSettings));
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

export interface Settings {
  volume: number;
}

export interface SettingsItem {
  label: string;
  description: string;
  type: string;
  defaultValue: any;
  setting: keyof Settings;
}

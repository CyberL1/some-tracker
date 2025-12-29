import type { SettingsItem } from '../components/Settings/types';

export const settingsItems: SettingsItem[] = [
  {
    label: 'Volume',
    description: "Changes the volume, duh",
    type: 'range',
    defaultValue: 100,
    setting: 'volume'
  }
];

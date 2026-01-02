export interface Settings {
	volume: number;
	showVisualGrid: boolean;
}

export interface SettingsItem {
	label: string;
	description: string;
	type: string;
	defaultValue: any;
	setting: keyof Settings;
}

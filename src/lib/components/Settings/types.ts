export interface Settings {
	volume: number;
	showVisualGrid: boolean;
	envelopeAsNote: boolean;
	patternEditorFontSize: number;
	patternEditorFontFamily: string;
	uiFontFamily: string;
	channelSeparatorWidth: number;
}

export interface SettingsItem {
	label: string;
	description: string;
	type: string;
	defaultValue: any;
	setting: keyof Settings;
	category?: 'general' | 'keyboard' | 'appearance';
	min?: number;
	max?: number;
	step?: number;
	options?: { value: string; label: string }[];
}

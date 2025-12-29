export type FieldType = 'note' | 'hex' | 'symbol' | 'dec' | 'text';

export interface ChipField {
	key: string;
	type: FieldType;
	length: number;
	color?: string;
	selectable?: 'atomic' | 'character';
	skip?: boolean;
}

export type SettingType = 'text' | 'number' | 'select' | 'toggle';

export interface SettingOption {
	label: string;
	value: string | number;
}

export interface ChipSetting {
	key: string;
	label: string;
	type: SettingType;
	options?: SettingOption[];
	defaultValue?: unknown;
	group?: string;
	notifyAudioService?: boolean;
}

export interface ChipSchema {
	chipType: string;
	template: string;
	fields: Record<string, ChipField>;
	globalTemplate?: string;
	globalFields?: Record<string, ChipField>;
	settings?: ChipSetting[];
}

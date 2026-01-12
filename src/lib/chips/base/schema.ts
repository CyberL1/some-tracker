export type FieldType = 'note' | 'hex' | 'symbol' | 'dec' | 'text';

export interface ChipField {
	key: string;
	type: FieldType;
	length: number;
	color?: string;
	selectable?: 'atomic' | 'character';
	skip?: boolean;
	defaultValue?: unknown;
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
	channelLabels?: string[];
	settings?: ChipSetting[];
}

export function applySchemaDefaults<T extends object>(target: T, schema: ChipSchema): void {
	if (!schema.settings) return;

	for (const setting of schema.settings) {
		if (setting.defaultValue !== undefined) {
			const key = setting.key;
			const currentValue = (target as any)[key];
			if (currentValue === undefined) {
				(target as any)[key] = setting.defaultValue;
			}
		}
	}
}

export function getDefaultForFieldType(type: FieldType): unknown {
	switch (type) {
		case 'hex':
		case 'dec':
		case 'symbol':
			return 0;
		case 'note':
			return null;
		case 'text':
			return '';
		default:
			return 0;
	}
}

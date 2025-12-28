export type FieldType = 'note' | 'hex' | 'symbol' | 'dec' | 'text';

export interface ChipField {
	key: string;
	type: FieldType;
	length: number;
	color?: string;
	selectable?: 'atomic' | 'character';
	skip?: boolean;
}

export interface ChipSchema {
	chipType: string;
	template: string;
	fields: Record<string, ChipField>;
	globalTemplate?: string;
	globalFields?: Record<string, ChipField>;
}

export interface GenericRow {
	[key: string]: string | number | null | undefined;
}

export interface GenericPatternRow {
	[key: string]: string | number | null | undefined;
}

export interface GenericChannel {
	rows: GenericRow[];
}

export interface GenericPattern {
	id: number;
	length: number;
	channels: GenericChannel[];
	patternRows: GenericPatternRow[];
}


export interface ScriptRowData {
	rowIndex: number;
	channelIndex: number;
	note: string;
	volume: number;
	instrument: number;
	table: number;
	envelopeShape: number;
	envelopeValue: number;
	envelopeEffect: {
		effect: number;
		delay: number;
		parameter: number;
		tableIndex?: number;
	} | null;
	effect: {
		effect: number;
		delay: number;
		parameter: number;
		tableIndex?: number;
	} | null;
}

export interface ScriptContext {
	rows: ScriptRowData[];
	selection: {
		minRow: number;
		maxRow: number;
		minCol: number;
		maxCol: number;
	};
	patternLength: number;
	channelCount: number;
}

export interface ScriptResult {
	rows: ScriptRowData[];
}

export type UserScriptFunction = (context: ScriptContext) => ScriptResult;

export interface UserScript {
	id: string;
	name: string;
	description: string;
	code: string;
}

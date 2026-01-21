import { LuaFactory } from 'wasmoon';
import type { ScriptContext, ScriptResult, ScriptRowData } from './types';

let luaFactory: LuaFactory | null = null;

async function getFactory(): Promise<LuaFactory> {
	if (!luaFactory) {
		luaFactory = new LuaFactory();
	}
	return luaFactory;
}

export class LuaExecutor {
	static async execute(code: string, context: ScriptContext): Promise<ScriptResult> {
		const factory = await getFactory();
		const lua = await factory.createEngine();

		try {
			lua.global.set('rows', context.rows);
			lua.global.set('selection', context.selection);
			lua.global.set('patternLength', context.patternLength);
			lua.global.set('channelCount', context.channelCount);

			await lua.doString(code);

			const resultRows = lua.global.get('rows') as ScriptRowData[];

			return { rows: this.normalizeRows(resultRows) };
		} finally {
			lua.global.close();
		}
	}

	private static normalizeRows(rows: any[]): ScriptRowData[] {

		//ay for now
		return rows.map((row) => ({
			rowIndex: row.rowIndex ?? 0,
			channelIndex: row.channelIndex ?? 0,
			note: row.note ?? '---',
			volume: row.volume ?? 0,
			instrument: row.instrument ?? 0,
			table: row.table_ ?? row.table ?? 0,
			envelopeShape: row.envelopeShape ?? 0,
			effect:
				row.effect && typeof row.effect === 'object'
					? {
							effect: row.effect.effect ?? 0,
							delay: row.effect.delay ?? 0,
							parameter: row.effect.parameter ?? 0
						}
					: null
		}));
	}
}

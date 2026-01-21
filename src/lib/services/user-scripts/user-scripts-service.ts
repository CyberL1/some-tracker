import type { Pattern } from '../../models/song';
import type { SelectionBounds } from '../pattern/selection-bounds-service';
import type { PatternConverter } from '../../chips/base/adapter';
import type {
	ScriptRowData,
	ScriptContext,
	ScriptResult,
	UserScript
} from './types';
import { isEffectLike, toNumber } from '../../utils/type-guards';
import { LuaExecutor } from './lua-executor';

export interface ScriptExtractionContext {
	pattern: Pattern;
	bounds: SelectionBounds;
	converter: PatternConverter;
	selectedChannels: Set<number>;
}

export class UserScriptsService {
	static extractSelectionData(context: ScriptExtractionContext): ScriptRowData[] {
		const { pattern, bounds, converter, selectedChannels } = context;
		const genericPattern = converter.toGeneric(pattern);
		const rows: ScriptRowData[] = [];

		for (let rowIndex = bounds.minRow; rowIndex <= bounds.maxRow; rowIndex++) {
			for (let channelIndex = 0; channelIndex < genericPattern.channels.length; channelIndex++) {
				if (!selectedChannels.has(channelIndex)) continue;

				const channel = genericPattern.channels[channelIndex];
				const row = channel.rows[rowIndex];
				const effectValue = row.effect;
				const effect = isEffectLike(effectValue) ? effectValue : null;

				rows.push({
					rowIndex,
					channelIndex,
					note: (row.note as string) ?? '---',
					volume: toNumber(row.volume),
					instrument: toNumber(row.instrument),
					table: toNumber(row.table),
					envelopeShape: toNumber(row.envelopeShape),
					effect: effect
						? {
								effect: effect.effect,
								delay: effect.delay,
								parameter: effect.parameter
							}
						: null
				});
			}
		}

		return rows;
	}

	static createScriptContext(context: ScriptExtractionContext): ScriptContext {
		const { pattern, bounds } = context;
		const rows = this.extractSelectionData(context);

		return {
			rows,
			selection: {
				minRow: bounds.minRow,
				maxRow: bounds.maxRow,
				minCol: bounds.minCol,
				maxCol: bounds.maxCol
			},
			patternLength: pattern.length,
			channelCount: pattern.channels.length
		};
	}

	static applyScriptResult(
		pattern: Pattern,
		result: ScriptResult,
		converter: PatternConverter
	): Pattern {
		const genericPattern = converter.toGeneric(pattern);

		for (const rowData of result.rows) {
			const channel = genericPattern.channels[rowData.channelIndex];
			if (!channel) continue;

			const row = channel.rows[rowData.rowIndex];
			if (!row) continue;

			row.note = rowData.note;
			row.volume = rowData.volume;
			row.instrument = rowData.instrument;
			row.table = rowData.table;
			row.envelopeShape = rowData.envelopeShape;

			if (rowData.effect) {
				row.effect = {
					effect: rowData.effect.effect,
					delay: rowData.effect.delay,
					parameter: rowData.effect.parameter
				};
			}
		}

		return converter.fromGeneric(genericPattern);
	}

	static async executeScript(script: UserScript, context: ScriptContext): Promise<ScriptResult> {
		return LuaExecutor.execute(script.code, context);
	}

	static async runScript(
		script: UserScript,
		context: ScriptExtractionContext
	): Promise<Pattern> {
		const scriptContext = this.createScriptContext(context);
		const result = await this.executeScript(script, scriptContext);
		return this.applyScriptResult(context.pattern, result, context.converter);
	}
}

import type { Pattern } from '../../models/song';

export interface EnvelopeModeContext {
	patterns: Pattern[];
}

export interface EnvelopeModeResult {
	updatedPatterns: Pattern[];
	shouldRedraw: boolean;
}

export class EnvelopeModeService {
	static handleModeChange(
		context: EnvelopeModeContext,
		oldMode: boolean,
		newMode: boolean
	): EnvelopeModeResult {
		if (oldMode === newMode) {
			return {
				updatedPatterns: context.patterns,
				shouldRedraw: false
			};
		}

		return {
			updatedPatterns: [...context.patterns],
			shouldRedraw: true
		};
	}
}

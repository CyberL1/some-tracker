import type { Pattern } from '../../models/song';
import type { GenericPattern } from '../../models/song/generic';

export interface PatternConverter {
	toGeneric(chipPattern: Pattern): GenericPattern;
	fromGeneric(generic: GenericPattern): Pattern;
}


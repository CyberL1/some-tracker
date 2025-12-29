import type { Pattern } from '../song';
import type { GenericPattern } from '../song/generic';

export interface PatternConverter {
	toGeneric(chipPattern: Pattern): GenericPattern;
	fromGeneric(generic: GenericPattern): Pattern;
}


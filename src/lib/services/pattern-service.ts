import { Pattern, Note, Effect } from '../models/song';

export class PatternService {
	/**
	 * Find the next available pattern ID
	 */
	static findNextAvailablePatternId(
		patterns: Record<number, Pattern>,
		patternOrder: number[]
	): number {
		const usedPatternIds = new Set([...patternOrder, ...Object.keys(patterns).map(Number)]);

		let newPatternId = 0;
		while (usedPatternIds.has(newPatternId)) {
			newPatternId++;
		}

		return newPatternId;
	}

	/**
	 * Create a new empty pattern
	 */
	static createEmptyPattern(id: number): Pattern {
		return new Pattern(id);
	}

	/**
	 * Create a deep copy of a pattern with a new ID
	 */
	static clonePattern(sourcePattern: Pattern, newId: number): Pattern {
		const clonedPattern = new Pattern(newId, sourcePattern.length);

		// Deep copy channels
		sourcePattern.channels.forEach((channel, channelIndex) => {
			channel.rows.forEach((row, rowIndex) => {
				const newRow = clonedPattern.channels[channelIndex].rows[rowIndex];
				newRow.note = new Note(row.note.name, row.note.octave);
				newRow.instrument = row.instrument;
				newRow.volume = row.volume;
				newRow.table = row.table;
				newRow.envelopeShape = row.envelopeShape;
				newRow.effects = row.effects.map((effect) =>
					effect ? new Effect(effect.effect, effect.delay, effect.parameter) : null
				);
			});
		});

		// Deep copy pattern rows
		sourcePattern.patternRows.forEach((patternRow, index) => {
			const newPatternRow = clonedPattern.patternRows[index];
			newPatternRow.envelopeValue = patternRow.envelopeValue;
			newPatternRow.noiseValue = patternRow.noiseValue;
			newPatternRow.envelopeEffect = patternRow.envelopeEffect
				? new Effect(
						patternRow.envelopeEffect.effect,
						patternRow.envelopeEffect.delay,
						patternRow.envelopeEffect.parameter
					)
				: null;
		});

		return clonedPattern;
	}

	/**
	 * Add a new empty pattern after the specified index
	 */
	static addPatternAfter(
		patterns: Record<number, Pattern>,
		patternOrder: number[],
		index: number
	): {
		newPatterns: Record<number, Pattern>;
		newPatternOrder: number[];
		newPatternId: number;
		insertIndex: number;
	} {
		const newPatternId = this.findNextAvailablePatternId(patterns, patternOrder);
		const newPattern = this.createEmptyPattern(newPatternId);

		const newPatterns = { ...patterns, [newPatternId]: newPattern };
		const newPatternOrder = [...patternOrder];
		const insertIndex = index + 1;

		newPatternOrder.splice(insertIndex, 0, newPatternId);

		return {
			newPatterns,
			newPatternOrder,
			newPatternId,
			insertIndex
		};
	}

	/**
	 * Remove a pattern at the specified index
	 */
	static removePatternAt(
		patternOrder: number[],
		index: number
	): {
		newPatternOrder: number[];
		adjustedCurrentIndex: number;
	} {
		if (patternOrder.length <= 1) {
			return {
				newPatternOrder: patternOrder,
				adjustedCurrentIndex: index
			};
		}

		const newPatternOrder = [...patternOrder];
		newPatternOrder.splice(index, 1);

		// Calculate adjusted current index
		let adjustedCurrentIndex = index;
		if (adjustedCurrentIndex >= newPatternOrder.length) {
			adjustedCurrentIndex = newPatternOrder.length - 1;
		}

		return {
			newPatternOrder,
			adjustedCurrentIndex
		};
	}

	/**
	 * Clone a pattern and insert it after the specified index
	 */
	static clonePatternAfter(
		patterns: Record<number, Pattern>,
		patternOrder: number[],
		index: number,
		targetPattern: Pattern
	): {
		newPatterns: Record<number, Pattern>;
		newPatternOrder: number[];
		newPatternId: number;
		insertIndex: number;
	} | null {
		if (!targetPattern) return null;

		const newPatternId = this.findNextAvailablePatternId(patterns, patternOrder);
		const clonedPattern = this.clonePattern(targetPattern, newPatternId);

		const newPatterns = { ...patterns, [newPatternId]: clonedPattern };
		const newPatternOrder = [...patternOrder];
		const insertIndex = index + 1;

		newPatternOrder.splice(insertIndex, 0, newPatternId);

		return {
			newPatterns,
			newPatternOrder,
			newPatternId,
			insertIndex
		};
	}

	/**
	 * Make a pattern unique by creating a copy with a new ID and replacing it at the specified index
	 */
	static makePatternUnique(
		patterns: Record<number, Pattern>,
		patternOrder: number[],
		index: number,
		targetPattern: Pattern
	): {
		newPatterns: Record<number, Pattern>;
		newPatternOrder: number[];
		newPatternId: number;
	} | null {
		if (!targetPattern) return null;

		const newPatternId = this.findNextAvailablePatternId(patterns, patternOrder);
		const uniquePattern = this.clonePattern(targetPattern, newPatternId);

		const newPatterns = { ...patterns, [newPatternId]: uniquePattern };
		const newPatternOrder = [...patternOrder];

		// Replace the pattern ID at this position with the new unique pattern
		newPatternOrder[index] = newPatternId;

		return {
			newPatterns,
			newPatternOrder,
			newPatternId
		};
	}

	/**
	 * Calculate adjusted current pattern index after a removal operation
	 */
	static calculateAdjustedIndex(
		currentIndex: number,
		removedIndex: number,
		newPatternOrderLength: number
	): number {
		if (currentIndex < removedIndex) {
			return currentIndex;
		} else if (currentIndex === removedIndex) {
			return Math.min(currentIndex, newPatternOrderLength - 1);
		} else {
			return currentIndex - 1;
		}
	}

	/**
	 * Change the pattern ID at a specific position in the pattern order
	 */
	static setPatternIdInOrder(
		patterns: Record<number, Pattern>,
		patternOrder: number[],
		index: number,
		newId: number,
		currentPattern?: Pattern
	): {
		newPatterns: Record<number, Pattern>;
		newPatternOrder: number[];
	} | null {
		if (newId < 0 || newId > 99) return null;

		if (!patterns[newId]) {
			const newPattern = currentPattern
				? this.clonePattern(currentPattern, newId)
				: this.createEmptyPattern(newId);
			patterns = { ...patterns, [newId]: newPattern };
		}

		const newPatternOrder = patternOrder.map((id, i) => (i === index ? newId : id));

		return {
			newPatterns: patterns,
			newPatternOrder
		};
	}
}

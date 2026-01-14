import { describe, it, expect } from 'vitest';
import { EnvelopeModeService } from '../../../../src/lib/services/pattern/envelope-mode-service';
import { Pattern } from '../../../../src/lib/models/song';
import { AY_CHIP_SCHEMA } from '../../../../src/lib/chips/ay/schema';

describe('EnvelopeModeService', () => {
	describe('handleModeChange', () => {
		it('should not update patterns when mode does not change', () => {
			const pattern1 = new Pattern(0, 64, AY_CHIP_SCHEMA);
			const pattern2 = new Pattern(1, 64, AY_CHIP_SCHEMA);
			const patterns = [pattern1, pattern2];

			const result = EnvelopeModeService.handleModeChange(
				{ patterns },
				false,
				false
			);

			expect(result.shouldRedraw).toBe(false);
			expect(result.updatedPatterns).toBe(patterns);
		});

		it('should not update patterns when mode stays true', () => {
			const pattern1 = new Pattern(0, 64, AY_CHIP_SCHEMA);
			const patterns = [pattern1];

			const result = EnvelopeModeService.handleModeChange(
				{ patterns },
				true,
				true
			);

			expect(result.shouldRedraw).toBe(false);
			expect(result.updatedPatterns).toBe(patterns);
		});

		it('should create new patterns array when mode changes from false to true', () => {
			const pattern1 = new Pattern(0, 64, AY_CHIP_SCHEMA);
			const pattern2 = new Pattern(1, 64, AY_CHIP_SCHEMA);
			const patterns = [pattern1, pattern2];

			const result = EnvelopeModeService.handleModeChange(
				{ patterns },
				false,
				true
			);

			expect(result.shouldRedraw).toBe(true);
			expect(result.updatedPatterns).not.toBe(patterns);
			expect(result.updatedPatterns).toEqual(patterns);
			expect(result.updatedPatterns[0]).toBe(pattern1);
			expect(result.updatedPatterns[1]).toBe(pattern2);
		});

		it('should create new patterns array when mode changes from true to false', () => {
			const pattern1 = new Pattern(0, 64, AY_CHIP_SCHEMA);
			const patterns = [pattern1];

			const result = EnvelopeModeService.handleModeChange(
				{ patterns },
				true,
				false
			);

			expect(result.shouldRedraw).toBe(true);
			expect(result.updatedPatterns).not.toBe(patterns);
			expect(result.updatedPatterns).toEqual(patterns);
		});

		it('should preserve pattern instances when creating new array', () => {
			const pattern1 = new Pattern(0, 64, AY_CHIP_SCHEMA);
			const pattern2 = new Pattern(1, 32, AY_CHIP_SCHEMA);
			const pattern3 = new Pattern(2, 16, AY_CHIP_SCHEMA);
			const patterns = [pattern1, pattern2, pattern3];

			const result = EnvelopeModeService.handleModeChange(
				{ patterns },
				false,
				true
			);

			expect(result.updatedPatterns.length).toBe(3);
			expect(result.updatedPatterns[0]).toBe(pattern1);
			expect(result.updatedPatterns[1]).toBe(pattern2);
			expect(result.updatedPatterns[2]).toBe(pattern3);
		});

		it('should handle empty patterns array', () => {
			const patterns: Pattern[] = [];

			const result = EnvelopeModeService.handleModeChange(
				{ patterns },
				false,
				true
			);

			expect(result.shouldRedraw).toBe(true);
			expect(result.updatedPatterns).toEqual([]);
			expect(result.updatedPatterns).not.toBe(patterns);
		});
	});
});

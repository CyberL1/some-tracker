import { describe, it, expect } from 'vitest';
import {
	PT3TuneTables,
	generateTuningTable12TET,
	inferTuningTableSource,
	getTuningTableForSource,
	type TuningTableSource
} from '@/lib/models/pt3/tuning-tables';

describe('tuning-tables', () => {
	describe('generateTuningTable12TET', () => {
		it('returns 96 entries (Vortex Tracker layout, 8 octaves × 12 notes)', () => {
			const table = generateTuningTable12TET(1773400);
			expect(table).toHaveLength(96);
		});

		it('produces decreasing values for increasing note index (higher note = lower period)', () => {
			const table = generateTuningTable12TET(1773400);
			for (let i = 1; i < table.length; i++) {
				expect(table[i]).toBeLessThanOrEqual(table[i - 1]);
			}
		});

		it('values are positive and in expected range (period * 16)', () => {
			const table = generateTuningTable12TET(1773400);
			for (const v of table) {
				expect(v).toBeGreaterThan(0);
				expect(v).toBeLessThanOrEqual(4095 * 16);
			}
		});

		it('different clock produces different table', () => {
			const t1 = generateTuningTable12TET(1000000);
			const t2 = generateTuningTable12TET(2000000);
			expect(t1).not.toEqual(t2);
		});

		it('A4 at index 45 matches Vortex Tracker formula (440 Hz, 1.7734 MHz)', () => {
			const table = generateTuningTable12TET(1773400, 440);
			const periodAtA4 = Math.round(table[45] / 16);
			const expectedPeriod = Math.round((1773400 / 16) / 440);
			expect(periodAtA4).toBe(expectedPeriod);
			expect(periodAtA4).toBe(252);
		});
	});

	describe('inferTuningTableSource', () => {
		it('returns pt3-0 for PT3 table 0', () => {
			expect(inferTuningTableSource(PT3TuneTables[0])).toBe('pt3-0');
		});
		it('returns pt3-1 for PT3 table 1', () => {
			expect(inferTuningTableSource(PT3TuneTables[1])).toBe('pt3-1');
		});
		it('returns pt3-2 for PT3 table 2', () => {
			expect(inferTuningTableSource(PT3TuneTables[2])).toBe('pt3-2');
		});
		it('returns pt3-3 for PT3 table 3', () => {
			expect(inferTuningTableSource(PT3TuneTables[3])).toBe('pt3-3');
		});
		it('returns custom for 12TET generated table', () => {
			const table = generateTuningTable12TET(1773400);
			expect(inferTuningTableSource(table)).toBe('custom');
		});
		it('returns custom for modified table', () => {
			const modified = [...PT3TuneTables[2]];
			modified[0] = modified[0] + 1;
			expect(inferTuningTableSource(modified)).toBe('custom');
		});
		it('returns pt3-2 for normalized PT3 table 2 (period*16)', () => {
			const normalized = PT3TuneTables[2].map((v) => v * 16);
			expect(inferTuningTableSource(normalized)).toBe('pt3-2');
		});
	});

	describe('getTuningTableForSource', () => {
		it('returns normalized PT3 table (period*16) for pt3-0..pt3-3', () => {
			const sources: TuningTableSource[] = ['pt3-0', 'pt3-1', 'pt3-2', 'pt3-3'];
			for (let i = 0; i < sources.length; i++) {
				const table = getTuningTableForSource(sources[i], 1773400);
				const normalized = PT3TuneTables[i].map((v) => v * 16);
				expect(table).toEqual(normalized);
				expect(table).not.toBe(PT3TuneTables[i]);
			}
		});
		it('returns 12TET table for custom', () => {
			const table = getTuningTableForSource('custom', 1773400);
			expect(table).toHaveLength(96);
			expect(table).toEqual(generateTuningTable12TET(1773400));
		});
	});
});

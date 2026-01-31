import { describe, it, expect } from 'vitest';
import EffectAlgorithms from '../../public/effect-algorithms.js';

describe('EffectAlgorithms', () => {
	describe('initSlide', () => {
		it('returns step, delay, counter, current from parameter and delay', () => {
			const r = EffectAlgorithms.initSlide(5, 3);
			expect(r.step).toBe(5);
			expect(r.delay).toBe(3);
			expect(r.counter).toBe(3);
			expect(r.current).toBe(5);
		});

		it('when delay 0, counter is 1', () => {
			const r = EffectAlgorithms.initSlide(2, 0);
			expect(r.delay).toBe(0);
			expect(r.counter).toBe(1);
		});
	});

	describe('processSlideCounter', () => {
		it('when counter > 0 and newCounter > 0, decrements counter and keeps current', () => {
			const r = EffectAlgorithms.processSlideCounter(3, 2, 1, 10);
			expect(r.counter).toBe(2);
			expect(r.current).toBe(10);
		});

		it('when counter reaches 0, resets counter to delay and adds step to current', () => {
			const r = EffectAlgorithms.processSlideCounter(1, 2, 5, 10);
			expect(r.counter).toBe(2);
			expect(r.current).toBe(15);
		});

		it('when counter is 0, returns unchanged', () => {
			const r = EffectAlgorithms.processSlideCounter(0, 2, 5, 10);
			expect(r.counter).toBe(0);
			expect(r.current).toBe(10);
		});
	});

	describe('initPortamento', () => {
		it('step is positive when target > current', () => {
			const r = EffectAlgorithms.initPortamento(100, 200, 5, 1);
			expect(r.step).toBe(5);
			expect(r.delta).toBe(100);
			expect(r.active).toBe(true);
			expect(r.currentSliding).toBe(0);
		});

		it('step is negative when target < current', () => {
			const r = EffectAlgorithms.initPortamento(200, 100, 5, 1);
			expect(r.step).toBe(-5);
			expect(r.delta).toBe(-100);
		});

		it('delay 0 becomes 1', () => {
			const r = EffectAlgorithms.initPortamento(0, 100, 5, 0);
			expect(r.delay).toBe(1);
			expect(r.counter).toBe(1);
		});
	});

	describe('processPortamentoCounter', () => {
		it('when counter > 0 and newCounter > 0, decrements counter', () => {
			const r = EffectAlgorithms.processPortamentoCounter(2, 2, 5, 0, 100, 200, 100);
			expect(r.counter).toBe(1);
			expect(r.active).toBe(true);
		});

		it('when counter hits 0 and sliding reached delta, sets active false and baseValue to target', () => {
			const r = EffectAlgorithms.processPortamentoCounter(1, 2, 5, 100, 100, 200, 150);
			expect(r.counter).toBe(0);
			expect(r.currentSliding).toBe(0);
			expect(r.baseValue).toBe(200);
			expect(r.active).toBe(false);
		});

		it('when counter hits 0 but sliding not at delta, adds step and resets counter to delay', () => {
			const r = EffectAlgorithms.processPortamentoCounter(1, 2, 5, 50, 100, 200, 100);
			expect(r.counter).toBe(2);
			expect(r.currentSliding).toBe(55);
			expect(r.baseValue).toBe(100);
			expect(r.active).toBe(true);
		});
	});

	describe('initOnOff', () => {
		it('splits parameter into offDuration (low nibble) and onDuration (high nibble)', () => {
			const r = EffectAlgorithms.initOnOff(0x53);
			expect(r.onDuration).toBe(5);
			expect(r.offDuration).toBe(3);
			expect(r.counter).toBe(5);
			expect(r.enabled).toBe(true);
		});
	});

	describe('processOnOffCounter', () => {
		it('when counter > 0 and newCounter > 0, decrements and keeps enabled', () => {
			const r = EffectAlgorithms.processOnOffCounter(2, 3, 2, true);
			expect(r.counter).toBe(1);
			expect(r.enabled).toBe(true);
		});

		it('when counter hits 0, toggles enabled and sets counter to on or off duration', () => {
			const r = EffectAlgorithms.processOnOffCounter(1, 3, 2, true);
			expect(r.enabled).toBe(false);
			expect(r.counter).toBe(2);
			const r2 = EffectAlgorithms.processOnOffCounter(1, 3, 2, false);
			expect(r2.enabled).toBe(true);
			expect(r2.counter).toBe(3);
		});
	});

	describe('initArpeggio', () => {
		it('semitone1 and semitone2 from parameter nibbles', () => {
			const r = EffectAlgorithms.initArpeggio(0x37, 2);
			expect(r.semitone1).toBe(3);
			expect(r.semitone2).toBe(7);
			expect(r.delay).toBe(2);
			expect(r.counter).toBe(2);
			expect(r.position).toBe(0);
		});

		it('delay 0 becomes 1', () => {
			const r = EffectAlgorithms.initArpeggio(0x00, 0);
			expect(r.delay).toBe(1);
			expect(r.counter).toBe(1);
		});
	});

	describe('processArpeggioCounter', () => {
		it('when counter hits 0, position cycles 0->1->2->0', () => {
			let r = EffectAlgorithms.processArpeggioCounter(1, 2, 0);
			expect(r.position).toBe(1);
			expect(r.counter).toBe(2);
			r = EffectAlgorithms.processArpeggioCounter(1, 2, 1);
			expect(r.position).toBe(2);
			r = EffectAlgorithms.processArpeggioCounter(1, 2, 2);
			expect(r.position).toBe(0);
		});
	});

	describe('processArpeggioCounterTable', () => {
		it('when tableLength > 0 and position advances past end, wraps to tableLoop', () => {
			const r = EffectAlgorithms.processArpeggioCounterTable(1, 1, 2, 3, 1);
			expect(r.position).toBe(1);
			expect(r.counter).toBe(1);
		});

		it('when tableLength > 0, position increments', () => {
			const r = EffectAlgorithms.processArpeggioCounterTable(1, 1, 0, 5, -1);
			expect(r.position).toBe(1);
		});
	});

	describe('getArpeggioOffset', () => {
		it('position 0 returns 0', () => {
			expect(EffectAlgorithms.getArpeggioOffset(0, 3, 7)).toBe(0);
		});
		it('position 1 returns semitone1', () => {
			expect(EffectAlgorithms.getArpeggioOffset(1, 3, 7)).toBe(3);
		});
		it('position 2 returns semitone2', () => {
			expect(EffectAlgorithms.getArpeggioOffset(2, 3, 7)).toBe(7);
		});
	});

	describe('initVibrato', () => {
		it('speed and depth from parameter, delay 0 gives counter 1', () => {
			const r = EffectAlgorithms.initVibrato(0x42, 0);
			expect(r.speed).toBe(4);
			expect(r.depth).toBe(2);
			expect(r.delay).toBe(0);
			expect(r.counter).toBe(1);
			expect(r.position).toBe(0);
		});

		it('speed 0 becomes 1', () => {
			const r = EffectAlgorithms.initVibrato(0x02, 1);
			expect(r.speed).toBe(1);
		});
	});

	describe('processVibratoCounter', () => {
		it('when counter hits 0, position advances modulo speed*4', () => {
			const r = EffectAlgorithms.processVibratoCounter(1, 2, 2, 0);
			expect(r.position).toBe(1);
			expect(r.counter).toBe(2);
		});
	});

	describe('getVibratoOffset', () => {
		it('depth 0 returns 0', () => {
			expect(EffectAlgorithms.getVibratoOffset(0, 1, 5)).toBe(0);
		});

		it('first quarter of cycle: positive ramp', () => {
			expect(EffectAlgorithms.getVibratoOffset(0, 1, 4)).toBe(0);
			expect(EffectAlgorithms.getVibratoOffset(1, 1, 4)).toBe(4);
		});

		it('second quarter: positive to zero', () => {
			const r = EffectAlgorithms.getVibratoOffset(2, 1, 4);
			expect(r === 0 || Object.is(r, -0)).toBe(true);
		});

		it('third quarter: negative', () => {
			const r = EffectAlgorithms.getVibratoOffset(3, 1, 4);
			expect(r).toBeLessThanOrEqual(0);
		});

		it('fourth quarter: negative back to zero', () => {
			const r = EffectAlgorithms.getVibratoOffset(4, 1, 4);
			expect(r).toBe(-4 + 4);
		});
	});
});

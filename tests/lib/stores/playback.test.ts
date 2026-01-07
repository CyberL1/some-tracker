import { describe, it, expect, beforeEach } from 'vitest';
import { playbackStore } from '../../../src/lib/stores/playback.svelte';

describe('playbackStore', () => {
	describe('isPlaying', () => {
		it('should default to false', () => {
			expect(playbackStore.isPlaying).toBe(false);
		});

		it('should allow setting isPlaying to true', () => {
			playbackStore.isPlaying = true;
			expect(playbackStore.isPlaying).toBe(true);
		});

		it('should allow setting isPlaying to false', () => {
			playbackStore.isPlaying = false;
			expect(playbackStore.isPlaying).toBe(false);
		});

		it('should allow toggling between true and false', () => {
			playbackStore.isPlaying = true;
			expect(playbackStore.isPlaying).toBe(true);

			playbackStore.isPlaying = false;
			expect(playbackStore.isPlaying).toBe(false);

			playbackStore.isPlaying = true;
			expect(playbackStore.isPlaying).toBe(true);
		});
	});
});

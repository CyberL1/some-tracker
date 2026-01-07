import { describe, it, expect, beforeEach } from 'vitest';
import { channelMuteStore } from '../../../src/lib/stores/channel-mute.svelte';

describe('channelMuteStore', () => {
	beforeEach(() => {
		// Reset store state between tests
		(channelMuteStore as any).clear();
	});

	describe('isChannelMuted', () => {
		it('should return false for non-existent chips', () => {
			expect(channelMuteStore.isChannelMuted(999, 0)).toBe(false);
		});

		it('should return false for non-existent channels in existing chips', () => {
			channelMuteStore.setChannelMuted(0, 0, true);
			expect(channelMuteStore.isChannelMuted(0, 999)).toBe(false);
		});

		it('should return false for unset channels', () => {
			expect(channelMuteStore.isChannelMuted(0, 0)).toBe(false);
		});
	});

	describe('setChannelMuted', () => {
		it('should set channel to muted', () => {
			channelMuteStore.setChannelMuted(0, 0, true);
			expect(channelMuteStore.isChannelMuted(0, 0)).toBe(true);
		});

		it('should set channel to unmuted', () => {
			channelMuteStore.setChannelMuted(0, 0, true);
			channelMuteStore.setChannelMuted(0, 0, false);
			expect(channelMuteStore.isChannelMuted(0, 0)).toBe(false);
		});

		it('should handle multiple chips independently', () => {
			channelMuteStore.setChannelMuted(0, 0, true);
			channelMuteStore.setChannelMuted(1, 0, false);

			expect(channelMuteStore.isChannelMuted(0, 0)).toBe(true);
			expect(channelMuteStore.isChannelMuted(1, 0)).toBe(false);
		});

		it('should handle multiple channels within a chip', () => {
			channelMuteStore.setChannelMuted(0, 0, true);
			channelMuteStore.setChannelMuted(0, 1, false);
			channelMuteStore.setChannelMuted(0, 2, true);

			expect(channelMuteStore.isChannelMuted(0, 0)).toBe(true);
			expect(channelMuteStore.isChannelMuted(0, 1)).toBe(false);
			expect(channelMuteStore.isChannelMuted(0, 2)).toBe(true);
		});
	});

	describe('toggleChannel', () => {
		it('should toggle from false to true', () => {
			expect(channelMuteStore.isChannelMuted(0, 0)).toBe(false);
			channelMuteStore.toggleChannel(0, 0);
			expect(channelMuteStore.isChannelMuted(0, 0)).toBe(true);
		});

		it('should toggle from true to false', () => {
			channelMuteStore.setChannelMuted(0, 0, true);
			expect(channelMuteStore.isChannelMuted(0, 0)).toBe(true);

			channelMuteStore.toggleChannel(0, 0);
			expect(channelMuteStore.isChannelMuted(0, 0)).toBe(false);
		});

		it('should handle multiple toggles', () => {
			channelMuteStore.toggleChannel(0, 0); // false -> true
			expect(channelMuteStore.isChannelMuted(0, 0)).toBe(true);

			channelMuteStore.toggleChannel(0, 0); // true -> false
			expect(channelMuteStore.isChannelMuted(0, 0)).toBe(false);

			channelMuteStore.toggleChannel(0, 0); // false -> true
			expect(channelMuteStore.isChannelMuted(0, 0)).toBe(true);
		});

		it('should handle toggling different channels independently', () => {
			channelMuteStore.toggleChannel(0, 0);
			channelMuteStore.toggleChannel(0, 1);

			expect(channelMuteStore.isChannelMuted(0, 0)).toBe(true);
			expect(channelMuteStore.isChannelMuted(0, 1)).toBe(true);

			channelMuteStore.toggleChannel(0, 0);

			expect(channelMuteStore.isChannelMuted(0, 0)).toBe(false);
			expect(channelMuteStore.isChannelMuted(0, 1)).toBe(true);
		});
	});

	describe('getAllMuteStates', () => {
		it('should return a Map', () => {
			const result = channelMuteStore.getAllMuteStates();
			expect(result).toBeInstanceOf(Map);
		});

		it('should return a copy, not the original', () => {
			const result1 = channelMuteStore.getAllMuteStates();
			const result2 = channelMuteStore.getAllMuteStates();
			expect(result1).not.toBe(result2);
		});

		it('should include set mute states', () => {
			channelMuteStore.setChannelMuted(0, 0, true);
			channelMuteStore.setChannelMuted(0, 1, false);
			channelMuteStore.setChannelMuted(1, 0, true);

			const result = channelMuteStore.getAllMuteStates();

			expect(result.get(0)).toEqual([true, false]);
			expect(result.get(1)).toEqual([true]);
		});

		it('should return empty map when no states are set', () => {
			const result = channelMuteStore.getAllMuteStates();
			expect(result.size).toBe(0);
		});
	});
});

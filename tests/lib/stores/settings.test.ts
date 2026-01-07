import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { settingsStore } from '../../../src/lib/stores/settings.svelte';

// Mock localStorage
const localStorageMock = {
	getItem: vi.fn(),
	setItem: vi.fn(),
	removeItem: vi.fn(),
	clear: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
	value: localStorageMock,
	writable: true
});

describe('settingsStore', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Don't auto-init here, let individual tests handle initialization
	});

	afterEach(() => {
		// Clean up after each test
		localStorageMock.getItem.mockClear();
		localStorageMock.setItem.mockClear();
	});

	describe('init', () => {
		it('should load settings from localStorage if they exist', () => {
			const storedSettings = { volume: 75, showVisualGrid: false };
			localStorageMock.getItem.mockReturnValue(JSON.stringify(storedSettings));

			settingsStore.init();

			expect(localStorageMock.getItem).toHaveBeenCalledWith('settings');
			const result = settingsStore.get();
			expect(result.volume).toBe(75);
			expect(result.showVisualGrid).toBe(false);
		});

		it('should use default settings if localStorage is empty', () => {
			localStorageMock.getItem.mockReturnValue(null);

			settingsStore.init();

			expect(localStorageMock.getItem).toHaveBeenCalledWith('settings');
			expect(localStorageMock.setItem).toHaveBeenCalledWith(
				'settings',
				JSON.stringify({ volume: 100, showVisualGrid: true })
			);

			const result = settingsStore.get();
			expect(result.volume).toBe(100);
			expect(result.showVisualGrid).toBe(true);
		});

		it('should handle invalid JSON in localStorage gracefully', () => {
			localStorageMock.getItem.mockReturnValue('invalid json');

			// Should not throw and fall back to defaults
			expect(() => settingsStore.init()).not.toThrow();

			const result = settingsStore.get();
			expect(result.volume).toBe(100);
			expect(result.showVisualGrid).toBe(true);
		});
	});

	describe('get', () => {
		it('should return current settings', () => {
			localStorageMock.getItem.mockReturnValue(null);
			settingsStore.init();

			const result = settingsStore.get();
			expect(result).toHaveProperty('volume');
			expect(result).toHaveProperty('showVisualGrid');
		});

		it('should return a copy, not the original object', () => {
			localStorageMock.getItem.mockReturnValue(null);
			settingsStore.init();

			const result1 = settingsStore.get();
			const result2 = settingsStore.get();
			expect(result1).not.toBe(result2);
		});
	});

	describe('set', () => {
		beforeEach(() => {
			localStorageMock.getItem.mockReturnValue(null);
			settingsStore.init();
		});

		it('should update volume setting', () => {
			settingsStore.set('volume', 50);

			const result = settingsStore.get();
			expect(result.volume).toBe(50);
			expect(localStorageMock.setItem).toHaveBeenCalledWith(
				'settings',
				JSON.stringify({ volume: 50, showVisualGrid: true })
			);
		});

		it('should update showVisualGrid setting', () => {
			settingsStore.set('showVisualGrid', false);

			const result = settingsStore.get();
			expect(result.showVisualGrid).toBe(false);
			expect(localStorageMock.setItem).toHaveBeenCalledWith(
				'settings',
				JSON.stringify({ volume: 100, showVisualGrid: false })
			);
		});

		it('should handle multiple updates', () => {
			localStorageMock.getItem.mockReturnValue(null);
			settingsStore.init();

			settingsStore.set('volume', 25);
			settingsStore.set('showVisualGrid', false);

			const result = settingsStore.get();
			expect(result.volume).toBe(25);
			expect(result.showVisualGrid).toBe(false);

			expect(localStorageMock.setItem).toHaveBeenCalled();
		});

		it('should preserve other settings when updating one', () => {
			settingsStore.set('volume', 75);

			const result = settingsStore.get();
			expect(result.volume).toBe(75);
			expect(result.showVisualGrid).toBe(true); // Should remain unchanged
		});

		it('should save to localStorage after each update', () => {
			localStorageMock.getItem.mockReturnValue(null);
			settingsStore.init();

			const initialCalls = localStorageMock.setItem.mock.calls.length;

			settingsStore.set('volume', 80);
			expect(localStorageMock.setItem).toHaveBeenCalled();

			settingsStore.set('showVisualGrid', false);
			expect(localStorageMock.setItem.mock.calls.length).toBeGreaterThan(initialCalls + 1);
		});
	});

	describe('integration with stored data', () => {
		it('should load stored settings and allow updates', () => {
			const storedSettings = { volume: 60, showVisualGrid: true };
			localStorageMock.getItem.mockReturnValue(JSON.stringify(storedSettings));

			settingsStore.init();
			expect(settingsStore.get().volume).toBe(60);

			settingsStore.set('volume', 40);
			expect(settingsStore.get().volume).toBe(40);
			expect(localStorageMock.setItem).toHaveBeenCalledWith(
				'settings',
				JSON.stringify({ volume: 40, showVisualGrid: true })
			);
		});
	});
});

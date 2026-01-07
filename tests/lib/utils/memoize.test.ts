import { describe, it, expect, vi } from 'vitest';
import { Cache, memoize } from '../../../src/lib/utils/memoize';

describe('Cache', () => {
	describe('constructor', () => {
		it('should create cache with default max size', () => {
			const cache = new Cache();
			expect(cache).toBeInstanceOf(Cache);
		});

		it('should create cache with custom max size', () => {
			const cache = new Cache(50);
			expect(cache).toBeInstanceOf(Cache);
		});
	});

	describe('get and set', () => {
		it('should store and retrieve values', () => {
			const cache = new Cache<string, number>();
			cache.set('key1', 42);
			expect(cache.get('key1')).toBe(42);
		});

		it('should return undefined for non-existent keys', () => {
			const cache = new Cache<string, number>();
			expect(cache.get('nonexistent')).toBeUndefined();
		});
	});

	describe('has', () => {
		it('should return true for existing keys', () => {
			const cache = new Cache<string, number>();
			cache.set('key1', 42);
			expect(cache.has('key1')).toBe(true);
		});

		it('should return false for non-existent keys', () => {
			const cache = new Cache<string, number>();
			expect(cache.has('nonexistent')).toBe(false);
		});
	});

	describe('delete', () => {
		it('should remove existing keys', () => {
			const cache = new Cache<string, number>();
			cache.set('key1', 42);
			expect(cache.has('key1')).toBe(true);

			cache.delete('key1');
			expect(cache.has('key1')).toBe(false);
			expect(cache.get('key1')).toBeUndefined();
		});

		it('should handle deleting non-existent keys', () => {
			const cache = new Cache<string, number>();
			expect(() => cache.delete('nonexistent')).not.toThrow();
		});
	});

	describe('clear', () => {
		it('should remove all entries', () => {
			const cache = new Cache<string, number>();
			cache.set('key1', 42);
			cache.set('key2', 24);
			expect(cache.has('key1')).toBe(true);
			expect(cache.has('key2')).toBe(true);

			cache.clear();
			expect(cache.has('key1')).toBe(false);
			expect(cache.has('key2')).toBe(false);
		});
	});

	describe('invalidate', () => {
		it('should remove entries matching predicate', () => {
			const cache = new Cache<string, number>();
			cache.set('key1', 42);
			cache.set('key2', 24);
			cache.set('key3', 12);

			cache.invalidate((key) => key.startsWith('key'));
			expect(cache.has('key1')).toBe(false);
			expect(cache.has('key2')).toBe(false);
			expect(cache.has('key3')).toBe(false);
		});

		it('should only remove entries matching predicate', () => {
			const cache = new Cache<string, number>();
			cache.set('keep1', 42);
			cache.set('remove1', 24);
			cache.set('keep2', 12);

			cache.invalidate((key) => key.startsWith('remove'));
			expect(cache.has('keep1')).toBe(true);
			expect(cache.has('remove1')).toBe(false);
			expect(cache.has('keep2')).toBe(true);
		});
	});

	describe('max size', () => {
		it('should evict oldest entry when max size is reached', () => {
			const cache = new Cache<string, number>(2);
			cache.set('key1', 1);
			cache.set('key2', 2);
			expect(cache.has('key1')).toBe(true);
			expect(cache.has('key2')).toBe(true);

			cache.set('key3', 3);
			expect(cache.has('key1')).toBe(false); // Should be evicted
			expect(cache.has('key2')).toBe(true);
			expect(cache.has('key3')).toBe(true);
		});

		it('should not evict when updating existing key', () => {
			const cache = new Cache<string, number>(2);
			cache.set('key1', 1);
			cache.set('key2', 2);
			cache.set('key1', 10); // Update existing key

			expect(cache.get('key1')).toBe(10);
			expect(cache.has('key2')).toBe(true);
		});
	});
});

describe('memoize', () => {
	it('should cache function results', () => {
		let callCount = 0;
		const expensiveFunction = (x: number) => {
			callCount++;
			return x * 2;
		};

		const memoized = memoize(expensiveFunction);

		expect(memoized(5)).toBe(10);
		expect(callCount).toBe(1);

		expect(memoized(5)).toBe(10); // Should use cache
		expect(callCount).toBe(1); // Should not increment

		expect(memoized(3)).toBe(6);
		expect(callCount).toBe(2); // Should increment for new argument
	});

	it('should use custom key function', () => {
		let callCount = 0;
		const add = (a: number, b: number) => {
			callCount++;
			return a + b;
		};

		const memoized = memoize(add, (a, b) => `${a}-${b}`);

		expect(memoized(2, 3)).toBe(5);
		expect(callCount).toBe(1);

		expect(memoized(2, 3)).toBe(5); // Same key
		expect(callCount).toBe(1);

		expect(memoized(3, 2)).toBe(5); // Different key
		expect(callCount).toBe(2);
	});

	it('should respect max cache size', () => {
		let callCount = 0;
		const identity = (x: number) => {
			callCount++;
			return x;
		};

		const memoized = memoize(identity, undefined, 2);

		memoized(1);
		memoized(2);
		expect(callCount).toBe(2);

		memoized(1); // Should still be cached
		expect(callCount).toBe(2);

		memoized(3); // Should evict 1
		expect(callCount).toBe(3);

		memoized(1); // Should recompute since it was evicted
		expect(callCount).toBe(4);
	});

	it('should handle complex arguments', () => {
		let callCount = 0;
		const processObject = (obj: { a: number; b: string }) => {
			callCount++;
			return `${obj.a}-${obj.b}`;
		};

		const memoized = memoize(processObject);

		const obj1 = { a: 1, b: 'test' };
		const obj2 = { a: 1, b: 'test' }; // Same content, different reference

		expect(memoized(obj1)).toBe('1-test');
		expect(callCount).toBe(1);

		expect(memoized(obj2)).toBe('1-test'); // Should use cache despite different reference
		expect(callCount).toBe(1);
	});
});

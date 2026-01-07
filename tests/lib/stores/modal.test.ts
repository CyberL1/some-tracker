import { describe, it, expect, beforeEach, vi } from 'vitest';
import { modalStore } from '../../../src/lib/stores/modal.svelte';
import type { Component } from 'svelte';

describe('ModalStore', () => {
	beforeEach(() => {
		while (modalStore.modals.length > 0) {
			modalStore.close(0);
		}
	});

	it('should start with no modals', () => {
		expect(modalStore.modals).toHaveLength(0);
	});

	it('should open a modal and add it to the store', async () => {
		const MockComponent = {} as Component;
		const props = { title: 'Test Modal' };

		const promise = modalStore.open(MockComponent, props);

		expect(modalStore.modals).toHaveLength(1);
		expect(modalStore.modals[0].component).toStrictEqual(MockComponent);
		expect(modalStore.modals[0].props).toEqual(props);
		expect(modalStore.modals[0].resolve).toBeInstanceOf(Function);
		expect(modalStore.modals[0].reject).toBeInstanceOf(Function);

		modalStore.close(0);
		await promise;
	});

	it('should open multiple modals', async () => {
		const Component1 = {} as Component;
		const Component2 = {} as Component;

		const promise1 = modalStore.open(Component1, {});
		const promise2 = modalStore.open(Component2, {});

		expect(modalStore.modals).toHaveLength(2);
		expect(modalStore.modals[0].component).toStrictEqual(Component1);
		expect(modalStore.modals[1].component).toStrictEqual(Component2);

		modalStore.close(0);
		modalStore.close(0);
		await Promise.all([promise1, promise2]);
	});

	it('should close a modal and resolve the promise with a value', async () => {
		const MockComponent = {} as Component;
		const resolveValue = { success: true, data: 'test' };

		const promise = modalStore.open(MockComponent, {});

		expect(modalStore.modals).toHaveLength(1);

		modalStore.close(0, resolveValue);

		const result = await promise;

		expect(result).toEqual(resolveValue);
		expect(modalStore.modals).toHaveLength(0);
	});

	it('should close a modal and resolve the promise without a value', async () => {
		const MockComponent = {} as Component;

		const promise = modalStore.open(MockComponent, {});

		expect(modalStore.modals).toHaveLength(1);

		modalStore.close(0);

		const result = await promise;

		expect(result).toBeUndefined();
		expect(modalStore.modals).toHaveLength(0);
	});

	it('should dismiss a modal and reject the promise', async () => {
		const MockComponent = {} as Component;
		const error = new Error('User cancelled');

		const promise = modalStore.open(MockComponent, {});

		expect(modalStore.modals).toHaveLength(1);

		modalStore.dismiss(0, error);

		await expect(promise).rejects.toThrow('User cancelled');
		expect(modalStore.modals).toHaveLength(0);
	});

	it('should dismiss a modal without an error', async () => {
		const MockComponent = {} as Component;

		const promise = modalStore.open(MockComponent, {});

		modalStore.dismiss(0);

		try {
			await promise;
			expect.fail('Promise should have been rejected');
		} catch (error) {
			expect(error).toBeUndefined();
		}
		expect(modalStore.modals).toHaveLength(0);
	});

	it('should handle closing a non-existent modal gracefully', () => {
		expect(modalStore.modals).toHaveLength(0);

		modalStore.close(999);

		expect(modalStore.modals).toHaveLength(0);
	});

	it('should handle dismissing a non-existent modal gracefully', () => {
		expect(modalStore.modals).toHaveLength(0);

		modalStore.dismiss(999);

		expect(modalStore.modals).toHaveLength(0);
	});

	it('should maintain correct indices when closing modals', async () => {
		const Component1 = {} as Component;
		const Component2 = {} as Component;
		const Component3 = {} as Component;

		const promise1 = modalStore.open(Component1, { id: 1 });
		const promise2 = modalStore.open(Component2, { id: 2 });
		const promise3 = modalStore.open(Component3, { id: 3 });

		expect(modalStore.modals).toHaveLength(3);

		modalStore.close(1, { id: 2 });

		expect(modalStore.modals).toHaveLength(2);
		expect(modalStore.modals[0].props.id).toBe(1);
		expect(modalStore.modals[1].props.id).toBe(3);

		const result2 = await promise2;
		expect(result2.id).toBe(2);

		modalStore.close(0, { id: 1 });
		modalStore.close(0, { id: 3 });
		const [result1, result3] = await Promise.all([promise1, promise3]);
		expect(result1.id).toBe(1);
		expect(result3.id).toBe(3);
	});

	it('should pass props correctly to modal instances', async () => {
		const MockComponent = {} as Component;
		const props = {
			title: 'Test',
			count: 42,
			callback: vi.fn()
		};

		const promise = modalStore.open(MockComponent, props);

		expect(modalStore.modals).toHaveLength(1);
		expect(modalStore.modals[0].props).toEqual(props);
		expect(modalStore.modals[0].props.title).toBe('Test');
		expect(modalStore.modals[0].props.count).toBe(42);

		modalStore.close(0);
		await promise;
	});

	it('should handle rapid open/close operations', async () => {
		const MockComponent = {} as Component;

		const promises = [];
		for (let i = 0; i < 5; i++) {
			promises.push(modalStore.open(MockComponent, { index: i }));
		}

		expect(modalStore.modals.length).toBeGreaterThanOrEqual(5);

		for (let i = 0; i < 5; i++) {
			if (modalStore.modals.length > 0) {
				modalStore.close(0, { index: i });
			}
		}

		const results = await Promise.all(promises);

		expect(modalStore.modals).toHaveLength(0);
		expect(results).toHaveLength(5);
		results.forEach((result, i) => {
			expect(result.index).toBe(i);
		});
	});
});

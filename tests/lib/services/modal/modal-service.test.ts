import { describe, it, expect, beforeEach, vi } from 'vitest';
import { open } from '../../../../src/lib/services/modal/modal-service';
import { modalStore } from '../../../../src/lib/stores/modal.svelte';
import type { Component } from 'svelte';

vi.mock('../../../../src/lib/stores/modal.svelte', () => {
	const modals: any[] = [];
	return {
		modalStore: {
			get modals() {
				return modals;
			},
			open<T extends Component>(component: T, props: any): Promise<any> {
				return new Promise((resolve, reject) => {
					modals.push({
						component,
						props,
						resolve,
						reject
					});
				});
			},
			close(index: number, value?: any) {
				const modal = modals[index];
				if (modal) {
					modal.resolve(value);
					modals.splice(index, 1);
				}
			},
			dismiss(index: number, error?: any) {
				const modal = modals[index];
				if (modal) {
					modal.reject(error);
					modals.splice(index, 1);
				}
			}
		}
	};
});

describe('ModalService', () => {
	beforeEach(() => {
		while (modalStore.modals.length > 0) {
			modalStore.close(0);
		}
	});

	it('should open a modal and return a promise', async () => {
		const MockComponent = {} as Component;
		const props = { title: 'Test' };

		const promise = open(MockComponent, props);

		expect(modalStore.modals).toHaveLength(1);
		expect(modalStore.modals[0].component).toBe(MockComponent);
		expect(modalStore.modals[0].props).toEqual(props);

		modalStore.close(0);
		await promise;
	});

	it('should resolve promise when modal is closed', async () => {
		const MockComponent = {} as Component;
		const resolveValue = { result: 'success' };

		const promise = open(MockComponent, {});

		modalStore.close(0, resolveValue);

		const result = await promise;

		expect(result).toEqual(resolveValue);
		expect(modalStore.modals).toHaveLength(0);
	});

	it('should reject promise when modal is dismissed', async () => {
		const MockComponent = {} as Component;
		const error = new Error('Cancelled');

		const promise = open(MockComponent, {});

		modalStore.dismiss(0, error);

		await expect(promise).rejects.toThrow('Cancelled');
		expect(modalStore.modals).toHaveLength(0);
	});

	it('should handle multiple modals independently', async () => {
		const Component1 = {} as Component;
		const Component2 = {} as Component;

		const promise1 = open(Component1, { id: 1 });
		const promise2 = open(Component2, { id: 2 });

		expect(modalStore.modals).toHaveLength(2);

		modalStore.close(0, { result: 1 });
		modalStore.close(0, { result: 2 });

		const [result1, result2] = await Promise.all([promise1, promise2]);

		expect(result1.result).toBe(1);
		expect(result2.result).toBe(2);
		expect(modalStore.modals).toHaveLength(0);
	});

	it('should pass props correctly through the service', async () => {
		const MockComponent = {} as Component;
		const props = {
			message: 'Hello',
			count: 10,
			nested: { value: true }
		};

		const promise = open(MockComponent, props);

		expect(modalStore.modals[0].props).toEqual(props);
		expect(modalStore.modals[0].props.message).toBe('Hello');
		expect(modalStore.modals[0].props.count).toBe(10);
		expect(modalStore.modals[0].props.nested.value).toBe(true);

		modalStore.close(0);
		await promise;
	});
});

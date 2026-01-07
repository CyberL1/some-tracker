import type { Component, ComponentProps } from 'svelte';

type ModalInstance<T extends Component<any, any, any>> = {
	component: T;
	props: ComponentProps<T>;
	resolve: (value: any) => void;
	reject: (error?: any) => void;
};

let modals = $state<ModalInstance<any>[]>([]);

export const modalStore = {
	get modals() {
		return modals;
	},

	open<T extends Component<any, any, any>>(component: T, props: ComponentProps<T>): Promise<any> {
		return new Promise((resolve, reject) => {
			modals = [
				...modals,
				{
					component,
					props,
					resolve,
					reject
				}
			];
		});
	},

	close(index: number, value?: any) {
		const modal = modals[index];
		if (modal) {
			modal.resolve(value);
			modals = modals.filter((_, i) => i !== index);
		}
	},

	dismiss(index: number, error?: any) {
		const modal = modals[index];
		if (modal) {
			modal.reject(error);
			modals = modals.filter((_, i) => i !== index);
		}
	}
};

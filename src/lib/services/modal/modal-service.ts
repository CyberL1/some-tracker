import type { Component, ComponentProps } from 'svelte';
import { modalStore } from '../../stores/modal.svelte';

export function open<T extends Component<any, any, any>>(
	component: T,
	props: ComponentProps<T>
): Promise<any> {
	return modalStore.open(component, props);
}

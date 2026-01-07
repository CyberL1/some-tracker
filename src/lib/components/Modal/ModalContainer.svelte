<script lang="ts">
	import { modalStore } from '../../stores/modal.svelte';
	import Modal from './Modal.svelte';

	const modals = $derived(modalStore.modals);
</script>

{#each modals as modal, index}
	{@const Component = modal.component}
	{@const resolve = (value?: any) => modalStore.close(index, value)}
	{@const baseDismiss = (error?: any) => modalStore.dismiss(index, error)}
	{@const props = {
		...modal.props,
		resolve,
		dismiss: baseDismiss
	}}
	<Modal onClose={() => baseDismiss()}>
		<Component {...props} />
	</Modal>
{/each}

<script>
	import { settingsItems } from '../../config/settings';
	import { settingsStore } from '../../stores/settings.svelte';

	const settings = settingsStore.get();
</script>

{#each settingsItems as item (item.setting)}
	{item.label}<br />
	{item.description}<br />
	{#if item.type === 'range'}
		<input
			type="range"
			onchange={(value) => settingsStore.set(item.setting, value.currentTarget.value)}
			defaultValue={settings[item.setting]} />
	{/if}
	<br />
{/each}

<script lang="ts">
	import Card from '../Card/Card.svelte';
	import CardElement from '../Card/CardElement.svelte';
	import Button from '../Button/Button.svelte';
	import FrequencySelector from './FrequencySelector.svelte';
	import IconCarbonFolders from '~icons/carbon/folders';

	let {
		title = $bindable(),
		author = $bindable(),
		aymChipType = $bindable(),
		aymFrequency = $bindable(),
		intFrequency = $bindable()
	}: {
		title: string;
		author: string;
		aymChipType: 'AY' | 'YM';
		aymFrequency: number;
		intFrequency: number;
	} = $props();

	function changeAymChipType() {
		aymChipType = aymChipType === 'AY' ? 'YM' : 'AY';
	}

	const ayFrequencyOptions = [
		{ label: 'Sinclair QL (0.75 MHz)', value: 750000 },
		{ label: 'Amstrad CPC (1 MHz)', value: 1000000 },
		{ label: 'ZX Spectrum (1.7734 MHz)', value: 1773400 },
		{ label: 'Pentagon (1.75 MHz)', value: 1750000 },
		{ label: 'MSX (1.7897 MHz)', value: 1789700 },
		{ label: 'Atari ST (2 MHz)', value: 2000000 }
	];

	const intFrequencyOptions = [
		{ label: 'Pentagon (48.828 Hz)', value: 48.828 },
		{ label: 'PAL (50 Hz)', value: 50 },
		{ label: 'NTSC (60 Hz)', value: 60 }
	];
</script>

<Card title="Project" icon={IconCarbonFolders} class="flex w-full flex-col gap-2">
	<CardElement label="Title">
		<input
			type="text"
			bind:value={title}
			class="min-w-0 flex-1 overflow-x-auto rounded border border-neutral-600 bg-neutral-900 px-2 py-1 focus:border-transparent focus:ring-1 focus:ring-blue-500 focus:outline-none" />
	</CardElement>

	<CardElement label="Author">
		<input
			type="text"
			bind:value={author}
			class="flex-1 overflow-x-auto rounded border border-neutral-600 bg-neutral-900 px-2 py-1 focus:border-transparent focus:ring-1 focus:ring-blue-500 focus:outline-none" />
	</CardElement>

	<div class="flex gap-2">
		<CardElement label="AY chip type">
			<Button onclick={changeAymChipType}>{aymChipType}</Button>
		</CardElement>

		<div class="flex-1">
			<CardElement label="AY frequency">
				<FrequencySelector bind:value={aymFrequency} options={ayFrequencyOptions} />
			</CardElement>
		</div>

		<div class="flex-1">
			<CardElement label="Interrupt frequency">
				<FrequencySelector bind:value={intFrequency} options={intFrequencyOptions} />
			</CardElement>
		</div>
	</div>
</Card>

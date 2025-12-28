<script lang="ts">
	import Card from '../Card/Card.svelte';
	import CardElement from '../Card/CardElement.svelte';
	import Input from '../Input/Input.svelte';
	import Button from '../Button/Button.svelte';
	import Select from './Select.svelte';
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

<Card title="Project" icon={IconCarbonFolders} class="flex w-full flex-col gap-2 p-3">
	<CardElement label="Title">
		<Input bind:value={title} />
	</CardElement>

	<CardElement label="Author">
		<Input bind:value={author} />
	</CardElement>

	<div class="flex gap-2">
		<CardElement label="AY chip type">
			<Button onclick={changeAymChipType}>{aymChipType}</Button>
		</CardElement>

		<div class="flex-1">
			<CardElement label="AY frequency">
				<Select bind:value={aymFrequency} options={ayFrequencyOptions} />
			</CardElement>
		</div>

		<div class="flex-1">
			<CardElement label="Interrupt frequency">
				<Select bind:value={intFrequency} options={intFrequencyOptions} />
			</CardElement>
		</div>
	</div>
</Card>

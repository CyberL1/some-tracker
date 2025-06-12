<script lang="ts">
	import IconCarbonEdit from '~icons/carbon/edit';
	import IconCarbonChevronDown from '~icons/carbon/chevron-down';

	type FrequencyOption = {
		label: string;
		value: number;
	};

	let {
		value = $bindable(),
		options
	}: {
		value: number;
		options: FrequencyOption[];
	} = $props();

	let selectedOption = $state<string>('');
	let isCustom = $state(false);
	let customValue = $state(value);

	$effect(() => {
		const matchingOption = options.find((option) => option.value === value);
		if (matchingOption) {
			selectedOption = matchingOption.label;
			isCustom = false;
		} else {
			selectedOption = 'Custom';
			isCustom = true;
			customValue = value;
		}
	});

	function handleSelectionChange() {
		if (selectedOption === 'Custom') {
			isCustom = true;
			customValue = value;
		} else {
			isCustom = false;
			const option = options.find((opt) => opt.label === selectedOption);
			if (option) {
				value = option.value;
			}
		}
	}

	function handleCustomValueChange() {
		if (isCustom) {
			value = customValue;
		}
	}

	function switchToDropdown() {
		isCustom = false;
		selectedOption = '';
	}
</script>

{#if isCustom}
	<div class="relative">
		<input
			type="number"
			bind:value={customValue}
			oninput={handleCustomValueChange}
			placeholder="Enter frequency"
			class="w-full rounded border border-neutral-600 bg-neutral-900 px-2 py-1 pr-8 text-xs focus:border-transparent focus:ring-1 focus:ring-blue-500 focus:outline-none" />
		<button
			onclick={switchToDropdown}
			class="absolute top-1/2 right-1 -translate-y-1/2 rounded p-1 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200"
			title="Switch to preset options">
			<IconCarbonEdit class="h-3 w-3" />
		</button>
	</div>
{:else}
	<div class="relative">
		<select
			bind:value={selectedOption}
			onchange={handleSelectionChange}
			class="w-full cursor-pointer rounded border border-neutral-600 bg-neutral-900 px-2 py-1 pr-8 text-xs focus:border-transparent focus:ring-1 focus:ring-blue-500 focus:outline-none">
			<option value="" disabled>Select frequency</option>
			{#each options as option}
				<option value={option.label}>{option.label}</option>
			{/each}
			<option value="Custom">Custom</option>
		</select>
		<div class="pointer-events-none absolute top-1/2 right-1 -translate-y-1/2 cursor-pointer">
			<IconCarbonChevronDown class="h-3 w-3 text-neutral-400" />
		</div>
	</div>
{/if}

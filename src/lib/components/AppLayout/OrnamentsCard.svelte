<script lang="ts">
	import Card from '../Card/Card.svelte';
	import type { Ornament } from '../../models/song';
	import IconCarbonMusic from '~icons/carbon/music';

	let {
		ornaments = $bindable()
	}: {
		ornaments: Ornament[];
	} = $props();
</script>

<div class="h-full w-full">
	<Card title="Ornaments (Arpeggios)" icon={IconCarbonMusic} fullHeight={true}></Card>
</div>

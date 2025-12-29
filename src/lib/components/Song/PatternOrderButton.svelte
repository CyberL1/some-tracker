<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		buttonType: 'up' | 'remove' | 'add' | 'clone';
		isHovered: boolean;
		onClick: () => void;
		onMouseEnter: () => void;
		onMouseLeave: () => void;
		disabled?: boolean;
		title: string;
		size: number;
		hasMargin?: boolean;
		children: Snippet;
	}

	let {
		buttonType,
		isHovered,
		onClick,
		onMouseEnter,
		onMouseLeave,
		disabled = false,
		title,
		size,
		hasMargin = true,
		children
	}: Props = $props();
</script>

<button
	class="border-pattern-empty bg-pattern-bg text-pattern-text hover:border-pattern-text hover:bg-pattern-header pointer-events-auto {hasMargin
		? 'mb-0.5'
		: ''} flex cursor-pointer items-center justify-center border transition-colors {isHovered
		? 'border-pattern-text bg-pattern-header'
		: ''} {disabled ? 'opacity-50' : ''}"
	style="height: {size}px; width: {size}px;"
	onclick={onClick}
	onmouseenter={onMouseEnter}
	onmouseleave={onMouseLeave}
	{disabled}
	{title}>
	{@render children()}
</button>

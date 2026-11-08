<script lang="ts">
import { cubicOut } from 'svelte/easing';
import { showcaseIcons } from '$lib/iconpacks';
import { ticker, tickWhileVisible } from '$lib/ticker.svelte';
import IconGlyph from './IconGlyph.svelte';

/**
 * A pack's card preview: a small grid of its icons that turns over to the next
 * set on the shared clock, one slot after another, so every card on the page
 * shows the same symbols at the same moment and can be compared at a glance.
 */
let {
	pack,
	count = 8,
	multicolor = false,
}: { pack: string; count?: number; multicolor?: boolean } = $props();

const slots = $derived(
	Array.from(
		{ length: count },
		(_, i) => showcaseIcons[(i + ticker.step * count) % showcaseIcons.length],
	),
);

/* In: grows and untwists into place. Out: shrinks the other way. Both are CSS,
   so the turnover costs the main thread nothing once it starts. */
function enter(_: Element, { delay = 0 }: { delay?: number }) {
	return {
		delay,
		duration: 520,
		easing: cubicOut,
		css: (t: number) =>
			`opacity: ${t}; transform: scale(${0.4 + 0.6 * t}) rotate(${(1 - t) * -24}deg);`,
	};
}

function leave(_: Element, { delay = 0 }: { delay?: number }) {
	return {
		delay,
		duration: 280,
		css: (t: number) => `opacity: ${t}; transform: scale(${0.6 + 0.4 * t});`,
	};
}
</script>

<div
	class="grid gap-x-3 gap-y-4"
	style="grid-template-columns: repeat({count / 2}, minmax(0, 1fr));"
	use:tickWhileVisible
>
	{#each slots as icon, i (i)}
		<div class="slot grid place-items-center">
			{#key icon}
				<span class="cell" in:enter={{ delay: i * 55 }} out:leave={{ delay: i * 35 }}>
					<IconGlyph {pack} {icon} color={multicolor} class="h-7 w-7 sm:h-8 sm:w-8" />
				</span>
			{/key}
		</div>
	{/each}
</div>

<style>
	.slot {
		aspect-ratio: 1;
	}

	/* Incoming and outgoing glyphs share the slot's one grid cell, so the swap
	   happens in place instead of pushing the old icon below the new one. */
	.slot > :global(*) {
		grid-area: 1 / 1;
	}

	.cell {
		display: grid;
		place-items: center;
	}
</style>

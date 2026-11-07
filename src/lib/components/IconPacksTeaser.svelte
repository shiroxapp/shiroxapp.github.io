<script lang="ts">
import { iconPacksCopy } from '$lib/content';
import type { IconPackSummary } from '$lib/iconpacks';
import { glowField, inView, inViewStagger } from '$lib/motion';
import IconPreview from './IconPreview.svelte';
import RevealHeading from './RevealHeading.svelte';

/**
 * The home page's look at the icon packs, laid out like the stats below it: one
 * small card per pack, each turning over its own icons on the shared clock, and a
 * last card that leads to the guide for making one.
 */
let { packs }: { packs: IconPackSummary[] } = $props();
const copy = iconPacksCopy.teaser;
</script>

<section
	id="icon-packs"
	class="mx-auto max-w-5xl px-6 py-24 md:py-32"
	aria-labelledby="icon-packs-heading"
>
	<RevealHeading
		id="icon-packs-heading"
		text={copy.title}
		class="display text-[clamp(2.25rem,5.4vw,3.5rem)]"
	/>

	<p
		use:inView={70}
		class="mt-5 max-w-[38ch] text-[1.0625rem]"
		style="color: var(--muted); text-wrap: pretty;"
	>
		{copy.sub}
		<a href="/iconpacks/" class="ul whitespace-nowrap" style="color: var(--fg);">{copy.cta} →</a>
	</p>

	<div
		class="glow-field mt-12 grid grid-cols-2 gap-4 md:mt-16 md:grid-cols-5"
		use:inViewStagger={70}
		use:glowField
	>
		{#each packs as pack (pack.id)}
			<a href="/iconpacks/#{pack.id}" class="card glow relative overflow-hidden rounded-2xl p-6">
				<IconPreview pack={pack.id} count={4} />
				<p class="mt-5 text-center text-[0.8125rem] text-nowrap" style="color: var(--muted);">
					{pack.name}
				</p>
			</a>
		{/each}

		<a
			href="/iconpacks/#create"
			class="card own glow relative col-span-2 flex flex-col items-center justify-center overflow-hidden rounded-2xl p-6 md:col-span-1"
		>
			<span class="plus grid h-14 w-14 place-items-center rounded-full" aria-hidden="true">
				<svg class="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M10 3v14M3 10h14" stroke-linecap="round" />
				</svg>
			</span>
			<p class="mt-5 text-center text-[0.8125rem] text-nowrap" style="color: var(--muted);">
				{copy.own}
			</p>
		</a>
	</div>
</section>

<style>
	/* Same card as StatTile: the reveal's transitions restated beside the hover's,
	   since a scoped transition list replaces the global one. */
	.card {
		display: block;
		color: inherit;
		text-decoration: none;
		border: 1px solid var(--rule);
		background: var(--sunken);
		transition:
			opacity 0.75s var(--ease) var(--delay, 0ms),
			transform 0.75s var(--ease) var(--delay, 0ms),
			translate 0.5s var(--ease-hover),
			scale 0.5s var(--ease-hover),
			border-color 0.5s var(--ease-hover);
	}

	.own {
		display: flex;
		border-style: dashed;
		background: transparent;
	}

	.plus {
		border: 1px dashed var(--rule);
		color: var(--color-accent);
		transition: rotate 0.5s var(--ease-hover);
	}

	@media (hover: hover) {
		.card:hover {
			translate: 0 -3px;
			scale: 1.02;
			border-color: color-mix(in srgb, var(--color-accent) 35%, transparent);
		}

		.own:hover .plus {
			rotate: 90deg;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.card:hover {
			translate: none;
			scale: none;
		}

		.own:hover .plus {
			rotate: none;
		}
	}
</style>

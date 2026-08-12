<script lang="ts">
import { features, sections } from '$lib/content';
import { glowField, inView, inViewStagger } from '$lib/motion';
import RevealHeading from './RevealHeading.svelte';
</script>

<section
	id="features"
	class="mx-auto max-w-5xl px-6 py-24 md:py-32"
	aria-labelledby="features-heading"
>
	<RevealHeading
		id="features-heading"
		text={sections.features.title}
		class="display text-[clamp(2.25rem,5.4vw,3.5rem)]"
	/>

	<p
		use:inView={70}
		class="mt-5 max-w-[38ch] text-[1.0625rem]"
		style="color: var(--muted); text-wrap: pretty;"
	>
		{sections.features.sub}
	</p>

	<div
		class="glow-field mt-12 grid gap-4 sm:grid-cols-2 md:mt-16 lg:grid-cols-3"
		use:inViewStagger={70}
		use:glowField
	>
		{#each features as feature (feature.title)}
			<article class="card glow relative overflow-hidden rounded-2xl p-7 md:p-8">
				<h3 class="text-[1.25rem] font-medium tracking-tight md:text-[1.375rem]">
					{feature.title}
				</h3>
				<p
					class="mt-3 text-[0.9375rem] leading-relaxed"
					style="color: var(--muted); text-wrap: pretty;"
				>
					{feature.body}
				</p>
			</article>
		{/each}
	</div>
</section>

<style>
	/* `translate` and `scale` rather than one `transform`, so the hover composes with
	   the `transform` the reveal stagger puts on these same cards instead of fighting
	   it — the same reason `.press` is written that way.

	   `opacity` and `transform` are the reveal's own, restated here because they have
	   to be: this rule is scoped to `.card.svelte-hash`, which outranks `.rise`, and a
	   transition list replaces the list it outranks rather than adding to it. Without
	   them — and without `--delay`, which the shorthand resets too — the cards cut
	   straight to their finished state, all at once. */
	.card {
		border: 1px solid var(--rule);
		background: var(--sunken);
		transition:
			opacity 0.75s var(--ease) var(--delay, 0ms),
			transform 0.75s var(--ease) var(--delay, 0ms),
			translate 0.5s var(--ease-hover),
			scale 0.5s var(--ease-hover),
			border-color 0.5s var(--ease-hover);
	}

	/* Rises and grows together: one gesture, the card coming toward the pointer.
	   The growth stays inside the grid gap, so neighbours never get clipped.

	   Gated on `(hover: hover)`, as every hover on the page is — see the note in
	   layout.css. A tapped card would otherwise hold this pose, accent border and
	   all, long after the finger left. */
	@media (hover: hover) {
		.card:hover {
			translate: 0 -3px;
			scale: 1.02;
			border-color: color-mix(in srgb, var(--color-accent) 35%, transparent);
		}
	}

	/* The rest of the hover is the pointer glow — `.glow` in layout.css. */

	@media (prefers-reduced-motion: reduce) {
		.card:hover {
			translate: none;
			scale: none;
		}
	}
</style>

<script lang="ts">
	import { installMethods, sections } from '$lib/content';
	import { glowField, inView, inViewStagger } from '$lib/motion';
	import CopyField from './CopyField.svelte';
	import RevealHeading from './RevealHeading.svelte';

	const recommended = installMethods.find((m) => m.recommended);
	const rest = installMethods.filter((m) => !m.recommended);
</script>

<section
	id="install"
	class="mx-auto max-w-5xl px-6 py-24 md:py-32"
	style="scroll-margin-top: 6rem;"
	aria-labelledby="install-heading"
>
	<RevealHeading
		id="install-heading"
		text={sections.install.title}
		class="display text-[clamp(2.25rem,5.4vw,3.5rem)]"
	/>

	<p
		use:inView={70}
		class="mt-5 max-w-[38ch] text-[1.0625rem]"
		style="color: var(--muted); text-wrap: pretty;"
	>
		{sections.install.sub}
	</p>

	<!-- The recommended route spans the row; the alternatives sit beside each other
	     underneath. Three equal cards would say all three are equally good. -->
	<div
		class="glow-field mt-12 grid gap-4 md:mt-16 md:grid-cols-2"
		use:inViewStagger={80}
		use:glowField
	>
		{#if recommended}
			<article
				class="card lead glow relative overflow-hidden rounded-2xl p-7 md:col-span-2 md:p-10"
			>
				<span class="edge" aria-hidden="true"></span>

				<div class="flex flex-wrap items-center gap-x-4 gap-y-3">
					<h3 class="text-[1.5rem] font-medium tracking-tight md:text-[1.875rem]">
						{recommended.title}
					</h3>
					<span
						class="mono rounded-full px-2.5 py-1 text-[0.6875rem] tracking-[0.12em] uppercase"
						style="background: var(--color-accent); color: var(--color-paper);">Recommended</span
					>
				</div>

				<p class="mt-3 max-w-[46ch] text-[1rem] leading-relaxed" style="color: var(--muted);">
					{recommended.tagline}
				</p>

				<div class="mt-8 max-w-152">
					<CopyField value={recommended.url} />
				</div>

				{#if recommended.deepLinks}
					<div class="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2">
						{#each recommended.deepLinks as deepLink (deepLink.label)}
							<a href={deepLink.href} class="ul text-[0.9375rem] font-medium">{deepLink.label}</a>
						{/each}
						<span class="text-[0.8125rem]" style="color: var(--muted);">on device</span>
					</div>
				{/if}
			</article>
		{/if}

		{#each rest as method (method.title)}
			<article
				class="card glow relative flex flex-col overflow-hidden rounded-2xl p-7 md:p-8"
			>
				<h3 class="text-[1.25rem] font-medium tracking-tight md:text-[1.375rem]">
					{method.title}
				</h3>
				<p class="mt-3 text-[0.9375rem] leading-relaxed" style="color: var(--muted);">
					{method.tagline}
				</p>

				<div class="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2">
					<a
						href={method.url}
						target="_blank"
						rel="noreferrer"
						class="group/link inline-flex items-center gap-2 text-[0.9375rem] font-medium"
					>
						<span class="ul">{method.action}</span>
						<svg
							class="h-3 w-3 transition-transform duration-300 ease-out group-hover/link:translate-y-0.5"
							viewBox="0 0 12 12"
							fill="none"
							stroke="currentColor"
							stroke-width="1.6"
							stroke-linecap="round"
							stroke-linejoin="round"
							aria-hidden="true"
						>
							<path d="M6 1v8M2.5 5.5 6 9l3.5-3.5" />
						</svg>
					</a>
					{#if method.meta}
						<span class="mono text-[0.8125rem]" style="color: var(--muted);">{method.meta}</span>
					{/if}
				</div>
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

	/* Rises and grows together: one gesture, the card coming toward the pointer. */
	.card:hover {
		translate: 0 -3px;
		scale: var(--grow, 1.02);
		border-color: color-mix(in srgb, var(--color-accent) 35%, transparent);
	}

	/* The recommended panel is twice the width of the cards below it, so the same
	   percentage would carry it twice as far. It grows by about the same number of
	   pixels instead, and the two sizes read as one response. */
	.lead {
		--grow: 1.01;
	}

	/* The recommended panel alone wears the accent across its top edge, and wears it
	   permanently: it is a mark of which route to take, not a response to the pointer.
	   Answering the pointer is the pointer glow's job — `.glow` in layout.css. */
	.edge {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 2px;
		background: var(--color-accent);
	}

	@media (prefers-reduced-motion: reduce) {
		.card:hover {
			translate: none;
			scale: none;
		}
	}
</style>

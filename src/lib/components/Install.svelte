<script lang="ts">
	import { installMethods, sections } from '$lib/content';
	import { glowField, inView, inViewStagger, preconnectOnHover } from '$lib/motion';
	import CopyField from './CopyField.svelte';
	import RevealHeading from './RevealHeading.svelte';

	/** Which app (by index into the recommended method's `apps`) the pointer is
	    over — its name, or its deep link below — so the split badge can open
	    fully toward it. `null` at rest, back to the 70/30 default cut. */
	let focusApp: number | null = $state(null);
	const split = $derived(focusApp === 0 ? [100, 100] : focusApp === 1 ? [0, 0] : [70, 30]);
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
		{#each installMethods as method (method.title)}
			{#if method.kind === 'source'}
				<article
					class="card lead glow relative overflow-hidden rounded-2xl p-7 md:col-span-2 md:p-10"
				>
					{#if method.recommended}
						<span class="edge" aria-hidden="true"></span>
					{/if}

					<div class="flex flex-wrap items-center gap-x-4 gap-y-3">
						{#if method.apps}
							<!-- One badge for both apps rather than one each: a diagonal cut,
							     AltStore's own art on the left, SideStore's on the right, so the
							     combined title still reads as one route with two doors rather
							     than two separate ones. Hovering either name below, or its deep
							     link further down, opens the cut fully toward that app's side. -->
							<div
								class="relative h-[29px] w-[29px] shrink-0 overflow-hidden"
								style="border-radius: 8px; corner-shape: squircle;"
							>
								<img
									src={method.apps[0].icon}
									alt=""
									aria-hidden="true"
									class="absolute inset-0 h-full w-full object-cover"
									style="clip-path: polygon(0 0, {split[0]}% 0, {split[1]}% 100%, 0 100%);"
								/>
								<img
									src={method.apps[1].icon}
									alt=""
									aria-hidden="true"
									class="absolute inset-0 h-full w-full object-cover"
									style="clip-path: polygon(
										{split[0]}% 0,
										100% 0,
										100% 100%,
										{split[1]}% 100%
									);"
								/>
							</div>
							<h3 class="text-[1.5rem] font-medium tracking-tight md:text-[1.875rem]">
								{#each method.apps as app, i (app.name)}
									{#if i > 0}<span aria-hidden="true"> / </span>{/if}<span
										role="presentation"
										onmouseenter={() => (focusApp = i)}
										onmouseleave={() => (focusApp = null)}>{app.name}</span
									>
								{/each}
							</h3>
						{:else}
							{#if method.icon}
								<img
									src={method.icon}
									alt=""
									aria-hidden="true"
									class="h-[29px] w-[29px] shrink-0 object-cover"
									style="border-radius: 8px; corner-shape: squircle;"
								/>
							{/if}
							<h3 class="text-[1.5rem] font-medium tracking-tight md:text-[1.875rem]">
								{method.title}
							</h3>
						{/if}
						{#if method.recommended}
							<span
								class="mono rounded-full px-2.5 py-1 text-[0.6875rem] tracking-[0.12em] uppercase"
								style="background: var(--color-accent); color: var(--color-paper);"
								>Recommended</span
							>
						{/if}
					</div>

					<p class="mt-3 max-w-[46ch] text-[1rem] leading-relaxed" style="color: var(--muted);">
						{method.tagline}
					</p>

					<div class="mt-8 max-w-152">
						<CopyField value={method.url ?? ''} />
					</div>

					{#if method.deepLinks}
						<div class="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2">
							{#each method.deepLinks as deepLink, i (deepLink.label)}
								<a
									href={deepLink.href}
									class="group/link inline-flex items-center gap-2 text-[0.9375rem] font-medium"
									onmouseenter={() => (focusApp = i)}
									onmouseleave={() => (focusApp = null)}
								>
									<span class="ul">{deepLink.label}</span>
									<svg
										class="h-2.5 w-2.5 transition-transform duration-300 ease-out group-hover/link:scale-110"
										viewBox="0 0 12 12"
										fill="none"
										stroke="currentColor"
										stroke-width="1.6"
										stroke-linecap="round"
										stroke-linejoin="round"
										aria-hidden="true"
									>
										<path d="M6 1v10M1 6h10" />
									</svg>
								</a>
							{/each}
							<span class="text-[0.8125rem]" style="color: var(--muted);">on device</span>
						</div>
					{/if}
				</article>
			{:else}
				<article
					class="card glow relative flex flex-col overflow-hidden rounded-2xl p-7 md:p-8"
				>
					{#if method.recommended}
						<span class="edge" aria-hidden="true"></span>
					{/if}

					<div class="flex items-center gap-2.5">
						{#if method.icon}
							<img
								src={method.icon}
								alt=""
								aria-hidden="true"
								class="h-[25px] w-[25px] shrink-0 object-cover"
								style="border-radius: 7px; corner-shape: squircle;"
							/>
						{/if}
						<h3 class="text-[1.25rem] font-medium tracking-tight md:text-[1.375rem]">
							{method.title}
						</h3>
						{#if method.recommended}
							<span
								class="mono rounded-full px-2 py-0.5 text-[0.625rem] tracking-[0.12em] uppercase"
								style="background: var(--color-accent); color: var(--color-paper);"
								>Recommended</span
							>
						{/if}
					</div>
					<p class="mt-3 text-[0.9375rem] leading-relaxed" style="color: var(--muted);">
						{method.tagline}
					</p>

					<div class="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2">
						{#if method.kind === 'pending'}
							<!-- No link exists yet, so there's nothing to act on: the status
							     reads as plain text, the same weight as the links beside it
							     elsewhere in this grid, just muted since it isn't one. -->
							<span class="text-[0.9375rem] font-medium" style="color: var(--muted);"
								>{method.status}</span
							>
						{:else}
							<a
								href={method.url}
								target="_blank"
								rel="noreferrer"
								use:preconnectOnHover
								class="group/link inline-flex items-center gap-2 text-[0.9375rem] font-medium"
							>
								<span class="ul">{method.action}</span>
								{#if method.kind === 'join'}
									<svg
										class="h-2.5 w-2.5 transition-transform duration-300 ease-out group-hover/link:scale-110"
										viewBox="0 0 12 12"
										fill="none"
										stroke="currentColor"
										stroke-width="1.6"
										stroke-linecap="round"
										stroke-linejoin="round"
										aria-hidden="true"
									>
										<path d="M6 1v10M1 6h10" />
									</svg>
								{:else}
									<svg
										class="mt-0.5 h-3 w-3 transition-transform duration-300 ease-out group-hover/link:translate-y-0.5"
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
								{/if}
							</a>
							{#if method.meta}
								<span class="mono text-[0.8125rem]" style="color: var(--muted);"
									>{method.meta}</span
								>
							{/if}
						{/if}
					</div>
				</article>
			{/if}
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

	/* Trial: every app icon sits in grayscale until its card is hovered, so the
	   row reads as one quiet system rather than five different brand colours —
	   colour becomes a response to attention rather than a fixed decoration.
	   Gated on `(hover: hover)` — there is no hover to answer on a touch
	   device, so the icons just stay in colour there rather than sitting
	   permanently grayscale with no way to reveal it. */
	@media (hover: hover) {
		/* `clip-path` rides in the same list as `filter`/`opacity` — the badge
		   images are `.card img` too, and `transition` isn't additive across
		   rules, so a second declaration on a lower-specificity selector
		   elsewhere would silently clobber this one rather than add to it. */
		.card img {
			filter: grayscale(1);
			transition:
				filter 0.4s var(--ease-hover),
				opacity 0.4s var(--ease-hover),
				clip-path 0.4s var(--ease-hover);
		}

		.card:hover img {
			filter: grayscale(0);
		}

		/* GitHub's mark is already black and white, so grayscale alone leaves
		   it starker than the icons beside it, which settle to a mid gray
		   once desaturated. Dimmed at rest to read as the same weight; full
		   opacity on hover, same as the others going to full colour. */
		.card img[src='/icons/github.jpg'] {
			opacity: 0.55;
		}

		.card:hover img[src='/icons/github.jpg'] {
			opacity: 1;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.card:hover {
			translate: none;
			scale: none;
		}
	}
</style>

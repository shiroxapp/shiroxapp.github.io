<script lang="ts">
	import { hoverPause, onScreen, swipe, tilt } from '$lib/motion';
	import { screens } from '$lib/content';
	import PhoneFrame from './PhoneFrame.svelte';

	let active = $state(0);
	/** Tracked per region rather than on the section as a whole: the wrapper spans
	    the full column, so its dead space either side of the device — and the caption
	    below it — would hold the carousel on a pointer that is only passing through. */
	let overDevice = $state(false);
	let overTabs = $state(false);
	let overCaption = $state(false);
	let focused = $state(false);
	/** Auto-advance stops for good once the visitor picks a screen themselves. */
	let auto = $state(true);
	/** Assumed until the browser says otherwise, so the prerendered HTML — which is
	    what a reduced-motion visitor sees before hydration — carries no animation. */
	let reduced = $state(true);
	let visible = $state(false);
	/** Only true once the row is too wide for its container, which is where the
	    edge fades earn their place; on a wide screen they would just dim the ends. */
	let scrollable = $state(false);

	/** Above this the device has room to turn sideways; below it, screens that the
	    app renders in both orientations show their portrait capture instead. */
	let wide = $state(true);

	let tabs: HTMLButtonElement[] = $state([]);
	let list: HTMLDivElement | undefined = $state();

	const cycling = $derived(auto && !reduced);
	/** Held still while the device, its labels or its caption are hovered, while a
	    label is focused, or while the whole thing is scrolled past. */
	const held = $derived(overDevice || overTabs || overCaption || focused || !visible);
	const landscape = $derived(Boolean(screens[active].landscape) && wide);

	$effect(() => {
		reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
	});

	/* Kept in step with the `<source>` media query on the captures below. */
	$effect(() => {
		const mq = matchMedia('(min-width: 44rem)');
		const sync = () => (wide = mq.matches);
		sync();
		mq.addEventListener('change', sync);
		return () => mq.removeEventListener('change', sync);
	});

	/** Watched rather than measured once, so the fades are still right after a resize. */
	$effect(() => {
		if (!list) return;
		const observed = list;
		const ro = new ResizeObserver(() => {
			scrollable = observed.scrollWidth > observed.clientWidth;
		});
		ro.observe(observed);
		return () => ro.disconnect();
	});

	/** Keeps the current label in view in the scrolling row, without ever scrolling
	    the page itself — `scrollIntoView` would drag the viewport here on load. */
	$effect(() => {
		const tab = tabs[active];
		if (!tab || !list || list.scrollWidth <= list.clientWidth) return;

		list.scrollTo({
			left: tab.offsetLeft - (list.clientWidth - tab.offsetWidth) / 2,
			behavior: reduced ? 'auto' : 'smooth'
		});
	});

	function wrap(i: number) {
		return ((i % screens.length) + screens.length) % screens.length;
	}

	function go(next: number, manual = false) {
		active = wrap(next);
		if (manual) auto = false;
	}

	function onKeydown(event: KeyboardEvent) {
		const moves: Record<string, number> = {
			ArrowRight: active + 1,
			ArrowLeft: active - 1,
			Home: 0,
			End: screens.length - 1
		};

		const next = moves[event.key];
		if (next === undefined) return;

		event.preventDefault();
		go(next, true);
		tabs[wrap(next)]?.focus();
	}
</script>

<section class="px-6 pb-20 md:pb-28" aria-label="What Shirox looks like">
	<div class="mx-auto flex max-w-5xl flex-col items-center">
		<!-- The stage always reserves the portrait height and centres the device in
		     it, so turning sideways for the player resizes nothing on the page. The
		     device shrinks around its own centre; every section below stays put. -->
		<div class="stage" use:onScreen={(seen) => (visible = seen)}>
			<!-- The entrance and the idle drift get an element each. Both want the
			     `animation` property, and on one element the more specific rule would
			     replace the other outright rather than adding to it.

			     A load animation rather than a scroll one: the device sits just past the
			     hero, close enough to be on the first screen at every viewport from a
			     phone to a 27" display. The observer cannot give it an entrance there —
			     it is already past the trigger line when the page loads, so it would be
			     marked hidden and revealed in the same frame, never painting either
			     state. It arrives on load instead, trailing the headline. -->
			<div class="device load-rise" style="perspective: 1400px; --base: 420ms;">
				<div class="float">
					<!-- Wraps the frame exactly, so the pause covers the device and nothing
					     of the stage's centring space around it. -->
					<div
						use:tilt
						use:swipe={(delta) => go(active + delta, true)}
						use:hoverPause={(over) => (overDevice = over)}
						class="transition-transform duration-500 ease-out"
						style="transform: rotateX(var(--tilt-x, 0deg)) rotateY(var(--tilt-y, 0deg));"
					>
						<PhoneFrame {landscape}>
							<!-- all seven stacked; only the active one is opaque, so the change
							     crossfades instead of swapping a decoded image in -->
							<div
								id="app-screens"
								role="tabpanel"
								aria-labelledby="tab-{active}"
								class="absolute inset-0"
							>
								{#each screens as screen, i (screen.label)}
									<!-- The browser picks the orientation itself, so a phone never
									     downloads the sideways capture just to discard it. -->
									<picture>
										{#if screen.narrowSrc}
											<source media="(max-width: 43.999rem)" srcset={screen.narrowSrc} />
										{/if}
										<img
											src={screen.src}
											alt={screen.alt}
											aria-hidden={active !== i}
											loading={i === 0 ? 'eager' : 'lazy'}
											decoding="async"
											draggable="false"
											class="screen"
											style="opacity: {active === i ? 1 : 0}; transform: scale({active === i
												? 1
												: 1.015});"
										/>
									</picture>
								{/each}
							</div>
						</PhoneFrame>
					</div>
				</div>
			</div>
		</div>

		<!-- Labels double as the progress indicator: the active one's hairline fills
		     over its dwell, so the next change is never a surprise. -->
		<div
			bind:this={list}
			role="tablist"
			aria-label="App screens"
			use:hoverPause={(over) => (overTabs = over)}
			class="no-scrollbar mt-8 flex max-w-full gap-1 overflow-x-auto"
			class:faded={scrollable}
		>
			{#each screens as screen, i (screen.label)}
				<button
					bind:this={tabs[i]}
					type="button"
					role="tab"
					id="tab-{i}"
					aria-selected={active === i}
					aria-controls="app-screens"
					tabindex={active === i ? 0 : -1}
					onclick={() => go(i, true)}
					onkeydown={onKeydown}
					onfocus={() => (focused = true)}
					onblur={() => (focused = false)}
					class="tab press mono shrink-0 px-3 py-2.5 text-[0.6875rem] tracking-[0.14em] uppercase"
					style="color: {active === i ? 'var(--fg)' : 'var(--muted)'};"
				>
					{screen.label}
					<span class="track"></span>
					{#if active === i}
						<span
							class="fill"
							class:cycling
							style="animation-play-state: {held ? 'paused' : 'running'};"
							onanimationend={() => go(active + 1)}
						></span>
					{/if}
				</button>
			{/each}
		</div>

		<!-- The action goes on this wrapper rather than the caption itself: `{#key}`
		     replaces the paragraph on every change, and an element destroyed under the
		     pointer is not reliably sent a `pointerleave` — the flag would stick. -->
		<div class="mt-5" use:hoverPause={(over) => (overCaption = over)}>
			{#key active}
				<p class="load-rise text-center text-[0.9375rem]" style="color: var(--muted);">
					{screens[active].caption}
				</p>
			{/key}
		</div>
	</div>
</section>

<style>
	.stage {
		--w: 16rem;
		--h: calc(var(--w) * 19.5 / 9);
		display: flex;
		height: var(--h);
		align-items: center;
		justify-content: center;
	}

	@media (min-width: 44rem) {
		.stage {
			--w: 17rem;
		}
	}

	/* Generates no box, so the image inside still positions against the frame. */
	picture {
		display: contents;
	}

	/* Signals that the row scrolls, instead of letting a half-cut label at the
	   edge read as a rendering fault. */
	.faded {
		mask-image: linear-gradient(
			to right,
			transparent,
			#000 1.5rem,
			#000 calc(100% - 1.5rem),
			transparent
		);
	}

	.screen {
		position: absolute;
		inset: 0;
		height: 100%;
		width: 100%;
		object-fit: cover;
		user-select: none;
		transition:
			opacity 0.7s var(--ease),
			transform 0.7s var(--ease);
	}

	.tab {
		position: relative;
		transition:
			color 0.5s var(--ease),
			scale 0.35s var(--ease-hover);
	}

	.tab:hover {
		color: var(--fg);
	}

	/* Every label sits on a hairline; the active one draws an accent over it. */
	.track,
	.fill {
		position: absolute;
		bottom: 0;
		left: 0.75rem;
		right: 0.75rem;
		height: 1px;
	}

	.track {
		background: var(--rule);
	}

	.fill {
		background: var(--color-accent);
		transform-origin: left;
	}

	/* Advancing is driven by this animation ending, rather than by a timer running
	   alongside it — one clock, so the bar can never disagree with the screen, and
	   pausing it on hover pauses the carousel. */
	.fill.cycling {
		animation: fill 4.6s linear forwards;
	}

	@keyframes fill {
		from {
			transform: scaleX(0);
		}
		to {
			transform: scaleX(1);
		}
	}
</style>

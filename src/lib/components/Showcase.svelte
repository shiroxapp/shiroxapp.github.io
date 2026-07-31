<script lang="ts">
import { type Frame, type Screen, screens } from '$lib/content';
import { hoverPause, onScreen, swipe, tilt } from '$lib/motion';
import { theme } from '$lib/theme.svelte';
import PhoneFrame from './PhoneFrame.svelte';

/** Frames with no light capture of their own (the player) just keep `src`. */
function frameSrc(frame: Frame) {
	return theme.current === 'light' && frame.srcLight ? frame.srcLight : frame.src;
}

let active = $state(0);
/** Which frame of the active screen is showing — only ever nonzero for a
	    screen with more than one, mid-cycle. Reset to 0 on every tab change. */
let frame = $state(0);
/** Tracked per region rather than on the section as a whole: the wrapper spans
	    the full column, so its dead space either side of the device — and the caption
	    below it — would hold the carousel on a pointer that is only passing through. */
let overDevice = $state(false);
let overTabs = $state(false);
let overCaption = $state(false);
let focused = $state(false);
/** Auto-advance pauses once the visitor picks a screen themselves, then
	    resumes on its own after `AUTO_RESUME_MS` of no further picking — see
	    the effect below. */
let auto = $state(true);
/** Bumped on every manual pick so the resume effect can debounce off it,
	    independent of whatever `auto`'s own value happens to be. */
let manualAt = $state(0);
const AUTO_RESUME_MS = 10000;
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
/** The tvOS capture drops out below the width a device can turn sideways in
	    — fitted rather than cropped (`.screen.contain`) still reads as an odd
	    fit once it's portrait, and there's no phone-shaped alternative capture
	    to fall back to, unlike `narrowFrames`. */
const visibleScreens = $derived(wide ? screens : screens.filter((s) => !s.bare));
const bare = $derived(Boolean(visibleScreens[active]?.bare));
const landscape = $derived(Boolean(visibleScreens[active]?.landscape) && wide);

/** Narrow viewports get a screen's `narrowFrames` in place of `frames` where
	    it has one (the player, swapping its landscape capture for the portrait
	    one plus the two selector sheets that only ever show up there). */
function framesFor(screen: Screen): Frame[] {
	return !wide && screen.narrowFrames ? screen.narrowFrames : screen.frames;
}

const activeFrames = $derived(framesFor(visibleScreens[active]));
/**
 * A screen with only one frame behaves exactly as before: it advances once
 * `auto` says to and otherwise sits still. A screen with more than one frame
 * keeps cycling through its own frames on a loop even after `auto` has been
 * switched off by a manual pick elsewhere — picking a tab is not the same as
 * asking to never see the rest of what's in it.
 */
const segmentCycling = $derived((activeFrames.length > 1 || auto) && !reduced);

/** The list just lost the screen `active` pointed at (tvOS, narrowing away) —
	    back to the first rather than off the end. */
$effect(() => {
	if (active >= visibleScreens.length) {
		active = 0;
		frame = 0;
	}
});

/** Widening or narrowing can swap in a shorter `frames`/`narrowFrames` list
	    out from under whichever frame was showing (the player, mid-cycle). */
$effect(() => {
	if (frame >= activeFrames.length) frame = 0;
});

/** Reached the end of the active screen's own frames: loop them forever if
	    `auto` is off (see `segmentCycling`), otherwise hand off to the tab-level
	    advance so the carousel moves on to the next screen. */
function onSegmentEnd() {
	if (frame + 1 < activeFrames.length) {
		frame += 1;
	} else if (auto) {
		go(active + 1);
	} else {
		frame = 0;
	}
}

$effect(() => {
	reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
});

/** Reads `manualAt` so it reruns on every manual pick even when `auto` was
	    already false, cancelling whatever resume was pending and starting a
	    fresh one — continuing to browse manually keeps pushing the resume out
	    rather than racing it. */
$effect(() => {
	manualAt;
	if (auto) return;
	const timer = setTimeout(() => (auto = true), AUTO_RESUME_MS);
	return () => clearTimeout(timer);
});

/* Kept in step with the device's actual width, since the frames a screen
	   shows (see `framesFor`) can differ between wide and narrow. */
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
		behavior: reduced ? 'auto' : 'smooth',
	});
});

function wrap(i: number) {
	const n = visibleScreens.length;
	return ((i % n) + n) % n;
}

function go(next: number, manual = false) {
	active = wrap(next);
	frame = 0;
	if (manual) {
		auto = false;
		manualAt = Date.now();
	}
}

function onKeydown(event: KeyboardEvent) {
	const moves: Record<string, number> = {
		ArrowRight: active + 1,
		ArrowLeft: active - 1,
		Home: 0,
		End: visibleScreens.length - 1,
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
							<!-- Every frame of every screen stacked; only the active screen's
							     active frame is opaque, so any change — tab or sub-frame —
							     crossfades instead of swapping a decoded image in -->
							<div
								id="app-screens"
								role="tabpanel"
								aria-labelledby="tab-{active}"
								class="absolute inset-0"
							>
								{#each visibleScreens as screen, i (screen.label)}
									{#each framesFor(screen) as item, j (item.src)}
										<img
											src={frameSrc(item)}
											alt={item.alt}
											aria-hidden={!(active === i && frame === j)}
											loading={i === 0 && j === 0 ? 'eager' : 'lazy'}
											decoding="async"
											draggable="false"
											class="screen"
											class:contain={screen.bare}
											style="opacity: {active === i && frame === j
												? 1
												: 0}; transform: scale({active === i && frame === j ? 1 : 1.015});"
										/>
									{/each}
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
			{#each visibleScreens as screen, i (screen.label)}
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
						<!-- One segment per frame — a single-frame screen renders exactly
						     the one bar this used to be. -->
						<span class="segments">
							{#each framesFor(screen) as _, j (j)}
								<span class="segment">
									<span
										class="fill"
										class:cycling={segmentCycling && frame === j}
										class:filled={frame > j}
										style="animation-play-state: {held ? 'paused' : 'running'};"
										onanimationend={onSegmentEnd}
									></span>
								</span>
							{/each}
						</span>
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
					{visibleScreens[active]?.caption}
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

	/* The tvOS capture isn't the frame's own aspect, so cropping it to fill —
	   what every other screen wants, since each is a real device capture at the
	   frame's own ratio — would cut its edges instead. Letterboxed, not cropped. */
	.screen.contain {
		object-fit: contain;
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

	/* Every label sits on a hairline; the active one draws its segments over it. */
	.track {
		position: absolute;
		bottom: 0;
		left: 0.75rem;
		right: 0.75rem;
		height: 1px;
		background: var(--rule);
	}

	/* Sits over `.track`, one segment per frame — a small gap between segments
	   reveals the hairline underneath, same as the gap between story rings. */
	.segments {
		position: absolute;
		bottom: 0;
		left: 0.75rem;
		right: 0.75rem;
		height: 1px;
		display: flex;
		gap: 2px;
	}

	.segment {
		position: relative;
		flex: 1;
		height: 100%;
		overflow: hidden;
	}

	.fill {
		position: absolute;
		inset: 0;
		background: var(--color-accent);
		transform-origin: left;
		transform: scaleX(0);
	}

	/* A frame already shown while its screen's later frames cycle — filled in
	   full rather than left empty, same idea as a finished story ring. */
	.fill.filled {
		transform: scaleX(1);
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

<script lang="ts">
import { links } from '$lib/content';
import { preconnectOnHover, scrollProgress } from '$lib/motion';
import ShiroMark from './ShiroMark.svelte';
import ThemeToggle from './ThemeToggle.svelte';
</script>

<!-- Scroll position, as a single hairline along the very top edge. It sits above
     the dock rather than inside it: a straight rule clipped to a pill reads as a
     rendering fault at the ends. -->
<!-- Below sm the bar is flush to the top edge and there is nowhere for a detached
     hairline to sit: it lands in the status-bar region, and a phone's corner radius
     clips its ends. The dock is the only fixed furniture a small screen gets. -->
<div class="progress fixed inset-x-0 top-0 z-50 hidden h-0.5 sm:block" aria-hidden="true">
	<div
		use:scrollProgress
		class="h-full origin-left"
		style="background: var(--color-accent); transform: scaleX(var(--progress, 0));"
	></div>
</div>

<!-- Two pieces of chrome, not one made responsive: below sm an edge-to-edge bar that
     reads as part of the app, and at sm and up the floating pill. A pill on a 390px
     screen spends most of the width on itself and still has to hide half its links. -->
<header class="fixed inset-x-0 top-0 z-50 flex justify-center sm:top-3 sm:px-4 md:top-5">
	<div
		class="dock flex w-full items-center gap-1.5 border-b px-4 backdrop-blur-xl sm:w-auto sm:rounded-full sm:border sm:py-2 sm:pr-2 sm:pl-4"
		style="border-color: var(--rule); background: var(--glass);"
	>
		<a
			href="#top"
			class="group flex items-center gap-2.5 rounded-full py-2 pr-2"
			aria-label="Shirox, back to top"
		>
			<ShiroMark
				class="h-[1.3rem] w-[1.3rem] transition-transform duration-500 group-hover:-rotate-6"
			/>
			<span class="text-[1.0625rem] font-semibold tracking-[-0.02em]">Shirox</span>
		</a>

		<span
			class="mx-1.5 hidden h-5 w-px shrink-0 sm:block"
			style="background: var(--rule);"
			aria-hidden="true"
		></span>

		<!-- `ml-auto` opens the gap between wordmark and controls that a full-width bar
		     needs; at sm the pill closes up again and the dividers come back. -->
		<nav aria-label="Primary" class="ml-auto flex items-center gap-1 sm:ml-0">
			<a
				href="#features"
				class="link press hidden rounded-full px-4 py-2.5 text-[0.9375rem] sm:block"
				style="color: var(--muted);">Features</a
			>
			<a
				href={links.github}
				target="_blank"
				rel="noreferrer"
				use:preconnectOnHover
				class="link press hidden rounded-full px-4 py-2.5 text-[0.9375rem] sm:block"
				style="color: var(--muted);">Source</a
			>
			<a
				href="#install"
				class="cta press rounded-full px-5 py-2.5 text-[0.9375rem] font-medium"
				style="background: var(--color-accent); color: var(--color-paper);">Install</a
			>
		</nav>

		<span
			class="mx-1.5 hidden h-5 w-px shrink-0 sm:block"
			style="background: var(--rule);"
			aria-hidden="true"
		></span>

		<ThemeToggle />
	</div>
</header>

<style>
	/* A bar flush to the top edge sits under the status bar and the notch unless it
	   says otherwise; the pill floats clear of both and does not need to. The shadow
	   goes with the pill for the same reason — an edge-to-edge bar casting one reads
	   as a floating object that failed to detach. */
	.dock {
		padding-top: calc(0.5rem + env(safe-area-inset-top, 0px));
		padding-bottom: 0.5rem;
	}

	@media (width >= 40rem) {
		.dock {
			padding-top: 0.5rem;
			box-shadow:
				0 12px 32px -12px rgb(11 11 12 / 0.18),
				0 1px 2px rgb(11 11 12 / 0.06);
		}
	}

	/* `scale` is listed but never set here: the growth is `.press`'s, and a control
	   that declares its own transition has to make room for it. */
	.link {
		transition:
			color 0.3s var(--ease),
			background-color 0.3s var(--ease),
			scale 0.35s var(--ease-hover);
	}

	.link:hover {
		color: var(--fg) !important;
		background: var(--sunken);
	}
</style>

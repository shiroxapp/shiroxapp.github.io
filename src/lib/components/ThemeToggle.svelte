<script lang="ts">
import { theme } from '$lib/theme.svelte';

/** The inline script in app.html has already set the attribute; adopt it. */
$effect(() => theme.sync());

/** Keeps following the OS theme live, unless this visitor has chosen one. */
$effect(() => theme.followSystem());

const dark = $derived(theme.current === 'dark');
</script>

<button
	type="button"
	onclick={() => theme.toggle()}
	class="toggle press grid h-10 w-10 shrink-0 place-items-center rounded-full"
	aria-label={dark ? 'Switch to the light theme' : 'Switch to the dark theme'}
	aria-pressed={dark}
	title={dark ? 'Light theme' : 'Dark theme'}
>
	<!-- One shape does the work: the disc grows and a cutter slides across it to
	     bite a crescent out, while the rays retract. -->
	<svg viewBox="0 0 20 20" class="h-5 w-5" aria-hidden="true">
		<mask id="shirox-moon">
			<rect x="0" y="0" width="20" height="20" fill="#fff" />
			<circle class="cutter" class:dark cx="10" cy="10" r="6" fill="#000" />
		</mask>

		<circle
			class="disc"
			class:dark
			cx="10"
			cy="10"
			r="6"
			fill="currentColor"
			mask="url(#shirox-moon)"
		/>

		<g class="rays" class:dark stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
			<path d="M10 1.5v1.6" />
			<path d="M10 16.9v1.6" />
			<path d="M1.5 10h1.6" />
			<path d="M16.9 10h1.6" />
			<path d="m4.2 4.2 1.1 1.1" />
			<path d="m14.7 14.7 1.1 1.1" />
			<path d="m15.8 4.2-1.1 1.1" />
			<path d="m5.3 14.7-1.1 1.1" />
		</g>
	</svg>
</button>

<style>
	/* Declared here rather than with `transition-colors`, which would drop the
	   press scale: one element gets one transition-property list. */
	.toggle {
		color: var(--muted);
		transition:
			color 0.3s var(--ease),
			background-color 0.3s var(--ease),
			scale 0.35s var(--ease-hover);
	}

	/* `(hover: hover)` as everywhere else — see the note in layout.css. Left
	   ungated, the toggle would keep the lit background after the tap that
	   switched the theme, reading as a pressed state that never released. */
	@media (hover: hover) {
		.toggle:hover {
			color: var(--fg);
			background: var(--sunken);
		}
	}

	/* transform-box keeps the origin on each shape rather than the whole canvas,
	   so scaling happens about the shape's own centre. */
	.disc,
	.cutter,
	.rays {
		transform-box: fill-box;
		transform-origin: center;
		transition: transform 0.5s var(--ease);
	}

	.disc {
		transform: scale(0.62);
	}

	.disc.dark {
		transform: scale(0.92);
	}

	/* Parked clear of the disc in light, so nothing is cut away. */
	.cutter {
		transform: translate(-100%, -100%) scale(0.85);
	}

	.cutter.dark {
		transform: translate(28%, -22%) scale(0.85);
	}

	.rays {
		transition:
			transform 0.5s var(--ease),
			opacity 0.35s var(--ease);
	}

	.rays.dark {
		transform: scale(0.4);
		opacity: 0;
	}
</style>

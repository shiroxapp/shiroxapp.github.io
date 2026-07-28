<script lang="ts">
	import type { Snippet } from 'svelte';

	/**
	 * A CSS-only iPhone shell holding real screen captures. It draws no status bar
	 * or home indicator of its own — the captures already contain theirs, and a
	 * second set drawn on top would sit at a different size and read as a mistake.
	 *
	 * `landscape` swaps the shell's two dimensions. Both are derived from `--w` on
	 * an ancestor, so turning sideways is one transition on width and height rather
	 * than a rotation, and the corner radius stays put through the whole move.
	 *
	 * Also used, unmodified, for a capture of something that isn't a phone (the
	 * tvOS screen) — same box, same chrome, on the theory that a shape that keeps
	 * changing size and style screen to screen would read as a broken carousel
	 * rather than one frame showing something different for a moment. The image
	 * fits inside without cropping or stretching; see `.screen`'s object-fit
	 * override in Showcase.svelte.
	 */
	let { children, landscape = false }: { children: Snippet; landscape?: boolean } = $props();
</script>

<div class="frame shrink-0 overflow-hidden" class:landscape>
	{@render children()}
</div>

<style>
	.frame {
		position: relative;
		width: var(--w);
		height: var(--h);
		border: 1px solid var(--rule);
		border-radius: 2.5rem;
		background: var(--sunken);
		box-shadow:
			0 40px 80px -32px rgb(11 11 12 / 0.3),
			0 1px 3px rgb(11 11 12 / 0.06);
		transition:
			width 0.75s var(--ease),
			height 0.75s var(--ease);
	}

	/* Only ever applied at widths where a sideways device already fits, so it needs
	   no scaling down; narrower viewports get a portrait capture instead. */
	.frame.landscape {
		width: var(--h);
		height: var(--w);
	}

	@media (prefers-reduced-motion: reduce) {
		.frame {
			transition: none;
		}
	}
</style>

<script lang="ts">
/**
 * A URL with a copy button. Three states, so a failed clipboard write never
 * reports success: idle → copied, or idle → manual (clipboard unavailable or
 * blocked), where the text is selected so ⌘C still works.
 */
let { value }: { value: string } = $props();

const fieldId = $props.id();
let status = $state<'idle' | 'copied' | 'manual'>('idle');
let timer: ReturnType<typeof setTimeout> | undefined;
let button: HTMLButtonElement | undefined = $state();

const labels = { idle: 'Copy', copied: 'Copied', manual: '⌘C' } as const;
/** The faces are stacked and hidden from assistive tech, so the button carries
	    its own name — and can spell out what the ⌘C face only symbolises. */
const names = {
	idle: 'Copy URL',
	copied: 'Copied',
	manual: 'Copy failed — press Command C',
} as const;
const announcements = {
	idle: '',
	copied: 'Copied to clipboard',
	manual: 'Copy failed — the URL is selected, press Command C',
} as const;

function selectField() {
	const node = document.getElementById(fieldId);
	if (!node) return;
	const range = document.createRange();
	range.selectNodeContents(node);
	const selection = getSelection();
	selection?.removeAllRanges();
	selection?.addRange(range);
}

/**
 * The confirmation beat. Scripted rather than declared because the button and
 * its classes survive every click: a CSS animation would play on the first
 * copy and then sit finished, leaving repeat copies with no acknowledgement.
 */
function pop() {
	if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
	button?.animate([{ scale: '1' }, { scale: '1.055', offset: 0.32 }, { scale: '1' }], {
		duration: 420,
		easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
	});
}

async function copy() {
	clearTimeout(timer);
	try {
		await navigator.clipboard.writeText(value);
		status = 'copied';
		pop();
	} catch {
		status = 'manual';
		selectField();
	}
	timer = setTimeout(() => (status = 'idle'), 2400);
}
</script>

<div class="flex items-center gap-1 rounded-xl py-1 pr-1 pl-3.5" style="background: var(--sunken);">
	<code
		id={fieldId}
		class="url mono no-scrollbar min-w-0 flex-1 overflow-x-auto py-1.5 text-[0.6875rem] whitespace-nowrap sm:text-[0.75rem]"
		>{value}</code
	>

	<button
		bind:this={button}
		type="button"
		onclick={copy}
		aria-label={names[status]}
		class="copy press grid shrink-0 rounded-lg px-3 py-2 text-[0.8125rem] font-medium"
		class:copied={status === 'copied'}
	>
		<!-- All three faces occupy the same grid cell, so the button is as wide as its
		     longest state at rest and never resizes the row it sits in mid-swap. -->
		<span class="faces" aria-hidden="true">
			<span class="face" class:on={status === 'idle'}>{labels.idle}</span>

			<span class="face" class:on={status === 'copied'}>
				<svg
					class="h-3 w-3"
					viewBox="0 0 12 12"
					fill="none"
					stroke="currentColor"
					stroke-width="1.8"
				>
					<path
						class="check"
						d="M1.5 6.5 4.5 9.5 10.5 2.5"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
				{labels.copied}
			</span>

			<span class="face" class:on={status === 'manual'}>{labels.manual}</span>
		</span>
	</button>
</div>

<span class="sr-only" aria-live="polite">{announcements[status]}</span>

<style>
	/* The field scrolls rather than truncating, so an ellipsis would misreport it.
	   The fade covers only the last 2rem: where the URL already fits, that band is
	   empty and nothing dims; where it overflows, the clip reads as "scrolls". */
	.url {
		mask-image: linear-gradient(to right, #000 calc(100% - 2rem), transparent);
	}

	/* Colour lives here rather than in an inline style so hover has somewhere to
	   go — an inline background can only be overridden with `!important`. */
	.copy {
		background: var(--bg);
		color: var(--fg);
		box-shadow: 0 1px 2px rgb(11 11 12 / 0.07);
		transition:
			background-color 0.3s var(--ease),
			color 0.3s var(--ease),
			box-shadow 0.3s var(--ease),
			scale 0.35s var(--ease-hover);
	}

	/* A shadow would be the obvious hover cue, but the button sits above its field
	   in light and below it in dark, so only a shift toward the foreground reads
	   as "raised" in both. */
	.copy:hover {
		background: color-mix(in srgb, var(--fg) 9%, var(--bg));
	}

	/* After :hover, so a second copy attempt doesn't lift the confirmation away. */
	.copy.copied {
		background: var(--color-accent);
		color: var(--color-paper);
		box-shadow: 0 3px 12px -4px color-mix(in srgb, var(--color-accent) 70%, transparent);
	}


	.faces {
		display: grid;
		place-items: center;
	}

	.faces > * {
		grid-area: 1 / 1;
	}

	/* Labels rise into place and sink back out, so the swap reads as movement
	   rather than as two words dissolving through each other. */
	.face {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		white-space: nowrap;
		opacity: 0;
		translate: 0 0.35rem;
		transition:
			opacity 0.26s var(--ease),
			translate 0.26s var(--ease);
	}

	.face.on {
		opacity: 1;
		translate: 0;
	}

	/* the tick draws itself rather than popping in */
	.check {
		stroke-dasharray: 16;
		stroke-dashoffset: 16;
	}

	/* Bound to the class, not the element: removing `.on` drops the animation and
	   restores the undrawn tick, so the next copy draws it again from scratch. */
	.face.on .check {
		animation: draw 0.35s var(--ease) 0.08s forwards;
	}

	@keyframes draw {
		to {
			stroke-dashoffset: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.face.on .check {
			animation: none;
			stroke-dashoffset: 0;
		}
	}
</style>

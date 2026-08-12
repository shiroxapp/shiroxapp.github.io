<script lang="ts">
/**
 * One tile in the stats section. A numeric `value` counts up while
 * `visible` and back down to 0 once it scrolls out — appearing and
 * disappearing are the same animation run toward opposite targets, not
 * two separate effects, so reversing direction mid-count is seamless.
 * A string `value` (the last-commit date) has nothing sensible to count
 * toward, so it's shown as-is — still a card among cards, just a still one.
 *
 * `raw` tracks the animation's current position as a plain variable, not
 * `$state` — reading the displayed count back inside the effect that
 * writes it would register that write as a dependency of the same
 * effect, restarting it on every single frame instead of running once
 * per `visible`/`value` change.
 */
let {
	label,
	value,
	visible,
	href,
}: { label: string; value: number | string | null; visible: boolean; href?: string } = $props();

let displayValue = $state(0);
let raw = 0;

$effect(() => {
	if (typeof value !== 'number') return;

	const target = visible ? value : 0;

	if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
		raw = target;
		displayValue = target;
		return;
	}

	const start = raw;
	const startTime = performance.now();
	const duration = 900;
	let frame = 0;

	const tick = (now: number) => {
		const progress = Math.min((now - startTime) / duration, 1);
		const eased = 1 - (1 - progress) ** 3;
		raw = start + (target - start) * eased;
		displayValue = Math.round(raw);
		if (progress < 1) frame = requestAnimationFrame(tick);
	};

	frame = requestAnimationFrame(tick);
	return () => cancelAnimationFrame(frame);
});
</script>

<svelte:element
	this={href ? 'a' : 'article'}
	{href}
	target={href ? '_blank' : undefined}
	rel={href ? 'noreferrer' : undefined}
	class="card glow reveal surface relative overflow-hidden rounded-2xl p-7 text-center md:p-8"
>
	<p class="mono display text-nowrap text-[clamp(1.75rem,3.6vw,2.5rem)]">
		{#if value === null}
			—
		{:else if typeof value === 'number'}
			{displayValue.toLocaleString()}
		{:else}
			{value}
		{/if}
	</p>
	<p class="mt-2 text-nowrap text-[0.8125rem]" style="color: var(--muted);">{label}</p>
</svelte:element>

<style>
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

	/* `(hover: hover)` as everywhere else — see the note in layout.css. These tiles
	   are links, so on a phone the pose would stick from the tap until the page
	   navigated away under it. */
	@media (hover: hover) {
		.card:hover {
			translate: 0 -3px;
			scale: 1.02;
			border-color: color-mix(in srgb, var(--color-accent) 35%, transparent);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.card:hover {
			translate: none;
			scale: none;
		}
	}
</style>

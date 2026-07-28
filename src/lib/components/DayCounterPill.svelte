<script lang="ts">
	/**
	 * The status pill on a `pending` install method. At rest it reads the plain
	 * status ("In review by Apple"); hovered, it counts up to the number of days
	 * since `since` instead — the wait becomes a number rather than a word. A
	 * tap does the same on a device with no hover to answer.
	 *
	 * The two triggers are mutually exclusive, not layered on the same
	 * `onclick`/`onmouseenter` pair: a touchscreen's first tap on a hoverable
	 * element fires a synthetic `mouseenter` before `click` even reaches it
	 * (iOS Safari does this so a hover-triggered menu gets a chance to open
	 * before the tap commits), so a click handler that just toggles `hovered`
	 * would immediately undo what that synthetic hover had just set. Checking
	 * `(hover: hover)` up front instead picks one interaction model per device
	 * and never asks the other to share state with it.
	 *
	 * The count is computed from the visitor's clock, not baked in at build time,
	 * so it stays correct no matter how long after a deploy someone reads it.
	 */
	let { status, since }: { status: string; since?: string } = $props();

	let hovered = $state(false);
	let count = $state(0);
	let canHover = $state(true);

	$effect(() => {
		canHover = matchMedia('(hover: hover)').matches;
	});

	const totalDays = $derived(
		since ? Math.max(0, Math.floor((Date.now() - new Date(since).getTime()) / 86_400_000)) : 0
	);

	$effect(() => {
		if (!hovered || !since) {
			count = 0;
			return;
		}

		const start = performance.now();
		const duration = 350;
		let frame = 0;

		const tick = (now: number) => {
			const progress = Math.min((now - start) / duration, 1);
			count = Math.round(progress * totalDays);
			if (progress < 1) frame = requestAnimationFrame(tick);
		};

		frame = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(frame);
	});
</script>

<span
	role="presentation"
	class="mono inline-flex w-[11.5rem] items-center justify-center rounded-full border px-2.5 py-1 text-center text-[0.6875rem] tracking-[0.12em] uppercase"
	style="border-color: var(--rule); color: var(--muted);"
	onmouseenter={canHover ? () => (hovered = true) : undefined}
	onmouseleave={canHover ? () => (hovered = false) : undefined}
	onclick={canHover ? undefined : () => (hovered = !hovered)}
>
	{#if hovered && since}
		{count} day{count === 1 ? '' : 's'} in review
	{:else}
		{status}
	{/if}
</span>

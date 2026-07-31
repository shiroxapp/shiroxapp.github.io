<script lang="ts">
import { onMount } from 'svelte';
import { links, release, sections, statLabels } from '$lib/content';
import { glowField, inView, inViewStagger, onScreen } from '$lib/motion';
import { loadStats, type Stats } from '$lib/stats';
import RevealHeading from './RevealHeading.svelte';
import StatTile from './StatTile.svelte';

let visible = $state(false);
let stats: Stats = $state({
	githubStars: null,
	discordMembers: null,
	testflightInstalls: null,
	lastCommit: null,
});

onMount(async () => {
	stats = await loadStats();
});

const lastCommitDisplay = $derived(
	stats.lastCommit
		? new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short' }).format(
				new Date(stats.lastCommit),
			)
		: null,
);
</script>

<section
	class="mx-auto max-w-5xl px-6 py-24 md:py-32"
	aria-labelledby="stats-heading"
	use:onScreen={(seen) => (visible = seen)}
>
	<RevealHeading
		id="stats-heading"
		text={sections.stats.title}
		class="display text-[clamp(2.25rem,5.4vw,3.5rem)]"
	/>

	<p
		use:inView={70}
		class="reveal mt-5 max-w-[38ch] text-[1.0625rem]"
		style="--i: 1; color: var(--muted); text-wrap: pretty;"
	>
		{sections.stats.sub}
	</p>

	<div
		class="glow-field mt-12 grid grid-cols-2 gap-4 md:mt-16 md:grid-cols-5"
		use:inViewStagger={70}
		use:glowField
	>
		<StatTile
			label={statLabels.githubStars}
			value={stats.githubStars}
			{visible}
			href={links.github}
		/>
		<StatTile
			label={statLabels.discordMembers}
			value={stats.discordMembers}
			{visible}
			href={links.discord}
		/>
		<StatTile
			label={statLabels.testflightInstalls}
			value={stats.testflightInstalls}
			{visible}
			href={links.testflight}
		/>
		<StatTile
			label={statLabels.version}
			value={`v${release.version}`}
			{visible}
			href={links.testflight}
		/>
		<StatTile
			label={statLabels.lastCommit}
			value={lastCommitDisplay ?? '—'}
			{visible}
			href={links.github}
		/>
	</div>
</section>

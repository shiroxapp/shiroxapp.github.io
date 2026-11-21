<script lang="ts">
import { onMount } from 'svelte';
import { slide } from 'svelte/transition';
import Footer from '$lib/components/Footer.svelte';
import IconPackCard from '$lib/components/IconPackCard.svelte';
import IconPackGuide from '$lib/components/IconPackGuide.svelte';
import Nav from '$lib/components/Nav.svelte';
import PageRays from '$lib/components/PageRays.svelte';
import RevealHeading from '$lib/components/RevealHeading.svelte';
import config from '$lib/config.json';
import { iconPacksCopy } from '$lib/content';
import { glowField, inView, inViewStagger, preconnectOnHover } from '$lib/motion';

let { data } = $props();

const copy = iconPacksCopy;
const line1 = copy.hero.headline.split(' ');
const line2 = copy.hero.headlineAccent.split(' ');

const SITE_URL = config.site.url;
const pageUrl = `${SITE_URL}/iconpacks/`;
const title = 'Icon packs — Shirox';
const description =
	'Community icon packs for Shirox: redraw every icon in the app with Font Awesome, Heroicons, Iconoir, Lucide and more. Copy a link, paste it in the app.';

/**
 * The guide to making a pack stays folded away until someone asks for it: most
 * visitors are here to pick a pack, and five steps of tooling would bury the
 * request link. It opens from the "Create your own" button, from the hero's link,
 * and from any link to #create, such as the home page's last icon card.
 */
let guideOpen = $state(false);

const scrollToGuide = () =>
	document.getElementById('create')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

/* Opening scrolls once the guide has slid in (`onintroend` below), not at once: a
   scroll started mid-slide aims at a moving target, and on arrival from another
   page SvelteKit's own jump to the hash cancels it. Already open, it just scrolls. */
function openGuide() {
	if (location.hash !== '#create') history.replaceState(history.state, '', '#create');
	if (guideOpen) scrollToGuide();
	guideOpen = true;
}

onMount(() => {
	const fromHash = () => {
		if (location.hash === '#create') openGuide();
	};
	fromHash();
	addEventListener('hashchange', fromHash);
	return () => removeEventListener('hashchange', fromHash);
});
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={pageUrl} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={pageUrl} />
	<meta property="og:site_name" content="Shirox" />
	<meta property="og:image" content="{SITE_URL}/og-image.png" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content="{SITE_URL}/og-image.png" />
</svelte:head>

<PageRays />

<Nav />

<main id="top">
	<section class="mx-auto max-w-5xl px-6 pt-24 pb-12 sm:pt-32 md:pt-44 md:pb-16">
		<p
			class="mono load-rise text-[0.8125rem] tracking-wide uppercase"
			style="--base: 60ms; color: var(--color-accent);"
		>
			{copy.hero.kicker}
		</p>
		<h1 class="display mt-6 text-[clamp(2.5rem,7.6vw,5.25rem)]">
			{#each line1 as word, i (word)}
				<span class="load-rise inline-block" style="--i: {i}; --base: 130ms; --step: 42ms"
					>{word}</span
				>{' '}
			{/each}
			<span class="block">
				{#each line2 as word, i (word)}
					<span
						class="load-rise inline-block"
						style="--i: {line1.length + i}; --base: 130ms; --step: 42ms; color: var(--muted)"
						>{word}</span
					>{' '}
				{/each}
			</span>
		</h1>
		<p
			class="load-rise mt-8 max-w-[46ch] text-[1.0625rem] leading-relaxed md:text-lg"
			style="--base: 400ms; color: var(--muted); text-wrap: pretty"
		>
			{copy.hero.sub}
		</p>
		<div class="load-rise mt-10 flex flex-wrap items-center gap-7" style="--base: 470ms">
			<a
				href="#packs"
				class="cta press rounded-full px-6 py-3 text-[0.9375rem] font-medium"
				style="background: var(--color-accent); color: var(--color-paper);">Get a pack</a
			>
			<a
				href="#create"
				onclick={(e) => {
					e.preventDefault();
					openGuide();
				}}
				class="ul text-[0.9375rem] transition-colors hover:text-(--fg)"
				style="color: var(--muted)">Make your own</a
			>
		</div>
	</section>

	<section id="packs" class="mx-auto max-w-5xl px-6 py-24 md:py-28" aria-labelledby="packs-heading">
		<RevealHeading
			id="packs-heading"
			text={copy.packs.title}
			class="display text-[clamp(2.25rem,5.4vw,3.5rem)]"
		/>
		<p
			use:inView={70}
			class="mt-5 max-w-[40ch] text-[1.0625rem]"
			style="color: var(--muted); text-wrap: pretty;"
		>
			{copy.packs.sub}
		</p>

		<div
			class="glow-field mt-12 grid gap-4 md:mt-16 md:grid-cols-2"
			use:inViewStagger={80}
			use:glowField
		>
			{#each data.packs as pack (pack.id)}
				<IconPackCard {pack} />
			{/each}
		</div>
	</section>

	<section
		id="install-pack"
		class="mx-auto max-w-5xl px-6 py-24 md:py-28"
		aria-labelledby="install-pack-heading"
	>
		<RevealHeading
			id="install-pack-heading"
			text={copy.install.title}
			class="display text-[clamp(2.25rem,5.4vw,3.5rem)]"
		/>

		<ol class="mt-12 grid gap-4 sm:grid-cols-3 md:mt-16" use:inViewStagger={70}>
			{#each copy.install.steps as step, i (step.title)}
				<li class="tile rounded-2xl p-7">
					<span class="mono text-[0.8125rem]" style="color: var(--color-accent);">0{i + 1}</span>
					<h3 class="mt-3 text-[1.25rem] font-medium tracking-tight">{step.title}</h3>
					<p
						class="mt-2 text-[0.9375rem] leading-relaxed"
						style="color: var(--muted); text-wrap: pretty;"
					>
						{step.body}
					</p>
				</li>
			{/each}
		</ol>

		<p use:inView={70} class="mt-6 text-[0.875rem]" style="color: var(--muted);">
			{copy.install.note}
		</p>
	</section>

	<section class="mx-auto max-w-5xl px-6 pt-8 pb-24 md:pb-28" aria-labelledby="request-heading">
		<div use:inView class="request relative overflow-hidden rounded-3xl p-8 md:p-12">
			<h2 id="request-heading" class="display text-[clamp(2rem,4.6vw,3rem)]">
				{copy.request.title}
			</h2>
			<p class="mt-4 max-w-[40ch] text-[1.0625rem]" style="color: var(--muted); text-wrap: pretty;">
				{copy.request.sub}
			</p>
			<div class="mt-8 flex flex-wrap items-center gap-4">
				<a
					href={config.iconpacks.requestUrl}
					target="_blank"
					rel="noreferrer"
					use:preconnectOnHover
					class="cta press rounded-full px-6 py-3 text-[0.9375rem] font-medium"
					style="background: var(--color-accent); color: var(--color-paper);">{copy.request.cta}</a
				>
				<button
					type="button"
					class="own press inline-flex items-center gap-2 rounded-full px-6 py-3 text-[0.9375rem] font-medium"
					aria-expanded={guideOpen}
					aria-controls="create"
					onclick={() => {
						if (!guideOpen) return openGuide();
						guideOpen = false;
						history.replaceState(history.state, '', location.pathname);
					}}
				>
					{copy.request.own}
					<svg
						class="chevron h-3 w-3"
						class:open={guideOpen}
						viewBox="0 0 12 12"
						fill="none"
						stroke="currentColor"
						stroke-width="1.8"
						aria-hidden="true"
					>
						<path d="M2.5 4.5 6 8l3.5-3.5" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
				</button>
			</div>
		</div>
	</section>

	<!-- The anchor stays in the page while the guide is folded, so links to #create
	     (the home page's last icon card) have somewhere to land and open it. -->
	<div id="create">
		{#if guideOpen}
			<div transition:slide={{ duration: 600 }} onintroend={scrollToGuide}>
				<IconPackGuide />
			</div>
		{/if}
	</div>
</main>

<Footer />

<style>
	.tile {
		border: 1px solid var(--rule);
		background: var(--sunken);
		transition:
			opacity 0.75s var(--ease) var(--delay, 0ms),
			transform 0.75s var(--ease) var(--delay, 0ms);
	}

	.request {
		border: 1px solid var(--rule);
		background:
			radial-gradient(80% 120% at 100% 0%, var(--glow), transparent 70%),
			var(--sunken);
	}

	.own {
		border: 1px solid var(--rule);
		background: var(--bg);
		color: var(--fg);
		transition:
			background-color 0.3s var(--ease),
			scale 0.35s var(--ease-hover);
	}

	@media (hover: hover) {
		.own:hover {
			background: color-mix(in srgb, var(--fg) 9%, var(--bg));
		}
	}

	.chevron {
		transition: rotate 0.4s var(--ease);
	}

	.chevron.open {
		rotate: 180deg;
	}
</style>

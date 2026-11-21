<script lang="ts">
import config from '$lib/config.json';
import { iconPacksCopy } from '$lib/content';
import { inView, inViewStagger } from '$lib/motion';
import IconPackChecker from './IconPackChecker.svelte';
import RevealHeading from './RevealHeading.svelte';

/**
 * How to make a pack, start to finish. The commands are the repo's own
 * (scripts/iconpacks.ts), so the guide and the tooling can't drift apart without
 * the check in CI noticing.
 */
const copy = iconPacksCopy.create;
const repo = config.iconpacks.repoUrl;

const packJson = `{
  "name": "My Icons",
  "author": "Who drew the icons",
  "license": "MIT",
  "website": "https://example.com",
  "contributor": {
    "name": "your-github",
    "url": "https://github.com/your-github"
  },
  "url": "https://shiroxapp.github.io/iconpacks/my-icons/pack.json",
  "iconsVersion": 1,
  "packVersion": 1,
  "icons": {}
}`;

const steps = [
	{
		title: 'Fork the website repo',
		body: 'Packs live next to this page. Fork it and clone your copy.',
		code: `git clone https://github.com/<you>/shiroxapp.github.io\ncd shiroxapp.github.io && bun install`,
		link: { label: 'shiroxapp.github.io', href: repo },
	},
	{
		title: 'Draw one SVG per symbol',
		body: 'Name each file after the SF Symbol it replaces, e.g. house.fill.svg. Paint in currentColor so the app can tint it. The checker below shows what is still missing.',
		code: 'static/iconpacks/my-icons/svg/house.fill.svg\nstatic/iconpacks/my-icons/svg/magnifyingglass.svg\n…',
		link: { label: 'The list of symbols (icons.json)', href: config.iconpacks.manifestUrl },
	},
	{
		title: 'Describe the pack',
		body: 'Add a pack.json beside the svg folder. Leave icons empty, the build fills it in. Put a LICENSE file next to it too. For a pack drawn in colour, add "multicolor": true so the app keeps the colours.',
		code: packJson,
	},
	{
		title: 'Build and check',
		body: 'Turns the SVGs into the PDFs the app draws, and checks nothing is missing. Needs rsvg-convert (brew install librsvg).',
		code: 'bun run iconpacks trim my-icons    # optional: crops empty margins\nbun run iconpacks build my-icons\nbun run iconpacks check my-icons\nbun run dev   # see it on /iconpacks',
	},
	{
		title: 'Open a pull request',
		body: 'Once it is merged, the pack shows up on this page and its link works in the app.',
		link: { label: 'New pull request', href: `${repo}/compare` },
	},
];
</script>

<section class="mx-auto max-w-5xl px-6 py-24 md:py-32" aria-labelledby="create-heading">
	<RevealHeading id="create-heading" text={copy.title} class="display text-[clamp(2.25rem,5.4vw,3.5rem)]" />

	<p use:inView={70} class="mt-5 max-w-[44ch] text-[1.0625rem]" style="color: var(--muted); text-wrap: pretty;">
		{copy.sub}
	</p>

	<ol class="steps mt-12 md:mt-16" use:inViewStagger={70}>
		{#each steps as step, i (step.title)}
			<li class="step relative grid gap-4 pb-10 pl-14 md:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] md:gap-8">
				<span class="num mono absolute top-0 left-0 grid h-9 w-9 place-items-center rounded-full text-[0.8125rem]">
					{i + 1}
				</span>
				<div>
					<h3 class="pt-1.5 text-[1.125rem] font-medium tracking-tight">{step.title}</h3>
					<p class="mt-2 text-[0.9375rem] leading-relaxed" style="color: var(--muted); text-wrap: pretty;">
						{step.body}
					</p>
					{#if step.link}
						<a
							href={step.link.href}
							target="_blank"
							rel="noreferrer"
							class="ul mt-3 inline-block text-[0.875rem]"
							style="color: var(--color-accent);">{step.link.label} ↗</a
						>
					{/if}
				</div>
				{#if step.code}
					<pre class="code mono no-scrollbar overflow-x-auto rounded-xl p-4 text-[0.75rem] leading-relaxed"><code
							>{step.code}</code
						></pre>
				{/if}
			</li>
		{/each}
	</ol>

	<div use:inView class="mt-4">
		<IconPackChecker />
	</div>
</section>

<style>
	/* A rail down the numbers, so five steps read as one path rather than five boxes. */
	.step::before {
		content: '';
		position: absolute;
		top: 2.75rem;
		bottom: 0.5rem;
		left: calc(1.125rem - 0.5px);
		width: 1px;
		background: var(--rule);
	}

	.step:last-child::before {
		display: none;
	}

	.num {
		border: 1px solid var(--rule);
		background: var(--bg);
		color: var(--fg);
	}

	.code {
		border: 1px solid var(--rule);
		background: var(--sunken);
		align-self: start;
	}
</style>

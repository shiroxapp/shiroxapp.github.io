<script lang="ts">
	import { hero, links } from '$lib/content';
	import { preconnectOnHover } from '$lib/motion';
	import ShiroMark from './ShiroMark.svelte';

	const line1 = hero.headline.split(' ');
	const line2 = hero.headlineAccent.split(' ');
</script>

<!-- Top padding clears the dock, which is out of flow and so reserves no space of
     its own. Below sm the dock is flush to the top edge rather than floating at
     top-3, so it needs less clearing. -->
<section class="mx-auto max-w-5xl px-6 pt-24 pb-12 sm:pt-32 md:pt-44 md:pb-16">
	<ShiroMark draw class="load-rise h-12 w-12 transition-transform duration-500 hover:-rotate-6" />

	<!-- Words are split so they can rise in one after another. The `{' '}` between
	     them is a real space text node, not a margin: without it the heading reads
	     as "Youranimelibrary" to screen readers, to copy-paste, and to crawlers. -->
	<h1 class="display mt-9 text-[clamp(2.5rem,7.6vw,5.25rem)] md:mt-12">
		{#each line1 as word, i (word)}
			<span class="load-rise inline-block" style="--i: {i}; --base: 130ms; --step: 42ms">{word}</span
			>{' '}
		{/each}
		<span class="block">
			{#each line2 as word, i (word)}
				<span
					class="load-rise inline-block"
					style="--i: {line1.length + i}; --base: 130ms; --step: 42ms; color: var(--muted)">{word}</span
				>{' '}
			{/each}
		</span>
	</h1>

	<p
		class="load-rise mt-8 max-w-[46ch] text-[1.0625rem] leading-relaxed md:text-lg"
		style="--base: 400ms; color: var(--muted); text-wrap: pretty"
	>
		{hero.sub}
	</p>

	<div class="load-rise mt-10 flex items-center gap-7" style="--base: 470ms">
		<a
			href="#install"
			class="cta press rounded-full px-6 py-3 text-[0.9375rem] font-medium"
			style="background: var(--color-accent); color: var(--color-paper);"
		>
			Install
		</a>

		<a
			href={links.github}
			target="_blank"
			rel="noreferrer"
			use:preconnectOnHover
			class="ul text-[0.9375rem] transition-colors hover:text-(--fg)"
			style="color: var(--muted)">Source</a
		>
	</div>

	<p class="mono load-rise mt-9 text-[0.8125rem]" style="--base: 530ms; color: var(--muted)">
		{hero.meta}
	</p>
</section>

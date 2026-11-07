<script lang="ts">
import config from '$lib/config.json';
import { type IconPackSummary, packSourceUrl } from '$lib/iconpacks';
import { preconnectOnHover } from '$lib/motion';
import CopyField from './CopyField.svelte';
import IconPreview from './IconPreview.svelte';

let { pack }: { pack: IconPackSummary } = $props();
</script>

<!-- `id` so the home page's pack cards can land on this one. -->
<article id={pack.id} class="card glow relative flex flex-col overflow-hidden rounded-2xl">
	<div class="preview relative px-6 pt-6 pb-5 sm:px-7">
		<IconPreview pack={pack.id} />
	</div>

	<div class="flex flex-1 flex-col gap-5 p-6 sm:p-7">
		<div class="flex flex-wrap items-center justify-between gap-3">
			<div class="flex items-baseline gap-2.5">
				<h3 class="text-[1.375rem] font-medium tracking-tight">{pack.name}</h3>
				<span class="mono text-[0.75rem]" style="color: var(--muted);">v{pack.packVersion}</span>
			</div>

			{#if pack.contributor}
				<a
					href={pack.contributor.url}
					target="_blank"
					rel="noreferrer"
					class="contributor flex items-center gap-2 rounded-full py-1 pr-3 pl-1 text-[0.8125rem]"
				>
					<img
						src="https://github.com/{pack.contributor.name}.png?size=64"
						alt=""
						width="22"
						height="22"
						loading="lazy"
						class="h-[22px] w-[22px] rounded-full"
					/>
					<span style="color: var(--muted);">
						by <span class="font-medium" style="color: var(--fg);">{pack.contributor.name}</span>
					</span>
				</a>
			{/if}
		</div>

		<div class="mt-auto">
			<p
				class="mb-2 text-[0.75rem] font-medium tracking-wide uppercase"
				style="color: var(--muted);"
			>
				Pack link
			</p>
			<CopyField value={pack.url} />
		</div>

		<div class="flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.875rem]">
			{#if pack.website}
				<a
					href={pack.website}
					target="_blank"
					rel="noreferrer"
					use:preconnectOnHover
					class="ul transition-colors hover:text-(--fg)"
					style="color: var(--muted);">Website</a
				>
			{/if}
			<a
				href={packSourceUrl(config.iconpacks.treeUrl, pack.id)}
				target="_blank"
				rel="noreferrer"
				class="ul transition-colors hover:text-(--fg)"
				style="color: var(--muted);">Source</a
			>
			<a
				href="/iconpacks/{pack.id}/pack.json"
				target="_blank"
				class="ul transition-colors hover:text-(--fg)"
				style="color: var(--muted);">pack.json</a
			>
		</div>
	</div>
</article>

<style>
	/* Reveal and hover transitions restated together, as in Features.svelte: a
	   scoped transition list replaces the global one rather than adding to it. */
	.card {
		scroll-margin-top: 6rem;
		border: 1px solid var(--rule);
		background: var(--sunken);
		transition:
			opacity 0.75s var(--ease) var(--delay, 0ms),
			transform 0.75s var(--ease) var(--delay, 0ms),
			translate 0.5s var(--ease-hover),
			border-color 0.5s var(--ease-hover);
	}

	/* Arriving from the home page's card for this pack: a brief accent outline says
	   which of the cards it was. */
	.card:target {
		border-color: color-mix(in srgb, var(--color-accent) 55%, transparent);
	}

	@media (hover: hover) {
		.card:hover {
			translate: 0 -3px;
			border-color: color-mix(in srgb, var(--color-accent) 35%, transparent);
		}

		.contributor:hover {
			background: var(--sunken);
		}
	}

	.preview {
		border-bottom: 1px solid var(--rule);
		background: radial-gradient(110% 100% at 50% 0%, var(--glow), transparent 75%);
	}

	.contributor {
		border: 1px solid var(--rule);
		transition: background-color 0.3s var(--ease);
	}

	@media (prefers-reduced-motion: reduce) {
		.card:hover {
			translate: none;
		}
	}
</style>

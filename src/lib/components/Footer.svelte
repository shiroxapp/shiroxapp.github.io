<script lang="ts">
	import { footer, links } from '$lib/content';

	const social = [
		{ label: 'GitHub', href: links.github },
		{ label: 'Discord', href: links.discord },
		{ label: 'Ko-fi', href: links.kofi }
	];
</script>

<footer class="border-t backdrop-blur-xl" style="border-color: var(--rule); background: var(--glass);">
	<div
		class="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between"
	>
		<p class="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[0.8125rem]">
			<span style="color: var(--muted);">
				Shirox {footer.year} · by
				<a href={links.author} target="_blank" rel="noreferrer" class="ul">xibrox</a>
				·
				<a href={links.license} target="_blank" rel="noreferrer" class="ul">{footer.licenseLabel}</a>
			</span>
		</p>

		<nav aria-label="Elsewhere" class="flex gap-6 text-[0.8125rem]">
			{#each social as item (item.label)}
				<a
					href={item.href}
					target="_blank"
					rel="noreferrer"
					class="ul transition-colors hover:text-(--fg)"
					style="color: var(--muted);">{item.label}</a
				>
			{/each}
		</nav>
	</div>
</footer>

<script lang="ts">
import { glyphUrl } from '$lib/iconpacks';

/**
 * One icon, painted in the current text colour: a published pack's icon by `pack`
 * and `icon`, or any SVG by `src` (the pack checker's local files). A `color` icon,
 * from a multicolor pack, is shown as it is drawn instead.
 *
 * Drawn as a mask over `currentColor` rather than an `<img>`: an SVG loaded as an
 * image can't inherit the page's colour, so every icon would be black on the dark
 * theme. The SVG still decides the shape, and nothing is inlined.
 */
let {
	pack = '',
	icon = '',
	src,
	color = false,
	label,
	class: klass = '',
}: {
	pack?: string;
	icon?: string;
	src?: string;
	color?: boolean;
	label?: string;
	class?: string;
} = $props();

const url = $derived(src ?? glyphUrl(pack, icon));
</script>

{#if color}
	<img src={url} alt={label ?? ''} class="inline-block object-contain {klass}" loading="lazy" decoding="async" />
{:else}
<span
	class="glyph {klass}"
	style="--src: url('{url}');"
	role={label ? 'img' : undefined}
	aria-label={label}
	aria-hidden={label ? undefined : 'true'}
></span>
{/if}

<style>
	.glyph {
		display: inline-block;
		background: currentColor;
		mask: var(--src) center / contain no-repeat;
		-webkit-mask: var(--src) center / contain no-repeat;
	}
</style>

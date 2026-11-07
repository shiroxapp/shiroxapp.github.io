<script lang="ts">
import { glyphUrl } from '$lib/iconpacks';

/**
 * One icon of one pack, painted in the current text colour.
 *
 * Drawn as a mask over `currentColor` rather than an `<img>`: an SVG loaded as an
 * image can't inherit the page's colour, so every icon would be black on the dark
 * theme. The pack's own SVG still decides the shape, and nothing is inlined.
 */
let {
	pack,
	icon,
	label,
	class: klass = '',
}: { pack: string; icon: string; label?: string; class?: string } = $props();
</script>

<span
	class="glyph {klass}"
	style="--src: url('{glyphUrl(pack, icon)}');"
	role={label ? 'img' : undefined}
	aria-label={label}
	aria-hidden={label ? undefined : 'true'}
></span>

<style>
	.glyph {
		display: inline-block;
		background: currentColor;
		mask: var(--src) center / contain no-repeat;
		-webkit-mask: var(--src) center / contain no-repeat;
	}
</style>

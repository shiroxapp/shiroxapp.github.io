<script lang="ts">
/**
 * The kanji 白 (shiro, "white") — the Shirox app icon, traced as vector strokes
 * so it is crisp at any size and costs no image request.
 *
 * `draw` wipes the strokes in one after another on load, in the order a hand
 * would write them. Sized by the caller via `class`; colored via currentColor.
 */
let { class: className = '', draw = false }: { class?: string; draw?: boolean } = $props();
</script>

<svg class={className} viewBox="0 0 1024 1024" fill="currentColor" aria-hidden="true">
	<g class={draw ? 'load-stroke' : ''}>
		<path d="M447 106 L537 122 L505 245 L406 245 Z" />
		<rect x="200" y="245" width="625" height="75" />
		<rect x="200" y="245" width="85" height="670" />
		<rect x="740" y="245" width="85" height="670" />
		<rect x="285" y="500" width="455" height="75" />
		<rect x="285" y="775" width="455" height="80" />
	</g>
</svg>

<script lang="ts">
	import { inViewStagger } from '$lib/motion';

	/**
	 * A heading that rises word by word when it reaches the viewport, matching how
	 * the hero headline arrives — the lower sections were the only ones on the page
	 * whose type just appeared.
	 */
	let {
		text,
		id,
		class: klass = ''
	}: { text: string; id?: string; class?: string } = $props();

	const words = $derived(text.split(' '));
</script>

<!--
	The space between words is a real text node, never a margin. Splitting into
	spans without it makes the heading read as "Whatitdoes." to screen readers,
	to copy-paste, and to crawlers.
-->
<h2 {id} class={klass} use:inViewStagger={45}>
	{#each words as word, i (i)}<span class="inline-block">{word}</span>{' '}{/each}
</h2>

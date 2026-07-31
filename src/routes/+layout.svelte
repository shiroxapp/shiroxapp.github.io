<script lang="ts">
import './layout.css';
import favicon from '$lib/assets/favicon.svg';

let { children } = $props();

/* Read by scripts/probe.html, which cannot otherwise tell a prerendered page
	   from a hydrated one and would sample the wrong state. */
$effect(() => {
	(window as unknown as { __hydrated?: boolean }).__hydrated = true;
});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{@render children()}

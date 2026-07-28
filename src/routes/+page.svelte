<script lang="ts">
	import Nav from '$lib/components/Nav.svelte';
	import Hero from '$lib/components/Hero.svelte';
	import Showcase from '$lib/components/Showcase.svelte';
	import Features from '$lib/components/Features.svelte';
	import Stats from '$lib/components/Stats.svelte';
	import Install from '$lib/components/Install.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import SideRays from '$lib/components/SideRays.svelte';
	import { theme } from '$lib/theme.svelte';

	const title = 'Shirox — Anime & manga library manager for iOS';
	const description =
		'A free, source-available library manager for anime and manga on iOS 15+. Community modules, AniList and MyAnimeList sync, and offline downloads.';

	/** Served from the root of shiroxapp.github.io — see .github/workflows/pages.yml —
	    so this is also what Cloudflare serves; both hosts share one build. Absolute,
	    since og:image and og:url have to be, not relative to whatever crawled them. */
	const SITE_URL = 'https://shiroxapp.github.io';
	const ogImage = `${SITE_URL}/og-image.png`;

	/** White-on-dark barely needs help; the same rays on paper read as almost
	    nothing, so light mode gets darker strands instead of the same grays.
	    Darkening the colour alone under-shoots, though — the shader ties alpha
	    directly to the ray colour's own brightness (`color.a = max(color.rgb)`),
	    so a darker colour is also a more transparent one. Intensity and falloff
	    compensate: measured by reading GPU pixels back at rest, the defaults
	    (intensity 2, falloff 1.6) land around 6% alpha with these darker
	    colours — near-invisible — while intensity 6 / falloff 1.3 lands around
	    20%, clearly present without overwhelming the page. */
	const rayColor1 = $derived(theme.current === 'light' ? '#8a8a8a' : '#ffffff');
	const rayColor2 = $derived(theme.current === 'light' ? '#3f3f3f' : '#8a8a8a');
	const rayIntensity = $derived(theme.current === 'light' ? 6 : 2);
	const rayFalloff = $derived(theme.current === 'light' ? 1.3 : 1.6);
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<meta name="keywords" content="anime, manga, library manager, iOS, AltStore, SideStore, AniList, MyAnimeList" />
	<meta name="author" content="xibrox" />
	<link rel="canonical" href={SITE_URL} />

	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={SITE_URL} />
	<meta property="og:site_name" content="Shirox" />
	<meta property="og:locale" content="en_US" />
	<meta property="og:image" content={ogImage} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content="Shirox — your anime library, entirely yours." />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={ogImage} />
</svelte:head>

<!-- TEMP: background test — drop or promote before this ships. -->
<div class="pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
	<SideRays
		speed={2.5}
		{rayColor1}
		{rayColor2}
		intensity={rayIntensity}
		spread={2}
		origin="top-right"
		tilt={0}
		saturation={0.15}
		blend={0.75}
		falloff={rayFalloff}
		opacity={1}
	/>
</div>

<Nav />

<main id="top">
	<Hero />
	<Showcase />
	<Features />
	<Stats />
	<Install />
</main>

<Footer />

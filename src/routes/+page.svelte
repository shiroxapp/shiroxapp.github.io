<script lang="ts">
import Features from '$lib/components/Features.svelte';
import Footer from '$lib/components/Footer.svelte';
import Hero from '$lib/components/Hero.svelte';
import Install from '$lib/components/Install.svelte';
import Nav from '$lib/components/Nav.svelte';
import Showcase from '$lib/components/Showcase.svelte';
import SideRays from '$lib/components/SideRays.svelte';
import Stats from '$lib/components/Stats.svelte';
import config from '$lib/config.json';
import { theme } from '$lib/theme.svelte';

const title = 'Shirox — Anime & manga library manager for iOS';
const description =
	'A free, source-available library manager for anime and manga on iOS 15+. Community modules, AniList and MyAnimeList sync, and offline downloads.';

/** Served from the root of shiroxapp.github.io — see .github/workflows/pages.yml —
	    so this is also what Cloudflare serves; both hosts share one build. Absolute,
	    since og:image and og:url have to be, not relative to whatever crawled them. */
const SITE_URL = config.site.url;
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

/** A phone is held close and the rays cover far more of the field of view there,
	    so the brightness that reads as a corner accent on a desktop reads as a lit
	    background — measured on a 390x844 screen, the top of the page composited to
	    #585859 against a #0b0b0c surface. Below `sm` (the line the dock already
	    switches at) the rays are dimmed to a third and pulled tighter to the
	    corner, which lands that same band on #272728 — darker than the desktop's
	    own #3e3e3e, which is the point: dark mode should read as dark.

	    `innerWidth` is 0 until the browser reports it, and the desktop values are
	    the safe default in that window — the canvas only ever renders client-side,
	    so nothing is prerendered against them. */
let innerWidth = $state(0);
const narrow = $derived(innerWidth > 0 && innerWidth < 640);
const rayIntensity = $derived((theme.current === 'light' ? 6 : 2) * (narrow ? 0.32 : 1));
const rayFalloff = $derived((theme.current === 'light' ? 1.3 : 1.6) + (narrow ? 0.4 : 0));
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

<svelte:window bind:innerWidth />

<!-- TEMP: background test — drop or promote before this ships. -->
<div class="rays pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
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

<style>
	/* Safari paints its toolbars from `theme-color`, which is the raw page surface
	   — so wherever the rays still carry brightness at the very bottom of the
	   viewport, the page meets the toolbar on a different colour and the join
	   reads as a seam. (Measured on a phone: the bottom band composited to
	   #171718 against a #0b0b0c toolbar.) Fading the layer out over the lower
	   half puts the last strip at exactly the surface colour, so there is nothing
	   left to mismatch, whether Safari uses theme-color or samples the pixels
	   itself. Phones only: on a desktop there is no browser chrome to meet, and
	   the full-height field is the look. */
	@media (max-width: 639px) {
		.rays {
			mask-image: linear-gradient(to bottom, #000 55%, transparent 100%);
		}
	}
</style>

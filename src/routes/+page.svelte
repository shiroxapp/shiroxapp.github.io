<script lang="ts">
import Features from '$lib/components/Features.svelte';
import Footer from '$lib/components/Footer.svelte';
import Hero from '$lib/components/Hero.svelte';
import IconPacksTeaser from '$lib/components/IconPacksTeaser.svelte';
import Install from '$lib/components/Install.svelte';
import Nav from '$lib/components/Nav.svelte';
import PageRays from '$lib/components/PageRays.svelte';
import Showcase from '$lib/components/Showcase.svelte';
import Stats from '$lib/components/Stats.svelte';
import config from '$lib/config.json';

let { data } = $props();

const title = 'Shirox — Anime & manga library manager for iOS and Mac';
const description =
	'A free, source-available library manager for anime and manga on iPhone, iPad and Mac. Community modules, AniList and MyAnimeList sync, and offline downloads.';

/** Served from the root of shiroxapp.github.io — see .github/workflows/pages.yml —
	    so this is also what Cloudflare serves; both hosts share one build. Absolute,
	    since og:image and og:url have to be, not relative to whatever crawled them. */
const SITE_URL = config.site.url;
const ogImage = `${SITE_URL}/og-image.png`;
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<meta name="keywords" content="anime, manga, library manager, iOS, macOS, Mac, AltStore, SideStore, AniList, MyAnimeList" />
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

<PageRays />

<Nav />

<main id="top">
	<Hero />
	<Showcase />
	<Features />
	<IconPacksTeaser packs={data.packs} />
	<Stats />
	<Install />
</main>

<Footer />

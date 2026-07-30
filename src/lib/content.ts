/**
 * Every string, URL and number shown on the page lives here. Components render
 * this data and never hardcode copy, so changing a link or bumping a version
 * doesn't touch markup.
 *
 * Copy rule: one short clause per item. If a line needs a comma splice to fit,
 * it's too long for this page.
 */

/**
 * Version, size, min OS and the IPA link are read off the AltStore manifest at
 * build time rather than typed here — see scripts/sync-release.ts. Shipping a
 * release updates the site on its next build with no edit to this file.
 */
import { release } from './release.generated';
import { safeMode } from './safe-mode';

export type Feature = { n: string; title: string; body: string };

export type Screen = {
	label: string;
	caption: string;
	alt: string;
	src: string;
	landscape?: boolean;
	/**
	 * Used instead of `src` on viewports too narrow to turn the device sideways.
	 * The app renders this screen in either orientation, so a phone-width visitor
	 * sees the portrait capture in an upright frame rather than a shrunken
	 * sideways one.
	 */
	narrowSrc?: string;
	/**
	 * A light-theme capture, used in place of `src` while the site is in light
	 * mode. Absent for a screen that doesn't change with the app's own theme
	 * (the player, tvOS) — those just keep showing `src` either way.
	 */
	srcLight?: string;
	/** Drops the PhoneFrame chrome for this screen — a capture of something
	    that isn't a phone gets no bezel, just the image. */
	bare?: boolean;
};

export type DeepLink = { label: string; href: string };

export type InstallMethod = {
	n: string;
	/** `join` gets the same action-link treatment as `download`, just with a
	    plus in place of the download arrow — this isn't a file landing on
	    disk, it's an invite to a beta. */
	kind: 'source' | 'download' | 'join' | 'pending';
	title: string;
	tagline: string;
	/** Absent for a `pending` method: there is nowhere to send anyone yet. */
	url?: string;
	action?: string;
	meta?: string;
	/** Shown in place of the action link on a `pending` method, e.g. "Planned". */
	status?: string;
	deepLinks?: DeepLink[];
	/** Lifts one method out of the list and into a panel. Exactly one should set it. */
	recommended?: boolean;
	/** Path under /static/icons, dropped in by hand rather than vendored. */
	icon?: string;
	/** For a method naming more than one app (AltStore / SideStore) — one icon
	    per app, rendered right before that app's own name instead of `icon`. */
	apps?: { name: string; icon: string }[];
};

/** Section headings, at the same weight as the hero so the page keeps one voice. */
export const sections = {
	features: { title: 'What it does.', sub: 'No accounts required, no ads, no upsell.' },
	stats: { title: 'By the numbers.', sub: 'Live from GitHub, Discord and more.' },
	install: { title: 'Install it.', sub: 'Sideload it today. On the App Store soon.' }
} as const;

export type StatKey = 'githubStars' | 'discordMembers' | 'testflightInstalls' | 'version' | 'lastCommit';

/** Order here is render order in Stats.svelte. */
export const statLabels: Record<StatKey, string> = {
	githubStars: 'GitHub stars',
	discordMembers: 'Discord members',
	testflightInstalls: 'Testflight installs',
	version: 'Current version',
	lastCommit: 'Last commit'
};

export { release };

export const links = {
	github: 'https://github.com/xibrox/Shirox',
	discord: 'https://discord.com/invite/b9tZSuJj73',
	kofi: 'https://ko-fi.com/xibrox',
	license: 'https://github.com/xibrox/Shirox/blob/main/LICENSE',
	author: 'https://github.com/xibrox'
} as const;

export const footer = {
	year: 2026,
	licenseLabel: 'License'
} as const;

export const hero = {
	headline: 'Your anime library,',
	headlineAccent: 'entirely yours.',
	sub: 'A free, source-available library manager for anime and manga on iOS.',
	meta: `v${release.version} · ${release.minOS}`
} as const;

export const features: Feature[] = [
	{
		n: '01',
		title: 'Community modules',
		body: safeMode
			? 'Bring your own catalog sources.'
			: 'Add a source, search it, watch it.'
	},
	{ n: '02', title: 'Anime and manga', body: 'One library for both, with a real reader.' },
	{ n: '03', title: 'Tracking', body: 'AniList and MyAnimeList. Offline edits catch up.' },
	{ n: '04', title: 'Player', body: 'Picture-in-Picture, AirPlay, Chromecast, subtitles.' },
	{ n: '05', title: 'Downloads', body: 'Episodes and chapters, kept for no signal.' },
	{ n: '06', title: 'Your own files', body: 'Local video, or a Jellyfin server.' }
];

/**
 * Real captures from the app, ordered as a first run reads: arrive, browse,
 * find, open, watch, track, share. `landscape` turns the device sideways —
 * the player genuinely is a landscape screen, so the frame follows it.
 */
const allScreens: Screen[] = [
	{
		label: 'Home',
		caption: 'Pick up where you left off.',
		alt: 'The Shirox home screen, with a featured series and a Continue Watching row.',
		src: '/screenshots/home.webp'
	},
	{
		label: 'Discover',
		caption: 'Trending, seasonal, top rated.',
		alt: 'Rows of anime posters under Trending Now and This Season, each with a rating.',
		src: '/screenshots/home-trending.webp'
	},
	{
		label: 'Search',
		caption: 'Every entry, every season.',
		alt: 'Search results for Clannad, shown as a grid of rated poster cards.',
		src: '/screenshots/search.webp'
	},
	{
		label: 'Series',
		caption: 'Synopsis, episodes, downloads.',
		alt: 'The Clannad series page, with synopsis, genres and a list of 23 episodes.',
		src: '/screenshots/detail.webp'
	},
	{
		label: 'Library',
		caption: 'Everything you track, in one list.',
		alt: 'The library, filtered to Watching, showing episode progress for each series.',
		src: '/screenshots/library.webp'
	},
	{
		label: 'Social',
		caption: 'See what everyone else is watching.',
		alt: 'A profile page with a banner, avatar and a feed of friends’ recent activity.',
		src: '/screenshots/social.webp'
	},
	{
		label: 'Player',
		caption: 'Picture-in-Picture, AirPlay, Chromecast, subtitles.',
		alt: 'The video player, playing episode 5 with a skip-intro control and a scrubber.',
		src: '/screenshots/player.webp',
		landscape: true,
		narrowSrc: '/screenshots/player-portrait.webp'
	},
	/* Last of all: the one capture that isn't a phone at all, so it gets no
	   bezel — see `bare` on PhoneFrame. Also landscape, like the player. */
	{
		label: 'AppleTV',
		caption: 'Under active development.',
		alt: 'Shirox running on tvOS, showing the Apple TV interface.',
		src: '/screenshots/tvos.png',
		landscape: true,
		bare: true
	}
];

/** The player is the one screen that reads as playback of unlicensed content
    out of context, so a review build drops it rather than just relabels it. */
export const screens: Screen[] = safeMode
	? allScreens.filter((screen) => screen.label !== 'Player')
	: allScreens;

/** Mirrored in scripts/sync-release.ts, which reads the same manifest at build time. */
const SOURCE_URL = 'https://raw.githubusercontent.com/xibrox/Shirox/refs/heads/main/apps.json';
const TESTFLIGHT_URL = 'https://testflight.apple.com/join/jvGzcXYh';
const NIGHTLY_URL = 'https://nightly.link/xibrox/Shirox/workflows/nightly.yaml/main?preview';

export const installMethods: InstallMethod[] = [
	{
		n: '01',
		kind: 'join',
		title: 'TestFlight',
		tagline: 'Public beta, straight from Apple.',
		url: TESTFLIGHT_URL,
		recommended: true,
		action: 'Join the beta',
		meta: '~21 MB · iOS 15+',
		icon: '/icons/testflight.jpg'
	},
	{
		n: '02',
		kind: 'pending',
		title: 'App Store',
		tagline: 'The official listing. Release planned soon.',
		status: 'Planned',
		icon: '/icons/app-store.webp'
	},
	{
		n: '03',
		kind: 'source',
		title: 'AltStore / SideStore',
		tagline: 'Add the source once. Updates arrive on their own.',
		url: SOURCE_URL,
		apps: [
			{ name: 'AltStore', icon: '/icons/altstore.jpg' },
			{ name: 'SideStore', icon: '/icons/sidestore.jpg' }
		],
		deepLinks: [
			{ label: 'Add to AltStore', href: `altstore://source?url=${encodeURIComponent(SOURCE_URL)}` },
			{ label: 'Add to SideStore', href: `sidestore://source?url=${encodeURIComponent(SOURCE_URL)}` }
		]
	},
	{
		n: '04',
		kind: 'download',
		title: 'Stable IPA',
		tagline: 'Sideload it by hand.',
		url: release.ipaUrl,
		action: 'Download',
		meta: `${release.size} · ${release.minOS}`,
		icon: '/icons/github.jpg'
	},
	{
		n: '05',
		kind: 'download',
		title: 'Nightly',
		tagline: 'Latest build from main. May be unstable.',
		url: NIGHTLY_URL,
		action: 'Download',
		icon: '/icons/github.jpg'
	}
];

/**
 * The icon packs published under /static/iconpacks, as the pages see them.
 *
 * Each pack is a folder with a pack.json (the file the app downloads), one PDF per
 * icon for the app and the SVG sources the PDFs are built from. The site draws
 * its previews from the SVGs: every one of them paints in `currentColor`, so used
 * as a CSS mask they take the page's own ink in both themes.
 *
 * The full pack.json files are read at build time in $lib/server/iconpacks.ts and
 * only the summary below reaches the browser, not hundreds of icon paths per pack.
 */

export type IconPackSummary = {
	/** The folder name under /static/iconpacks, e.g. `lucide`. */
	id: string;
	name: string;
	website: string;
	contributor: { name: string; url: string } | null;
	/** The link pasted into the app: where this pack's pack.json is published. */
	url: string;
	packVersion: number;
	/** False for the just-for-fun packs, which the icon page lists but the home page
	    leaves out. Site-only: `featured` in pack.json, which the app ignores. */
	featured: boolean;
	/** Drawn in its own colours (`multicolor` in pack.json): previewed as images, not tinted. */
	multicolor: boolean;
};

/**
 * The icons the previews cycle through: ones a visitor would recognise from the
 * app's own tab bar, player and library, so a pack reads as "the app, redrawn".
 */
export const showcaseIcons = [
	'house.fill',
	'magnifyingglass',
	'books.vertical.fill',
	'gearshape.fill',
	'play.fill',
	'heart.fill',
	'bookmark.fill',
	'bell',
	'star.fill',
	'film',
	'tv',
	'square.and.arrow.down',
	'puzzlepiece.extension',
	'person.circle',
	'calendar',
	'sparkles',
	'pause.circle.fill',
	'gobackward.10',
	'captions.bubble',
	'trash',
	'folder.fill',
	'globe',
	'paperplane.fill',
	'checkmark.circle.fill',
] as const;

/** The SVG source of one icon of one pack, as served from /static. */
export const glyphUrl = (pack: string, icon: string) => `/iconpacks/${pack}/svg/${icon}.svg`;

/** A pack's folder on GitHub. */
export const packSourceUrl = (treeUrl: string, pack: string) => `${treeUrl}/${pack}`;

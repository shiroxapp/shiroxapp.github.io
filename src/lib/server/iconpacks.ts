import type { IconPackSummary } from '$lib/iconpacks';

type PackFile = {
	name: string;
	website?: string;
	contributor?: { name: string; url: string };
	url: string;
	packVersion: number;
	featured?: boolean;
	multicolor?: boolean;
};

/* Eager and server-only: the packs are read once at build time, while the pages
   prerender, and nothing of the 209-entry icon maps is shipped to the browser. */
const files = import.meta.glob<PackFile>('/static/iconpacks/*/pack.json', {
	eager: true,
	import: 'default',
});

export const iconPacks: IconPackSummary[] = Object.entries(files)
	.map(([path, pack]) => ({
		id: path.split('/').at(-2) ?? '',
		name: pack.name,
		website: pack.website ?? '',
		contributor: pack.contributor ?? null,
		url: pack.url,
		packVersion: pack.packVersion,
		featured: pack.featured !== false,
		multicolor: pack.multicolor === true,
	}))
	// The regular packs first, then the just-for-fun ones, each by name.
	.sort((a, b) => Number(b.featured) - Number(a.featured) || a.name.localeCompare(b.name));

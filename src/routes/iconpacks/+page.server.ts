import { iconPacks } from '$lib/server/iconpacks';

export const prerender = true;

/* The packs themselves are served from /iconpacks/<pack>/, so the page has to be
   that folder's index.html. As a sibling iconpacks.html, GitHub Pages would answer
   /iconpacks with a redirect into the folder, which has no index, and a 404. */
export const trailingSlash = 'always';

export const load = () => ({ packs: iconPacks });

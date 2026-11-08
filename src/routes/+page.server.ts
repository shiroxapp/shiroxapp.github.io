import { iconPacks } from '$lib/server/iconpacks';

/* The home page shows the serious packs only; the joke ones live on /iconpacks/. */
export const load = () => ({ packs: iconPacks.filter((p) => p.featured) });

#!/usr/bin/env bun
/**
 * Builds and checks the icon packs in static/iconpacks.
 *
 *     bun run iconpacks check [pack]        # every pack (or one) against the app's icons.json
 *     bun run iconpacks build <pack> [ver]  # svg/*.svg -> icons/*.pdf, rewrites pack.json
 *
 * icons.json, the list of SF Symbols a pack has to cover and its version, belongs
 * to the app (xibrox/Shirox, iconpacks/icons.json, kept by scripts/icons/icons.py)
 * and is read from GitHub. Set ICONS_JSON to a local path to use another copy.
 *
 * The app loads a pack only when its `iconsVersion` matches the one it ships with,
 * and offers an update when `packVersion` goes up, so `build` bumps packVersion
 * whenever the pack's icons or icons version change. `url` must be where the
 * pack.json is published, https://shiroxapp.github.io/iconpacks/<pack>/pack.json,
 * since the app resolves the icon paths against it and checks it for updates.
 */
import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import config from '../src/lib/config.json';

type Manifest = { version: number; icons: string[] };
type Pack = {
	name?: string;
	url?: string;
	iconsVersion?: number;
	packVersion?: number;
	icons?: Record<string, string>;
	[key: string]: unknown;
};

const ROOT = new URL('../static/iconpacks', import.meta.url).pathname.replace(
	/^\/([a-zA-Z]:)/,
	'$1',
);
const SITE = config.site.url;

async function manifest(): Promise<Manifest> {
	const local = process.env.ICONS_JSON;
	if (local) return JSON.parse(await readFile(local, 'utf8'));
	const res = await fetch(config.iconpacks.manifestUrl, { cache: 'no-store' });
	if (!res.ok)
		throw new Error(`icons.json: HTTP ${res.status} from ${config.iconpacks.manifestUrl}`);
	return res.json();
}

const readPack = async (id: string): Promise<Pack> =>
	JSON.parse(await readFile(join(ROOT, id, 'pack.json'), 'utf8'));

const writePack = (id: string, pack: Pack) =>
	writeFile(join(ROOT, id, 'pack.json'), `${JSON.stringify(pack, null, 2)}\n`);

async function packIds(): Promise<string[]> {
	const entries = await readdir(ROOT, { withFileTypes: true });
	return entries
		.filter((e) => e.isDirectory() && existsSync(join(ROOT, e.name, 'pack.json')))
		.map((e) => e.name)
		.sort();
}

async function check(only: string | undefined) {
	const ids = await packIds();
	if (only && !ids.includes(only)) throw new Error(`no pack ${only} in static/iconpacks`);
	const { version, icons } = await manifest();
	let failed = false;
	for (const id of only ? [only] : ids) {
		const pack = await readPack(id);
		const problems: string[] = [];
		if (!pack.name) problems.push('no name');
		if (pack.iconsVersion !== version)
			problems.push(`made for icons version ${pack.iconsVersion}, the app is on ${version}`);
		const expected = `${SITE}/iconpacks/${id}/pack.json`;
		if (pack.url !== expected) problems.push(`url should be ${expected}`);
		if (!existsSync(join(ROOT, id, 'LICENSE'))) problems.push('no LICENSE file');
		const mapped = pack.icons ?? {};
		for (const name of icons) {
			if (!mapped[name]) problems.push(`no icon for ${name}`);
			if (!existsSync(join(ROOT, id, 'svg', `${name}.svg`))) problems.push(`no svg/${name}.svg`);
		}
		for (const [name, file] of Object.entries(mapped)) {
			if (file.includes('..') || !existsSync(join(ROOT, id, file)))
				problems.push(`${name}: ${file} is missing`);
		}
		console.log(`${id}: ${problems.length ? `${problems.length} problems` : 'ok'}`);
		for (const p of problems.slice(0, 20)) console.log(`  ${p}`);
		failed ||= problems.length > 0;
	}
	process.exit(failed ? 1 : 0);
}

async function build(id: string | undefined, forced: string | undefined) {
	if (!id) throw new Error('build: name the pack folder, e.g. lucide');
	if (!existsSync(join(ROOT, id, 'pack.json'))) throw new Error(`${id}/pack.json is missing`);
	if (!Bun.which('rsvg-convert'))
		throw new Error('build needs rsvg-convert (brew install librsvg)');

	const { version, icons } = await manifest();
	const missing = icons.filter((n) => !existsSync(join(ROOT, id, 'svg', `${n}.svg`)));
	if (missing.length) throw new Error(`no SVG for: ${missing.join(', ')}`);

	const out = join(ROOT, id, 'icons');
	await rm(out, { recursive: true, force: true });
	await mkdir(out, { recursive: true });
	for (const name of icons) {
		const proc = Bun.spawnSync([
			'rsvg-convert',
			'-f',
			'pdf',
			'-o',
			join(out, `${name}.pdf`),
			join(ROOT, id, 'svg', `${name}.svg`),
		]);
		if (proc.exitCode !== 0) throw new Error(`rsvg-convert failed on ${name}: ${proc.stderr}`);
	}

	const pack = await readPack(id);
	const mapped = Object.fromEntries(icons.map((n) => [n, `icons/${n}.pdf`]));
	const changed =
		JSON.stringify(mapped) !== JSON.stringify(pack.icons) || pack.iconsVersion !== version;
	const packVersion = forced ? Number(forced) : (pack.packVersion ?? 0) + (changed ? 1 : 0);
	Object.assign(pack, {
		url: `${SITE}/iconpacks/${id}/pack.json`,
		iconsVersion: version,
		packVersion,
		icons: mapped,
	});
	await writePack(id, pack);
	console.log(
		`${id}: ${icons.length} icons, pack version ${packVersion}, icons version ${version}`,
	);
}

const [command, ...args] = process.argv.slice(2);
try {
	if (command === 'check') await check(args[0]);
	else if (command === 'build') await build(args[0], args[1]);
	else {
		console.log('usage: bun run iconpacks check [pack] | build <pack> [packVersion]');
		process.exit(2);
	}
} catch (error) {
	console.error(error instanceof Error ? error.message : error);
	process.exit(1);
}

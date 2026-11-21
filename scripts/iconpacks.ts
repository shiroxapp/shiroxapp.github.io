#!/usr/bin/env bun
/**
 * Builds and checks the icon packs in static/iconpacks.
 *
 *     bun run iconpacks check [pack]        # every pack (or one) against the app's icons.json
 *     bun run iconpacks build <pack> [ver]  # svg/*.svg -> icons/*.pdf, rewrites pack.json
 *     bun run iconpacks trim <pack>         # crops the empty margin shared by all its SVGs
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
import { inflateSync } from 'node:zlib';
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

/** The alpha channel of an 8-bit RGBA, non-interlaced PNG, which is what rsvg-convert
    writes: enough of a decoder to measure where an icon draws, without a dependency. */
function pngAlpha(png: Buffer): { width: number; height: number; alpha: Uint8Array } {
	let offset = 8;
	let width = 0;
	let height = 0;
	const data: Buffer[] = [];
	while (offset < png.length) {
		const length = png.readUInt32BE(offset);
		const type = png.toString('ascii', offset + 4, offset + 8);
		const body = png.subarray(offset + 8, offset + 8 + length);
		if (type === 'IHDR') {
			width = body.readUInt32BE(0);
			height = body.readUInt32BE(4);
			if (body[8] !== 8 || body[9] !== 6 || body[12] !== 0)
				throw new Error('expected an 8-bit RGBA, non-interlaced PNG');
		} else if (type === 'IDAT') data.push(body);
		offset += 12 + length;
	}
	const raw = inflateSync(Buffer.concat(data));
	const stride = width * 4;
	const rows = new Uint8Array(stride * height);
	for (let y = 0; y < height; y++) {
		const filter = raw[y * (stride + 1)];
		const src = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
		const row = rows.subarray(y * stride, (y + 1) * stride);
		const prev = y ? rows.subarray((y - 1) * stride, y * stride) : new Uint8Array(stride);
		for (let x = 0; x < stride; x++) {
			const a = x >= 4 ? row[x - 4] : 0;
			const b = prev[x];
			const c = x >= 4 ? prev[x - 4] : 0;
			const p = a + b - c;
			const pa = Math.abs(p - a);
			const pb = Math.abs(p - b);
			const pc = Math.abs(p - c);
			const predictor = [0, a, b, (a + b) >> 1, pa <= pb && pa <= pc ? a : pb <= pc ? b : c][
				filter
			];
			row[x] = (src[x] + predictor) & 0xff;
		}
	}
	const alpha = new Uint8Array(width * height);
	for (let i = 0; i < alpha.length; i++) alpha[i] = rows[i * 4 + 3];
	return { width, height, alpha };
}

/** Where an SVG draws, in its own viewBox units: rendered with rsvg-convert, and the
    box around every pixel that isn't (nearly) transparent. */
function drawnBox(path: string, viewBox: number[]): [number, number, number, number] | null {
	const RES = 512;
	const proc = Bun.spawnSync(['rsvg-convert', '-w', `${RES}`, '-h', `${RES}`, '-f', 'png', path]);
	if (proc.exitCode !== 0) throw new Error(`rsvg-convert failed on ${path}`);
	const { width, height, alpha } = pngAlpha(Buffer.from(proc.stdout));
	let x0 = width;
	let y0 = height;
	let x1 = -1;
	let y1 = -1;
	for (let y = 0; y < height; y++)
		for (let x = 0; x < width; x++)
			if (alpha[y * width + x] > 8) {
				x0 = Math.min(x0, x);
				y0 = Math.min(y0, y);
				x1 = Math.max(x1, x);
				y1 = Math.max(y1, y);
			}
	if (x1 < 0) return null;
	const [vx, vy, vw, vh] = viewBox;
	return [
		vx + (x0 / width) * vw,
		vy + (y0 / height) * vh,
		vx + ((x1 + 1) / width) * vw,
		vy + ((y1 + 1) / height) * vh,
	];
}

/**
 * Crops the empty margin around each icon of a pack, so it fills the space the app gives
 * it the way the other packs' icons do (Font Awesome's SVGs are cropped to their glyph
 * too). Each icon gets a square viewBox around what it draws, so nothing is stretched.
 * A floor of 80% of the pack's median icon keeps the small ones (a dot, a minus) from
 * blowing up to the size of a house.
 */
async function trim(id: string | undefined) {
	if (!id) throw new Error('trim: name the pack folder, e.g. clay');
	if (!Bun.which('rsvg-convert')) throw new Error('trim needs rsvg-convert (brew install librsvg)');
	const dir = join(ROOT, id, 'svg');
	const files = (await readdir(dir)).filter((f) => f.endsWith('.svg'));
	const measured: { file: string; svg: string; viewBox: number[]; box: number[] }[] = [];
	for (const file of files) {
		const svg = await readFile(join(dir, file), 'utf8');
		const viewBox = /viewBox="([^"]+)"/
			.exec(svg)?.[1]
			.split(/[\s,]+/)
			.map(Number);
		if (viewBox?.length !== 4) throw new Error(`${file} has no viewBox`);
		const box = drawnBox(join(dir, file), viewBox);
		if (box) measured.push({ file, svg, viewBox, box });
	}
	if (!measured.length) throw new Error(`no SVGs in ${dir}`);
	const extent = (b: number[]) => Math.max(b[2] - b[0], b[3] - b[1]);
	const sorted = measured.map((m) => extent(m.box)).sort((x, y) => x - y);
	const floor = sorted[Math.floor(sorted.length / 2)] * 0.8;
	const round = (n: number) => Math.round(n * 1000) / 1000;
	const gains: number[] = [];
	for (const { file, svg, viewBox, box } of measured) {
		// a hair of room for antialiasing at the edges
		const size = Math.max(extent(box), floor) * 1.02;
		if (size >= viewBox[2] * 0.98) continue;
		const cx = (box[0] + box[2]) / 2;
		const cy = (box[1] + box[3]) / 2;
		const crop = [cx - size / 2, cy - size / 2, size, size].map(round);
		gains.push(viewBox[2] / size);
		await writeFile(
			join(dir, file),
			svg
				.replace(/viewBox="[^"]+"/, `viewBox="${crop.join(' ')}"`)
				.replace(/(<svg[^>]*?)\swidth="[^"]*"/, `$1 width="${crop[2]}"`)
				.replace(/(<svg[^>]*?)\sheight="[^"]*"/, `$1 height="${crop[3]}"`),
		);
	}
	if (!gains.length) {
		console.log(`${id}: no margin worth trimming`);
		return;
	}
	// the icons look different now, so installed copies should update once rebuilt
	const pack = await readPack(id);
	pack.packVersion = (pack.packVersion ?? 0) + 1;
	await writePack(id, pack);
	gains.sort((x, y) => x - y);
	const pct = (n: number) => `${Math.round(n * 100)}%`;
	console.log(
		`${id}: trimmed ${gains.length} of ${files.length} SVGs, icons now ${pct(gains[0])} to ${pct(gains.at(-1) ?? 1)} of their old size (median ${pct(gains[Math.floor(gains.length / 2)])}), pack version ${pack.packVersion}. Run build next.`,
	);
}

const [command, ...args] = process.argv.slice(2);
try {
	if (command === 'check') await check(args[0]);
	else if (command === 'build') await build(args[0], args[1]);
	else if (command === 'trim') await trim(args[0]);
	else {
		console.log('usage: bun run iconpacks check [pack] | build <pack> [packVersion] | trim <pack>');
		process.exit(2);
	}
} catch (error) {
	console.error(error instanceof Error ? error.message : error);
	process.exit(1);
}

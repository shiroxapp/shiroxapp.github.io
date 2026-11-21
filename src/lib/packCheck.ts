/**
 * Checks an icon pack folder in the browser, before it is sent as a pull request.
 *
 * The same rules as `bun run iconpacks check` (scripts/iconpacks.ts), applied to
 * the source a contributor has on their own machine: one SVG per symbol in the
 * app's icons.json, a pack.json the build can fill in, and a LICENSE. A pack that
 * hasn't been built yet (no icons/ PDFs) is fine here; the build makes them.
 *
 * Nothing leaves the browser: the files are read locally, and the only request
 * is for icons.json, the list of symbols the app currently draws.
 */
import config from './config.json';

export type Manifest = { version: number; icons: string[] };

/** A file from the dropped or picked folder, with its path inside that folder. */
export type LocalFile = { path: string; file: File };

export type Finding = { level: 'error' | 'warning'; message: string };

export type PackReport = {
	/** The pack's folder name: what its url and its folder in the repo are named after. */
	folder: string;
	name: string | null;
	manifestVersion: number;
	total: number;
	missing: string[];
	/** SVGs named after no symbol the app uses: never shown, usually a typo. */
	extra: string[];
	/** By symbol name, for the preview. */
	svgs: Map<string, File>;
	/** `multicolor` in pack.json: the icons keep their own colours, previewed as drawn. */
	multicolor: boolean;
	findings: Finding[];
};

const SITE = config.site.url;

export async function loadManifest(): Promise<Manifest> {
	const res = await fetch(config.iconpacks.manifestUrl, { cache: 'no-store' });
	if (!res.ok) throw new Error(`HTTP ${res.status}`);
	return res.json();
}

const depth = (path: string) => path.split('/').length;
const dirname = (path: string) => path.split('/').slice(0, -1).join('/');

/** The pack's own folder inside whatever was dropped: where pack.json is, or else the
    folder holding svg/. Lets someone drop the pack itself or the folder above it. */
function packRoot(files: LocalFile[]): string {
	const json = files
		.filter((f) => f.path.split('/').at(-1) === 'pack.json')
		.sort((a, b) => depth(a.path) - depth(b.path))[0];
	if (json) return dirname(json.path);
	const svg = files
		.filter((f) => f.path.split('/').includes('svg'))
		.sort((a, b) => depth(a.path) - depth(b.path))[0];
	if (!svg) return '';
	const parts = svg.path.split('/');
	return parts.slice(0, parts.lastIndexOf('svg')).join('/');
}

/** Fixed colours in an SVG: a fill, stroke or gradient stop that isn't currentColor or none. */
const FIXED_COLOR = /(?:fill|stroke|stop-color)\s*[=:]\s*["']?\s*(?:#|rgb|hsl)/i;

/** Problems with one SVG that would break it in the app, or quietly drop part of it.
    Returns how it is coloured: in currentColor (tinted by the app), or in fixed colours. */
async function inspectSvg(
	name: string,
	file: File,
	findings: Finding[],
): Promise<'tinted' | 'colored' | 'unknown'> {
	if (file.size > 64 * 1024)
		findings.push({
			level: 'warning',
			message: `${name}.svg is ${Math.round(file.size / 1024)} KB: icons are usually a few hundred bytes`,
		});
	const text = await file.text();
	const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
	const root = doc.documentElement;
	if (doc.querySelector('parsererror') || root.nodeName !== 'svg') {
		findings.push({ level: 'error', message: `${name}.svg isn't a valid SVG` });
		return 'unknown';
	}
	if (!root.getAttribute('viewBox'))
		findings.push({
			level: 'warning',
			message: `${name}.svg has no viewBox, so it may not scale to the icon size`,
		});
	if (root.querySelector('image'))
		findings.push({
			level: 'warning',
			message: `${name}.svg embeds a bitmap, which blurs instead of scaling`,
		});
	if (root.querySelector('text'))
		findings.push({
			level: 'warning',
			message: `${name}.svg uses <text>: convert it to paths, fonts aren't carried into the PDF`,
		});
	if (text.includes('currentColor')) return 'tinted';
	return FIXED_COLOR.test(text) ? 'colored' : 'unknown';
}

export async function checkPack(files: LocalFile[], manifest: Manifest): Promise<PackReport> {
	const root = packRoot(files);
	const inPack = new Map<string, File>();
	for (const { path, file } of files) {
		if (root && !path.startsWith(`${root}/`)) continue;
		inPack.set(root ? path.slice(root.length + 1) : path, file);
	}
	const folder = root.split('/').at(-1) || 'my-icons';
	const findings: Finding[] = [];

	// pack.json
	let name: string | null = null;
	let multicolor = false;
	const jsonFile = inPack.get('pack.json');
	if (!jsonFile) {
		findings.push({ level: 'error', message: 'No pack.json next to the svg folder' });
	} else {
		let pack: Record<string, unknown> | null = null;
		try {
			pack = JSON.parse(await jsonFile.text());
		} catch {
			findings.push({ level: 'error', message: "pack.json isn't valid JSON" });
		}
		if (pack) {
			name = typeof pack.name === 'string' && pack.name.trim() ? pack.name : null;
			multicolor = pack.multicolor === true;
			if (pack.multicolor !== undefined && typeof pack.multicolor !== 'boolean')
				findings.push({ level: 'error', message: 'multicolor should be true or false' });
			if (!name) findings.push({ level: 'error', message: 'pack.json has no name' });
			if (!pack.author)
				findings.push({ level: 'warning', message: 'pack.json has no author: who drew the icons' });
			if (!pack.license)
				findings.push({
					level: 'warning',
					message: "pack.json has no license: the icon set's license",
				});
			const expected = `${SITE}/iconpacks/${folder}/pack.json`;
			if (pack.url !== expected)
				findings.push({
					level: 'error',
					message: `url should be ${expected} (the folder is named ${folder})`,
				});
			if (pack.iconsVersion !== manifest.version)
				findings.push({
					level: 'warning',
					message: `iconsVersion is ${String(pack.iconsVersion ?? 'missing')}, the app is on ${manifest.version}: the build sets it`,
				});
			if (typeof pack.packVersion !== 'number')
				findings.push({ level: 'error', message: 'packVersion should be a number, starting at 1' });
			if (!pack.contributor)
				findings.push({
					level: 'warning',
					message: 'No contributor: add your GitHub name to be credited on the site',
				});
		}
	}

	if (![...inPack.keys()].some((p) => /^LICEN[CS]E(\.\w+)?$/i.test(p)))
		findings.push({
			level: 'error',
			message: 'No LICENSE file: the icon set has to allow redistribution',
		});

	// svg/
	const svgs = new Map<string, File>();
	for (const [path, file] of inPack) {
		const match = /^svg\/(.+)\.svg$/i.exec(path);
		if (match) svgs.set(match[1], file);
	}
	if (!svgs.size) findings.push({ level: 'error', message: 'No svg folder, or no SVGs in it' });

	const wanted = new Set(manifest.icons);
	const missing = manifest.icons.filter((n) => !svgs.has(n));
	const extra = [...svgs.keys()].filter((n) => !wanted.has(n)).sort();

	const styles = await Promise.all(
		[...svgs].filter(([n]) => wanted.has(n)).map(([n, file]) => inspectSvg(n, file, findings)),
	);
	const colored = styles.filter((s) => s === 'colored').length;
	const tinted = styles.filter((s) => s === 'tinted').length;
	if (!multicolor && colored > tinted)
		findings.push({
			level: 'warning',
			message: `${colored} SVGs are drawn in fixed colours: add "multicolor": true to pack.json to keep them, or the app shows them as one-colour shapes`,
		});
	if (multicolor && tinted > 0)
		findings.push({
			level: 'warning',
			message: `multicolor is on, but ${tinted} SVGs paint in currentColor, which comes out black in a colour pack`,
		});

	findings.sort((a, b) => (a.level === b.level ? 0 : a.level === 'error' ? -1 : 1));
	return {
		folder,
		name,
		manifestVersion: manifest.version,
		total: manifest.icons.length,
		missing,
		extra,
		svgs,
		multicolor,
		findings,
	};
}

/** Everything inside a dropped folder, read through the entries API that drag and drop
    exposes (the file list of a drop is flat and leaves the folders out). */
export async function filesFromDrop(items: DataTransferItemList): Promise<LocalFile[]> {
	const out: LocalFile[] = [];
	const walk = async (entry: FileSystemEntry): Promise<void> => {
		if (entry.isFile) {
			const file = await new Promise<File>((resolve, reject) =>
				(entry as FileSystemFileEntry).file(resolve, reject),
			);
			out.push({ path: entry.fullPath.replace(/^\//, ''), file });
		} else if (entry.isDirectory) {
			const reader = (entry as FileSystemDirectoryEntry).createReader();
			// readEntries hands them over in batches, until an empty one
			for (;;) {
				const batch = await new Promise<FileSystemEntry[]>((resolve, reject) =>
					reader.readEntries(resolve, reject),
				);
				if (!batch.length) break;
				await Promise.all(batch.map(walk));
			}
		}
	};
	const entries = [...items].map((i) => i.webkitGetAsEntry()).filter((e) => e !== null);
	await Promise.all(entries.map(walk));
	return out;
}

/** The files of an `<input webkitdirectory>`, with their paths inside the picked folder. */
export const filesFromInput = (list: FileList): LocalFile[] =>
	[...list].map((file) => ({ path: file.webkitRelativePath || file.name, file }));

#!/usr/bin/env bun
/**
 * Minifies every prerendered HTML file after `vite build`. Vite's own
 * `build.minify` covers the JS and CSS bundles; it never touches the HTML
 * documents adapter-static writes, so that pass has to happen separately,
 * after the fact, here.
 *
 * A failure here would ship a broken site with a green build, so any error
 * (missing output dir, a malformed file) is fatal rather than swallowed —
 * the opposite tradeoff from sync-release.ts, which is allowed to leave a
 * stale but working file behind.
 */
import { minify } from 'html-minifier-terser';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const OUT_DIR = new URL('../build', import.meta.url).pathname.replace(/^\/([a-zA-Z]:)/, '$1');

async function htmlFiles(dir: string): Promise<string[]> {
	const entries = await readdir(dir, { withFileTypes: true });
	const files = await Promise.all(
		entries.map((entry) => {
			const path = join(dir, entry.name);
			if (entry.isDirectory()) return htmlFiles(path);
			return entry.name.endsWith('.html') ? [path] : [];
		})
	);
	return files.flat();
}

const files = await htmlFiles(OUT_DIR);

for (const file of files) {
	const before = await readFile(file, 'utf8');
	const after = await minify(before, {
		collapseWhitespace: true,
		removeComments: true,
		minifyCSS: true,
		minifyJS: true,
		removeAttributeQuotes: false,
		sortAttributes: true,
		sortClassName: true
	});
	await writeFile(file, after);
	console.log(`minified ${file.slice(OUT_DIR.length + 1)}: ${before.length}B -> ${after.length}B`);
}

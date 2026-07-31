import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig(({ command }) => ({
	// Lets a `cloudflared tunnel --url` quick tunnel reach the dev server —
	// each run gets a random *.trycloudflare.com subdomain, which Vite's Host
	// header check would otherwise reject. Dev-only; irrelevant to the build.
	server: {
		allowedHosts: ['.trycloudflare.com'],
	},

	build: {
		// Both are Vite's own defaults; named so the build's shape is a decision
		// on record here rather than an assumption about what esbuild happens to do.
		minify: 'esbuild',
		cssMinify: true,
	},

	// `command === 'build'` rather than checking NODE_ENV: only `vite build`
	// should drop console output — `vite dev` needs it for debugging.
	esbuild:
		command === 'build'
			? {
					drop: ['console', 'debugger'],
					// The comment stripping minification already does; this additionally
					// drops the `/*! ... */`-style license banners some deps ship with,
					// which minifiers otherwise preserve on purpose.
					legalComments: 'none',
				}
			: undefined,

	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true,
			},

			// The site is fully prerendered static output — deployable to GitHub Pages,
			// Cloudflare Pages, or any static host. Assumes it is served from a domain
			// root; if served from a subpath, set kit.paths.base here too.
			adapter: adapter(),
		}),
	],
}));

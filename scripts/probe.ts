/**
 * Motion probe — the repeatable form of the throwaway harnesses that found the
 * reveal bugs on 2026-07-25.
 *
 * Headless Chrome cannot verify how motion feels: it never advances the animation
 * clock, and under `--virtual-time-budget` it does not deliver IntersectionObserver
 * callbacks either. What it verifies reliably is everything around the motion —
 * which cascade rule wins, which of the two paths a browser takes, whether a class
 * is applied while the element is still below the fold. That is where all three
 * bugs actually lived.
 *
 * The page reports over HTTP rather than through `--dump-dom`, which fires at the
 * load event and so returns before any async probe has finished.
 */
const ROOT = new URL('..', import.meta.url).pathname;
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

type Check = { name: string; actual: string; pass: boolean };

const build = Bun.spawnSync(['bun', 'run', 'build'], { cwd: ROOT });
if (!build.success) {
	console.error(new TextDecoder().decode(build.stderr));
	throw new Error('build failed');
}

let settle: (checks: Check[]) => void;
const reported = new Promise<Check[]>((resolve) => (settle = resolve));

const server = Bun.serve({
	port: 0,
	async fetch(request) {
		const { pathname } = new URL(request.url);

		if (pathname === '/__report') {
			settle(await request.json());
			return new Response('ok');
		}
		if (pathname === '/__probe') {
			return new Response(Bun.file(`${ROOT}scripts/probe.html`), {
				headers: { 'content-type': 'text/html' },
			});
		}

		const asset = Bun.file(`${ROOT}build${pathname === '/' ? '/index.html' : pathname}`);
		return (await asset.exists())
			? new Response(asset)
			: new Response('not found', { status: 404 });
	},
});

const chrome = Bun.spawn([
	CHROME,
	'--headless=new',
	'--disable-gpu',
	'--window-size=1200,900',
	`http://localhost:${server.port}/__probe`,
]);

/* Chrome hangs retrying GCM registration long after it has done its work, so it is
   never waited on — it is killed once the page has reported, or once it is clear
   nothing is coming. */
const checks = await Promise.race([reported, Bun.sleep(60_000).then(() => null)]);

chrome.kill(9);
server.stop(true);

if (!checks) {
	console.error('probe timed out with no report');
	process.exit(1);
}

for (const { name, actual, pass } of checks) {
	console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${pass ? '' : `\n        got: ${actual}`}`);
}

const failed = checks.filter((c) => !c.pass).length;
console.log(`\n${checks.length - failed}/${checks.length} passed`);
process.exit(failed ? 1 : 0);

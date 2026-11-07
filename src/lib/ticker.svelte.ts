/**
 * One clock for every icon preview on the page.
 *
 * The previews are there to be compared — the same symbol, drawn by each pack —
 * so they turn over together rather than each on a timer started whenever its own
 * card happened to mount. The interval runs only while at least one preview is
 * on screen, and never under reduced motion: there the previews hold their first
 * set, which is still a complete picture of the pack.
 */

const PERIOD = 2600;

export const ticker = $state({ step: 0 });

let visible = 0;
let timer: ReturnType<typeof setInterval> | undefined;

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

function sync() {
	if (visible > 0 && !timer && !reduced()) {
		timer = setInterval(() => {
			if (!document.hidden) ticker.step++;
		}, PERIOD);
	} else if (visible === 0 && timer) {
		clearInterval(timer);
		timer = undefined;
	}
}

/** Keeps the clock running while the element is on screen. */
export function tickWhileVisible(node: HTMLElement) {
	let seen = false;
	const io = new IntersectionObserver(([entry]) => {
		if (entry.isIntersecting === seen) return;
		seen = entry.isIntersecting;
		visible += seen ? 1 : -1;
		sync();
	});
	io.observe(node);
	return {
		destroy() {
			io.disconnect();
			if (seen) visible--;
			sync();
		},
	};
}

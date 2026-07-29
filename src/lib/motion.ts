/**
 * Scroll-driven motion, as Svelte actions.
 *
 * Nothing here bakes hidden state into markup: the page is prerendered, so the
 * `rise` class is added at runtime. With JavaScript off, every element simply
 * renders in its final state.
 *
 * One mechanism drives every entrance: the observer below adds `in`, and CSS
 * transitions the element from `.rise` to its finished state. There was briefly a
 * second, scroll-linked path built on `animation-timeline: view()`; it was removed
 * because it ran on only some of this site's browsers, which made the entrance a
 * different gesture depending on who was looking at it.
 */

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Whether the element was on screen the moment hydration reached it.
 *
 * Such an element is left alone. The page is prerendered, so it has already been
 * painted, in its finished state, for as long as the JavaScript took to arrive —
 * hiding it now to reveal it a frame later is not an entrance, it is the thing
 * blinking out and coming back, which is exactly how a fault looks. An entrance on
 * the first screen belongs to the load animations (`.load-rise` and friends), which
 * are CSS from the first paint and so have nothing to catch up to.
 */
const onFirstScreen = (el: Element) => {
	const { top, bottom } = el.getBoundingClientRect();
	return top < innerHeight && bottom > 0;
};

/**
 * Watches every element it is given, and reports each batch that arrives together.
 *
 * The margin holds the reveal back until the element is properly on screen rather
 * than grazing the bottom edge: at 0 an element plays its entrance in the sliver
 * below the fold, and is already finished by the time it has been scrolled to.
 */
function observe(nodes: Element[], onEnter: (batch: HTMLElement[]) => void) {
	const io = new IntersectionObserver(
		(entries) => {
			const arriving = entries.filter((e) => e.isIntersecting).map((e) => e.target as HTMLElement);
			if (!arriving.length) return;
			for (const el of arriving) io.unobserve(el);
			onEnter(arriving);
		},
		{ rootMargin: '0px 0px -12% 0px' }
	);
	for (const node of nodes) io.observe(node);
	return { destroy: () => io.disconnect() };
}

/** Fades and lifts one element in when it scrolls into view. */
export function inView(node: HTMLElement, delay = 0) {
	if (reduced() || onFirstScreen(node)) return;
	node.classList.add('rise');
	if (delay) node.style.setProperty('--delay', `${delay}ms`);
	return observe([node], ([el]) => el.classList.add('in'));
}

/**
 * Same, but sequences the element's direct children.
 *
 * The children are watched one by one, not the parent: a grid taller than the
 * viewport would otherwise reveal every row the moment its top edge appeared, and
 * the lower rows would be sitting in their finished state before they were ever
 * scrolled to.
 *
 * Which makes the stagger a property of each arrival rather than of the list. What
 * crosses together — a row of cards, the words of a heading — cascades in document
 * order; what arrives alone starts immediately, instead of waiting out a delay
 * counted from siblings that came in several screens ago.
 */
export function inViewStagger(node: HTMLElement, step = 70) {
	if (reduced()) return;
	const children = ([...node.children] as HTMLElement[]).filter((c) => !onFirstScreen(c));
	if (!children.length) return;
	for (const child of children) child.classList.add('rise');

	return observe(children, (batch) => {
		// the entry order is the observer's, which is not specified to be the DOM's
		batch.sort((a, b) => children.indexOf(a) - children.indexOf(b));
		for (const [i, child] of batch.entries()) {
			child.style.setProperty('--delay', `${i * step}ms`);
			child.classList.add('in');
		}
	});
}

/**
 * Tilts an element a couple of degrees toward the pointer, and lets it drift on
 * its own when the pointer is elsewhere. Pointer-coarse devices get the drift only.
 */
export function tilt(node: HTMLElement, max = 5) {
	if (reduced()) return;

	let frame = 0;

	const onMove = (event: PointerEvent) => {
		cancelAnimationFrame(frame);
		frame = requestAnimationFrame(() => {
			const { innerWidth, innerHeight } = window;
			const x = (event.clientX / innerWidth - 0.5) * 2;
			const y = (event.clientY / innerHeight - 0.5) * 2;
			node.style.setProperty('--tilt-y', `${x * max}deg`);
			node.style.setProperty('--tilt-x', `${-y * (max * 0.6)}deg`);
		});
	};

	if (matchMedia('(pointer: fine)').matches) {
		window.addEventListener('pointermove', onMove, { passive: true });
	}

	return {
		destroy() {
			cancelAnimationFrame(frame);
			window.removeEventListener('pointermove', onMove);
		}
	};
}

/**
 * One light over a grid of cards, rather than one inside each of them.
 *
 * The pointer's position goes to every child, each expressed in that child's own
 * coordinates — so for the cards the pointer is not over, it lands outside them,
 * and each renders only whatever part of a single bloom reaches it. The card under
 * the cursor is brightest, its neighbours catch the edge, and the light crosses
 * the gaps as one thing rather than stopping at a border.
 *
 * Offsets are measured once and re-measured on resize, so a pointer move costs one
 * rect read rather than one per card. Fine pointers only: with no cursor to place
 * it, --gx/--gy keep their registered 50% and each card glows in the middle
 * instead, which is the whole of the effect where nothing points.
 */
export function glowField(node: HTMLElement) {
	if (!matchMedia('(pointer: fine)').matches) return;

	const cards = [...node.children] as HTMLElement[];
	let offsets: [number, number][] = [];
	let frame = 0;

	const measure = () => {
		const base = node.getBoundingClientRect();
		offsets = cards.map((card) => {
			const rect = card.getBoundingClientRect();
			return [rect.left - base.left, rect.top - base.top];
		});
	};

	const place = (event: PointerEvent) => {
		const base = node.getBoundingClientRect();
		const x = event.clientX - base.left;
		const y = event.clientY - base.top;
		for (const [i, card] of cards.entries()) {
			card.style.setProperty('--gx', `${x - offsets[i][0]}px`);
			card.style.setProperty('--gy', `${y - offsets[i][1]}px`);
		}
	};

	/* The light has to arrive already at the pointer. It trails the cursor by
	   design, and a trail from wherever it was last left would drag a bloom across
	   every card in the row on the way in — so tracking is off for the one frame
	   that places it. */
	const onEnter = (event: PointerEvent) => {
		measure();
		for (const card of cards) card.style.setProperty('--glow-track', '0s');
		place(event);
		requestAnimationFrame(() => {
			for (const card of cards) card.style.removeProperty('--glow-track');
		});
	};

	const onMove = (event: PointerEvent) => {
		cancelAnimationFrame(frame);
		frame = requestAnimationFrame(() => place(event));
	};

	// observing fires the callback once, which is the initial measurement
	const ro = new ResizeObserver(measure);
	ro.observe(node);
	node.addEventListener('pointerenter', onEnter);
	node.addEventListener('pointermove', onMove, { passive: true });

	return {
		destroy() {
			cancelAnimationFrame(frame);
			ro.disconnect();
			node.removeEventListener('pointerenter', onEnter);
			node.removeEventListener('pointermove', onMove);
		}
	};
}

/**
 * Calls back while the pointer is over the element. Attached as an action rather
 * than inline handlers, since the element is a decorative container and giving it
 * an interaction role to satisfy the linter would misrepresent it to assistive tech.
 */
export function hoverPause(node: HTMLElement, set: (hovering: boolean) => void) {
	const enter = () => set(true);
	const leave = () => set(false);

	node.addEventListener('pointerenter', enter);
	node.addEventListener('pointerleave', leave);

	return {
		destroy() {
			node.removeEventListener('pointerenter', enter);
			node.removeEventListener('pointerleave', leave);
		}
	};
}

/**
 * Reports whether the element is on screen, and keeps reporting — unlike `inView`,
 * which fires once and disconnects. Used to hold a carousel still while nobody is
 * looking at it, so it never reflows the part of the page someone is reading.
 */
export function onScreen(node: HTMLElement, set: (visible: boolean) => void) {
	const io = new IntersectionObserver(([entry]) => set(entry.isIntersecting), { threshold: 0.3 });
	io.observe(node);
	return { destroy: () => io.disconnect() };
}

/**
 * Reports a horizontal drag past a threshold as +1 (swiped left, meaning "next")
 * or -1 (swiped right). Touch and pen only: on a mouse the same gesture is a
 * text selection, and the device already responds to the pointer by tilting.
 */
export function swipe(node: HTMLElement, onSwipe: (delta: 1 | -1) => void, threshold = 40) {
	let startX = 0;
	let tracking = false;

	const down = (event: PointerEvent) => {
		if (event.pointerType === 'mouse') return;
		startX = event.clientX;
		tracking = true;
	};

	const up = (event: PointerEvent) => {
		if (!tracking) return;
		tracking = false;
		const dx = event.clientX - startX;
		if (Math.abs(dx) > threshold) onSwipe(dx < 0 ? 1 : -1);
	};

	const cancel = () => (tracking = false);

	node.addEventListener('pointerdown', down, { passive: true });
	node.addEventListener('pointerup', up, { passive: true });
	node.addEventListener('pointercancel', cancel, { passive: true });

	return {
		destroy() {
			node.removeEventListener('pointerdown', down);
			node.removeEventListener('pointerup', up);
			node.removeEventListener('pointercancel', cancel);
		}
	};
}

/**
 * Reports scroll progress through the document as a 0–1 value on `--progress`,
 * for the hairline indicator under the nav.
 */
export function scrollProgress(node: HTMLElement) {
	let frame = 0;

	const update = () => {
		cancelAnimationFrame(frame);
		frame = requestAnimationFrame(() => {
			const max = document.documentElement.scrollHeight - innerHeight;
			node.style.setProperty('--progress', max > 0 ? `${scrollY / max}` : '0');
		});
	};

	update();
	addEventListener('scroll', update, { passive: true });
	addEventListener('resize', update, { passive: true });

	return {
		destroy() {
			cancelAnimationFrame(frame);
			removeEventListener('scroll', update);
			removeEventListener('resize', update);
		}
	};
}

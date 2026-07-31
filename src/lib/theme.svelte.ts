/**
 * Theme state, owned in one place.
 *
 * The OS preference is the default everywhere a visitor hasn't chosen for
 * themselves. A visitor's own choice — made via `toggle()` — is remembered
 * and re-applied (along with a system-preference default) by the inline
 * script in `app.html` before first paint, so nobody sees a flash of the
 * wrong theme; this module only handles changes made after the page is
 * running, plus following the OS live for as long as no explicit choice
 * has been made.
 */

export type Theme = 'light' | 'dark';

export const THEME_KEY = 'shirox-theme';

const SURFACE: Record<Theme, string> = {
	light: '#fafaf9',
	dark: '#0b0b0c',
};

let current = $state<Theme>('light');

function storedChoice(): Theme | null {
	try {
		const value = localStorage.getItem(THEME_KEY);
		return value === 'dark' || value === 'light' ? value : null;
	} catch {
		return null;
	}
}

/** `persist` is false for a system-driven update, so it can keep following
    the OS on the next visit rather than locking in as if it were chosen. */
function apply(next: Theme, persist = true) {
	current = next;

	// Light is the absence of the attribute, matching what the inline script writes.
	if (next === 'dark') document.documentElement.dataset.theme = 'dark';
	else delete document.documentElement.dataset.theme;

	// Keeps the browser's own chrome — Safari's toolbar, the address bar — in step.
	document.querySelector('meta[name="theme-color"]')?.setAttribute('content', SURFACE[next]);

	if (!persist) return;

	try {
		localStorage.setItem(THEME_KEY, next);
	} catch {
		// Private browsing can refuse storage; the theme still applies for this visit.
	}
}

export const theme = {
	get current() {
		return current;
	},

	/** Picks up whatever the inline script already decided, so state and DOM agree. */
	sync() {
		current = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
	},

	toggle() {
		apply(current === 'dark' ? 'light' : 'dark');
	},

	/**
	 * Keeps the page in step with the OS theme for as long as this visitor
	 * hasn't made an explicit choice of their own — checked once up front,
	 * not on every change, so choosing a theme and later changing the OS
	 * theme doesn't quietly override that choice mid-session. No-ops (and
	 * returns nothing to clean up) once a choice exists.
	 */
	followSystem() {
		if (storedChoice()) return () => {};

		const mq = matchMedia('(prefers-color-scheme: dark)');
		const sync = () => apply(mq.matches ? 'dark' : 'light', false);
		mq.addEventListener('change', sync);
		return () => mq.removeEventListener('change', sync);
	},
};

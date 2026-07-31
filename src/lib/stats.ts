/**
 * Runtime data for the stats section — fetched fresh from each visitor's own
 * browser rather than baked in at build time, the way release.generated.ts
 * bakes in the app version. GitHub stars, Discord members and the last commit
 * date all have public, no-auth endpoints that answer that directly; there is
 * no equivalent for TestFlight, which exposes no public API for its own
 * install count, so that one number can only come from whoever runs the beta.
 *
 * `STATS_URL` is same-origin by default (`/stats.json`), which is exactly
 * right in dev, on GitHub Pages, and through a cloudflared tunnel alike —
 * all three simply serve whatever sits at the site's own root, so nothing
 * here needs to know which of the three it's running under. The tradeoff is
 * that updating the number this way still means committing a file to the
 * repo, which still triggers the Pages redeploy. For a number that changes
 * on its own schedule rather than the site's, point this at a GitHub Gist's
 * raw URL instead — editing a Gist doesn't touch this repo or its workflow,
 * so the number can move on its own without a rebuild.
 */

export const STATS_URL = '/stats.json';

const GITHUB_REPO = 'xibrox/Shirox';
const DISCORD_INVITE_CODE = 'b9tZSuJj73';

export type Stats = {
	githubStars: number | null;
	discordMembers: number | null;
	testflightInstalls: number | null;
	/** ISO date string. */
	lastCommit: string | null;
};

async function safeFetchJson<T>(url: string): Promise<T | null> {
	try {
		const res = await fetch(url);
		if (!res.ok) return null;
		return (await res.json()) as T;
	} catch {
		return null;
	}
}

export async function loadStats(): Promise<Stats> {
	const [repo, commits, invite, local] = await Promise.all([
		safeFetchJson<{ stargazers_count: number }>(`https://api.github.com/repos/${GITHUB_REPO}`),
		safeFetchJson<{ commit: { committer: { date: string } } }[]>(
			`https://api.github.com/repos/${GITHUB_REPO}/commits?per_page=1`,
		),
		safeFetchJson<{ approximate_member_count: number }>(
			`https://discord.com/api/v9/invites/${DISCORD_INVITE_CODE}?with_counts=true`,
		),
		safeFetchJson<{ testflightInstalls: number }>(STATS_URL),
	]);

	return {
		githubStars: repo?.stargazers_count ?? null,
		discordMembers: invite?.approximate_member_count ?? null,
		testflightInstalls: local?.testflightInstalls ?? null,
		lastCommit: commits?.[0]?.commit.committer.date ?? null,
	};
}

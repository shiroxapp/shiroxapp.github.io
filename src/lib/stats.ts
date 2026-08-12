/**
 * Runtime data for the stats section — fetched fresh from each visitor's own
 * browser rather than baked in at build time, the way release.generated.ts
 * bakes in the app version. GitHub stars, Discord members and the last commit
 * date all have public, no-auth endpoints that answer that directly.
 *
 * TestFlight has no equivalent — it exposes no public API for its own install
 * count — so that number can only come from whoever runs the beta, by hand,
 * same as the app version in release.generated.ts. It's imported directly
 * from config.json rather than fetched: updating it already meant committing
 * to this repo and waiting on the Pages redeploy either way (config.json
 * isn't a Gist that moves on its own schedule), so a fetch bought nothing
 * here but a network round trip and a null on the visitor's first paint.
 */

import config from './config.json';

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
	const [repo, commits, invite] = await Promise.all([
		safeFetchJson<{ stargazers_count: number }>(config.github.apiRepoUrl),
		safeFetchJson<{ commit: { committer: { date: string } } }[]>(config.github.apiCommitsUrl),
		safeFetchJson<{ approximate_member_count: number }>(config.discord.apiInviteUrl),
	]);

	return {
		githubStars: repo?.stargazers_count ?? null,
		discordMembers: invite?.approximate_member_count ?? null,
		testflightInstalls: config.testflight.installs,
		lastCommit: commits?.[0]?.commit.committer.date ?? null,
	};
}

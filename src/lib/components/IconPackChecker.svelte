<script lang="ts">
import { onDestroy } from 'svelte';
import { showcaseIcons } from '$lib/iconpacks';
import {
	checkPack,
	filesFromDrop,
	filesFromInput,
	type LocalFile,
	loadManifest,
	type Manifest,
	type PackReport,
} from '$lib/packCheck';
import IconGlyph from './IconGlyph.svelte';

/**
 * Drop a pack folder, get the verdict: which symbols are missing, what pack.json
 * still needs, and a preview of the icons as the app would draw them. The rules
 * live in $lib/packCheck.ts; everything is read locally, nothing is uploaded.
 */
let status = $state<'idle' | 'reading' | 'done' | 'failed'>('idle');
let error = $state('');
let dragging = $state(false);
let report = $state<PackReport | null>(null);
let urls = $state<Map<string, string>>(new Map());
let manifest = $state<Manifest | null>(null);
let input: HTMLInputElement | undefined = $state();

const errors = $derived(report?.findings.filter((f) => f.level === 'error') ?? []);
const warnings = $derived(report?.findings.filter((f) => f.level === 'warning') ?? []);
const covered = $derived(report ? report.total - report.missing.length : 0);
const ready = $derived(report !== null && report.missing.length === 0 && errors.length === 0);
const preview = $derived(showcaseIcons.filter((n) => urls.has(n)).slice(0, 8));

function release() {
	for (const url of urls.values()) URL.revokeObjectURL(url);
	urls = new Map();
}

async function run(files: LocalFile[]) {
	status = 'reading';
	release();
	report = null;
	try {
		manifest ??= await loadManifest();
	} catch {
		status = 'failed';
		error = "Couldn't load the list of symbols from GitHub. Check your connection and try again.";
		return;
	}
	if (!files.length) {
		status = 'failed';
		error = 'That folder is empty.';
		return;
	}
	report = await checkPack(files, manifest);
	// Typed explicitly: a mask only reads an object URL as SVG with that type, and a
	// file from a drop or picker can arrive with none.
	urls = new Map(
		[...report.svgs].map(([name, file]) => [
			name,
			URL.createObjectURL(new Blob([file], { type: 'image/svg+xml' })),
		]),
	);
	status = 'done';
}

async function onDrop(event: DragEvent) {
	event.preventDefault();
	dragging = false;
	if (event.dataTransfer?.items) run(await filesFromDrop(event.dataTransfer.items));
}

function onPick() {
	if (input?.files) run(filesFromInput(input.files));
	if (input) input.value = '';
}

function reset() {
	release();
	report = null;
	status = 'idle';
}

onDestroy(release);
</script>

<div class="checker rounded-3xl p-6 md:p-10">
	<h3 class="text-[1.5rem] font-medium tracking-tight md:text-[1.75rem]">Check your pack</h3>
	<p class="mt-2 max-w-[52ch] text-[0.9375rem] leading-relaxed" style="color: var(--muted); text-wrap: pretty;">
		Drop your pack folder here to see what's missing and how your icons look. It's read in your
		browser, nothing is uploaded. In the repo, <code class="mono text-[0.8125rem]">bun run iconpacks check</code>
		runs the same rules.
	</p>

	{#if status !== 'done'}
		<div
			class="zone mt-6 flex flex-col items-center justify-center gap-4 rounded-2xl px-6 py-12 text-center"
			class:dragging
			role="region"
			aria-label="Drop a pack folder"
			ondragover={(e) => {
				e.preventDefault();
				dragging = true;
			}}
			ondragleave={() => (dragging = false)}
			ondrop={onDrop}
		>
			{#if status === 'reading'}
				<p class="text-[0.9375rem]" style="color: var(--muted);">Checking…</p>
			{:else}
				<svg class="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true" style="color: var(--color-accent);">
					<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke-linejoin="round" />
					<path d="M12 10v6m-3-3 3-3 3 3" stroke-linecap="round" stroke-linejoin="round" />
				</svg>
				<p class="text-[0.9375rem]">
					Drop the folder with <span class="mono text-[0.8125rem]">pack.json</span> and
					<span class="mono text-[0.8125rem]">svg/</span>
				</p>
				<button type="button" class="pick press rounded-full px-5 py-2.5 text-[0.875rem] font-medium" onclick={() => input?.click()}>
					Choose folder
				</button>
				{#if status === 'failed'}
					<p class="text-[0.875rem]" style="color: var(--color-accent);" role="alert">{error}</p>
				{/if}
			{/if}
			<input bind:this={input} type="file" webkitdirectory multiple class="sr-only" tabindex="-1" aria-hidden="true" onchange={onPick} />
		</div>
	{:else if report}
		<div class="mt-6 grid gap-6">
			<div class="flex flex-wrap items-center gap-3">
				<span class="verdict rounded-full px-3.5 py-1.5 text-[0.8125rem] font-medium" class:ready>
					{#if ready}
						Ready to send
					{:else}
						{report.missing.length + errors.length} to fix
					{/if}
				</span>
				<span class="text-[1.0625rem] font-medium">{report.name ?? 'Unnamed pack'}</span>
				<span class="mono text-[0.8125rem]" style="color: var(--muted);">{report.folder}/</span>
				<button type="button" class="ul ml-auto text-[0.875rem]" style="color: var(--muted);" onclick={reset}>Check another</button>
			</div>

			<div>
				<div class="flex items-baseline justify-between text-[0.875rem]">
					<span style="color: var(--muted);">Symbols covered</span>
					<span class="mono">{covered} / {report.total}</span>
				</div>
				<div class="meter mt-2 h-1.5 overflow-hidden rounded-full">
					<div class="h-full rounded-full" style="width: {(covered / report.total) * 100}%; background: {covered === report.total ? 'var(--color-accent)' : 'var(--muted)'};"></div>
				</div>
			</div>

			{#if preview.length}
				<div class="stage grid grid-cols-4 gap-4 rounded-2xl p-5 sm:grid-cols-8">
					{#each preview as name (name)}
						<div class="grid place-items-center py-2">
							<IconGlyph src={urls.get(name)} color={report.multicolor} class="h-7 w-7" label={name} />
						</div>
					{/each}
				</div>
			{/if}

			{#if errors.length || warnings.length}
				<ul class="grid gap-2 text-[0.875rem]">
					{#each [...errors, ...warnings] as finding (finding.message)}
						<li class="flex gap-3">
							<span class="dot mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full" class:error={finding.level === 'error'}></span>
							<span style={finding.level === 'warning' ? 'color: var(--muted)' : ''}>{finding.message}</span>
						</li>
					{/each}
				</ul>
			{/if}

			{#if report.missing.length}
				<div>
					<p class="text-[0.875rem]">Missing SVGs <span style="color: var(--muted);">(name each one exactly like this, plus .svg)</span></p>
					<div class="mt-2 flex flex-wrap gap-1.5">
						{#each report.missing as name (name)}
							<span class="chip mono rounded-md px-2 py-1 text-[0.75rem]">{name}</span>
						{/each}
					</div>
				</div>
			{/if}

			{#if report.extra.length}
				<div>
					<p class="text-[0.875rem]" style="color: var(--muted);">Not used by the app, probably a typo:</p>
					<div class="mt-2 flex flex-wrap gap-1.5">
						{#each report.extra as name (name)}
							<span class="chip mono rounded-md px-2 py-1 text-[0.75rem]" style="color: var(--muted);">{name}.svg</span>
						{/each}
					</div>
				</div>
			{/if}

			{#if manifest}
				<details class="all">
					<summary class="text-[0.875rem]" style="color: var(--muted);">All {report.total} symbols</summary>
					<ul class="mt-3 grid grid-cols-4 gap-1 sm:grid-cols-6 md:grid-cols-8">
						{#each manifest.icons as name (name)}
							<li class="cell flex flex-col items-center gap-1.5 rounded-lg px-1 py-3" class:missing={!urls.has(name)} title={name}>
								{#if urls.has(name)}
									<IconGlyph src={urls.get(name)} color={report.multicolor} class="h-6 w-6" />
								{:else}
									<span class="h-6 w-6 rounded-md border border-dashed" style="border-color: var(--color-accent);"></span>
								{/if}
								<span class="mono w-full truncate text-center text-[0.625rem]" style="color: var(--muted);">{name}</span>
							</li>
						{/each}
					</ul>
				</details>
			{/if}
		</div>
	{/if}
</div>

<style>
	.checker {
		border: 1px solid var(--rule);
		background: var(--sunken);
	}

	.zone {
		border: 1.5px dashed var(--rule);
		transition:
			border-color 0.3s var(--ease),
			background-color 0.3s var(--ease);
	}

	.zone.dragging {
		border-color: var(--color-accent);
		background: color-mix(in srgb, var(--color-accent) 6%, transparent);
	}

	.pick {
		background: var(--bg);
		color: var(--fg);
		border: 1px solid var(--rule);
		transition:
			background-color 0.3s var(--ease),
			scale 0.35s var(--ease-hover);
	}

	@media (hover: hover) {
		.pick:hover {
			background: color-mix(in srgb, var(--fg) 9%, var(--bg));
		}
	}

	.verdict {
		border: 1px solid var(--rule);
		color: var(--fg);
	}

	.verdict.ready {
		border-color: transparent;
		background: var(--color-accent);
		color: var(--color-paper);
	}

	.meter {
		background: var(--rule);
	}

	.stage {
		border: 1px solid var(--rule);
		background: radial-gradient(110% 100% at 50% 0%, var(--glow), transparent 75%);
	}

	.dot {
		background: var(--muted);
	}

	.dot.error {
		background: var(--color-accent);
	}

	.chip {
		background: var(--bg);
		border: 1px solid var(--rule);
	}

	.all summary {
		cursor: pointer;
	}

	.cell.missing {
		background: color-mix(in srgb, var(--color-accent) 6%, transparent);
	}
</style>

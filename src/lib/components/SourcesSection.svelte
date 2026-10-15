<script lang="ts">
	import { onMount } from 'svelte';
	import {
		CHAPTER_REFERENCES,
		ALL_SOURCES,
		SOURCES_MARKDOWN,
		getPublicationLabel,
		type ChapterReferenceGroup
	} from '$lib/data/missions';
	import { ASSET_MANIFEST, VIDEO_MANIFEST, ASSETS_MARKDOWN } from '$lib/data/assets';

	const chapterGroups: ChapterReferenceGroup[] = CHAPTER_REFERENCES;
	const ASSETS_GROUP_KEY = 'assets-manifest';
	const VIDEOS_GROUP_KEY = 'videos-manifest';

	const initialExpanded: Record<string, boolean> = Object.fromEntries([
		...chapterGroups.map((g) => [g.chapterId, false]),
		[ASSETS_GROUP_KEY, false],
		[VIDEOS_GROUP_KEY, false]
	]);

	let expandedChapters = $state<Record<string, boolean>>(initialExpanded);
	let showRawMarkdown = $state<boolean>(false);
	let copiedMarkdown = $state<boolean>(false);
	let copiedAssetsMarkdown = $state<boolean>(false);

	onMount(() => {
		const isDesktop = window.innerWidth >= 768;
		const next: Record<string, boolean> = {};
		for (const group of chapterGroups) {
			next[group.chapterId] = isDesktop;
		}
		next[ASSETS_GROUP_KEY] = isDesktop;
		next[VIDEOS_GROUP_KEY] = isDesktop;
		expandedChapters = next;
	});

	function toggleGroup(groupId: string) {
		expandedChapters[groupId] = !expandedChapters[groupId];
	}

	async function copySourcesMarkdown() {
		try {
			await navigator.clipboard.writeText(SOURCES_MARKDOWN);
			copiedMarkdown = true;
			setTimeout(() => {
				copiedMarkdown = false;
			}, 2400);
		} catch {
			copiedMarkdown = false;
		}
	}

	async function copyAssetsMarkdown() {
		try {
			await navigator.clipboard.writeText(ASSETS_MARKDOWN);
			copiedAssetsMarkdown = true;
			setTimeout(() => {
				copiedAssetsMarkdown = false;
			}, 2400);
		} catch {
			copiedAssetsMarkdown = false;
		}
	}
</script>

<section
	id="sources"
	data-section="sources"
	class="relative z-10 w-full border-t border-[#E8E6E1]/10 bg-[#050607] py-12 sm:py-20 px-4 sm:px-8 lg:px-16"
>
	<div class="mx-auto max-w-[1320px]">
		<!-- Compact Section Header -->
		<div class="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[#E8E6E1]/10 pb-5">
			<div class="min-w-0">
				<div class="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono-tech text-[11px] uppercase tracking-[0.16em]">
					<span class="text-[#C89B57]">PRIMARY ARCHIVE INDEX</span>
					<span class="text-[#E8E6E1]/60">
						{ALL_SOURCES.length} CITATIONS · {ASSET_MANIFEST.length} ARCHIVAL PLATES · {VIDEO_MANIFEST.length} VIDEO SOURCES
					</span>
				</div>
				<h2
					class="mt-2 font-display font-normal tracking-[-0.02em] text-[#E8E6E1] leading-[1.08]"
					style="font-size: clamp(1.65rem, 4.2vw, 3.25rem);"
				>
					Sources &amp; Verification Index
				</h2>
				<p class="mt-2.5 max-w-[65ch] font-sans text-base text-[#E8E6E1]/72 leading-[1.6]">
					Primary mission citations and planetary imagery credits cross-referenced against NASA,
					JPL/Caltech, ESA, JAXA, LIGO, and Event Horizon Telescope archives.
				</p>
			</div>

			<button
				type="button"
				onclick={() => (showRawMarkdown = !showRawMarkdown)}
				aria-expanded={showRawMarkdown}
				class="shrink-0 font-mono-tech text-xs text-[#E8E6E1]/60 hover:text-[#C89B57] transition-colors duration-200 cursor-pointer"
			>
				[{showRawMarkdown ? 'Hide' : 'View'} Raw SOURCES.md &amp; ASSETS.md]
			</button>
		</div>

		{#if showRawMarkdown}
			<div class="my-6 grid grid-cols-1 lg:grid-cols-2 gap-6 border-b border-[#E8E6E1]/10 pb-6">
				<div class="border border-[#E8E6E1]/10 bg-[#08090B]">
					<div class="flex items-center justify-between gap-3 border-b border-[#E8E6E1]/10 px-4 py-2.5">
						<span class="font-mono-tech text-xs text-[#E8E6E1]/75">SOURCES.md ({ALL_SOURCES.length})</span>
						<button
							type="button"
							onclick={copySourcesMarkdown}
							class="font-mono-tech text-xs text-[#C89B57] hover:text-[#DDB474] cursor-pointer"
						>
							{copiedMarkdown ? '✓ Copied' : 'Copy SOURCES.md'}
						</button>
					</div>
					<pre class="max-h-72 overflow-y-auto p-4 font-mono-tech text-xs text-[#E8E6E1]/75 whitespace-pre-wrap break-words leading-relaxed">{SOURCES_MARKDOWN}</pre>
				</div>

				<div class="border border-[#E8E6E1]/10 bg-[#08090B]">
					<div class="flex items-center justify-between gap-3 border-b border-[#E8E6E1]/10 px-4 py-2.5">
						<span class="font-mono-tech text-xs text-[#E8E6E1]/75">ASSETS.md ({ASSET_MANIFEST.length + VIDEO_MANIFEST.length})</span>
						<button
							onclick={copyAssetsMarkdown}
							class="font-mono-tech text-xs text-[#C89B57] hover:text-[#DDB474] cursor-pointer"
						>
							{copiedAssetsMarkdown ? '✓ Copied' : 'Copy ASSETS.md'}
						</button>
					</div>
					<pre class="max-h-72 overflow-y-auto p-4 font-mono-tech text-xs text-[#E8E6E1]/75 whitespace-pre-wrap break-words leading-relaxed">{ASSETS_MARKDOWN}</pre>
				</div>
			</div>
		{/if}

		<!-- Collapsible Chapter Reference Groups -->
		<div class="divide-y divide-[#E8E6E1]/10 border-b border-[#E8E6E1]/10">
			{#each chapterGroups as group (group.chapterId)}
				{@const isExpanded = Boolean(expandedChapters[group.chapterId])}
				<div>
					<button
						type="button"
						data-chapter-toggle={group.chapterId}
						onclick={() => toggleGroup(group.chapterId)}
						aria-expanded={isExpanded}
						class="w-full py-3 flex items-baseline justify-between gap-3 text-left transition-colors duration-200 hover:text-[#C89B57] cursor-pointer"
					>
						<div class="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 min-w-0">
							<span class="font-display text-base sm:text-lg font-normal text-[#E8E6E1]">
								{group.chapterNumber} · {group.title}
							</span>
							<span class="font-mono-tech text-xs text-[#C89B57]">
								{group.yearRange}
							</span>
						</div>
						<div class="flex items-center gap-2.5 shrink-0 font-mono-tech text-xs uppercase tracking-[0.14em] text-[#E8E6E1]/60">
							<span>{group.sourceCount} sources</span>
							<span class="w-3 text-center text-sm text-[#C89B57]" aria-hidden="true">
								{isExpanded ? '−' : '+'}
							</span>
						</div>
					</button>

					{#if isExpanded}
						<div class="grid grid-cols-1 md:grid-cols-3 gap-x-8 border-t border-[#E8E6E1]/10">
							{#each group.milestones as entry (entry.milestoneId)}
								<div class="py-2.5 border-b border-[#E8E6E1]/10 last:border-b-0 md:last:border-b flex flex-col justify-center min-w-0">
									<div class="flex items-baseline justify-between gap-3 min-w-0">
										<h3
											class="font-display text-base font-normal text-[#E8E6E1] leading-snug"
											title={entry.fullTitle}
										>
											{entry.missionName}
										</h3>
										<span class="font-mono-tech text-xs text-[#C89B57] shrink-0">
											{entry.year}
										</span>
									</div>
									<div class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
										{#each entry.sources as src (src.id)}
											<a
												href={src.url}
												target="_blank"
												rel="noopener noreferrer"
												title={src.title}
												class="inline-flex items-center gap-1 font-mono-tech text-xs text-[#E8E6E1]/68 hover:text-[#C89B57] transition-colors duration-200"
											>
												<span>{src.label}</span>
												<span class="text-[#C89B57]" aria-hidden="true">↗</span>
											</a>
										{/each}
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/each}

			<!-- Collapsible Archival Imagery & Planetary Maps Group (ASSETS.md) -->
			<div>
				<button
					type="button"
					onclick={() => toggleGroup(ASSETS_GROUP_KEY)}
					aria-expanded={Boolean(expandedChapters[ASSETS_GROUP_KEY])}
					class="w-full py-3.5 flex items-baseline justify-between gap-3 text-left transition-colors duration-200 hover:text-[#C89B57] cursor-pointer"
				>
					<div class="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 min-w-0">
						<span class="font-display text-base sm:text-lg font-normal text-[#E8E6E1]">
							Archival Imagery &amp; Planetary Maps (ASSETS.md)
						</span>
						<span class="font-mono-tech text-xs text-[#C89B57]">
							1975–2025
						</span>
					</div>
					<div class="flex items-center gap-2.5 shrink-0 font-mono-tech text-xs uppercase tracking-[0.14em] text-[#E8E6E1]/60">
						<span>{ASSET_MANIFEST.length} plates</span>
						<span class="w-3 text-center text-sm text-[#C89B57]" aria-hidden="true">
							{expandedChapters[ASSETS_GROUP_KEY] ? '−' : '+'}
						</span>
					</div>
				</button>

				{#if expandedChapters[ASSETS_GROUP_KEY]}
					<div class="grid grid-cols-1 md:grid-cols-3 gap-x-8 border-t border-[#E8E6E1]/10">
						{#each ASSET_MANIFEST as asset (asset.id)}
							<div class="py-2.5 border-b border-[#E8E6E1]/10 last:border-b-0 md:last:border-b flex flex-col justify-center min-w-0">
								<div class="flex items-baseline justify-between gap-3 min-w-0">
									<h3
										class="font-display text-base font-normal text-[#E8E6E1] leading-snug"
										title={asset.title}
									>
										{asset.title}
									</h3>
									<span class="font-mono-tech text-xs text-[#C89B57] shrink-0">
										{asset.archiveId} · {asset.year}
									</span>
								</div>
								<div class="mt-1 font-sans text-xs text-[#E8E6E1]/68 leading-snug" title={asset.creditLine}>
									{asset.creditLine}
								</div>
								<div class="mt-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 font-mono-tech text-xs">
									<span class="text-[#E8E6E1]/55 leading-snug" title={asset.license}>
										{asset.license}
									</span>
									<a
										href={asset.sourceUrl}
										target="_blank"
										rel="noopener noreferrer"
										class="inline-flex items-center gap-1 text-[#C89B57] hover:text-[#DDB474] shrink-0 transition-colors duration-200"
									>
										<span>{getPublicationLabel(asset.sourceUrl)}</span>
										<span aria-hidden="true">↗</span>
									</a>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Collapsible Archival & Embedded Mission Video Sources Group (ASSETS.md) -->
			<div>
				<button
					type="button"
					onclick={() => toggleGroup(VIDEOS_GROUP_KEY)}
					aria-expanded={Boolean(expandedChapters[VIDEOS_GROUP_KEY])}
					class="w-full py-3.5 flex items-baseline justify-between gap-3 text-left transition-colors duration-200 hover:text-[#C89B57] cursor-pointer"
				>
					<div class="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 min-w-0">
						<span class="font-display text-base sm:text-lg font-normal text-[#E8E6E1]">
							Archival Mission Footage &amp; Embedded Video Sources (ASSETS.md)
						</span>
						<span class="font-mono-tech text-xs text-[#C89B57]">
							1975–2024
						</span>
					</div>
					<div class="flex items-center gap-2.5 shrink-0 font-mono-tech text-xs uppercase tracking-[0.14em] text-[#E8E6E1]/60">
						<span>{VIDEO_MANIFEST.length} videos</span>
						<span class="w-3 text-center text-sm text-[#C89B57]" aria-hidden="true">
							{expandedChapters[VIDEOS_GROUP_KEY] ? '−' : '+'}
						</span>
					</div>
				</button>

				{#if expandedChapters[VIDEOS_GROUP_KEY]}
					<div class="grid grid-cols-1 md:grid-cols-3 gap-x-8 border-t border-[#E8E6E1]/10">
						{#each VIDEO_MANIFEST as vid (vid.id)}
							<div class="py-2.5 border-b border-[#E8E6E1]/10 last:border-b-0 md:last:border-b flex flex-col justify-center min-w-0">
								<div class="flex items-baseline justify-between gap-3 min-w-0">
									<h3
										class="font-display text-base font-normal text-[#E8E6E1] leading-snug"
										title={vid.title}
									>
										{vid.title}
									</h3>
									<span class="font-mono-tech text-xs text-[#C89B57] shrink-0">
										{vid.archiveId} · {vid.year}
									</span>
								</div>
								<div class="mt-1 font-sans text-xs text-[#E8E6E1]/68 leading-snug" title={vid.creditLine}>
									{vid.creditLine}
								</div>
								<div class="mt-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 font-mono-tech text-xs">
									<span class="text-[#E8E6E1]/55 leading-snug" title={vid.license}>
										{vid.license}
									</span>
									<a
										href={vid.sourceUrl}
										target="_blank"
										rel="noopener noreferrer"
										class="inline-flex items-center gap-1 text-[#C89B57] hover:text-[#DDB474] shrink-0 transition-colors duration-200"
									>
										<span>{vid.kind === 'youtube-embed' ? 'YouTube (SpaceX)' : vid.archiveName}</span>
										<span aria-hidden="true">↗</span>
									</a>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
</section>

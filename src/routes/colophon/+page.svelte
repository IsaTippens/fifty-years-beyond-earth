<script lang="ts">
	import {
		CHAPTER_REFERENCES,
		CHAPTER_HIGHLIGHTS,
		ALL_SOURCES,
		SOURCES_MARKDOWN,
		getPublicationLabel,
		type ChapterReferenceGroup
	} from '$lib/data/missions';
	import { ASSET_MANIFEST, VIDEO_MANIFEST, ASSETS_MARKDOWN } from '$lib/data/assets';
	import BuiltByAiPanel from '$lib/components/BuiltByAiPanel.svelte';
	import DecadeTimeline from '$lib/components/DecadeTimeline.svelte';

	const chapterGroups: ChapterReferenceGroup[] = CHAPTER_REFERENCES;
	const chapterArtAssets = ASSET_MANIFEST.filter(
		(a) => a.category === 'chapter-art' || a.category === 'finale-panorama'
	);
	const planetTextureAssets = ASSET_MANIFEST.filter((a) => a.category === 'planet-texture');

	let expandedChapters = $state<Record<string, boolean>>(
		Object.fromEntries(chapterGroups.map((g) => [g.chapterId, true]))
	);
	let showRawSourcesMd = $state(false);
	let showRawAssetsMd = $state(false);
	let showTrajectoryMatrix = $state(false);
	let copiedSources = $state(false);
	let copiedAssets = $state(false);

	function toggleChapterGroup(chapterId: string) {
		expandedChapters = {
			...expandedChapters,
			[chapterId]: !expandedChapters[chapterId]
		};
	}

	async function copySourcesMarkdown() {
		try {
			await navigator.clipboard.writeText(SOURCES_MARKDOWN);
			copiedSources = true;
			setTimeout(() => (copiedSources = false), 2400);
		} catch {
			copiedSources = false;
		}
	}

	async function copyAssetsMarkdown() {
		try {
			await navigator.clipboard.writeText(ASSETS_MARKDOWN);
			copiedAssets = true;
			setTimeout(() => (copiedAssets = false), 2400);
		} catch {
			copiedAssets = false;
		}
	}
</script>

<main class="relative z-10 w-full overflow-x-clip bg-[#050607] pt-20 md:pt-28">
	<!-- ====================================================================== -->
	<!-- COLOPHON HEADER & THREE-SECTION DIRECTORY                              -->
	<!-- ====================================================================== -->
	<header class="mx-auto max-w-[1320px] px-5 sm:px-10 lg:px-16 pb-10 md:pb-16 border-b border-[#E8E6E1]/12">
		<div class="mb-4">
			<a
				href="/"
				class="inline-flex items-center gap-2 font-mono-tech text-[11px] uppercase tracking-[0.16em] text-[#C89B57] hover:text-[#DDB474] transition-colors duration-300"
			>
				<span>← Back to the Journey</span>
			</a>
		</div>

		<div class="font-mono-tech text-[11px] uppercase tracking-[0.16em] text-[#E8E6E1]/65">
			COLOPHON &amp; VERIFICATION ARCHIVE · 1975–2075
		</div>

		<h1
			class="mt-3 font-display font-normal text-[#E8E6E1] tracking-[-0.03em] leading-[0.96]"
			style="font-size: clamp(2.25rem, 6.5vw, 5.5rem);"
		>
			Sources, Attributions &amp; Architecture
		</h1>

		<p class="mt-4 max-w-[64ch] font-sans text-base sm:text-lg text-[#E8E6E1]/78 leading-[1.65]">
			Every mission timestamp, orbital parameter, archival photograph, planetary surface map, and
			video stream in <span class="text-[#E8E6E1]">Fifty Years Beyond Earth</span> is documented and
			cross-referenced against primary scientific archives.
		</p>

		<!-- Jump Links to the Three Sections -->
		<nav
			aria-label="Colophon Sections"
			class="mt-8 pt-6 border-t border-[#E8E6E1]/12 grid grid-cols-1 sm:grid-cols-3 gap-4"
		>
			<a
				href="#sources"
				class="group border border-[#E8E6E1]/12 bg-[#08090B] hover:border-[#C89B57] p-4 transition-colors duration-300"
			>
				<div class="font-mono-tech text-xs uppercase tracking-[0.16em] text-[#C89B57]">
					SECTION 01 // VERIFICATION
				</div>
				<div class="mt-1 font-display text-xl text-[#E8E6E1] group-hover:text-[#DDB474] transition-colors">
					Consolidated Sources Archive
				</div>
				<div class="mt-1 font-mono-tech text-[11px] text-[#E8E6E1]/55">
					{ALL_SOURCES.length} Primary Citations Grouped by Chapter ↓
				</div>
			</a>

			<a
				href="#assets"
				class="group border border-[#E8E6E1]/12 bg-[#08090B] hover:border-[#C89B57] p-4 transition-colors duration-300"
			>
				<div class="font-mono-tech text-xs uppercase tracking-[0.16em] text-[#C89B57]">
					SECTION 02 // PROVENANCE
				</div>
				<div class="mt-1 font-display text-xl text-[#E8E6E1] group-hover:text-[#DDB474] transition-colors">
					Full Attributions &amp; ASSETS.md
				</div>
				<div class="mt-1 font-mono-tech text-[11px] text-[#E8E6E1]/55">
					{ASSET_MANIFEST.length} Plates &amp; Textures · {VIDEO_MANIFEST.length} Video Sources ↓
				</div>
			</a>

			<a
				href="#ai-architecture"
				class="group border border-[#E8E6E1]/12 bg-[#08090B] hover:border-[#C89B57] p-4 transition-colors duration-300"
			>
				<div class="font-mono-tech text-xs uppercase tracking-[0.16em] text-[#C89B57]">
					SECTION 03 // ENGINEERING
				</div>
				<div class="mt-1 font-display text-xl text-[#E8E6E1] group-hover:text-[#DDB474] transition-colors">
					AI Architecture Panel
				</div>
				<div class="mt-1 font-mono-tech text-[11px] text-[#E8E6E1]/55">
					Multi-Agent DAG &amp; Procedural Synthesis ↓
				</div>
			</a>
		</nav>
	</header>

	<!-- ====================================================================== -->
	<!-- SECTION 01: CONSOLIDATED SOURCES ARCHIVE (GROUPED BY CHAPTER)          -->
	<!-- ====================================================================== -->
	<section
		id="sources"
		data-section="sources"
		data-testid="colophon-sources-section"
		class="relative z-10 w-full py-12 sm:py-20 px-5 sm:px-10 lg:px-16 scroll-mt-16"
	>
		<div class="mx-auto max-w-[1320px]">
			<div class="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-[#E8E6E1]/12 pb-6">
				<div>
					<div class="font-mono-tech text-[11px] uppercase tracking-[0.16em] text-[#C89B57]">
						SECTION 01 // CONSOLIDATED SOURCES ARCHIVE ({ALL_SOURCES.length} PRIMARY CITATIONS)
					</div>
					<h2
						class="mt-2 font-display font-normal text-[#E8E6E1] tracking-[-0.02em] leading-[1.06]"
						style="font-size: clamp(1.75rem, 4.2vw, 3.25rem);"
					>
						Primary Sources Grouped by Chapter
					</h2>
					<p class="mt-2 max-w-[65ch] font-sans text-base text-[#E8E6E1]/72 leading-[1.6]">
						Authoritative mission citations verified against NASA, JPL/Caltech, ESA, JAXA, CNSA,
						Roscosmos, STScI, LIGO, and Event Horizon Telescope archives.
					</p>
				</div>

				<div class="flex flex-wrap items-center gap-3 shrink-0">
					<button
						type="button"
						onclick={() => (showTrajectoryMatrix = !showTrajectoryMatrix)}
						aria-expanded={showTrajectoryMatrix}
						class="border border-[#E8E6E1]/18 px-3.5 py-2 font-mono-tech text-xs uppercase tracking-[0.14em] text-[#E8E6E1]/80 hover:border-[#C89B57] hover:text-[#C89B57] transition-colors cursor-pointer"
					>
						{showTrajectoryMatrix
							? '[Hide 5-Decade Trajectory Matrix −]'
							: '[Open 5-Decade Trajectory Matrix +]'}
					</button>
					<button
						type="button"
						onclick={() => (showRawSourcesMd = !showRawSourcesMd)}
						aria-expanded={showRawSourcesMd}
						class="border border-[#C89B57]/50 px-3.5 py-2 font-mono-tech text-xs uppercase tracking-[0.14em] text-[#C89B57] hover:bg-[#C89B57]/12 transition-colors cursor-pointer"
					>
						{showRawSourcesMd ? '[Hide Raw SOURCES.md −]' : '[View Raw SOURCES.md +]'}
					</button>
				</div>
			</div>

			{#if showRawSourcesMd}
				<div class="my-6 border border-[#E8E6E1]/14 bg-[#08090B]">
					<div class="flex items-center justify-between gap-3 border-b border-[#E8E6E1]/10 px-4 py-2.5">
						<span class="font-mono-tech text-xs text-[#E8E6E1]/75">
							SOURCES.md ({ALL_SOURCES.length} Verified Citations)
						</span>
						<button
							type="button"
							onclick={copySourcesMarkdown}
							class="font-mono-tech text-xs text-[#C89B57] hover:text-[#DDB474] cursor-pointer"
						>
							{copiedSources ? '✓ Copied SOURCES.md' : 'Copy SOURCES.md'}
						</button>
					</div>
					<pre
						class="max-h-96 overflow-y-auto p-4 font-mono-tech text-xs text-[#E8E6E1]/75 whitespace-pre-wrap break-words leading-relaxed"
					>{SOURCES_MARKDOWN}</pre>
				</div>
			{/if}

			{#if showTrajectoryMatrix}
				<div class="my-8 border border-[#E8E6E1]/14 bg-[#08090B]/60">
					<DecadeTimeline />
				</div>
			{/if}

			<!-- Chapter-Grouped Reference Accordion -->
			<div class="divide-y divide-[#E8E6E1]/12 border-b border-[#E8E6E1]/12">
				{#each chapterGroups as group (group.chapterId)}
					{@const isExpanded = Boolean(expandedChapters[group.chapterId])}
					<div class="py-2">
						<div class="flex flex-wrap items-center justify-between gap-3 py-3">
							<button
								type="button"
								data-chapter-toggle={group.chapterId}
								onclick={() => toggleChapterGroup(group.chapterId)}
								aria-expanded={isExpanded}
								class="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-left hover:text-[#C89B57] transition-colors cursor-pointer"
							>
								<span class="font-display text-lg sm:text-xl font-normal text-[#E8E6E1]">
									{group.chapterNumber} · {group.title}
								</span>
								<span class="font-mono-tech text-xs text-[#C89B57]">
									{group.yearRange}
								</span>
								<span class="font-mono-tech text-xs uppercase tracking-[0.14em] text-[#E8E6E1]/55">
									({group.sourceCount} sources)
								</span>
							</button>

							<div class="flex items-center gap-4 font-mono-tech text-xs uppercase tracking-[0.14em]">
								<a
									href={`/chapters/${group.chapterId}`}
									class="text-[#C89B57] hover:text-[#DDB474] transition-colors"
								>
									Enter Chapter ↗
								</a>
								<button
									type="button"
									onclick={() => toggleChapterGroup(group.chapterId)}
									class="text-[#E8E6E1]/60 hover:text-[#E8E6E1] cursor-pointer"
								>
									{isExpanded ? '[−]' : '[+]'}
								</button>
							</div>
						</div>

						{#if isExpanded}
							<div class="grid grid-cols-1 md:grid-cols-3 gap-x-8 border-t border-[#E8E6E1]/10 pb-3">
								{#each group.milestones as entry (entry.milestoneId)}
									<div
										class="py-3 border-b border-[#E8E6E1]/10 last:border-b-0 md:last:border-b flex flex-col justify-between min-w-0"
									>
										<div>
											<div class="flex items-baseline justify-between gap-3 min-w-0">
												<a
													href={`/chapters/${entry.chapterId}#${entry.milestoneId}`}
													class="font-display text-base font-normal text-[#E8E6E1] hover:text-[#DDB474] transition-colors leading-snug"
													title={entry.fullTitle}
												>
													{entry.missionName}
												</a>
												<span class="font-mono-tech text-xs text-[#C89B57] shrink-0">
													{entry.year}
												</span>
											</div>
											<div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
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
									</div>
								{/each}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- ====================================================================== -->
	<!-- SECTION 02: FULL ATTRIBUTIONS & ASSETS.MD RENDERED                     -->
	<!-- ====================================================================== -->
	<section
		id="assets"
		data-section="assets"
		data-testid="colophon-assets-section"
		class="relative z-10 w-full border-t border-[#E8E6E1]/12 py-12 sm:py-20 px-5 sm:px-10 lg:px-16 scroll-mt-16"
	>
		<div class="mx-auto max-w-[1320px] space-y-12">
			<div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E8E6E1]/12 pb-6">
				<div>
					<div class="font-mono-tech text-[11px] uppercase tracking-[0.16em] text-[#C89B57]">
						SECTION 02 // ARCHIVAL PROVENANCE &amp; LICENSES (ASSETS.MD)
					</div>
					<h2
						class="mt-2 font-display font-normal text-[#E8E6E1] tracking-[-0.02em] leading-[1.06]"
						style="font-size: clamp(1.75rem, 4.2vw, 3.25rem);"
					>
						Full Media Attributions &amp; ASSETS.md
					</h2>
					<p class="mt-2 max-w-[65ch] font-sans text-base text-[#E8E6E1]/72 leading-[1.6]">
						All {ASSET_MANIFEST.length} self-hosted archival photographs, panoramic star maps, and 3D
						planetary surface textures plus {VIDEO_MANIFEST.length} archival and embedded mission video
						streams with mandatory credit lines and licenses.
					</p>
				</div>

				<div class="flex flex-wrap items-center gap-3 shrink-0">
					<button
						type="button"
						onclick={copyAssetsMarkdown}
						class="border border-[#E8E6E1]/18 px-3.5 py-2 font-mono-tech text-xs uppercase tracking-[0.14em] text-[#E8E6E1]/80 hover:border-[#C89B57] hover:text-[#C89B57] transition-colors cursor-pointer"
					>
						{copiedAssets ? '✓ Copied ASSETS.md' : 'Copy ASSETS.md'}
					</button>
					<button
						type="button"
						onclick={() => (showRawAssetsMd = !showRawAssetsMd)}
						aria-expanded={showRawAssetsMd}
						class="border border-[#C89B57]/50 px-3.5 py-2 font-mono-tech text-xs uppercase tracking-[0.14em] text-[#C89B57] hover:bg-[#C89B57]/12 transition-colors cursor-pointer"
					>
						{showRawAssetsMd ? '[Hide Raw ASSETS.md −]' : '[View Raw ASSETS.md +]'}
					</button>
				</div>
			</div>

			{#if showRawAssetsMd}
				<div class="border border-[#E8E6E1]/14 bg-[#08090B]">
					<div class="flex items-center justify-between gap-3 border-b border-[#E8E6E1]/10 px-4 py-2.5">
						<span class="font-mono-tech text-xs text-[#E8E6E1]/75">
							ASSETS.md ({ASSET_MANIFEST.length + VIDEO_MANIFEST.length} Verified Media Entries)
						</span>
						<button
							type="button"
							onclick={copyAssetsMarkdown}
							class="font-mono-tech text-xs text-[#C89B57] hover:text-[#DDB474] cursor-pointer"
						>
							{copiedAssets ? '✓ Copied' : 'Copy ASSETS.md'}
						</button>
					</div>
					<pre
						class="max-h-96 overflow-y-auto p-4 font-mono-tech text-xs text-[#E8E6E1]/75 whitespace-pre-wrap break-words leading-relaxed"
					>{ASSETS_MARKDOWN}</pre>
				</div>
			{/if}

			<!-- 2A. Chapter & Finale Archival Photographs -->
			<div class="space-y-4">
				<div class="flex items-baseline justify-between border-b border-[#E8E6E1]/10 pb-2.5">
					<h3 class="font-display text-xl sm:text-2xl text-[#E8E6E1]">
						1. Chapter &amp; Finale Archival Plates ({chapterArtAssets.length})
					</h3>
					<span class="font-mono-tech text-xs uppercase tracking-[0.14em] text-[#C89B57]">
						static/assets/chapters/ &amp; finale/
					</span>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
					{#each chapterArtAssets as asset (asset.id)}
						<div class="border border-[#E8E6E1]/12 bg-[#08090B]/80 p-4 flex flex-col justify-between gap-3">
							<div>
								<div class="flex items-baseline justify-between gap-2 font-mono-tech text-[11px] uppercase tracking-[0.14em]">
									<span class="text-[#C89B57]">{asset.archiveId}</span>
									<span class="text-[#E8E6E1]/55">{asset.year}</span>
								</div>
								<h4 class="mt-1.5 font-display text-lg text-[#E8E6E1] leading-snug">
									{asset.title}
								</h4>
								<p class="mt-1.5 font-caption text-xs text-[#E8E6E1]/68 leading-relaxed">
									{asset.caption}
								</p>
								<div class="mt-2.5 pt-2.5 border-t border-[#E8E6E1]/10 font-mono-tech text-[11px] text-[#E8E6E1]/75 leading-relaxed">
									{asset.creditLine}
								</div>
							</div>

							<div class="pt-2 border-t border-[#E8E6E1]/10 flex flex-wrap items-center justify-between gap-2 font-mono-tech text-[11px]">
								<span class="text-[#E8E6E1]/55">{asset.license}</span>
								<a
									href={asset.sourceUrl}
									target="_blank"
									rel="noopener noreferrer"
									class="inline-flex items-center gap-1 text-[#C89B57] hover:text-[#DDB474]"
								>
									<span>{getPublicationLabel(asset.sourceUrl)}</span>
									<span aria-hidden="true">↗</span>
								</a>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- 2B. 3D Planetary Surface & Ring Textures -->
			<div class="space-y-4">
				<div class="flex items-baseline justify-between border-b border-[#E8E6E1]/10 pb-2.5">
					<h3 class="font-display text-xl sm:text-2xl text-[#E8E6E1]">
						2. 3D Planetary Surface &amp; Ring Maps ({planetTextureAssets.length})
					</h3>
					<span class="font-mono-tech text-xs uppercase tracking-[0.14em] text-[#C89B57]">
						static/assets/textures/
					</span>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
					{#each planetTextureAssets as tex (tex.id)}
						<div class="border border-[#E8E6E1]/12 bg-[#08090B]/80 p-4 flex flex-col justify-between gap-3">
							<div>
								<div class="flex items-baseline justify-between gap-2 font-mono-tech text-[11px] uppercase tracking-[0.14em]">
									<span class="text-[#C89B57]">{tex.bodyName ?? tex.id}</span>
									<span class="text-[#E8E6E1]/55">{tex.archiveId} · {tex.year}</span>
								</div>
								<h4 class="mt-1.5 font-display text-lg text-[#E8E6E1] leading-snug">
									{tex.title}
								</h4>
								<p class="mt-1.5 font-caption text-xs text-[#E8E6E1]/68 leading-relaxed">
									{tex.caption}
								</p>
								<div class="mt-2.5 pt-2.5 border-t border-[#E8E6E1]/10 font-mono-tech text-[11px] text-[#E8E6E1]/75 leading-relaxed">
									{tex.creditLine}
								</div>
							</div>

							<div class="pt-2 border-t border-[#E8E6E1]/10 flex flex-wrap items-center justify-between gap-2 font-mono-tech text-[11px]">
								<span class="text-[#E8E6E1]/55">{tex.license}</span>
								<a
									href={tex.sourceUrl}
									target="_blank"
									rel="noopener noreferrer"
									class="inline-flex items-center gap-1 text-[#C89B57] hover:text-[#DDB474]"
								>
									<span>{getPublicationLabel(tex.sourceUrl)}</span>
									<span aria-hidden="true">↗</span>
								</a>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- 2C. Archival Mission Footage & Embedded Video Sources -->
			<div class="space-y-4">
				<div class="flex items-baseline justify-between border-b border-[#E8E6E1]/10 pb-2.5">
					<h3 class="font-display text-xl sm:text-2xl text-[#E8E6E1]">
						3. Archival Mission Footage &amp; Video Sources ({VIDEO_MANIFEST.length})
					</h3>
					<span class="font-mono-tech text-xs uppercase tracking-[0.14em] text-[#C89B57]">
						static/assets/videos/ &amp; YouTube No-Cookie
					</span>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
					{#each VIDEO_MANIFEST as vid (vid.id)}
						<div class="border border-[#E8E6E1]/12 bg-[#08090B]/80 p-4 flex flex-col justify-between gap-3">
							<div>
								<div class="flex items-baseline justify-between gap-2 font-mono-tech text-[11px] uppercase tracking-[0.14em]">
									<span class="text-[#C89B57]">{vid.archiveId}</span>
									<span class="text-[#E8E6E1]/55">{vid.year} · {vid.durationLabel}</span>
								</div>
								<h4 class="mt-1.5 font-display text-lg text-[#E8E6E1] leading-snug">
									{vid.title}
								</h4>
								<div class="mt-1 font-mono-tech text-[11px] text-[#E8E6E1]/60">
									{vid.missionName} · {vid.eventDate}
								</div>
								<div class="mt-2.5 pt-2.5 border-t border-[#E8E6E1]/10 font-mono-tech text-[11px] text-[#E8E6E1]/75 leading-relaxed">
									{vid.creditLine}
								</div>
							</div>

							<div class="pt-2 border-t border-[#E8E6E1]/10 flex flex-wrap items-center justify-between gap-2 font-mono-tech text-[11px]">
								<span class="text-[#E8E6E1]/55">{vid.license}</span>
								<a
									href={vid.sourceUrl}
									target="_blank"
									rel="noopener noreferrer"
									class="inline-flex items-center gap-1 text-[#C89B57] hover:text-[#DDB474]"
								>
									<span>{vid.kind === 'youtube-embed' ? 'YouTube (SpaceX)' : vid.archiveName}</span>
									<span aria-hidden="true">↗</span>
								</a>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</section>

	<!-- ====================================================================== -->
	<!-- SECTION 03: AI ARCHITECTURE PANEL                                      -->
	<!-- ====================================================================== -->
	<div id="colophon-ai-panel" data-testid="colophon-ai-section" class="scroll-mt-16">
		<BuiltByAiPanel />
	</div>

	<!-- ====================================================================== -->
	<!-- COLOPHON FOOTER: BACK TO THE JOURNEY & CHAPTER LINKS                   -->
	<!-- ====================================================================== -->
	<footer class="border-t border-[#E8E6E1]/14 bg-[#050607] py-12 px-5 sm:px-10 lg:px-16">
		<div class="mx-auto max-w-[1320px] flex flex-col sm:flex-row sm:items-center justify-between gap-6">
			<a
				href="/"
				class="inline-flex items-center gap-2 font-mono-tech text-xs uppercase tracking-[0.16em] text-[#E8E6E1] hover:text-[#C89B57] transition-colors"
			>
				<span class="text-[#C89B57]">←</span>
				<span>Back to the Journey</span>
			</a>

			<div class="flex flex-wrap items-center gap-2 font-mono-tech text-[11px] uppercase tracking-[0.14em]">
				{#each CHAPTER_HIGHLIGHTS as ch}
					<a
						href={`/chapters/${ch.slug}`}
						class="px-2.5 py-1 border border-[#E8E6E1]/12 text-[#E8E6E1]/68 hover:border-[#C89B57] hover:text-[#C89B57] transition-colors"
					>
						{ch.indexNumber} · {ch.chapterNumber}
					</a>
				{/each}
			</div>
		</div>
	</footer>
</main>

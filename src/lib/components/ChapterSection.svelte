<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import gsap from 'gsap';
	import {
		getPublicationLabel,
		SOURCE_BY_URL,
		type ChapterData,
		type MilestoneData
	} from '$lib/data/missions';
	import { CHAPTER_ART_BY_ID, VIDEOS_BY_MILESTONE_ID } from '$lib/data/assets';
	import GoldenRecordWidget from './GoldenRecordWidget.svelte';
	import MilestoneSchematic from './MilestoneSchematic.svelte';
	import MissionVideoPlate from './MissionVideoPlate.svelte';
	interface Props {
		chapter: ChapterData;
		index: number;
		saturnSetPiece?: Snippet;
		exoplanetSetPiece?: Snippet;
		setPiece?: Snippet<[MilestoneData]>;
		children?: Snippet<[MilestoneData]>;
	}

	let {
		chapter,
		index,
		saturnSetPiece,
		exoplanetSetPiece,
		setPiece,
		children
	}: Props = $props();

	let openerRef: HTMLElement | undefined = $state();
	let openerVisible = $state(false);
	const chapterArt = $derived(CHAPTER_ART_BY_ID[chapter.chapterId]);
	const chapterArtBase = $derived(
		chapterArt
			? chapterArt.localBasePath
					.replace(/-(800|1600|2400)\.(avif|webp)$/i, '')
					.replace(/\.(avif|webp)$/i, '')
			: ''
	);


	// Track which milestone deep-dive drawers are open
	let expandedDeepDives = $state<Record<string, boolean>>({});

	// Interactive state for Hubble 1990/1993 optical wavefront comparison
	let hubbleCostarActive = $state<boolean>(true);

	// Interactive state for LIGO Hanford/Livingston interferometer phase inspection
	let ligoDetectorOverlay = $state<'both' | 'h1' | 'l1'>('both');

	// Interactive state for JWST 18-segment primary mirror phasing mode
	let jwstPhased = $state<boolean>(true);

	function toggleDeepDive(milestoneId: string) {
		expandedDeepDives = {
			...expandedDeepDives,
			[milestoneId]: !expandedDeepDives[milestoneId]
		};
	}

	function formatDistanceKm(km: number): string {
		if (!km || km <= 0) return 'Low Earth Orbit';
		if (km >= 1_000_000_000) {
			return `${(km / 1_000_000_000).toFixed(2)}B km`;
		}
		if (km >= 1_000_000) {
			return `${(km / 1_000_000).toFixed(2)}M km`;
		}
		return `${km.toLocaleString('en-US')} km`;
	}

	function formatLightTimeFromAu(au: number): string {
		const totalSec = au * 499.00478;
		if (totalSec < 60) return `${totalSec.toFixed(1)}s OWLT`;
		const hrs = Math.floor(totalSec / 3600);
		const mins = Math.floor((totalSec % 3600) / 60);
		const secs = Math.floor(totalSec % 60);
		if (hrs > 0) return `${hrs}h ${mins}m ${secs}s OWLT`;
		return `${mins}m ${secs}s OWLT`;
	}

	function getChapterBackdropFilter(chapterId: string): string {
		if (chapterId === 'epilogue') {
			return 'filter: saturate(1.06) contrast(1.24) brightness(1.08); object-position: 56% 48%;';
		}
		if (chapterId === 'ch3-long-reach') {
			return 'filter: saturate(0.96) contrast(1.15) brightness(0.90); object-position: 64% 46%;';
		}
		if (chapterId === 'prologue') {
			return 'filter: saturate(0.94) contrast(1.15) brightness(0.90); object-position: 58% 48%;';
		}
		if (chapterId === 'ch4-reusable-revolution') {
			return 'filter: saturate(0.95) contrast(1.14) brightness(0.88); object-position: 62% 48%;';
		}
		return 'filter: saturate(0.92) contrast(1.12) brightness(0.84); object-position: center;';
	}

	function getChapterBackdropScrim(chapterId: string): string {
		const localizedProseScrim =
			'radial-gradient(ellipse 66% 72% at 34% 48%, rgba(5, 6, 7, 0.82) 0%, rgba(5, 6, 7, 0.62) 50%, rgba(5, 6, 7, 0.22) 78%, rgba(5, 6, 7, 0) 100%)';
		if (chapterId === 'epilogue') {
			return `background: ${localizedProseScrim}, radial-gradient(ellipse 96% 88% at 64% 48%, rgba(5, 6, 7, 0.02) 0%, rgba(5, 6, 7, 0.22) 74%, rgba(5, 6, 7, 0.78) 100%), linear-gradient(180deg, #050607 0%, rgba(5, 6, 7, 0.06) 14%, rgba(5, 6, 7, 0.10) 86%, #050607 100%);`;
		}
		if (chapterId === 'ch3-long-reach') {
			return `background: ${localizedProseScrim}, radial-gradient(ellipse 94% 86% at 68% 46%, rgba(5, 6, 7, 0.03) 0%, rgba(5, 6, 7, 0.28) 74%, rgba(5, 6, 7, 0.82) 100%), linear-gradient(180deg, #050607 0%, rgba(5, 6, 7, 0.08) 14%, rgba(5, 6, 7, 0.12) 86%, #050607 100%);`;
		}
		return `background: ${localizedProseScrim}, radial-gradient(ellipse 94% 86% at 68% 46%, rgba(5, 6, 7, 0.04) 0%, rgba(5, 6, 7, 0.32) 74%, rgba(5, 6, 7, 0.84) 100%), linear-gradient(180deg, #050607 0%, rgba(5, 6, 7, 0.10) 15%, rgba(5, 6, 7, 0.14) 85%, #050607 100%);`;
	}

	onMount(() => {
		if (!openerRef) return;
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting && !openerVisible) {
						openerVisible = true;
						const titleLines = openerRef?.querySelectorAll('.kinetic-title-line');
						const animatedEls = openerRef?.querySelectorAll('.kinetic-item');
						if (titleLines && titleLines.length > 0) {
							gsap.fromTo(
								titleLines,
								{ yPercent: 100, opacity: 0 },
								{
									yPercent: 0,
									opacity: 1,
									duration: 0.95,
									ease: 'expo.out'
								}
							);
						}
						if (animatedEls && animatedEls.length > 0) {
							gsap.fromTo(
								animatedEls,
								{ y: 24, opacity: 0 },
								{
									y: 0,
									opacity: 1,
									duration: 0.95,
									stagger: 0.09,
									ease: 'expo.out'
								}
							);
						}
					}
				}
			},
			{ threshold: 0.15 }
		);
		observer.observe(openerRef);
		return () => observer.disconnect();
	});
</script>

<section
	id={chapter.chapterId}
	data-chapter-id={chapter.chapterId}
	data-chapter-index={index}
	class="relative w-full border-t border-[#E8E6E1]/10 scroll-mt-20"
>
	<!-- ====================================================================== -->
	<!-- FULL-BLEED CHAPTER OPENER                                              -->
	<!-- ====================================================================== -->
	<div
		bind:this={openerRef}
		class="relative min-h-[60vh] md:min-h-[76vh] w-full overflow-hidden flex flex-col justify-center px-6 sm:px-10 lg:px-16 pt-20 pb-10 md:pt-28 md:pb-16"
	>
		{#if chapterArt && chapterArtBase}
			<div class="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
				<picture class="block h-full w-full">
					<source
						type="image/avif"
						srcset={`${chapterArtBase}-800.avif 800w, ${chapterArtBase}-1600.avif 1600w, ${chapterArtBase}-2400.avif 2400w`}
						sizes="100vw"
					/>
					<source
						type="image/webp"
						srcset={`${chapterArtBase}-800.webp 800w, ${chapterArtBase}-1600.webp 1600w, ${chapterArtBase}-2400.webp 2400w`}
						sizes="100vw"
					/>
					<img
						src={`${chapterArtBase}-1600.webp`}
						alt={chapterArt.caption || chapterArt.title}
						fetchpriority="high"
						decoding="async"
						class="chapter-ken-burns h-full w-full object-cover"
						style={getChapterBackdropFilter(chapter.chapterId)}
					/>
				</picture>
				<!-- Lifted Documentary Edge Scrim (preserves bright photograph presence while blending top/bottom edges) -->
				<div
					class="absolute inset-0"
					style={getChapterBackdropScrim(chapter.chapterId)}
				></div>
			</div>
		{/if}
		<div class="relative z-10 mx-auto w-full max-w-5xl">
			<!-- Back to the Journey Breadcrumb -->
			<div class="kinetic-item mb-3 md:mb-5">
				<a
					href="/"
					class="inline-flex items-center gap-2 font-mono-tech text-[11px] uppercase tracking-[0.16em] text-[#C89B57] hover:text-[#DDB474] transition-colors duration-300"
					style="text-shadow: 0 1px 12px rgba(5, 6, 7, 0.96);"
				>
					<span>← Back to the Journey</span>
				</a>
			</div>

			<!-- Small Tracked-Out Monospace Telemetry Header -->
			<div
				class="kinetic-item font-mono-tech text-[11px] uppercase tracking-[0.16em] text-[#E8E6E1]/85"
				style="text-shadow: 0 1px 12px rgba(5, 6, 7, 0.95);"
			>
				<span>{chapter.chapterNumber}</span>
				<span class="mx-2 text-[#E8E6E1]/45">·</span>
				<span class="text-[#DDB474]">{chapter.yearRange}</span>
				<span class="mx-2 text-[#E8E6E1]/45">·</span>
				<span>VOYAGER 1: {chapter.voyagerDistanceRangeLabel}</span>
				<span class="hidden sm:inline mx-2 text-[#E8E6E1]/45">·</span>
				<span class="hidden sm:inline">OWLT: {chapter.voyagerLightTime}</span>
			</div>

			<!-- Enormous Fraunces Chapter Title with Masked Rise -->
			<h1
				class="mt-3 md:mt-5 font-display font-normal text-[#F5F3EE] overflow-hidden pb-1.5 break-words"
				style="font-size: clamp(2.15rem, 8vw, 7.5rem); line-height: 0.94; letter-spacing: -0.03em; text-shadow: 0 2px 32px rgba(5, 6, 7, 0.96), 0 1px 8px rgba(5, 6, 7, 0.92);"
			>
				<span
					class="kinetic-title-line block transition-transform duration-[950ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
				>
					{chapter.title}
				</span>
			</h1>
			<!-- Editorial Subtitle -->
			<p
				class="kinetic-item mt-2.5 md:mt-4 font-display italic font-light text-lg sm:text-xl md:text-2xl text-[#DDB474] max-w-[54ch]"
				style="text-shadow: 0 2px 24px rgba(5, 6, 7, 0.96), 0 1px 6px rgba(5, 6, 7, 0.92);"
			>
				{chapter.subtitle}
			</p>

			<!-- Opening Prose with High-Contrast Arm's-Length Legibility -->
			<p
				class="kinetic-item mt-5 md:mt-10 max-w-[62ch] font-sans text-[16px] sm:text-lg md:text-xl leading-[1.64] md:leading-[1.7] text-[#F2F0EC] font-normal"
				style="text-shadow: 0 1px 12px rgba(5, 6, 7, 0.98), 0 2px 28px rgba(5, 6, 7, 0.95);"
			>
				{chapter.openingProse}
			</p>

			<!-- Milestones as a Tight Single-Column Editorial Index -->
			<div class="kinetic-item mt-6 md:mt-14 pt-4 md:pt-8 border-t border-[#E8E6E1]/18 max-w-4xl">
				<div
					class="font-mono-tech text-[11px] uppercase tracking-[0.16em] text-[#E8E6E1]/80 mb-2.5 md:mb-5"
					style="text-shadow: 0 1px 10px rgba(5, 6, 7, 0.95);"
				>
					CHRONICLE INDEX — EPOCH {String(index + 1).padStart(2, '0')} ({chapter.milestones.length} MILESTONES)
				</div>
				<ol class="divide-y divide-[#E8E6E1]/10 border-y border-[#E8E6E1]/10">
					{#each chapter.milestones as m, mIdx}
						<li>
							<a
								href={`#${m.id}`}
								class="group flex items-baseline justify-between gap-3 py-1.5 sm:py-2 leading-snug transition-colors duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#E8E6E1]/[0.02]"
							>
								<div class="flex items-baseline gap-3 sm:gap-5 min-w-0">
									<span
										class="font-mono-tech text-[11px] tracking-[0.16em] text-[#E8E6E1]/68 w-5 shrink-0"
									>
										{String(mIdx + 1).padStart(2, '0')}
									</span>
									<span
										class="font-mono-tech text-xs tracking-[0.12em] text-[#DDB474] w-11 shrink-0"
									>
										{m.year}
									</span>
									<span
										class="font-display text-base sm:text-lg text-[#F2F0EC] group-hover:text-[#DDB474] transition-colors duration-500 leading-snug"
									>
										{m.title}
									</span>
								</div>
								<span
									class="hidden md:inline font-mono-tech text-[11px] uppercase tracking-[0.14em] text-[#E8E6E1]/68 shrink-0 group-hover:text-[#DDB474] transition-colors duration-500"
								>
									{m.agency} ↓
								</span>
							</a>
						</li>
					{/each}
				</ol>
			</div>
		</div>

		{#if chapterArt}
			<div
				class="pointer-events-none mt-4 md:mt-0 md:absolute md:bottom-6 md:right-10 lg:right-16 z-10 max-w-[90vw] text-right font-mono-tech text-[11px] uppercase tracking-[0.16em] text-[#E8E6E1]/78"
				style="text-shadow: 0 1px 14px rgba(5, 6, 7, 0.98);"
			>
				ARCHIVE PLATE // {chapterArt.archiveId} · {chapterArt.creditLine}
			</div>
		{/if}
	</div>

	<!-- ====================================================================== -->
	<!-- FULL-BLEED MILESTONE NARRATIVE STREAM                                  -->
	<!-- ====================================================================== -->
	<div class="relative z-10 mx-auto max-w-5xl px-6 sm:px-10 lg:px-16 pb-6 md:pb-12">
		{#each chapter.milestones as milestone, mIndex (milestone.id)}
			{@const isDeepDiveOpen = !!expandedDeepDives[milestone.id]}
			{@const milestoneVideos = VIDEOS_BY_MILESTONE_ID[milestone.id]}
			<article
				id={milestone.id}
				data-milestone-id={milestone.id}
				data-chapter-id={chapter.chapterId}
				class="relative py-8 md:py-16 last:pb-6 md:last:pb-10 border-t border-[#E8E6E1]/10 scroll-mt-24"
			>
				<!-- 1. Editorial Milestone Header -->
				<header class="max-w-4xl">
					<div
						class="flex flex-wrap items-center gap-x-3 gap-y-1.5 font-mono-tech text-[11px] uppercase tracking-[0.16em]"
					>
						<span class="text-[#E8E6E1]/44">
							{String(mIndex + 1).padStart(2, '0')}
						</span>
						<span class="text-[#E8E6E1]/24">/</span>
						<span class="text-[#C89B57]">{milestone.exactDate}</span>
						<span class="text-[#E8E6E1]/24">·</span>
						<span class="text-[#E8E6E1]/60">{milestone.agency}</span>
						<span class="text-[#E8E6E1]/24">·</span>
						<span class="text-[#E8E6E1]/60">{milestone.locationOrOrbit}</span>
					</div>

					<h3
						class="mt-2.5 md:mt-4 font-display font-normal text-[#E8E6E1] leading-[1.1] break-words"
						style="font-size: clamp(1.4rem, 5.2vw, 3rem); letter-spacing: -0.02em; text-shadow: 0 2px 24px rgba(5, 6, 7, 0.9);"
					>
						{milestone.title}
					</h3>

					{#if milestone.subtitle}
						<p
							class="mt-1.5 md:mt-2.5 font-display italic font-light text-base sm:text-lg md:text-xl text-[#E8E6E1]/72 max-w-[60ch]"
						>
							{milestone.subtitle}
						</p>
					{/if}

					<div
						class="mt-2.5 md:mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 font-mono-tech text-[11px] uppercase tracking-[0.16em] text-[#E8E6E1]/60"
					>
						<span>
							EARTH RANGE: <strong class="font-normal text-[#E8E6E1]"
								>{formatDistanceKm(milestone.distanceFromEarthKm)}</strong
							>
						</span>
						<span class="text-[#E8E6E1]/24">·</span>
						<span>
							VOYAGER 1 BENCHMARK: <strong class="font-normal text-[#C89B57]"
								>{milestone.voyagerAuAtEvent.toFixed(2)} AU</strong
							>
							({formatLightTimeFromAu(milestone.voyagerAuAtEvent)})
						</span>
					</div>
				</header>

				<!-- 2. Refined Monochrome + Warm Amber Technical Schematic Plate -->
				<div
					class="my-4 md:my-8 border-y border-[#E8E6E1]/12 bg-[#050607]/60 py-2 md:py-5 px-2 sm:px-4"
				>
					<div class="mb-2 md:mb-4 flex flex-wrap items-center justify-between gap-2 md:gap-3">
						<div class="flex items-center gap-2.5">
							<span class="h-1.5 w-1.5 rounded-full bg-[#C89B57]"></span>
							<span
								class="font-mono-tech text-[11px] uppercase tracking-[0.16em] text-[#E8E6E1]/60"
							>
								TECHNICAL TELEMETRY SCHEMATIC · {milestone.id.toUpperCase()}
							</span>
						</div>

						{#if milestone.id === 'hubble-repair-1993'}
							<div class="flex flex-wrap items-center gap-2">
								<button
									type="button"
									onclick={() => (hubbleCostarActive = false)}
									class="border px-3 py-1 font-mono-tech text-xs uppercase tracking-[0.14em] transition-colors duration-500 cursor-pointer {!hubbleCostarActive
										? 'border-[#C89B57] bg-[#C89B57]/15 text-[#E8E6E1]'
										: 'border-[#E8E6E1]/15 bg-transparent text-[#E8E6E1]/50 hover:text-[#E8E6E1]'}"
								>
									1990 Flawed Primary (2.2 μm Error)
								</button>
								<button
									type="button"
									onclick={() => (hubbleCostarActive = true)}
									class="border px-3 py-1 font-mono-tech text-xs uppercase tracking-[0.14em] transition-colors duration-500 cursor-pointer {hubbleCostarActive
										? 'border-[#C89B57] bg-[#C89B57]/15 text-[#E8E6E1]'
										: 'border-[#E8E6E1]/15 bg-transparent text-[#E8E6E1]/50 hover:text-[#E8E6E1]'}"
								>
									1993 COSTAR + WFPC2 Corrected
								</button>
							</div>
						{:else if milestone.id === 'ligo-gravitational-waves-2015'}
							<div class="flex flex-wrap items-center gap-2">
								{#each [
									{ id: 'both', label: 'H1 + L1 Coincidence (Δt = 6.9 ms)' },
									{ id: 'h1', label: 'Hanford H1' },
									{ id: 'l1', label: 'Livingston L1' }
								] as mode}
									<button
										type="button"
										onclick={() => (ligoDetectorOverlay = mode.id as 'both' | 'h1' | 'l1')}
										class="border px-2.5 py-1 font-mono-tech text-xs uppercase tracking-[0.14em] transition-colors duration-500 cursor-pointer {ligoDetectorOverlay ===
										mode.id
											? 'border-[#C89B57] bg-[#C89B57]/15 text-[#E8E6E1]'
											: 'border-[#E8E6E1]/15 bg-transparent text-[#E8E6E1]/50 hover:text-[#E8E6E1]'}"
									>
										{mode.label}
									</button>
								{/each}
							</div>
						{:else if milestone.id === 'jwst-first-images-2022'}
							<div class="flex flex-wrap items-center gap-2">
								<button
									type="button"
									onclick={() => (jwstPhased = false)}
									class="border px-3 py-1 font-mono-tech text-xs uppercase tracking-[0.14em] transition-colors duration-500 cursor-pointer {!jwstPhased
										? 'border-[#C89B57] bg-[#C89B57]/15 text-[#E8E6E1]'
										: 'border-[#E8E6E1]/15 bg-transparent text-[#E8E6E1]/50 hover:text-[#E8E6E1]'}"
								>
									Unphased 18-Segment Array
								</button>
								<button
									type="button"
									onclick={() => (jwstPhased = true)}
									class="border px-3 py-1 font-mono-tech text-xs uppercase tracking-[0.14em] transition-colors duration-500 cursor-pointer {jwstPhased
										? 'border-[#C89B57] bg-[#C89B57]/15 text-[#E8E6E1]'
										: 'border-[#E8E6E1]/15 bg-transparent text-[#E8E6E1]/50 hover:text-[#E8E6E1]'}"
								>
									Fine-Phased Wavefront (&lt;15 nm RMS)
								</button>
							</div>
						{/if}
					</div>

					<MilestoneSchematic
						{milestone}
						{hubbleCostarActive}
						{ligoDetectorOverlay}
						{jwstPhased}
					/>
				</div>

				<!-- 3. Editorial Body Prose Directly on the Void -->
				<div class="mt-4 md:mt-8">
					<p
						class="max-w-[65ch] font-sans text-base sm:text-[17px] leading-[1.65] text-[#E8E6E1]/92 font-normal"
						style="text-shadow: 0 2px 20px rgba(5, 6, 7, 0.9);"
					>
						{milestone.summary}
					</p>
				</div>

				<!-- 4. Quiet Typographic Engineering Deep Dive Toggle & Left-Ruled Drawer -->
				<div class="mt-4 md:mt-7">
					<button
						type="button"
						onclick={() => toggleDeepDive(milestone.id)}
						aria-expanded={isDeepDiveOpen}
						class="group inline-flex items-center gap-2.5 py-1 font-mono-tech text-xs uppercase tracking-[0.16em] text-[#C89B57] hover:text-[#DDB474] transition-colors duration-500 cursor-pointer"
					>
						<span class="font-mono-tech text-sm leading-none">
							{isDeepDiveOpen ? '−' : '+'}
						</span>
						<span>
							{isDeepDiveOpen ? 'Close Engineering Deep Dive' : 'Read Engineering Deep Dive'}
						</span>
					</button>

					{#if isDeepDiveOpen}
						<div
							class="mt-4 pl-4 sm:pl-7 border-l border-[#C89B57]/40 max-w-[65ch] space-y-3.5 transition-opacity duration-500"
						>
							<div
								class="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#E8E6E1]/10 font-mono-tech text-[11px] uppercase tracking-[0.16em] text-[#E8E6E1]/60"
							>
								<span>PRIMARY ENGINEERING ARCHIVE · {milestone.id.toUpperCase()}</span>
								<span class="text-[#C89B57]">{milestone.agency}</span>
							</div>
							{#each milestone.deepDive.split('\n\n') as paragraph}
								<p
									class="font-sans text-base sm:text-[17px] leading-[1.65] text-[#E8E6E1]/75"
								>
									{paragraph}
								</p>
							{/each}
						</div>
					{/if}
				</div>

				<!-- 4b. Archival Self-Hosted Video or Privacy-Enhanced YouTube Lite-Embed Plate -->
				{#if milestoneVideos && milestoneVideos.length > 0}
					<MissionVideoPlate videos={milestoneVideos} />
				{/if}

				<!-- 5. Embedded Interactive Artifacts & 3D Set-Piece Integration Points -->
				{#if milestone.id === 'voyager-golden-record-1977' || milestone.highlightType === 'golden-record'}
					<GoldenRecordWidget />
				{/if}

				{#if milestone.id === 'cassini-huygens-2005' || milestone.highlightType === 'saturn-setpiece'}
					{#if saturnSetPiece}
						<div class="mt-5 md:mt-10" data-setpiece-mount="saturn-cassini">
							{@render saturnSetPiece()}
						</div>
					{/if}
				{/if}

				{#if milestone.id === 'exoplanet-census-2026' || milestone.highlightType === 'exoplanet-setpiece'}
					{#if exoplanetSetPiece}
						<div class="mt-5 md:mt-10" data-setpiece-mount="exoplanet-orrery">
							{@render exoplanetSetPiece()}
						</div>
					{/if}
				{/if}

				{#if setPiece}
					<div class="mt-5 md:mt-8">
						{@render setPiece(milestone)}
					</div>
				{/if}

				{#if children}
					<div class="mt-5 md:mt-8">
						{@render children(milestone)}
					</div>
				{/if}

				<!-- 6. Compact 2×2 Mobile / 4-Column Desktop Editorial Key Statistics Grid -->
				{#if milestone.keyStats && milestone.keyStats.length > 0}
					<div
						class="mt-5 md:mt-10 border-t border-[#E8E6E1]/12 pt-3.5 md:pt-6 grid grid-cols-2 lg:grid-cols-4 gap-x-4 md:gap-x-8 gap-y-3 md:gap-y-6"
					>
						{#each milestone.keyStats as stat, sIdx}
							<div class="{sIdx >= 4 ? 'hidden lg:flex' : 'flex'} flex-col">
								<div
									class="flex items-start justify-between gap-2 font-mono-tech text-[11px] sm:text-xs uppercase tracking-[0.14em] text-[#E8E6E1]/68"
								>
									<span class="leading-snug">{stat.label}</span>
									{#if stat.unit}
										<span class="text-[11px] text-[#E8E6E1]/44 shrink-0">{stat.unit}</span>
									{/if}
								</div>
								<div
									class="mt-1 md:mt-2 font-display font-normal tracking-tight {sIdx === 0
										? 'text-[#C89B57]'
										: 'text-[#E8E6E1]'}"
									style="font-size: clamp(1.25rem, 2.2vw, 2rem); line-height: 1.1;"
								>
									{stat.value}
								</div>
								{#if stat.description}
									<div class="mt-1 font-sans text-xs text-[#E8E6E1]/58 leading-snug">
										{stat.description}
									</div>
								{/if}
							</div>
						{/each}
					</div>
				{/if}

				<!-- 7. Clean Inline Typographic Primary Source Citations -->
				{#if milestone.sourceUrls && milestone.sourceUrls.length > 0}
					<div class="mt-4 md:mt-8 pt-3 md:pt-4 border-t border-[#E8E6E1]/[0.08] flex flex-wrap items-center gap-x-4 gap-y-1.5">
						<span class="font-mono-tech text-[11px] uppercase tracking-[0.16em] text-[#E8E6E1]/44">
							PRIMARY SOURCES
						</span>
						{#each milestone.sourceUrls as url, sIdx}
							<a
								href={url}
								target="_blank"
								rel="noopener noreferrer"
								title={SOURCE_BY_URL[url]?.title ?? url}
								class="inline-flex items-center gap-1.5 font-mono-tech text-[11px] tracking-[0.06em] text-[#E8E6E1]/72 transition-colors duration-500 hover:text-[#C89B57]"
							>
								<span class="text-[#C89B57]">[{String(sIdx + 1).padStart(2, '0')}]</span>
								<span>{getPublicationLabel(url)}</span>
								<span class="text-[11px] opacity-60">↗</span>
							</a>
						{/each}
					</div>
				{/if}
			</article>
		{/each}
	</div>
</section>

<style>
	@keyframes chapterKenBurns {
		0% {
			transform: scale(1) translate3d(0, 0, 0);
		}
		100% {
			transform: scale(1.08) translate3d(-1%, -0.75%, 0);
		}
	}

	.chapter-ken-burns {
		will-change: transform;
		animation: chapterKenBurns 28s cubic-bezier(0.22, 1, 0.36, 1) infinite alternate;
	}

	@media (prefers-reduced-motion: reduce) {
		.chapter-ken-burns {
			animation: none;
			transform: none;
		}
	}
</style>

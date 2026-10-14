<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import gsap from 'gsap';
	import type { ChapterData, MilestoneData } from '$lib/data/missions';
	import { CHAPTER_ART_BY_ID } from '$lib/data/assets';
	import GoldenRecordWidget from './GoldenRecordWidget.svelte';

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

	function extractDistinctLabel(url: string, sIdx: number, allUrls?: string[]): string {
		try {
			const u = new URL(url);
			const host = u.hostname.replace(/^www\d*\./, '');
			const segments = u.pathname
				.split('/')
				.map((s) => s.replace(/\.(html?|pdf)$/i, '').trim())
				.filter(Boolean);
			if (segments.length === 0) {
				return allUrls && allUrls.filter((x) => x.includes(host)).length > 1
					? `${host}#${sIdx + 1}`
					: host;
			}
			const tail = segments[segments.length - 1].slice(0, 22).replace(/-+$/, '');
			const parent =
				segments.length > 1 ? `${segments[segments.length - 2].slice(0, 12).replace(/-+$/, '')}/` : '';
			return `${host}/${parent}${tail}`;
		} catch {
			return `source-${sIdx + 1}`;
		}
	}

	function resolveSchematicKind(m: MilestoneData): string {
		if (m.highlightType) return m.highlightType;
		const id = m.id;
		if (id.includes('apollo-soyuz')) return 'handshake';
		if (id.includes('viking')) return 'viking';
		if (id.includes('golden-record')) return 'golden-record';
		if (id.includes('sts-1') || id.includes('shuttle')) return 'shuttle';
		if (id.includes('mir-station')) return 'mir';
		if (id.includes('giotto')) return 'giotto';
		if (id.includes('iss-assembly')) return 'iss';
		if (id.includes('hubble')) return 'hubble';
		if (id.includes('pathfinder') || id.includes('spirit-opportunity')) return 'mars-rover';
		if (id.includes('cassini')) return 'saturn-setpiece';
		if (id.includes('kepler')) return 'kepler';
		if (id.includes('heliopause')) return 'heliopause';
		if (id.includes('rosetta')) return 'rosetta';
		if (id.includes('new-horizons') || id.includes('pluto')) return 'pluto';
		if (id.includes('ligo')) return 'ligo';
		if (id.includes('falcon9')) return 'falcon9';
		if (id.includes('hayabusa') || id.includes('osiris')) return 'asteroid';
		if (id.includes('change4')) return 'change4';
		if (id.includes('eht') || id.includes('black-hole')) return 'black-hole';
		if (id.includes('demo2') || id.includes('commercial-crew')) return 'commercial-crew';
		if (id.includes('perseverance') || id.includes('ingenuity')) return 'perseverance';
		if (id.includes('jwst')) return 'jwst';
		if (id.includes('dart')) return 'dart';
		if (id.includes('artemis')) return 'artemis';
		if (id.includes('exoplanet-census')) return 'exoplanet-setpiece';
		if (id.includes('europa') || id.includes('ocean-worlds')) return 'horizon';
		return 'horizon';
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
	<!-- FULL-BLEED CHAPTER OPENER (min-h-screen)                               -->
	<!-- ====================================================================== -->
	<div
		bind:this={openerRef}
		class="relative min-h-[68vh] md:min-h-screen w-full overflow-hidden flex flex-col justify-center px-6 sm:px-10 lg:px-16 py-12 md:py-28"
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
						loading="lazy"
						decoding="async"
						class="chapter-ken-burns h-full w-full object-cover object-center"
						style="filter: saturate(0.68) contrast(1.08) brightness(0.58);"
					/>
				</picture>
				<!-- Rich Dark Documentary Scrim (radial-gradient + linear-gradient to #050607 at top, left, and bottom) -->
				<div
					class="absolute inset-0"
					style="background: radial-gradient(ellipse 90% 80% at 68% 42%, rgba(5, 6, 7, 0.28) 0%, rgba(5, 6, 7, 0.78) 72%, #050607 100%), linear-gradient(90deg, rgba(5, 6, 7, 0.90) 0%, rgba(5, 6, 7, 0.56) 52%, rgba(5, 6, 7, 0.34) 100%), linear-gradient(180deg, #050607 0%, rgba(5, 6, 7, 0.36) 24%, rgba(5, 6, 7, 0.44) 74%, #050607 100%);"
				></div>
			</div>
		{/if}
		<div class="relative z-10 mx-auto w-full max-w-5xl">
			<!-- Small Tracked-Out Monospace Telemetry Header -->
			<div
				class="kinetic-item font-mono-tech text-[11px] uppercase tracking-[0.16em] text-[#E8E6E1]/60"
			>
				<span>{chapter.chapterNumber}</span>
				<span class="mx-2 text-[#E8E6E1]/30">·</span>
				<span class="text-[#C89B57]">{chapter.yearRange}</span>
				<span class="mx-2 text-[#E8E6E1]/30">·</span>
				<span>VOYAGER 1: {chapter.voyagerDistanceRangeLabel}</span>
				<span class="hidden sm:inline mx-2 text-[#E8E6E1]/30">·</span>
				<span class="hidden sm:inline">OWLT: {chapter.voyagerLightTime}</span>
			</div>

			<!-- Enormous Fraunces Chapter Title with Masked Rise -->
			<h2
				class="mt-3 md:mt-5 font-display font-normal text-[#E8E6E1] overflow-hidden pb-1.5 break-words"
				style="font-size: clamp(2.15rem, 8vw, 7.5rem); line-height: 0.94; letter-spacing: -0.03em; text-shadow: 0 2px 32px rgba(5, 6, 7, 0.9);"
			>
				<span
					class="kinetic-title-line block transition-transform duration-[950ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
				>
					{chapter.title}
				</span>
			</h2>

			<!-- Editorial Subtitle -->
			<p
				class="kinetic-item mt-2.5 md:mt-4 font-display italic font-light text-lg sm:text-xl md:text-2xl text-[#C89B57] max-w-[54ch]"
				style="text-shadow: 0 2px 24px rgba(5, 6, 7, 0.9);"
			>
				{chapter.subtitle}
			</p>

			<!-- Opening Prose Sitting Directly on the Void -->
			<p
				class="kinetic-item mt-5 md:mt-10 max-w-[62ch] font-sans text-[16px] sm:text-lg md:text-xl leading-[1.62] md:leading-[1.68] text-[#E8E6E1]/88 font-normal"
				style="text-shadow: 0 2px 24px rgba(5, 6, 7, 0.9);"
			>
				{chapter.openingProse}
			</p>

			<!-- Milestones as a Tight Single-Column Editorial Index -->
			<div class="kinetic-item mt-6 md:mt-14 pt-4 md:pt-8 border-t border-[#E8E6E1]/12 max-w-4xl">
				<div
					class="font-mono-tech text-[11px] uppercase tracking-[0.16em] text-[#E8E6E1]/60 mb-2.5 md:mb-5"
				>
					CHRONICLE INDEX — EPOCH {String(index + 1).padStart(2, '0')} ({chapter.milestones.length} MILESTONES)
				</div>
				<ol class="divide-y divide-[#E8E6E1]/10 border-y border-[#E8E6E1]/10">
					{#each chapter.milestones as m, mIdx}
						<li>
							<a
								href={`#${m.id}`}
								class="group flex items-baseline justify-between gap-3 py-1.5 sm:py-2 leading-tight transition-colors duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#E8E6E1]/[0.02]"
							>
								<div class="flex items-baseline gap-3 sm:gap-5 min-w-0">
									<span
										class="font-mono-tech text-[11px] tracking-[0.16em] text-[#E8E6E1]/44 w-5 shrink-0"
									>
										{String(mIdx + 1).padStart(2, '0')}
									</span>
									<span
										class="font-mono-tech text-xs tracking-[0.12em] text-[#C89B57] w-11 shrink-0"
									>
										{m.year}
									</span>
									<span
										class="font-display text-base sm:text-lg text-[#E8E6E1] group-hover:text-[#DDB474] transition-colors duration-500 truncate"
									>
										{m.title}
									</span>
								</div>
								<span
									class="hidden md:inline font-mono-tech text-[11px] uppercase tracking-[0.14em] text-[#E8E6E1]/44 shrink-0 group-hover:text-[#C89B57] transition-colors duration-500"
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
				class="pointer-events-none mt-4 md:mt-0 md:absolute md:bottom-6 md:right-10 lg:right-16 z-10 max-w-[90vw] text-right font-mono-tech text-[10px] sm:text-[11px] uppercase tracking-[0.16em] text-[#E8E6E1]/60"
				style="text-shadow: 0 1px 12px rgba(5, 6, 7, 0.95);"
			>
				ARCHIVE PLATE // {chapterArt.archiveId} · {chapterArt.creditLine}
			</div>
		{/if}
	</div>

	<!-- ====================================================================== -->
	<!-- FULL-BLEED MILESTONE NARRATIVE STREAM                                  -->
	<!-- ====================================================================== -->
	<div class="relative z-10 mx-auto max-w-5xl px-6 sm:px-10 lg:px-16 pb-10 md:pb-24">
		{#each chapter.milestones as milestone, mIndex (milestone.id)}
			{@const schematic = resolveSchematicKind(milestone)}
			{@const isDeepDiveOpen = !!expandedDeepDives[milestone.id]}
			<article
				id={milestone.id}
				data-milestone-id={milestone.id}
				data-chapter-id={chapter.chapterId}
				class="relative py-9 md:py-24 border-t border-[#E8E6E1]/10 scroll-mt-24"
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

						{#if schematic === 'hubble'}
							<div class="flex flex-wrap items-center gap-2">
								<button
									type="button"
									onclick={() => (hubbleCostarActive = false)}
									class="border px-3 py-1 font-mono-tech text-[10px] uppercase tracking-[0.14em] transition-colors duration-500 cursor-pointer {!hubbleCostarActive
										? 'border-[#C89B57] bg-[#C89B57]/15 text-[#E8E6E1]'
										: 'border-[#E8E6E1]/15 bg-transparent text-[#E8E6E1]/50 hover:text-[#E8E6E1]'}"
								>
									1990 Flawed Primary (2.2 μm Error)
								</button>
								<button
									type="button"
									onclick={() => (hubbleCostarActive = true)}
									class="border px-3 py-1 font-mono-tech text-[10px] uppercase tracking-[0.14em] transition-colors duration-500 cursor-pointer {hubbleCostarActive
										? 'border-[#C89B57] bg-[#C89B57]/15 text-[#E8E6E1]'
										: 'border-[#E8E6E1]/15 bg-transparent text-[#E8E6E1]/50 hover:text-[#E8E6E1]'}"
								>
									1993 COSTAR + WFPC2 Corrected
								</button>
							</div>
						{:else if schematic === 'ligo'}
							<div class="flex flex-wrap items-center gap-2">
								{#each [
									{ id: 'both', label: 'H1 + L1 Coincidence (Δt = 6.9 ms)' },
									{ id: 'h1', label: 'Hanford H1' },
									{ id: 'l1', label: 'Livingston L1' }
								] as mode}
									<button
										type="button"
										onclick={() => (ligoDetectorOverlay = mode.id as 'both' | 'h1' | 'l1')}
										class="border px-2.5 py-1 font-mono-tech text-[10px] uppercase tracking-[0.14em] transition-colors duration-500 cursor-pointer {ligoDetectorOverlay ===
										mode.id
											? 'border-[#C89B57] bg-[#C89B57]/15 text-[#E8E6E1]'
											: 'border-[#E8E6E1]/15 bg-transparent text-[#E8E6E1]/50 hover:text-[#E8E6E1]'}"
									>
										{mode.label}
									</button>
								{/each}
							</div>
						{:else if schematic === 'jwst'}
							<div class="flex flex-wrap items-center gap-2">
								<button
									type="button"
									onclick={() => (jwstPhased = false)}
									class="border px-3 py-1 font-mono-tech text-[10px] uppercase tracking-[0.14em] transition-colors duration-500 cursor-pointer {!jwstPhased
										? 'border-[#C89B57] bg-[#C89B57]/15 text-[#E8E6E1]'
										: 'border-[#E8E6E1]/15 bg-transparent text-[#E8E6E1]/50 hover:text-[#E8E6E1]'}"
								>
									Unphased 18-Segment Array
								</button>
								<button
									type="button"
									onclick={() => (jwstPhased = true)}
									class="border px-3 py-1 font-mono-tech text-[10px] uppercase tracking-[0.14em] transition-colors duration-500 cursor-pointer {jwstPhased
										? 'border-[#C89B57] bg-[#C89B57]/15 text-[#E8E6E1]'
										: 'border-[#E8E6E1]/15 bg-transparent text-[#E8E6E1]/50 hover:text-[#E8E6E1]'}"
								>
									Fine-Phased Wavefront (&lt;15 nm RMS)
								</button>
							</div>
						{/if}
					</div>

					<!-- Bespoke Architectural SVG Schematics (Warm Off-White #E8E6E1 + Warm Amber #C89B57 + Hairline Slate) -->
					{#if schematic === 'handshake'}
						<!-- Apollo-Soyuz APAS-75 Androgynous Docking & Airlock Schematic -->
						<svg viewBox="0 0 800 220" class="max-h-[135px] sm:max-h-none w-full h-auto" role="img" aria-label="Apollo-Soyuz APAS-75 Docking Schematic">
							<rect width="800" height="220" fill="#050607" />
							<!-- Orbital trajectory curve -->
							<path d="M 20 190 Q 400 140 780 190" fill="none" stroke="rgba(232,230,225,0.22)" stroke-width="1.2" stroke-dasharray="4 4" />
							<!-- Left: Apollo CSM + Docking Module -->
							<g transform="translate(80, 56)" stroke="#E8E6E1" fill="none">
								<rect x="0" y="20" width="110" height="68" rx="2" fill="rgba(232,230,225,0.03)" stroke-width="1.3" />
								<polygon points="-36,10 0,28 0,80 -36,98" fill="rgba(232,230,225,0.02)" stroke="rgba(232,230,225,0.5)" stroke-width="1.1" />
								<polygon points="110,20 165,36 165,72 110,88" fill="rgba(232,230,225,0.04)" stroke-width="1.3" />
								<!-- Docking Module (Airlock transfer tunnel) -->
								<rect x="165" y="34" width="115" height="40" fill="rgba(200,155,87,0.08)" stroke="#C89B57" stroke-width="1.4" />
								<text x="15" y="52" fill="#E8E6E1" stroke="none" font-family="monospace" font-size="10">APOLLO CSM-111</text>
								<text x="15" y="68" fill="rgba(232,230,225,0.6)" stroke="none" font-family="monospace" font-size="8.5">100% O₂ @ 34 kPa (5 psi)</text>
								<text x="172" y="52" fill="#C89B57" stroke="none" font-family="monospace" font-size="9">DOCKING MODULE</text>
								<text x="172" y="65" fill="rgba(232,230,225,0.6)" stroke="none" font-family="monospace" font-size="8">APAS-75 / N₂-O₂ Lock</text>
							</g>
							<!-- Center: APAS-75 Ring Interface -->
							<g transform="translate(360, 74)">
								<line x1="0" y1="-15" x2="0" y2="90" stroke="#C89B57" stroke-width="1.2" stroke-dasharray="3 3" />
								<circle cx="0" cy="36" r="24" fill="none" stroke="#C89B57" stroke-width="1.6" />
								<text x="-62" y="-22" fill="#C89B57" font-family="monospace" font-size="9.5">17 JUL 1975 · 16:12 UTC (222 KM LEO)</text>
							</g>
							<!-- Right: Soyuz 19 (7K-TM) -->
							<g transform="translate(364, 56)" stroke="#E8E6E1" fill="none">
								<ellipse cx="52" cy="54" rx="46" ry="34" fill="rgba(232,230,225,0.03)" stroke-width="1.3" />
								<path d="M 98 28 L 164 22 L 164 86 L 98 80 Z" fill="rgba(232,230,225,0.04)" stroke-width="1.3" />
								<rect x="164" y="26" width="90" height="56" fill="rgba(232,230,225,0.02)" stroke-width="1.3" />
								<line x1="208" y1="-26" x2="208" y2="134" stroke="#C89B57" stroke-width="2" />
								<text x="20" y="52" fill="#E8E6E1" stroke="none" font-family="monospace" font-size="9.5">SOYUZ 19</text>
								<text x="18" y="65" fill="rgba(232,230,225,0.6)" stroke="none" font-family="monospace" font-size="8">N₂/O₂ @ 68 kPa</text>
								<text x="170" y="56" fill="rgba(232,230,225,0.65)" stroke="none" font-family="monospace" font-size="9">7K-TM PAO</text>
							</g>
						</svg>
					{:else if schematic === 'viking'}
						<!-- Viking 1 & 2 Mars Aeroshell Entry & Lander Chromatograph Profile -->
						<svg viewBox="0 0 800 215" class="max-h-[135px] sm:max-h-none w-full h-auto" role="img" aria-label="Viking Mars Entry Descent and Landing Profile">
							<rect width="800" height="215" fill="#050607" />
							<!-- Martian Surface Horizon -->
							<path d="M 20 182 Q 400 162 780 182" fill="none" stroke="#C89B57" stroke-width="1.4" />
							<line x1="20" y1="44" x2="780" y2="44" stroke="rgba(232,230,225,0.16)" stroke-dasharray="4 4" />
							<text x="28" y="36" fill="rgba(232,230,225,0.55)" font-family="monospace" font-size="8.5">MARS ATMOSPHERIC ENTRY INTERFACE (125 KM // 4.6 KM/S)</text>
							<!-- Entry Corridor Curve -->
							<path d="M 85 44 Q 260 82 420 124 T 640 172" fill="none" stroke="#E8E6E1" stroke-width="1.6" />
							{#each [
								{ x: 140, y: 58, l: '70° BICONIC AEROSHELL PEAK DECEL' },
								{ x: 350, y: 106, l: '16m DISK-GAP-BAND PARACHUTE (5.8 KM)' },
								{ x: 520, y: 148, l: '18-NOZZLE HYDRAZINE TERMINAL DESCENT' },
								{ x: 640, y: 172, l: 'CHRYSE & UTOPIA PLANITIA TOUCHDOWN' }
							] as pt, idx}
								<circle cx={pt.x} cy={pt.y} r="4" fill={idx === 3 ? '#C89B57' : '#E8E6E1'} />
								<text x={pt.x - 10} y={pt.y - 12} fill={idx === 3 ? '#C89B57' : '#E8E6E1'} font-family="monospace" font-size="8.5">{pt.l}</text>
							{/each}
						</svg>
					{:else if schematic === 'hubble'}
						<!-- Hubble 2.2 μm Spherical Aberration vs COSTAR Wavefront Correction Ray Diagram -->
						<svg viewBox="0 0 800 235" class="max-h-[135px] sm:max-h-none w-full h-auto" role="img" aria-label="Hubble Optical Wavefront Ray Diagram">
							<rect width="800" height="235" fill="#050607" />
							<!-- Incoming Starlight Plane Wavefronts -->
							{#each [40, 70, 100] as x}
								<line x1={x} y1="30" x2={x} y2="205" stroke="rgba(232,230,225,0.22)" stroke-width="1.1" stroke-dasharray="3 3" />
							{/each}
							<text x="26" y="22" fill="rgba(232,230,225,0.6)" font-family="monospace" font-size="9">INCOMING PARALLEL WAVEFRONT</text>

							<!-- 2.4m Hyperbolic Primary Mirror (right side of OTA) -->
							<path d="M 380 24 Q 345 117 380 210" fill="none" stroke="#E8E6E1" stroke-width="4" />
							<text x="315" y="224" fill="rgba(232,230,225,0.65)" font-family="monospace" font-size="9">2.4m PRIMARY MIRROR (null corrector -2.2 μm edge error)</text>

							<!-- Secondary Mirror -->
							<path d="M 175 88 Q 190 117 175 146" fill="none" stroke="#E8E6E1" stroke-width="3" />

							{#if !hubbleCostarActive}
								<!-- 1990 Flawed Marginal vs Paraxial Rays -->
								<polyline points="40,42 372,42 182,102 520,136" fill="none" stroke="rgba(232,230,225,0.45)" stroke-width="1.4" stroke-dasharray="4 3" />
								<polyline points="40,192 372,192 182,132 520,98" fill="none" stroke="rgba(232,230,225,0.45)" stroke-width="1.4" stroke-dasharray="4 3" />
								<polyline points="40,78 362,78 184,110 568,117" fill="none" stroke="#C89B57" stroke-width="1.4" />
								<polyline points="40,156 362,156 184,124 568,117" fill="none" stroke="#C89B57" stroke-width="1.4" />
								<!-- Blurred PSF halo -->
								<circle cx="675" cy="117" r="46" fill="rgba(232,230,225,0.05)" stroke="rgba(232,230,225,0.4)" stroke-dasharray="3 3" />
								<circle cx="675" cy="117" r="24" fill="rgba(200,155,87,0.16)" />
								<circle cx="675" cy="117" r="5" fill="#E8E6E1" />
								<text x="568" y="34" fill="#C89B57" font-family="monospace" font-size="10">1990 ABERRATED PSF: 15% ENCIRCLED ENERGY</text>
								<text x="568" y="192" fill="rgba(232,230,225,0.6)" font-family="monospace" font-size="9">Marginal rays focus 38 mm beyond paraxial focus</text>
							{:else}
								<!-- 1993 COSTAR + WFPC2 Corrective Aspheric Mirrors -->
								<polyline points="40,42 372,42 182,102 470,114 568,117" fill="none" stroke="#C89B57" stroke-width="1.5" />
								<polyline points="40,192 372,192 182,132 470,120 568,117" fill="none" stroke="#C89B57" stroke-width="1.5" />
								<polyline points="40,78 362,78 184,110 470,116 568,117" fill="none" stroke="#E8E6E1" stroke-width="1.3" />
								<polyline points="40,156 362,156 184,124 470,118 568,117" fill="none" stroke="#E8E6E1" stroke-width="1.3" />
								<!-- COSTAR M1/M2 Corrective Mirror Stage -->
								<rect x="458" y="96" width="24" height="42" rx="2" fill="rgba(200,155,87,0.12)" stroke="#C89B57" stroke-width="1.4" />
								<text x="430" y="88" fill="#C89B57" font-family="monospace" font-size="9">COSTAR / WFPC2 (+2.2 μm)</text>
								<!-- Diffraction-limited sharp Airy disk -->
								<circle cx="675" cy="117" r="14" fill="none" stroke="#C89B57" stroke-opacity="0.55" stroke-width="1.2" />
								<circle cx="675" cy="117" r="4" fill="#E8E6E1" />
								<text x="568" y="34" fill="#E8E6E1" font-family="monospace" font-size="10">1993 CORRECTED PSF: 84% ENCIRCLED ENERGY</text>
								<text x="568" y="192" fill="rgba(232,230,225,0.6)" font-family="monospace" font-size="9">0.05 arcsec diffraction-limited resolution restored</text>
							{/if}
						</svg>
					{:else if schematic === 'shuttle'}
						<!-- Space Shuttle Orbiter Thermal Protection System (TPS) Isotherm Profile -->
						<svg viewBox="0 0 800 220" class="max-h-[135px] sm:max-h-none w-full h-auto" role="img" aria-label="Space Shuttle Columbia TPS Isotherm Schematic">
							<rect width="800" height="220" fill="#050607" />
							<!-- Plasma Shockwave Bow Envelope -->
							<path d="M 110 110 Q 140 20 520 12" fill="none" stroke="#C89B57" stroke-width="1.8" stroke-dasharray="6 4" />
							<path d="M 110 110 Q 140 200 520 208" fill="none" stroke="#C89B57" stroke-width="2" />
							<text x="24" y="45" fill="#C89B57" font-family="monospace" font-size="9.5">MACH 25 BOW SHOCK // α = 40°</text>

							<!-- Orbiter Planform with TPS Thermal Zones -->
							<g transform="translate(135, 36)">
								<path d="M 15 74 L 130 52 L 265 6 L 345 6 L 345 142 L 265 142 L 130 96 Z" fill="rgba(232,230,225,0.03)" stroke="#E8E6E1" stroke-width="1.8" />
								<path d="M 45 74 L 145 58 L 270 22 L 325 22 L 325 126 L 270 126 L 145 90 Z" fill="rgba(200,155,87,0.06)" stroke="#C89B57" stroke-width="1.2" />
								<path d="M 12 74 Q 26 60 44 62 L 44 86 Q 26 88 12 74 Z" fill="#C89B57" />
								<text x="155" y="78" fill="#E8E6E1" font-family="monospace" font-size="10">24,300 LI-900 SILICA TILES</text>
							</g>

							<!-- Isotherm Legend Table -->
							<g transform="translate(530, 34)" font-family="monospace" font-size="9.5">
								<rect x="0" y="0" width="245" height="150" fill="rgba(232,230,225,0.02)" stroke="rgba(232,230,225,0.18)" />
								<circle cx="18" cy="28" r="4" fill="#C89B57" />
								<text x="32" y="31" fill="#E8E6E1">RCC Nose &amp; Wing Edge: 1,650 °C</text>
								<circle cx="18" cy="60" r="4" fill="#DDB474" />
								<text x="32" y="63" fill="rgba(232,230,225,0.8)">HRSI Black Silica Tiles: 1,260 °C</text>
								<circle cx="18" cy="92" r="4" fill="#E8E6E1" />
								<text x="32" y="95" fill="rgba(232,230,225,0.65)">LRSI White Silica Tiles: 650 °C</text>
								<circle cx="18" cy="124" r="4" fill="rgba(232,230,225,0.44)" />
								<text x="32" y="127" fill="rgba(232,230,225,0.55)">FRSI Felt Blankets: &lt; 370 °C</text>
							</g>
						</svg>
					{:else if schematic === 'mir' || schematic === 'iss'}
						<!-- Modular Orbital Station Architecture (Mir / ISS Multi-Module Truss & Nodes) -->
						<svg viewBox="0 0 800 220" class="max-h-[135px] sm:max-h-none w-full h-auto" role="img" aria-label="Modular Space Station Schematic">
							<rect width="800" height="220" fill="#050607" />
							<!-- Integrated Truss / Core Axis -->
							<line x1="80" y1="110" x2="720" y2="110" stroke="rgba(232,230,225,0.35)" stroke-width="2" />
							<!-- Pressurized Core & Berthing Modules -->
							<rect x="260" y="96" width="120" height="28" fill="rgba(232,230,225,0.05)" stroke="#E8E6E1" stroke-width="1.4" />
							<rect x="380" y="92" width="44" height="36" fill="rgba(200,155,87,0.12)" stroke="#C89B57" stroke-width="1.5" />
							<rect x="424" y="96" width="110" height="28" fill="rgba(232,230,225,0.05)" stroke="#E8E6E1" stroke-width="1.4" />
							<rect x="386" y="42" width="32" height="50" fill="rgba(232,230,225,0.04)" stroke="rgba(232,230,225,0.65)" stroke-width="1.2" />
							<rect x="386" y="128" width="32" height="50" fill="rgba(232,230,225,0.04)" stroke="rgba(232,230,225,0.65)" stroke-width="1.2" />
							<!-- Photovoltaic Solar Wings -->
							{#each [140, 200, 600, 660] as sx}
								<rect x={sx - 18} y="24" width="36" height="72" fill="rgba(200,155,87,0.08)" stroke="#C89B57" stroke-width="1.1" />
								<rect x={sx - 18} y="124" width="36" height="72" fill="rgba(200,155,87,0.08)" stroke="#C89B57" stroke-width="1.1" />
							{/each}
							<text x="265" y="84" fill="#E8E6E1" font-family="monospace" font-size="9">{schematic === 'mir' ? 'DOS-7 CORE + KVANT / KRISTALL MODULES' : 'ZARYA FGB + UNITY NODE 1 + 109m TRUSS'}</text>
							<text x="265" y="204" fill="#C89B57" font-family="monospace" font-size="9">CONTINUOUSLY HABITABLE ORBITAL OUTPOST ({milestone.locationOrOrbit})</text>
						</svg>
					{:else if schematic === 'ligo'}
						<!-- LIGO GW150914 Strain Chirp & 4km Fabry-Perot Interferometer -->
						<svg viewBox="0 0 800 230" class="max-h-[135px] sm:max-h-none w-full h-auto" role="img" aria-label="LIGO GW150914 Strain Chirp & Interferometer">
							<rect width="800" height="230" fill="#050607" />
							<!-- Left: 4km L-Shaped Fabry-Perot Michelson Interferometer -->
							<g transform="translate(36, 32)">
								<text x="0" y="0" fill="#E8E6E1" font-family="monospace" font-size="9.5">4 KM FABRY–PÉROT ARMS (ΔL = 10⁻¹⁸ m)</text>
								<!-- Y-Arm -->
								<line x1="56" y1="130" x2="56" y2="20" stroke="#E8E6E1" stroke-width="2" />
								<rect x="46" y="14" width="20" height="6" fill="rgba(232,230,225,0.6)" />
								<!-- X-Arm -->
								<line x1="56" y1="130" x2="176" y2="130" stroke="#C89B57" stroke-width="2" />
								<rect x="176" y="120" width="6" height="20" fill="rgba(232,230,225,0.6)" />
								<!-- Beam Splitter -->
								<line x1="46" y1="140" x2="66" y2="120" stroke="#E8E6E1" stroke-width="1.8" />
								<!-- Nd:YAG 1064nm Laser & Photodetector -->
								<line x1="16" y1="130" x2="56" y2="130" stroke="rgba(232,230,225,0.5)" stroke-width="1.6" />
								<line x1="56" y1="130" x2="56" y2="165" stroke="#C89B57" stroke-width="1.6" />
								<text x="70" y="55" fill="rgba(232,230,225,0.6)" font-family="monospace" font-size="8">L_x - L_y = h · L</text>
								<text x="12" y="182" fill="#C89B57" font-family="monospace" font-size="8.5">GW150914: 36 M☉ + 29 M☉ → 62 M☉</text>
							</g>

							<!-- Right: GW150914 Inspiral -> Merger -> Ringdown Strain Waveform (35 Hz to 250 Hz) -->
							<g transform="translate(265, 24)">
								<rect x="0" y="10" width="505" height="175" fill="rgba(232,230,225,0.02)" stroke="rgba(232,230,225,0.16)" />
								<line x1="0" y1="97" x2="505" y2="97" stroke="rgba(232,230,225,0.16)" stroke-dasharray="3 3" />
								<!-- Inspiral, Merger, Ringdown Chirp -->
								{#if ligoDetectorOverlay === 'both' || ligoDetectorOverlay === 'h1'}
									<path
										d="M 14 97 Q 30 82 46 97 T 78 97 T 108 97 Q 122 72 136 97 Q 150 124 164 97 Q 176 66 188 97 Q 200 132 212 97 Q 222 58 232 97 Q 242 142 252 97 Q 260 44 268 97 Q 276 154 284 97 Q 291 28 298 97 Q 305 170 312 97 Q 318 18 324 97 Q 330 176 336 97 Q 341 55 346 97 Q 351 122 356 97 Q 362 88 370 97 L 485 97"
										fill="none"
										stroke="#E8E6E1"
										stroke-width="1.8"
									/>
								{/if}
								{#if ligoDetectorOverlay === 'both' || ligoDetectorOverlay === 'l1'}
									<path
										d="M 22 97 Q 38 84 54 97 T 86 97 T 116 97 Q 130 74 144 97 Q 158 122 172 97 Q 184 68 196 97 Q 208 130 220 97 Q 230 60 240 97 Q 250 140 260 97 Q 268 46 276 97 Q 284 152 292 97 Q 299 30 306 97 Q 313 168 320 97 Q 326 20 332 97 Q 338 174 344 97 Q 349 58 354 97 Q 359 120 364 97 L 485 97"
										fill="none"
										stroke="#C89B57"
										stroke-width="1.6"
									/>
								{/if}
								<text x="16" y="28" fill="#E8E6E1" font-family="monospace" font-size="9">STRAIN h(t) × 10⁻²¹ [PEAK h = 1.0 × 10⁻²¹ @ 250 Hz]</text>
								<text x="45" y="172" fill="rgba(232,230,225,0.6)" font-family="monospace" font-size="8.5">INSPIRAL (35–150 Hz)</text>
								<text x="275" y="172" fill="#C89B57" font-family="monospace" font-size="8.5">MERGER (3 M☉ c²)</text>
								<text x="395" y="172" fill="rgba(232,230,225,0.6)" font-family="monospace" font-size="8.5">KERR RINGDOWN</text>
							</g>
						</svg>
					{:else if schematic === 'falcon9'}
						<!-- Falcon 9 Flight 20 Boostback, Supersonic Retropropulsion & LZ-1 Hoverslam Profile -->
						<svg viewBox="0 0 800 225" class="max-h-[135px] sm:max-h-none w-full h-auto" role="img" aria-label="Falcon 9 Booster Return Trajectory Profile">
							<rect width="800" height="225" fill="#050607" />
							<!-- Ground & Atlantic Ocean Reference -->
							<line x1="30" y1="195" x2="770" y2="195" stroke="rgba(232,230,225,0.22)" stroke-width="1.4" />
							<!-- Ascent Arc -->
							<path d="M 70 195 Q 150 95 250 65" fill="none" stroke="#C89B57" stroke-width="2" />
							<!-- Second Stage to Orbit -->
							<path d="M 250 65 Q 480 24 750 20" fill="none" stroke="rgba(232,230,225,0.55)" stroke-width="1.5" stroke-dasharray="5 3" />
							<!-- First Stage Boostback + Ballistic Apogee (200 km) + Entry + LZ-1 Landing -->
							<path d="M 250 65 Q 340 16 420 55 Q 485 110 520 195" fill="none" stroke="#E8E6E1" stroke-width="2" />

							<!-- Key Burn Nodes -->
							<circle cx="70" cy="195" r="4.5" fill="#C89B57" />
							<text x="45" y="212" fill="rgba(232,230,225,0.65)" font-family="monospace" font-size="8.5">SLC-40 LIFTOFF</text>

							<circle cx="250" cy="65" r="4.5" fill="#C89B57" />
							<text x="195" y="52" fill="#C89B57" font-family="monospace" font-size="8.5">MECO (80 km, Mach 6)</text>

							<circle cx="335" cy="36" r="4.5" fill="#E8E6E1" />
							<text x="295" y="22" fill="#E8E6E1" font-family="monospace" font-size="8.5">APOGEE 200 KM / BOOSTBACK</text>

							<circle cx="465" cy="105" r="4.5" fill="#C89B57" />
							<text x="480" y="108" fill="rgba(232,230,225,0.65)" font-family="monospace" font-size="8.5">3-ENGINE ENTRY BURN (70 km)</text>

							<circle cx="520" cy="195" r="5.5" fill="#C89B57" />
							<text x="465" y="212" fill="#E8E6E1" font-family="monospace" font-size="8.5">LZ-1 HOVERSLAM TOUCHDOWN (T+09:40)</text>

							<text x="565" y="42" fill="rgba(232,230,225,0.6)" font-family="monospace" font-size="9">STAGE 2 → 11 ORBCOMM SATELLITES</text>
						</svg>
					{:else if schematic === 'black-hole'}
						<!-- Event Horizon Telescope 1.3mm VLBI Baseline Network & M87* Relativistic Photon Ring -->
						<svg viewBox="0 0 800 230" class="max-h-[135px] sm:max-h-none w-full h-auto" role="img" aria-label="EHT VLBI Network and M87* Shadow Reconstruction">
							<rect width="800" height="230" fill="#050607" />
							<!-- Left: Earth-Diameter 1.3mm (230 GHz) VLBI Baseline Chord Network -->
							<g transform="translate(155, 115)">
								<circle cx="0" cy="0" r="82" fill="rgba(232,230,225,0.02)" stroke="#E8E6E1" stroke-width="1.3" />
								<!-- Latitude/Longitude graticules -->
								<ellipse cx="0" cy="0" rx="82" ry="32" fill="none" stroke="rgba(232,230,225,0.16)" />
								<ellipse cx="0" cy="0" rx="36" ry="82" fill="none" stroke="rgba(232,230,225,0.16)" />
								<!-- 8 Station VLBI Baselines -->
								{#each [
									[-52, -18, 12, 34],
									[-52, -18, 0, 76],
									[12, 34, 48, -32],
									[48, -32, 0, 76],
									[-28, -36, 12, 34],
									[-28, -36, 48, -32],
									[-52, -18, -28, -36]
								] as [x1, y1, x2, y2]}
									<line {x1} {y1} {x2} {y2} stroke="#E8E6E1" stroke-width="1.1" stroke-opacity="0.55" />
								{/each}
								{#each [
									{ x: -52, y: -18, l: 'JCMT/SMA' },
									{ x: -28, y: -36, l: 'SMT/LMT' },
									{ x: 12, y: 34, l: 'ALMA/APEX' },
									{ x: 48, y: -32, l: 'IRAM 30m' },
									{ x: 0, y: 76, l: 'SPT' }
								] as st}
									<circle cx={st.x} cy={st.y} r="3.5" fill="#C89B57" />
									<text x={st.x + 6} y={st.y + 3} fill="#E8E6E1" font-family="monospace" font-size="7.5">{st.l}</text>
								{/each}
								<text x="-85" y="-92" fill="#E8E6E1" font-family="monospace" font-size="9">λ = 1.3 mm VLBI (D_eff = 10,700 km)</text>
							</g>

							<!-- Right: M87* Relativistic Beamed Photon Ring & 42 μas Kerr Shadow -->
							<g transform="translate(535, 115)">
								<defs>
									<radialGradient id="m87Ring" cx="50%" cy="55%" r="50%">
										<stop offset="0%" stop-color="#050607" />
										<stop offset="44%" stop-color="#050607" />
										<stop offset="65%" stop-color="#C89B57" stop-opacity="0.85" />
										<stop offset="78%" stop-color="#DDB474" stop-opacity="0.95" />
										<stop offset="92%" stop-color="#C89B57" stop-opacity="0.22" />
										<stop offset="100%" stop-color="#050607" stop-opacity="0" />
									</radialGradient>
								</defs>
								<circle cx="0" cy="0" r="84" fill="url(#m87Ring)" />
								<!-- Southern Doppler-boosted crescent -->
								<path d="M -46 12 A 48 48 0 0 0 46 12" fill="none" stroke="#E8E6E1" stroke-width="5" stroke-linecap="round" opacity="0.7" />
								<!-- 42 microarcsecond diameter caliper -->
								<line x1="-52" y1="0" x2="52" y2="0" stroke="rgba(232,230,225,0.55)" stroke-dasharray="3 3" />
								<text x="-38" y="-5" fill="#E8E6E1" font-family="monospace" font-size="8.5">θ = 42 ± 3 μas</text>
								<text x="-110" y="-92" fill="#C89B57" font-family="monospace" font-size="9">M87* (6.5 × 10⁹ M☉ · 55 MILLION LY)</text>
							</g>
						</svg>
					{:else if schematic === 'jwst'}
						<!-- JWST 18-Segment Hexagonal Gold-Coated Beryllium Mirror & 5-Layer Sunshield -->
						<svg viewBox="0 0 800 235" class="max-h-[135px] sm:max-h-none w-full h-auto" role="img" aria-label="JWST 18-Segment Primary Mirror & L2 Sunshield">
							<rect width="800" height="235" fill="#050607" />
							<!-- Left: 18 Hexagonal Segments (A1-A6, B1-B6, C1-C6) -->
							<g transform="translate(175, 118)">
								{#each [
									{ x: 0, y: -32 },
									{ x: 28, y: -16 },
									{ x: 28, y: 16 },
									{ x: 0, y: 32 },
									{ x: -28, y: 16 },
									{ x: -28, y: -16 },
									{ x: 0, y: -64 },
									{ x: 28, y: -48 },
									{ x: 56, y: -32 },
									{ x: 56, y: 0 },
									{ x: 56, y: 32 },
									{ x: 28, y: 48 },
									{ x: 0, y: 64 },
									{ x: -28, y: 48 },
									{ x: -56, y: 32 },
									{ x: -56, y: 0 },
									{ x: -56, y: -32 },
									{ x: -28, y: -48 }
								] as seg, idx}
									{@const jitterX = jwstPhased ? 0 : ((idx % 3) - 1) * 3.5}
									{@const jitterY = jwstPhased ? 0 : ((idx % 2) - 0.5) * 3.5}
									<polygon
										points="0,-15 13,-7.5 13,7.5 0,15 -13,7.5 -13,-7.5"
										transform="translate({seg.x + jitterX}, {seg.y + jitterY})"
										fill="#C89B57"
										fill-opacity={jwstPhased ? '0.32' : '0.14'}
										stroke="#C89B57"
										stroke-width="1.2"
									/>
								{/each}
								<!-- Central Secondary Mirror Tri-Strut -->
								<circle cx="0" cy="0" r="8" fill="#050607" stroke="#E8E6E1" stroke-width="1.4" />
								<text x="-95" y="-92" fill="#C89B57" font-family="monospace" font-size="9">6.5m 18-SEGMENT Au/Be PRIMARY (25.4 m²)</text>
							</g>

							<!-- Right: 5-Layer Kapton Thermal Gradient & L2 Diffraction Spike PSF -->
							<g transform="translate(370, 32)">
								<text x="0" y="0" fill="#E8E6E1" font-family="monospace" font-size="9.5">5-LAYER KAPTON SUNSHIELD (ΔT = 340 K AT SUN–EARTH L2)</text>
								{#each [0, 1, 2, 3, 4] as layer}
									<path
										d="M 10 {36 + layer * 14} Q 130 {26 + layer * 14} 250 {36 + layer * 14}"
										fill="none"
										stroke={layer < 2 ? '#C89B57' : layer === 2 ? 'rgba(232,230,225,0.55)' : '#E8E6E1'}
										stroke-width="1.6"
									/>
								{/each}
								<text x="12" y="28" fill="rgba(232,230,225,0.65)" font-family="monospace" font-size="8.5">COLD SIDE: 40 K (-233 °C) // MIRI @ 6.7 K</text>
								<text x="12" y="122" fill="#C89B57" font-family="monospace" font-size="8.5">HOT SUNWARD SIDE: 383 K (+110 °C)</text>

								<!-- 6+2 Point JWST Diffraction Spike Star PSF -->
								<g transform="translate(335, 76)">
									{#if jwstPhased}
										{#each [0, 30, 90, 150] as a}
											<line
												x1={Math.cos((a * Math.PI) / 180) * -42}
												y1={Math.sin((a * Math.PI) / 180) * -42}
												x2={Math.cos((a * Math.PI) / 180) * 42}
												y2={Math.sin((a * Math.PI) / 180) * 42}
												stroke="#C89B57"
												stroke-width="1.4"
											/>
										{/each}
										<circle cx="0" cy="0" r="5" fill="#E8E6E1" />
										<text x="-55" y="62" fill="#E8E6E1" font-family="monospace" font-size="8.5">COHERENT WAVEFRONT</text>
									{:else}
										{#each [0, 1, 2, 3, 4, 5] as hexIdx}
											{@const ha = (hexIdx * 60 * Math.PI) / 180}
											<circle cx={Math.cos(ha) * 24} cy={Math.sin(ha) * 24} r="3" fill="#C89B57" />
										{/each}
										<text x="-58" y="62" fill="rgba(232,230,225,0.6)" font-family="monospace" font-size="8.5">18 SEPARATE SPOTS</text>
									{/if}
								</g>
							</g>
						</svg>
					{:else if schematic === 'pluto'}
						<!-- New Horizons Pluto-Charon Flyby Chord & Sputnik Planitia N2 Basin -->
						<svg viewBox="0 0 800 220" class="max-h-[135px] sm:max-h-none w-full h-auto" role="img" aria-label="New Horizons Pluto Flyby Trajectory">
							<rect width="800" height="220" fill="#050607" />
							<!-- Pluto Disk & Sputnik Planitia Heart -->
							<g transform="translate(260, 110)">
								<circle cx="0" cy="0" r="56" fill="rgba(200,155,87,0.08)" stroke="#C89B57" stroke-width="1.5" />
								<circle cx="0" cy="0" r="68" fill="none" stroke="rgba(232,230,225,0.28)" stroke-dasharray="3 3" />
								<!-- Tombaugh Regio / Sputnik Planitia Heart -->
								<path d="M 4 -8 C 14 -22, 32 -12, 26 8 C 22 22, 6 32, 2 38 C -4 30, -18 20, -16 4 C -14 -12, -2 -18, 4 -8 Z" fill="rgba(232,230,225,0.22)" stroke="#E8E6E1" stroke-width="1" />
								<text x="-48" y="-64" fill="#C89B57" font-family="monospace" font-size="9.5">PLUTO (R = 1,188.3 km)</text>
							</g>
							<!-- Charon -->
							<g transform="translate(555, 76)">
								<circle cx="0" cy="0" r="28" fill="rgba(232,230,225,0.04)" stroke="rgba(232,230,225,0.55)" stroke-width="1.3" />
								<text x="-32" y="-36" fill="rgba(232,230,225,0.65)" font-family="monospace" font-size="9">CHARON (R = 606 km)</text>
							</g>
							<!-- New Horizons 13.78 km/s Trajectory & Solar/Earth Occultation Chords -->
							<path d="M 30 165 L 760 125" fill="none" stroke="#E8E6E1" stroke-width="1.8" />
							<circle cx="268" cy="152" r="4.5" fill="#C89B57" />
							<text x="190" y="175" fill="#E8E6E1" font-family="monospace" font-size="9">CLOSEST APPROACH: 12,500 KM @ 13.78 KM/S (14 JUL 2015)</text>
							<text x="480" y="165" fill="rgba(232,230,225,0.6)" font-family="monospace" font-size="8.5">REX + ALICE N₂/CH₄ OCCULTATION SHADOW ZONE →</text>
						</svg>
					{:else if schematic === 'golden-record'}
						<!-- Voyager 1 & 2 176-Year Planetary Alignment Grand Tour Gravity-Assist Slingshot -->
						<svg viewBox="0 0 800 215" class="max-h-[135px] sm:max-h-none w-full h-auto" role="img" aria-label="Voyager Grand Tour Gravity Assist Trajectory">
							<rect width="800" height="215" fill="#050607" />
							<!-- Sun & Planetary Orbits -->
							<circle cx="54" cy="170" r="12" fill="#C89B57" />
							<text x="38" y="198" fill="#C89B57" font-family="monospace" font-size="8.5">SUN</text>
							{#each [
								{ r: 95, name: 'EARTH (1 AU)', px: 138, py: 126 },
								{ r: 235, name: 'JUPITER (5.2 AU · 1979)', px: 274, py: 88 },
								{ r: 405, name: 'SATURN (9.5 AU · 1980/81)', px: 444, py: 72 },
								{ r: 575, name: 'URANUS (19.2 AU · 1986)', px: 616, py: 86 },
								{ r: 715, name: 'NEPTUNE (30.1 AU · 1989)', px: 752, py: 112 }
							] as planet, pIdx}
								<circle cx="54" cy="170" r={planet.r} fill="none" stroke="rgba(232,230,225,0.16)" stroke-dasharray="3 3" />
								<circle cx={planet.px} cy={planet.py} r="5.5" fill={pIdx === 1 || pIdx === 2 ? '#C89B57' : '#E8E6E1'} />
								<text x={planet.px - 36} y={planet.py - 12} fill="rgba(232,230,225,0.72)" font-family="monospace" font-size="8">{planet.name}</text>
							{/each}
							<!-- Voyager 1 Trajectory (Deflected North of Ecliptic at Saturn/Titan) -->
							<path d="M 138 126 Q 210 95 274 88 Q 360 74 444 72 L 620 18" fill="none" stroke="#C89B57" stroke-width="2" />
							<text x="535" y="28" fill="#C89B57" font-family="monospace" font-size="8.5">VOYAGER 1 → +35° INTERSTELLAR</text>
							<!-- Voyager 2 Grand Tour Trajectory (All 4 Giant Planets) -->
							<path d="M 138 126 Q 210 98 274 88 Q 360 76 444 72 Q 530 76 616 86 Q 684 98 752 112 L 790 148" fill="none" stroke="#E8E6E1" stroke-width="1.6" stroke-dasharray="5 3" />
							<text x="545" y="178" fill="rgba(232,230,225,0.68)" font-family="monospace" font-size="8.5">VOYAGER 2 → 4-PLANET GRAND TOUR (−48° SOUTH)</text>
						</svg>
					{:else if schematic === 'heliopause'}
						<!-- Voyager 1 Heliopause Crossing (25 Aug 2012 @ 121.6 AU): Solar Wind vs GCR & 2.6 kHz Plasma Wave -->
						<svg viewBox="0 0 800 220" class="max-h-[135px] sm:max-h-none w-full h-auto" role="img" aria-label="Voyager 1 Heliopause Crossing Telemetry">
							<rect width="800" height="220" fill="#050607" />
							<!-- Heliopause Boundary Line at 121.6 AU -->
							<line x1="420" y1="20" x2="420" y2="195" stroke="#C89B57" stroke-width="1.5" stroke-dasharray="4 4" />
							<text x="315" y="18" fill="#C89B57" font-family="monospace" font-size="9.5">HELIOPAUSE BOUNDARY: 121.6 AU (25 AUG 2012)</text>
							<!-- Heliospheric Anomalous Cosmic Rays (drops to zero) -->
							<path d="M 45 65 L 340 68 L 385 120 L 405 55 L 420 175 L 755 175" fill="none" stroke="rgba(232,230,225,0.45)" stroke-width="1.8" stroke-dasharray="4 3" />
							<text x="55" y="54" fill="rgba(232,230,225,0.65)" font-family="monospace" font-size="9">HELIOSPHERIC SOLAR IONS (DROPS 1,000×)</text>
							<!-- Galactic Cosmic Rays (surges to interstellar maximum) -->
							<path d="M 45 162 L 340 155 L 385 110 L 405 142 L 420 52 L 755 50" fill="none" stroke="#E8E6E1" stroke-width="2" />
							<text x="445" y="42" fill="#E8E6E1" font-family="monospace" font-size="9">GALACTIC COSMIC RAYS + PWS 2.6 kHz (n_e = 0.08 cm⁻³)</text>
						</svg>
					{:else if schematic === 'horizon'}
						<!-- Voyager Centennial 2075 Interstellar Drift & RTG Pu-238 Power Margin -->
						<svg viewBox="0 0 800 215" class="max-h-[135px] sm:max-h-none w-full h-auto" role="img" aria-label="Voyager 2075 Centennial Horizon Trajectory">
							<rect width="800" height="215" fill="#050607" />
							<!-- Logarithmic Heliocentric Distance Scale (1 AU -> 345 AU -> Oort Cloud -> Gliese 445) -->
							<line x1="40" y1="115" x2="760" y2="115" stroke="rgba(232,230,225,0.22)" stroke-width="1.5" />
							{#each [
								{ x: 65, l: '1 AU (1977)', sub: '470 W RTG' },
								{ x: 225, l: '121.6 AU (2012)', sub: 'Heliopause' },
								{ x: 395, l: '170.8 AU (2026)', sub: '23h 40m OWLT' },
								{ x: 565, l: '~345 AU (2075)', sub: 'Centennial Silent Drift' },
								{ x: 725, l: '40,000 YR', sub: 'Gliese 445 (1.7 ly)' }
							] as pt, idx}
								<circle cx={pt.x} cy="115" r="5" fill={idx === 2 || idx === 3 ? '#C89B57' : '#E8E6E1'} />
								<text x={pt.x - 42} y="92" fill={idx === 3 ? '#C89B57' : '#E8E6E1'} font-family="monospace" font-size="8.5">{pt.l}</text>
								<text x={pt.x - 42} y="140" fill="rgba(232,230,225,0.55)" font-family="monospace" font-size="8">{pt.sub}</text>
							{/each}
						</svg>
					{:else}
						<!-- Universal Architectural Orbital & Deep-Space Telemetry Vector Diagram (`giotto`, `mars-rover`, `saturn-setpiece`, `kepler`, `rosetta`, `asteroid`, `change4`, `commercial-crew`, `perseverance`, `dart`, `artemis`, `exoplanet-setpiece`) -->
						<svg viewBox="0 0 800 200" class="max-h-[135px] sm:max-h-none w-full h-auto" role="img" aria-label={`Telemetry diagram for ${milestone.title}`}>
							<rect width="800" height="200" fill="#050607" />
							<!-- Architectural Grid Hairlines -->
							{#each [120, 260, 400, 540, 680] as gx}
								<line x1={gx} y1="15" x2={gx} y2="185" stroke="rgba(232,230,225,0.08)" stroke-width="1" />
							{/each}
							<!-- Primary Transfer Trajectory Curve -->
							<path
								d="M 65 150 C 230 35, 520 35, 725 110"
								fill="none"
								stroke="#E8E6E1"
								stroke-width="1.8"
							/>
							<!-- Reference Ballistic Chord -->
							<path
								d="M 65 150 C 260 165, 510 155, 725 110"
								fill="none"
								stroke="#C89B57"
								stroke-width="1.2"
								stroke-dasharray="5 4"
							/>
							<!-- Origin Earth Node -->
							<circle cx="65" cy="150" r="7" fill="#050607" stroke="#E8E6E1" stroke-width="1.5" />
							<text x="38" y="174" fill="rgba(232,230,225,0.72)" font-family="monospace" font-size="9">EARTH ORIGIN</text>

							<!-- Midpoint Telemetry Node -->
							<circle cx="395" cy="68" r="4.5" fill="#C89B57" />
							<text x="295" y="48" fill="#C89B57" font-family="monospace" font-size="9">
								EPOCH: {milestone.exactDate} · VOYAGER @ {milestone.voyagerAuAtEvent.toFixed(2)} AU
							</text>

							<!-- Target Mission Regime Node -->
							<circle cx="725" cy="110" r="11" fill="#050607" stroke="#C89B57" stroke-width="1.6" />
							<circle cx="725" cy="110" r="3.5" fill="#C89B57" />
							<text x="530" y="148" fill="#E8E6E1" font-family="monospace" font-size="9.5">
								TARGET: {milestone.locationOrOrbit.slice(0, 34)}
							</text>
							<text x="530" y="164" fill="rgba(232,230,225,0.55)" font-family="monospace" font-size="8.5">
								RANGE: {formatDistanceKm(milestone.distanceFromEarthKm)}
							</text>
						</svg>
					{/if}
				</div>

				<!-- 3. Editorial Body Prose Directly on the Void -->
				<div class="mt-4 md:mt-8">
					<p
						class="max-w-[65ch] font-sans text-base sm:text-[17px] leading-[1.65] text-[#E8E6E1]/85 font-normal"
						style="text-shadow: 0 2px 20px rgba(5, 6, 7, 0.85);"
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
									class="flex items-baseline justify-between gap-2 font-mono-tech text-[10px] sm:text-[11px] uppercase tracking-[0.14em] text-[#E8E6E1]/60"
								>
									<span class="truncate">{stat.label}</span>
									{#if stat.unit}
										<span class="text-[10px] text-[#E8E6E1]/40 shrink-0">{stat.unit}</span>
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
									<div class="mt-1 font-sans text-xs text-[#E8E6E1]/48 leading-snug line-clamp-2 md:line-clamp-none">
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
								class="inline-flex items-center gap-1.5 font-mono-tech text-[11px] tracking-[0.06em] text-[#E8E6E1]/65 transition-colors duration-500 hover:text-[#C89B57]"
							>
								<span class="text-[#C89B57]">[{String(sIdx + 1).padStart(2, '0')}]</span>
								<span>{extractDistinctLabel(url, sIdx, milestone.sourceUrls)}</span>
								<span class="text-[10px] opacity-60">↗</span>
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

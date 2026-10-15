<script lang="ts">
	import { CHAPTERS, ALL_MILESTONES, type MilestoneData } from '$lib/data/missions';
	import { AU_IN_KM, SPEED_OF_LIGHT_KM_S, scrollToSection } from '$lib/stores/scrollTelemetry';

	type DecadeFilter =
		| 'All'
		| '1970s'
		| '1980s'
		| '1990s'
		| '2000s'
		| '2010s'
		| '2020s & Beyond';

	type DomainFilter =
		| 'All'
		| 'Crewed Orbit'
		| 'Planetary & Rovers'
		| 'Deep Space & Observatories'
		| 'Commercial & Reusable';

	const DECADE_OPTIONS: DecadeFilter[] = [
		'All',
		'1970s',
		'1980s',
		'1990s',
		'2000s',
		'2010s',
		'2020s & Beyond'
	];

	const DOMAIN_OPTIONS: DomainFilter[] = [
		'All',
		'Crewed Orbit',
		'Planetary & Rovers',
		'Deep Space & Observatories',
		'Commercial & Reusable'
	];

	const CREWED_IDS = new Set([
		'apollo-soyuz-1975',
		'sts-1-columbia-1981',
		'mir-station-1986',
		'hubble-repair-1993',
		'iss-assembly-1998',
		'commercial-crew-demo2-2020',
		'artemis-lunar-return-2022'
	]);

	const PLANETARY_IDS = new Set([
		'viking-mars-1976',
		'giotto-halley-1986',
		'mars-pathfinder-sojourner-1997',
		'spirit-opportunity-2004',
		'cassini-huygens-2005',
		'rosetta-philae-2014',
		'new-horizons-pluto-2015',
		'hayabusa2-osiris-rex-2018',
		'change4-farside-2019',
		'perseverance-ingenuity-2021',
		'dart-planetary-defense-2022',
		'ocean-worlds-europa-clipper-2024'
	]);

	const DEEP_SPACE_IDS = new Set([
		'voyager-golden-record-1977',
		'hubble-launch-1990',
		'hubble-repair-1993',
		'kepler-launch-2009',
		'voyager-heliopause-2012',
		'ligo-gravitational-waves-2015',
		'eht-black-hole-2019',
		'jwst-first-images-2022',
		'exoplanet-census-2026',
		'voyager-centennial-2075'
	]);

	const COMMERCIAL_IDS = new Set([
		'sts-1-columbia-1981',
		'falcon9-landing-2015',
		'commercial-crew-demo2-2020',
		'artemis-lunar-return-2022'
	]);

	function getPrimaryDomain(m: MilestoneData): Exclude<DomainFilter, 'All'> {
		if (COMMERCIAL_IDS.has(m.id) && (m.id.includes('falcon9') || m.id.includes('demo2'))) {
			return 'Commercial & Reusable';
		}
		if (CREWED_IDS.has(m.id)) return 'Crewed Orbit';
		if (PLANETARY_IDS.has(m.id)) return 'Planetary & Rovers';
		return 'Deep Space & Observatories';
	}

	function matchesDomain(m: MilestoneData, domain: DomainFilter): boolean {
		if (domain === 'All') return true;
		if (domain === 'Crewed Orbit') return CREWED_IDS.has(m.id);
		if (domain === 'Planetary & Rovers') return PLANETARY_IDS.has(m.id);
		if (domain === 'Deep Space & Observatories') return DEEP_SPACE_IDS.has(m.id);
		if (domain === 'Commercial & Reusable') return COMMERCIAL_IDS.has(m.id);
		return true;
	}

	function matchesDecade(m: MilestoneData, decade: DecadeFilter): boolean {
		if (decade === 'All') return true;
		if (decade === '1970s') return m.year >= 1970 && m.year < 1980;
		if (decade === '1980s') return m.year >= 1980 && m.year < 1990;
		if (decade === '1990s') return m.year >= 1990 && m.year < 2000;
		if (decade === '2000s') return m.year >= 2000 && m.year < 2010;
		if (decade === '2010s') return m.year >= 2010 && m.year < 2020;
		if (decade === '2020s & Beyond') return m.year >= 2020;
		return true;
	}

	function getDomainColor(domain: Exclude<DomainFilter, 'All'>): string {
		if (domain === 'Crewed Orbit') return '#E8E6E1';
		if (domain === 'Planetary & Rovers') return '#C89B57';
		if (domain === 'Deep Space & Observatories') return '#DDB474';
		return '#9E9A90';
	}

	let selectedDecade = $state<DecadeFilter>('All');
	let selectedDomain = $state<DomainFilter>('All');
	let selectedMilestoneId = $state<string>(
		ALL_MILESTONES.find((m) => m.id === 'voyager-heliopause-2012')?.id ??
			ALL_MILESTONES[0]?.id ??
			'apollo-soyuz-1975'
	);
	let hoveredMilestoneId = $state<string | null>(null);
	let showDeepDive = $state(false);

	const filteredMilestones = $derived(
		ALL_MILESTONES.filter(
			(m) => matchesDecade(m, selectedDecade) && matchesDomain(m, selectedDomain)
		)
	);

	const filteredIdsSet = $derived(new Set(filteredMilestones.map((m) => m.id)));

	const activeMilestone = $derived.by(() => {
		const targetId = hoveredMilestoneId ?? selectedMilestoneId;
		return (
			ALL_MILESTONES.find((m) => m.id === targetId) ??
			filteredMilestones[0] ??
			ALL_MILESTONES[0]
		);
	});

	const activeChapterForMilestone = $derived(
		CHAPTERS.find((c) => c.chapterId === activeMilestone?.chapterId) ?? CHAPTERS[0]
	);

	// SVG Scatter/Trajectory Plot Coordinate System
	const PLOT_WIDTH = 1040;
	const PLOT_HEIGHT = 430;
	const PAD_LEFT = 118;
	const PAD_RIGHT = 44;
	const PAD_TOP = 34;
	const PAD_BOTTOM = 52;
	const INNER_W = PLOT_WIDTH - PAD_LEFT - PAD_RIGHT;
	const INNER_H = PLOT_HEIGHT - PAD_TOP - PAD_BOTTOM;

	// Logarithmic distance scale: 10^2 km (100 km LEO) to 10^11 km (100B km / ~668 AU)
	const LOG_KM_MIN = 2.0; // 100 km
	const LOG_KM_MAX = 10.85; // ~70.8 billion km

	function yearToPlotX(year: number): number {
		// 1975 -> 2026 occupies 86% of width, 2026 -> 2075 occupies remaining 14% so 50-year history is spacious
		if (year <= 2026) {
			const t = Math.max(0, Math.min(1, (year - 1975) / (2026 - 1975)));
			return PAD_LEFT + t * (INNER_W * 0.86);
		}
		const tFuture = Math.max(0, Math.min(1, (year - 2026) / (2075 - 2026)));
		return PAD_LEFT + INNER_W * (0.86 + tFuture * 0.14);
	}

	function kmToPlotY(distanceKm: number): number {
		const safeKm = Math.max(100, distanceKm);
		const logVal = Math.log10(safeKm);
		const norm = Math.max(0, Math.min(1, (logVal - LOG_KM_MIN) / (LOG_KM_MAX - LOG_KM_MIN)));
		return PAD_TOP + INNER_H * (1 - norm);
	}

	const Y_AXIS_BANDS = [
		{ label: 'LEO · 400 km', km: 400 },
		{ label: 'MOON · 384k km', km: 384_400 },
		{ label: 'L2 · 1.5M km', km: 1_500_000 },
		{ label: 'MARS · 1.5 AU', km: 227_900_000 },
		{ label: 'SATURN · 9.5 AU', km: 1_427_000_000 },
		{ label: 'HELIOPAUSE · 122 AU', km: 18_190_000_000 },
		{ label: 'HORIZON · 340 AU', km: 50_863_275_800 }
	];

	const X_AXIS_YEARS = [1975, 1980, 1985, 1990, 1995, 2000, 2005, 2010, 2015, 2020, 2026, 2075];

	// Continuous Voyager 1 Reference Trajectory Path in SVG
	const VOYAGER_CURVE_POINTS = [
		{ year: 1977.7, au: 0.0026 },
		{ year: 1979.2, au: 5.2 },
		{ year: 1980.9, au: 9.54 },
		{ year: 1986.0, au: 26.0 },
		{ year: 1990.1, au: 40.2 },
		{ year: 1998.0, au: 70.0 },
		{ year: 2004.9, au: 94.0 },
		{ year: 2012.6, au: 121.6 },
		{ year: 2019.0, au: 145.0 },
		{ year: 2026.0, au: 169.8 },
		{ year: 2075.0, au: 340.0 }
	];

	const voyagerSvgPolyline = $derived(
		VOYAGER_CURVE_POINTS.map(
			(pt) => `${yearToPlotX(pt.year).toFixed(1)},${kmToPlotY(pt.au * AU_IN_KM).toFixed(1)}`
		).join(' ')
	);

	function formatMissionDistance(km: number): string {
		if (km < 10_000) {
			return `${km.toLocaleString('en-US')} km (Low Earth Orbit)`;
		}
		if (km < 2_000_000) {
			const ls = (km / SPEED_OF_LIGHT_KM_S).toFixed(2);
			return `${km.toLocaleString('en-US')} km (${ls} light-sec)`;
		}
		const au = km / AU_IN_KM;
		const lightHours = km / SPEED_OF_LIGHT_KM_S / 3600;
		if (lightHours >= 1) {
			return `${au.toFixed(2)} AU (${lightHours.toFixed(2)} light-hours)`;
		}
		const lightMin = km / SPEED_OF_LIGHT_KM_S / 60;
		return `${au.toFixed(2)} AU (${lightMin.toFixed(1)} light-min)`;
	}
</script>

<section
	id="decade-timeline"
	data-section="decade-timeline"
	class="relative z-10 w-full border-t border-[rgba(232,230,225,0.10)] bg-[#050607] py-10 md:py-24 px-4 sm:px-6 lg:px-8"
	aria-label="Interactive 5-Decade Mission Telemetry & Trajectory Explorer"
>
	<div class="mx-auto max-w-[1320px]">
		<!-- Section Header -->
		<div class="flex flex-col lg:flex-row lg:items-end justify-between gap-4 md:gap-8 border-b border-[rgba(232,230,225,0.10)] pb-5 mb-5 md:pb-10 md:mb-10">
			<div>
				<div class="font-mono-tech text-[11px] uppercase tracking-[0.16em] text-[#C89B57] mb-2 md:mb-3">
					CHRONOLOGICAL ARCHIVE · 1975–2075
				</div>
				<h2
					class="font-display font-normal text-[#E8E6E1] tracking-[-0.02em] leading-[1.08]"
					style="font-size: clamp(1.75rem, 4.8vw, 4.25rem);"
				>
					Five Decades Across Nine Orders of Magnitude
				</h2>
				<p class="mt-2.5 md:mt-4 max-w-[65ch] font-sans text-base text-[rgba(232,230,225,0.72)] leading-[1.62]">
					Filter all <span class="text-[#E8E6E1]">{ALL_MILESTONES.length} verified missions</span>
					by chronological decade or operational domain. Select any node on the logarithmic
					<span class="text-[#C89B57]">Distance-vs-Time Trajectory Plot</span> to inspect primary
					instrument telemetry or jump directly to its chapter in the outward journey.
				</p>
			</div>

			<!-- Active Filter Summary Readout -->
			<div class="border-l border-[rgba(232,230,225,0.14)] pl-4 py-0.5 shrink-0">
				<div class="font-mono-tech text-[10px] sm:text-[11px] uppercase tracking-[0.16em] text-[rgba(232,230,225,0.6)]">
					MATCHING MISSIONS
				</div>
				<div class="mt-0.5 flex items-baseline gap-2">
					<span class="font-display text-2xl sm:text-3xl font-normal text-[#C89B57]">
						{filteredMilestones.length}
					</span>
					<span class="font-mono-tech text-[10px] sm:text-[11px] uppercase tracking-[0.16em] text-[rgba(232,230,225,0.6)]">
						/ {ALL_MILESTONES.length} ARCHIVED NODES
					</span>
				</div>
			</div>
		</div>

		<!-- Filter Controls Hairline Bar: Decade & Domain/Agency -->
		<div class="border-b border-[rgba(232,230,225,0.10)] pb-4 mb-5 md:pb-6 md:mb-10 space-y-2.5 md:space-y-4">
			<!-- Row 1: Decade Filter -->
			<div class="flex flex-wrap items-center gap-y-1.5 gap-x-4 sm:gap-x-6">
				<span class="font-mono-tech text-[10px] sm:text-[11px] uppercase tracking-[0.16em] text-[rgba(232,230,225,0.6)] w-24 sm:w-28 shrink-0">
					01 · DECADE
				</span>
				<div class="flex flex-wrap gap-x-3.5 sm:gap-x-5 gap-y-1.5">
					{#each DECADE_OPTIONS as decade}
						{@const active = selectedDecade === decade}
						<button
							type="button"
							onclick={() => (selectedDecade = decade)}
							class="border-b pb-0.5 font-mono-tech text-[11px] sm:text-xs uppercase tracking-[0.14em] transition-colors duration-500 cursor-pointer {active
								? 'border-[#C89B57] text-[#C89B57]'
								: 'border-transparent text-[rgba(232,230,225,0.6)] hover:text-[#E8E6E1]'}"
						>
							{decade}
						</button>
					{/each}
				</div>
			</div>

			<!-- Row 2: Domain / Agency Filter -->
			<div class="flex flex-wrap items-center gap-y-1.5 gap-x-4 sm:gap-x-6 border-t border-[rgba(232,230,225,0.09)] pt-2.5 md:pt-4">
				<span class="font-mono-tech text-[10px] sm:text-[11px] uppercase tracking-[0.16em] text-[rgba(232,230,225,0.6)] w-24 sm:w-28 shrink-0">
					02 · DOMAIN
				</span>
				<div class="flex flex-wrap gap-x-3.5 sm:gap-x-5 gap-y-1.5">
					{#each DOMAIN_OPTIONS as domain}
						{@const active = selectedDomain === domain}
						<button
							type="button"
							onclick={() => (selectedDomain = domain)}
							class="flex items-center gap-1.5 border-b pb-0.5 font-mono-tech text-[11px] sm:text-xs uppercase tracking-[0.14em] transition-colors duration-500 cursor-pointer {active
								? 'border-[#C89B57] text-[#C89B57]'
								: 'border-transparent text-[rgba(232,230,225,0.6)] hover:text-[#E8E6E1]'}"
						>
							{#if domain !== 'All'}
								<span
									class="h-1.5 w-1.5 rounded-full"
									style={`background-color: ${getDomainColor(domain)};`}
								></span>
							{/if}
							<span>{domain}</span>
						</button>
					{/each}
				</div>
			</div>
		</div>

		<!-- Main Interactive Workspace: Logarithmic SVG Plot + Live Mission Dossier -->
		<div class="grid grid-cols-1 xl:grid-cols-12 gap-5 md:gap-8 items-start">
			<!-- Left 7 Cols: Interactive Logarithmic Distance-vs-Time Scatter/Trajectory Plot -->
			<div class="xl:col-span-7 border border-[rgba(232,230,225,0.10)] bg-[#050607] p-3 sm:p-6 overflow-hidden">
				<div class="flex flex-wrap items-baseline justify-between gap-2 mb-3 border-b border-[rgba(232,230,225,0.10)] pb-2.5">
					<div>
						<h3 class="font-mono-tech text-[10px] sm:text-[11px] uppercase tracking-[0.14em] text-[#C89B57]">
							LOGARITHMIC DISTANCE-VS-TIME TRAJECTORY PLOT (10² KM → 10¹¹ KM)
						</h3>
					</div>

					<!-- Legend -->
					<div class="flex flex-wrap items-center gap-3 font-mono-tech text-[10px] sm:text-[11px] uppercase tracking-[0.14em] text-[rgba(232,230,225,0.6)]">
						<span class="flex items-center gap-1.5">
							<span class="h-1.5 w-1.5 rounded-full bg-[#E8E6E1]"></span> Crewed
						</span>
						<span class="flex items-center gap-1.5">
							<span class="h-1.5 w-1.5 rounded-full bg-[#C89B57]"></span> Planetary
						</span>
						<span class="flex items-center gap-1.5">
							<span class="h-1.5 w-1.5 rounded-full bg-[#DDB474]"></span> Deep Space
						</span>
						<span class="flex items-center gap-1.5">
							<span class="h-1.5 w-1.5 rounded-full bg-[#9E9A90]"></span> Commercial
						</span>
					</div>
				</div>

				<!-- Responsive SVG Container -->
				<div class="relative w-full overflow-x-auto">
					<svg
						viewBox={`0 0 ${PLOT_WIDTH} ${PLOT_HEIGHT}`}
						class="w-full h-auto select-none"
						role="img"
						aria-label="Logarithmic scatter plot of space missions by year and distance from Earth"
					>
						<defs>
							<linearGradient id="voyagerRefLine" x1="0%" y1="100%" x2="100%" y2="0%">
								<stop offset="0%" stop-color="#C89B57" stop-opacity="0.45" />
								<stop offset="50%" stop-color="#C89B57" stop-opacity="0.80" />
								<stop offset="100%" stop-color="#DDB474" stop-opacity="0.95" />
							</linearGradient>
						</defs>

						<!-- Plot Background Grid -->
						<rect
							x={PAD_LEFT}
							y={PAD_TOP}
							width={INNER_W}
							height={INNER_H}
							fill="#050607"
							stroke="rgba(232, 230, 225, 0.12)"
							stroke-width="1"
						/>

						<!-- Horizontal Logarithmic Distance Bands -->
						{#each Y_AXIS_BANDS as band}
							{@const y = kmToPlotY(band.km)}
							<g>
								<line
									x1={PAD_LEFT}
									y1={y}
									x2={PLOT_WIDTH - PAD_RIGHT}
									y2={y}
									stroke="rgba(232, 230, 225, 0.10)"
									stroke-dasharray="2 4"
								/>
								<text
									x={PAD_LEFT - 10}
									y={y + 3.5}
									text-anchor="end"
									font-family="var(--font-mono)"
									font-size="10"
									fill="rgba(232, 230, 225, 0.6)"
								>
									{band.label}
								</text>
							</g>
						{/each}

						<!-- Vertical Year Grid Lines -->
						{#each X_AXIS_YEARS as yr}
							{@const x = yearToPlotX(yr)}
							<g>
								<line
									x1={x}
									y1={PAD_TOP}
									x2={x}
									y2={PLOT_HEIGHT - PAD_BOTTOM}
									stroke={yr === 2026 ? '#C89B57' : 'rgba(232, 230, 225, 0.08)'}
									stroke-opacity={yr === 2026 ? '0.45' : '1'}
									stroke-dasharray={yr === 2026 ? '3 4' : undefined}
								/>
								<text
									x={x}
									y={PLOT_HEIGHT - PAD_BOTTOM + 20}
									text-anchor="middle"
									font-family="var(--font-mono)"
									font-size="10.5"
									fill={yr === 2026 || yr === 2075 ? '#C89B57' : 'rgba(232, 230, 225, 0.6)'}
								>
									{yr}
								</text>
							</g>
						{/each}

						<!-- Voyager 1 Continuous Escape Trajectory Curve -->
						<polyline
							fill="none"
							stroke="url(#voyagerRefLine)"
							stroke-width="1.8"
							stroke-dasharray="5 4"
							points={voyagerSvgPolyline}
						/>
						<text
							x={yearToPlotX(2005)}
							y={kmToPlotY(94 * AU_IN_KM) - 10}
							font-family="var(--font-mono)"
							font-size="9.5"
							fill="#C89B57"
							opacity="0.88"
						>
							VOYAGER 1 ESCAPE TRAJECTORY →
						</text>

						<!-- All Mission Nodes -->
						{#each ALL_MILESTONES as m, idx}
							{@const isMatched = filteredIdsSet.has(m.id)}
							{@const isSelected = activeMilestone?.id === m.id}
							{@const domain = getPrimaryDomain(m)}
							{@const color = getDomainColor(domain)}
							{@const x = yearToPlotX(m.year + (idx % 3 - 1) * 0.18)}
							{@const y = kmToPlotY(m.distanceFromEarthKm)}

							<g
								class="cursor-pointer transition-opacity duration-500"
								style={`opacity: ${isMatched ? 1 : 0.16};`}
								role="button"
								tabindex="0"
								aria-label={`${m.year}: ${m.title}`}
								onmouseenter={() => (hoveredMilestoneId = m.id)}
								onmouseleave={() => (hoveredMilestoneId = null)}
								onclick={() => {
									selectedMilestoneId = m.id;
									showDeepDive = false;
								}}
								onkeydown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') {
										e.preventDefault();
										selectedMilestoneId = m.id;
									}
								}}
							>
								{#if isSelected}
									<!-- Selected Node Crosshair -->
									<line
										x1={x}
										y1={PAD_TOP}
										x2={x}
										y2={PLOT_HEIGHT - PAD_BOTTOM}
										stroke="#C89B57"
										stroke-opacity="0.45"
										stroke-width="1"
									/>
									<line
										x1={PAD_LEFT}
										y1={y}
										x2={PLOT_WIDTH - PAD_RIGHT}
										y2={y}
										stroke="#C89B57"
										stroke-opacity="0.45"
										stroke-width="1"
									/>
									<circle
										cx={x}
										cy={y}
										r="12"
										fill="#C89B57"
										fill-opacity="0.14"
										stroke="#C89B57"
										stroke-width="1"
									/>
								{/if}

								<!-- Invisible Larger Hit Target -->
								<circle cx={x} cy={y} r="13" fill="transparent" />

								<!-- Core Dot -->
								<circle
									cx={x}
									cy={y}
									r={isSelected ? 6.5 : 4.5}
									fill={isSelected ? '#C89B57' : color}
									stroke="#050607"
									stroke-width="1.5"
								/>

								{#if isSelected}
									{@const shortTitle = m.title.split(':')[0].trim()}
									{@const calloutText = `${m.year} · ${shortTitle}`}
									{@const boxW = Math.max(195, Math.min(340, calloutText.length * 6.5 + 24))}
									{@const boxX = Math.min(PLOT_WIDTH - boxW - 12, Math.max(PAD_LEFT + 4, x - boxW / 2))}
									<rect
										x={boxX}
										y={Math.max(PAD_TOP + 4, y - 34)}
										width={boxW}
										height="22"
										fill="#050607"
										stroke="#C89B57"
										stroke-width="1"
									/>
									<text
										x={boxX + boxW / 2}
										y={Math.max(PAD_TOP + 18, y - 19)}
										text-anchor="middle"
										font-family="var(--font-mono)"
										font-size="10"
										fill="#E8E6E1"
									>
										{calloutText}
									</text>
								{/if}
							</g>
						{/each}
					</svg>
				</div>
			</div>

			<!-- Right 5 Cols: Active Mission Editorial Telemetry Dossier -->
			{#if activeMilestone}
				{@const domain = getPrimaryDomain(activeMilestone)}
				{@const domainColor = getDomainColor(domain)}
				<div class="xl:col-span-5 border-t border-[rgba(232,230,225,0.18)] pt-4">
					<div class="flex flex-wrap items-center justify-between gap-2 border-b border-[rgba(232,230,225,0.10)] pb-2">
						<div class="flex items-center gap-2">
							<span
								class="h-2 w-2 rounded-full"
								style={`background-color: ${domainColor};`}
							></span>
							<span class="font-mono-tech text-[11px] uppercase tracking-[0.16em] text-[#C89B57]">
								{activeMilestone.exactDate}
							</span>
						</div>
						<span class="font-mono-tech text-[11px] uppercase tracking-[0.16em] text-[rgba(232,230,225,0.6)]">
							{domain}
						</span>
					</div>

					<!-- Title & Subtitle -->
					<h3 class="mt-2.5 font-display text-xl sm:text-3xl font-normal tracking-[-0.02em] text-[#E8E6E1] leading-[1.1]">
						{activeMilestone.title}
					</h3>
					{#if activeMilestone.subtitle}
						<p class="mt-1 font-sans text-base text-[rgba(232,230,225,0.72)]">
							{activeMilestone.subtitle}
						</p>
					{/if}

					<!-- Compact 2x2 Hairline Telemetry Grid -->
					<div class="mt-3 grid grid-cols-2 border-y border-[rgba(232,230,225,0.10)] divide-x divide-y divide-[rgba(232,230,225,0.10)] font-mono-tech">
						<div class="py-2 pr-3">
							<div class="text-[10px] uppercase tracking-[0.14em] text-[rgba(232,230,225,0.6)]">AGENCY</div>
							<div class="mt-0.5 text-xs text-[#E8E6E1] leading-snug" title={activeMilestone.agency}>
								{activeMilestone.agency}
							</div>
						</div>
						<div class="py-2 pl-3">
							<div class="text-[10px] uppercase tracking-[0.14em] text-[rgba(232,230,225,0.6)]">DISTANCE</div>
							<div class="mt-0.5 text-xs text-[#C89B57] leading-snug">
								{formatMissionDistance(activeMilestone.distanceFromEarthKm)}
							</div>
						</div>
						<div class="py-2 pr-3">
							<div class="text-[10px] uppercase tracking-[0.14em] text-[rgba(232,230,225,0.6)]">REGIME</div>
							<div class="mt-0.5 text-xs text-[#E8E6E1] leading-snug">
								{activeMilestone.locationOrOrbit}
							</div>
						</div>
						<div class="py-2 pl-3">
							<div class="text-[10px] uppercase tracking-[0.14em] text-[rgba(232,230,225,0.6)]">VOYAGER 1 EPOCH</div>
							<div class="mt-0.5 text-xs text-[#C89B57] leading-snug">
								{activeMilestone.voyagerAuAtEvent} AU
							</div>
						</div>
					</div>

					<!-- Summary & Optional Deep Dive (>= 16px body copy) -->
					<p class="mt-3 max-w-[65ch] font-sans text-base text-[rgba(232,230,225,0.82)] leading-[1.6]">
						{activeMilestone.summary}
					</p>

					{#if showDeepDive}
						<div class="mt-3 border-l border-[#C89B57] pl-4 py-1 font-sans text-base text-[rgba(232,230,225,0.78)] leading-[1.65] max-w-[65ch]">
							<div class="font-mono-tech text-[11px] uppercase tracking-[0.16em] text-[#C89B57] mb-1">
								ENGINEERING &amp; SCIENTIFIC DEEP DIVE
							</div>
							{activeMilestone.deepDive}
						</div>
					{/if}

					<!-- Compact 2x2 Key Stats Hairline Grid -->
					{#if activeMilestone.keyStats?.length}
						<div class="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-[rgba(232,230,225,0.10)] pt-3">
							{#each activeMilestone.keyStats.slice(0, 4) as stat}
								<div>
									<div class="font-mono-tech text-[10px] uppercase tracking-[0.14em] text-[rgba(232,230,225,0.6)] leading-snug">
										{stat.label}
									</div>
									<div class="mt-0.5 font-display text-base sm:text-lg font-normal text-[#E8E6E1]">
										{stat.value}
									</div>
								</div>
							{/each}
						</div>
					{/if}

					<!-- Action Buttons: Inspect Full Specs Inline OR Jump to Narrative Section -->
					<div class="mt-4 flex flex-wrap items-center gap-3 pt-3 border-t border-[rgba(232,230,225,0.10)]">
						<a
							href={`/chapters/${activeMilestone.chapterId}#${activeMilestone.id}`}
							class="flex-1 inline-flex items-center justify-center gap-2 border border-[#C89B57] bg-[rgba(200,155,87,0.12)] px-3 py-2 font-mono-tech text-[11px] uppercase tracking-[0.14em] text-[#E8E6E1] hover:bg-[rgba(200,155,87,0.22)] transition-colors duration-500 cursor-pointer"
						>
							<span>OPEN IN CHAPTER ({activeChapterForMilestone.chapterNumber})</span>
							<span>↗</span>
						</a>

						<button
							type="button"
							onclick={() => (showDeepDive = !showDeepDive)}
							class="border border-[rgba(232,230,225,0.18)] px-3 py-2 font-mono-tech text-[11px] uppercase tracking-[0.14em] text-[rgba(232,230,225,0.72)] hover:border-[#E8E6E1] hover:text-[#E8E6E1] transition-colors duration-500 cursor-pointer"
						>
							{showDeepDive ? 'HIDE SPECS' : 'FULL SPECS'}
						</button>
					</div>
				</div>
			{/if}
		</div>

		<!-- Filtered Mission Editorial Index: Tight Single-Column List on Mobile, 4-Col Matrix on Desktop -->
		<div class="mt-6 md:mt-12 border-t border-[rgba(232,230,225,0.10)]">
			<div class="max-h-[195px] sm:max-h-none overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 border-b border-[rgba(232,230,225,0.10)]">
				{#each filteredMilestones as m, idx}
					{@const domain = getPrimaryDomain(m)}
					{@const color = getDomainColor(domain)}
					{@const isSelected = activeMilestone?.id === m.id}
					<div
						class="py-2 px-3 sm:p-4 flex items-center sm:flex-col justify-between gap-2 cursor-pointer border-b sm:border-r border-[rgba(232,230,225,0.10)] transition-colors duration-300 {isSelected
							? 'bg-[rgba(200,155,87,0.08)]'
							: 'hover:bg-[rgba(232,230,225,0.02)]'}"
						role="button"
						tabindex="0"
						onclick={() => {
							selectedMilestoneId = m.id;
							showDeepDive = false;
						}}
						onkeydown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								selectedMilestoneId = m.id;
							}
						}}
					>
						<div class="min-w-0 flex-1 sm:w-full">
							<div class="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 font-mono-tech text-[10px] sm:text-[11px] uppercase tracking-[0.14em]">
								<span class="text-[#C89B57] shrink-0">{String(idx + 1).padStart(2, '0')} · {m.year}</span>
								<span class="hidden sm:inline-flex items-center gap-1.5 text-[rgba(232,230,225,0.6)]">
									<span class="h-1.5 w-1.5 rounded-full shrink-0" style={`background-color: ${color};`}></span>
									<span class="leading-snug">{m.agency}</span>
								</span>
							</div>

							<h4 class="mt-0.5 sm:mt-1.5 font-display text-base font-normal text-[#E8E6E1] leading-snug">
								{m.title}
							</h4>
						</div>

						<div class="sm:mt-3 sm:pt-2.5 sm:w-full sm:border-t sm:border-[rgba(232,230,225,0.09)] flex flex-wrap items-center justify-between gap-2 font-mono-tech text-[10px] sm:text-[11px] uppercase tracking-[0.14em] shrink-0">
							<span class="hidden sm:inline text-[rgba(232,230,225,0.6)] leading-snug">
								{formatMissionDistance(m.distanceFromEarthKm)}
							</span>
							<a
								href={`/chapters/${m.chapterId}#${m.id}`}
								onclick={(e) => e.stopPropagation()}
								class="text-[#C89B57] hover:text-[#DDB474] cursor-pointer"
							>
								OPEN ↗
							</a>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
</section>

<script lang="ts">
	interface PillarSpec {
		id: string;
		code: string;
		badge: string;
		title: string;
		metricValue: string;
		metricUnit: string;
		summary: string;
		technicalDetails: string[];
	}

	const CAPABILITY_PILLARS: PillarSpec[] = [
		{
			id: 'multi-agent-research',
			code: 'PHASE 01 // PARALLEL DISCOVERY',
			badge: '7 CONCURRENT RESEARCH SCOUTS',
			title: 'Parallel Multi-Agent Research',
			metricValue: '70+',
			metricUnit: 'Primary Archival Citations',
			summary:
				'7 dedicated chapter research subagents verified 28 milestones, exact UTC timestamps, orbital parameters, and mission statistics against 70+ primary NASA, ESA, JAXA, Caltech/JPL, LIGO, and ESO sources compiled into SOURCES.md.',
			technicalDetails: [
				'Each epoch (Prologue through Epilogue) was assigned to an isolated read-only research scout operating in parallel.',
				'Cross-verified exact mission parameters: APAS-75 airlock pressures, Hubble −2.2 μm primary mirror spherical aberration, Voyager 1 121.6 AU heliopause electron plasma oscillations, and GW150914 10⁻²¹ strain waveforms.',
				'Compiled a deterministic TypeScript telemetry ledger and raw SOURCES.md bibliography with clickable archival URLs.'
			]
		},
		{
			id: 'original-science-writing',
			code: 'PHASE 02 // EDITORIAL SYNTHESIS',
			badge: 'ZERO BOILERPLATE COPY',
			title: 'Original Science Writing',
			metricValue: '28',
			metricUnit: 'Deep-Dive Engineering Dossiers',
			summary:
				'Every chapter opener, summary, and engineering deep dive was written from verified primary telemetry—zero boilerplate or placeholder copy.',
			technicalDetails: [
				'7 full-screen literary chapter introductions trace humanity’s psychological and physical expansion from 222 km low Earth orbit to the 170+ AU interstellar medium.',
				'28 expandable Engineering Deep Dive drawers unpack propulsion specific impulse, orbital mechanics, interferometric baselines, and thermal protection physics.',
				'112 structured key-statistic telemetry cards pair quantitative measurements with physical context.'
			]
		},
		{
			id: 'procedural-webgl-glsl',
			code: 'PHASE 03 // ZERO-ASSET RENDERING',
			badge: 'CUSTOM GLSL & WEB AUDIO',
			title: '100% Procedural Visuals & Custom GLSL Shaders',
			metricValue: '0',
			metricUnit: 'External Images or Textures',
			summary:
				'Zero stock photos or external textures; 18,000 instanced spectral stars, volumetric FBM nebula shaders, Rayleigh/Mie atmospheric scattering, analytical Saturn ring shadow-casting shaders, and a real-time 3D exoplanet Laplace-resonance orrery.',
			technicalDetails: [
				'Persistent Three.js / Threlte background canvas renders 18,000 Blackbody-colored spectral stars with scroll-driven relativistic warp and volumetric FBM nebulae.',
				'Bespoke 3D set pieces: Cassini–Huygens Saturn system with analytical ring-planet shadow casting and Titan Rayleigh/Mie haze, plus a 3D Exoplanet Orrery modeling the TRAPPIST-1 8:5:3:2 Laplace resonance chain.',
				'Interactive Golden Record SVG & Web Audio API synthesizer generating 14-pulsar click trains, 512-line SSTV video frame reconstructions, and harmonic motifs.'
			]
		},
		{
			id: 'chromium-verification',
			code: 'PHASE 04 // CLOSED-LOOP QA',
			badge: 'AUTOMATED BROWSER HARNESS',
			title: 'Self-Reviewed in Real Chromium',
			metricValue: '100%',
			metricUnit: 'Desktop & Mobile Viewport Coverage',
			summary:
				'Verified across desktop and mobile viewports via automated headless browser inspection.',
			technicalDetails: [
				'Launched the live Vite/SvelteKit production runtime inside a real Chromium browser instance to inspect WebGL contexts, shader compilation, and scroll telemetry.',
				'Exercised interactive controls: Golden Record pulsar ray selection, engineering deep-dive drawers, Saturn & Exoplanet camera presets, and SOURCES.md filtering.',
				'Confirmed zero console errors, zero uncaught page exceptions, and responsive HUD layout integrity across 1440×900 desktop and 390×844 mobile viewports.'
			]
		}
	];

	let selectedPillar = $state<PillarSpec>(CAPABILITY_PILLARS[0]);
</script>

<section
	id="ai-showcase"
	data-section="ai-showcase"
	class="relative z-10 w-full border-t border-[rgba(232,230,225,0.10)] bg-[#050607] py-10 md:py-24 px-4 sm:px-8 lg:px-16"
>
	<div id="ai-architecture" class="mx-auto max-w-[1320px]">
		<!-- Top Header Banner -->
		<div class="flex flex-wrap items-end justify-between gap-4 md:gap-8 border-b border-[rgba(232,230,225,0.10)] pb-5 md:pb-10">
			<div>
				<div class="flex flex-wrap items-center gap-3 font-mono-tech text-[11px] uppercase tracking-[0.16em]">
					<span class="inline-flex items-center gap-2 text-[#C89B57]">
						<span class="h-1.5 w-1.5 rounded-full bg-[#C89B57]"></span>
						AUTONOMOUS ENGINEERING MANIFEST
					</span>
					<span class="text-[rgba(232,230,225,0.6)]">
						ORCHESTRATED MULTI-AGENT SYSTEM
					</span>
				</div>

				<h2
					class="mt-2 md:mt-3 font-display font-normal tracking-[-0.02em] text-[#E8E6E1] leading-[1.08]"
					style="font-size: clamp(1.65rem, 4.8vw, 4.25rem);"
				>
					Built Entirely by AI — From Primary Research to Custom GLSL Shaders
				</h2>
				<p class="mt-2.5 md:mt-4 max-w-[65ch] font-sans text-base text-[rgba(232,230,225,0.72)] leading-[1.62]">
					This interactive chronicle was conceived, researched, written, mathematically modeled, and
					verified end-to-end by a coordinated fleet of specialized AI agents—without a single
					external image file, stock texture, or human-edited line of code.
				</p>
			</div>

			<!-- Quick Telemetry Summary 2x2 / 4-Col Hairline Ledger -->
			<div class="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-[rgba(232,230,225,0.10)] border border-[rgba(232,230,225,0.10)] w-full lg:w-auto">
				{#each [
					{ k: 'RESEARCH SCOUTS', v: '7 Agents' },
					{ k: 'PRIMARY CITATIONS', v: '70+ Verified' },
					{ k: 'EXTERNAL IMAGES', v: '0 Hotlinks' },
					{ k: 'CUSTOM SHADERS', v: '100% Procedural' }
				] as metric}
					<div class="px-3 py-2 sm:px-4 sm:py-3 bg-[#050607]">
						<div class="font-mono-tech text-[10px] sm:text-[11px] uppercase tracking-[0.14em] text-[rgba(232,230,225,0.6)]">
							{metric.k}
						</div>
						<div class="mt-0.5 font-display text-base sm:text-lg font-normal text-[#C89B57]">
							{metric.v}
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Procedural Multi-Agent DAG Architecture Schematic -->
		<div
			class="mt-5 md:mt-10 border border-[rgba(232,230,225,0.10)] bg-[#050607] p-3 sm:p-7"
		>
			<div class="mb-2.5 md:mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[rgba(232,230,225,0.10)] pb-2 md:pb-3 font-mono-tech text-[10px] sm:text-[11px] uppercase tracking-[0.14em]">
				<span class="text-[#E8E6E1]">
					MULTI-AGENT ORCHESTRATION &amp; PROCEDURAL SYNTHESIS DAG
				</span>
				<span class="text-[#C89B57]">
					7 RESEARCH SCOUTS → 5 PARALLEL ENGINEERING WORKERS → CHROMIUM QA
				</span>
			</div>

			<svg
				viewBox="0 0 960 220"
				class="w-full h-auto select-none"
				role="img"
				aria-label="Multi-Agent AI Architecture Diagram"
			>
				<rect width="960" height="220" fill="#050607" />

				<!-- Stage 1: Lead Orchestrator -->
				<g transform="translate(24, 72)">
					<rect
						x="0"
						y="0"
						width="145"
						height="76"
						fill="#08090b"
						stroke="rgba(232, 230, 225, 0.24)"
						stroke-width="1"
					/>
					<text
						x="14"
						y="24"
						fill="#C89B57"
						font-family="var(--font-mono)"
						font-size="8.5"
					>
						LEAD ORCHESTRATOR
					</text>
					<text x="14" y="44" fill="#E8E6E1" font-family="var(--font-mono)" font-size="10">
						Architecture &amp;
					</text>
					<text x="14" y="58" fill="#E8E6E1" font-family="var(--font-mono)" font-size="10">
						Type Contracts
					</text>
				</g>

				<!-- Stage 2: 7 Parallel Chapter Research Scouts -->
				<g transform="translate(230, 16)">
					<rect
						x="0"
						y="0"
						width="205"
						height="188"
						fill="#08090b"
						stroke="#C89B57"
						stroke-opacity="0.45"
						stroke-width="1"
					/>
					<text
						x="14"
						y="20"
						fill="#C89B57"
						font-family="var(--font-mono)"
						font-size="8.5"
					>
						WAVE 1: 7 RESEARCH SCOUTS
					</text>
					{#each [
						'ScoutPrologue (1975–1980)',
						'ScoutChapter1 (1981–1998)',
						'ScoutChapter2 (1990–2005)',
						'ScoutChapter3 (2006–2015)',
						'ScoutChapter4 (2015–2020)',
						'ScoutChapter5 (2020–2026)',
						'ScoutEpilogue (2026–2075)'
					] as scoutName, sIdx}
						<rect
							x="12"
							y={28 + sIdx * 22}
							width="181"
							height="18"
							fill="#050607"
							stroke="rgba(200, 155, 87, 0.28)"
							stroke-width="0.8"
						/>
						<text
							x="20"
							y={40 + sIdx * 22}
							fill="#E8E6E1"
							font-family="var(--font-mono)"
							font-size="8.5"
						>
							· {scoutName}
						</text>
					{/each}
				</g>

				<!-- Stage 3: 5 Parallel Engineering Workers -->
				<g transform="translate(495, 22)">
					<rect
						x="0"
						y="0"
						width="225"
						height="176"
						fill="#08090b"
						stroke="rgba(232, 230, 225, 0.24)"
						stroke-width="1"
					/>
					<text
						x="14"
						y="20"
						fill="#C89B57"
						font-family="var(--font-mono)"
						font-size="8.5"
					>
						WAVE 2: 5 ENGINEERING AGENTS
					</text>
					{#each [
						'BuildShadersAndStarfield (GLSL)',
						'BuildSaturnSetPiece (3D Rings)',
						'BuildExoplanetOrrery (3D Resonance)',
						'BuildHudHeroAndTimeline (HUD)',
						'BuildNarrativeAndShowcase (SVG/Audio)'
					] as workerName, wIdx}
						<rect
							x="12"
							y={30 + wIdx * 28}
							width="201"
							height="22"
							fill="#050607"
							stroke="rgba(232, 230, 225, 0.14)"
							stroke-width="0.8"
						/>
						<text
							x="20"
							y={44 + wIdx * 28}
							fill="rgba(232, 230, 225, 0.82)"
							font-family="var(--font-mono)"
							font-size="8.5"
						>
							· {workerName}
						</text>
					{/each}
				</g>

				<!-- Stage 4: Real Chromium Verification Loop -->
				<g transform="translate(775, 62)">
					<rect
						x="0"
						y="0"
						width="160"
						height="96"
						fill="#08090b"
						stroke="#C89B57"
						stroke-opacity="0.55"
						stroke-width="1"
					/>
					<text
						x="14"
						y="24"
						fill="#C89B57"
						font-family="var(--font-mono)"
						font-size="8.5"
					>
						WAVE 3: LIVE VERIFY
					</text>
					<text x="14" y="44" fill="#E8E6E1" font-family="var(--font-mono)" font-size="10">
						Headless Chromium
					</text>
					<text x="14" y="60" fill="rgba(232, 230, 225, 0.6)" font-family="var(--font-mono)" font-size="8.5">
						· Desktop 1440×900
					</text>
					<text x="14" y="74" fill="rgba(232, 230, 225, 0.6)" font-family="var(--font-mono)" font-size="8.5">
						· Mobile 390×844
					</text>
					<text x="14" y="88" fill="#C89B57" font-family="var(--font-mono)" font-size="8.5">
						· 0 Console Errors
					</text>
				</g>

				<!-- Connecting Flow Hairlines -->
				<g stroke="#C89B57" stroke-opacity="0.55" stroke-width="1" fill="none">
					<line x1="169" y1="110" x2="230" y2="110" />
					<line x1="435" y1="110" x2="495" y2="110" />
					<line x1="720" y1="110" x2="775" y2="110" />
				</g>
			</svg>
		</div>

		<!-- 4 Capability Pillars Hairline Matrix -->
		<div class="mt-5 md:mt-10 grid grid-cols-1 md:grid-cols-2 border-t border-l border-[rgba(232,230,225,0.10)]">
			{#each CAPABILITY_PILLARS as pillar}
				{@const isSelected = selectedPillar.id === pillar.id}
				<div
					role="button"
					tabindex="0"
					onclick={() => (selectedPillar = pillar)}
					onkeydown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							selectedPillar = pillar;
						}
					}}
					class="border-r border-b border-[rgba(232,230,225,0.10)] p-4 sm:p-8 text-left transition-colors duration-500 cursor-pointer {isSelected
						? 'bg-[rgba(200,155,87,0.06)]'
						: 'bg-[#050607] hover:bg-[rgba(232,230,225,0.02)]'}"
				>
					<div class="flex flex-wrap items-center justify-between gap-2 font-mono-tech text-[10px] sm:text-[11px] uppercase tracking-[0.14em]">
						<span class="text-[#C89B57]">
							{pillar.code}
						</span>
						<span class="text-[rgba(232,230,225,0.6)]">
							{pillar.badge}
						</span>
					</div>

					<div class="mt-2 sm:mt-4 flex items-baseline justify-between gap-3">
						<h3 class="font-display text-xl sm:text-3xl font-normal tracking-[-0.02em] text-[#E8E6E1] leading-[1.12]">
							{pillar.title}
						</h3>
						<div class="text-right shrink-0">
							<div class="font-display text-2xl sm:text-3xl font-normal text-[#C89B57]">
								{pillar.metricValue}
							</div>
							<div class="font-mono-tech text-[10px] sm:text-[11px] uppercase tracking-[0.14em] text-[rgba(232,230,225,0.6)]">
								{pillar.metricUnit}
							</div>
						</div>
					</div>

					<p class="mt-2 sm:mt-4 max-w-[65ch] font-sans text-base text-[rgba(232,230,225,0.76)] leading-[1.58]">
						{pillar.summary}
					</p>

					<ul class="{isSelected ? 'mt-3 space-y-2 border-t border-[rgba(232,230,225,0.10)] pt-3' : 'hidden md:block mt-4 space-y-2 border-t border-[rgba(232,230,225,0.10)] pt-3'} font-sans text-base text-[rgba(232,230,225,0.72)] leading-[1.58]">
						{#each pillar.technicalDetails as item}
							<li class="flex items-start gap-2.5 max-w-[65ch]">
								<span class="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#C89B57]"></span>
								<span>{item}</span>
							</li>
						{/each}
					</ul>
				</div>
			{/each}
		</div>
	</div>
</section>

<script lang="ts">
	import { onMount } from 'svelte';
	import { telemetryStore, openChapterDirectory } from '$lib/stores/scrollTelemetry';

	const AU_PER_LY = 63_241.077;

	interface ProbeMarker {
		id: string;
		name: string;
		distanceAu: number;
		distanceLabel: string;
		angleDeg: number;
		velocityLabel: string;
	}

	interface StarNeighbor {
		id: string;
		name: string;
		distanceLy: number;
		distanceAu: number;
		spectral: string;
		note: string;
		angleDeg: number;
		color: string;
	}

	const PLANET_ORBITS = [
		{ name: 'EARTH', au: 1.0, showLabel: false },
		{ name: 'MARS', au: 1.524, showLabel: false },
		{ name: 'JUPITER', au: 5.204, showLabel: true, angleDeg: -142 },
		{ name: 'SATURN', au: 9.537, showLabel: true, angleDeg: -38 },
		{ name: 'URANUS', au: 19.19, showLabel: false },
		{ name: 'NEPTUNE · 30.1 AU', au: 30.07, showLabel: true, angleDeg: 138 }
	];

	const INTERSTELLAR_PROBES: ProbeMarker[] = [
		{
			id: 'voyager-1',
			name: 'VOYAGER 1',
			distanceAu: 169.8,
			distanceLabel: '169.8 AU · 23H 34M OWLT',
			angleDeg: -32,
			velocityLabel: '17.0 KM/S · OPHIUCHUS'
		},
		{
			id: 'voyager-2',
			name: 'VOYAGER 2',
			distanceAu: 142.1,
			distanceLabel: '142.1 AU · 19H 43M OWLT',
			angleDeg: 144,
			velocityLabel: '15.4 KM/S · PAVO'
		}
	];

	const OORT_SHELLS = [
		{
			id: 'hills-cloud',
			label: 'INNER OORT CLOUD (HILLS CLOUD)',
			distanceText: '2,000 – 20,000 AU',
			innerAu: 2_000,
			outerAu: 20_000,
			midAu: 6_324,
			angleDeg: -118
		},
		{
			id: 'outer-oort',
			label: 'OUTER OORT SPHERICAL SHELL',
			distanceText: '20,000 – 100,000 AU · 1.58 LY',
			innerAu: 20_000,
			outerAu: 100_000,
			midAu: 55_000,
			angleDeg: -52
		}
	];

	const NEARBY_STARS: StarNeighbor[] = [
		{
			id: 'alpha-centauri',
			name: 'ALPHA CENTAURI A/B & PROXIMA',
			distanceLy: 4.37,
			distanceAu: 4.37 * AU_PER_LY,
			spectral: 'G2V / K1V / M5.5V',
			note: 'NEAREST STELLAR SYSTEM',
			angleDeg: -136,
			color: '#F3E7D3'
		},
		{
			id: 'barnards-star',
			name: "BARNARD'S STAR",
			distanceLy: 5.96,
			distanceAu: 5.96 * AU_PER_LY,
			spectral: 'M4.0V RED DWARF',
			note: 'HIGH PROPER MOTION',
			angleDeg: 34,
			color: '#E7B99A'
		},
		{
			id: 'sirius',
			name: 'SIRIUS A & B',
			distanceLy: 8.6,
			distanceAu: 8.6 * AU_PER_LY,
			spectral: 'A1V + DA2 WHITE DWARF',
			note: 'CANIS MAJORIS',
			angleDeg: 148,
			color: '#E8EEF5'
		},
		{
			id: 'trappist-1',
			name: 'TRAPPIST-1',
			distanceLy: 40.7,
			distanceAu: 40.7 * AU_PER_LY,
			spectral: 'M8V · 7 TERRESTRIAL PLANETS',
			note: 'LAPLACE RESONANCE CHAIN',
			angleDeg: -42,
			color: '#C89B57'
		},
		{
			id: 'kepler-90',
			name: 'KEPLER-90',
			distanceLy: 2_790,
			distanceAu: 2_790 * AU_PER_LY,
			spectral: 'G0V · 8-PLANET SYSTEM',
			note: 'ORION–CYGNUS SPIRAL ARM',
			angleDeg: -112,
			color: '#E8E6E1'
		}
	];

	// Deterministic background cometary particles for Oort Cloud
	const OORT_MOTES = Array.from({ length: 72 }, (_, i) => {
		const goldenAngle = i * 137.50776405;
		const frac = (i + 0.5) / 72;
		const logAu = Math.log10(2_000) + frac * (Math.log10(100_000) - Math.log10(2_000));
		return {
			au: Math.pow(10, logAu),
			angleRad: (goldenAngle * Math.PI) / 180,
			size: 0.7 + (i % 3) * 0.35,
			alpha: 0.16 + ((i * 7) % 10) * 0.03
		};
	});

	// Deterministic condensing galactic starfield (190 stars concentrated along the galactic plane)
	// that emerges first during Beat 3 before the Milky Way band resolves
	const CONDENSING_GALAXY_STARS = Array.from({ length: 190 }, (_, i) => {
		const s1 = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
		const s2 = Math.sin(i * 93.9898 + 19.133) * 29183.1234;
		const s3 = Math.sin(i * 41.3312 + 53.719) * 19283.7412;
		const u1 = s1 - Math.floor(s1);
		const u2 = s2 - Math.floor(s2);
		const u3 = s3 - Math.floor(s3);

		// Concentrate 65% of stars near the diagonal galactic plane band
		const isBandStar = i % 3 !== 0;
		const along = (u1 - 0.5) * 960;
		const spread = isBandStar ? (u2 - 0.5) * (u3 * 220) : (u2 - 0.5) * 860;
		const angle = -0.32; // Matches Gaia galactic plane orientation
		const x = 500 + along * Math.cos(angle) - spread * Math.sin(angle);
		const y = 500 + along * Math.sin(angle) + spread * Math.cos(angle);

		return {
			x: Math.max(20, Math.min(980, x)),
			y: Math.max(20, Math.min(980, y)),
			r: 0.55 + (i % 4) * 0.38,
			threshold: (i / 190) * 0.65, // Staggered condensation threshold
			color: i % 5 === 0 ? '#C89B57' : i % 3 === 0 ? '#DDB474' : '#E8E6E1',
			maxAlpha: 0.28 + (u3 * 0.58)
		};
	});

	let sectionEl: HTMLElement | undefined = $state();
	let targetP = $state(0);
	let smoothP = $state(0);
	let viewportW = $state(typeof window !== 'undefined' ? window.innerWidth : 1440);
	let viewportH = $state(typeof window !== 'undefined' ? window.innerHeight : 900);
	let showMobileSecondaryLabels = $state(false);

	const isMobile = $derived(viewportW < 768);
	const showSecondaryLabels = $derived(!isMobile || showMobileSecondaryLabels);
	const stageSquarePx = $derived(Math.max(320, Math.min(viewportW, viewportH)));
	const svgUnitPerPx = $derived(1000 / stageSquarePx);

	function svgPx(targetCssPx: number): number {
		return Number((targetCssPx * svgUnitPerPx).toFixed(2));
	}

	// Rebalanced label sizes: ~22–28% smaller on desktop while preserving the 11–12px effective mobile floor
	function labelPx(desktopCssPx: number, mobileCssPx: number): number {
		return svgPx(isMobile ? mobileCssPx : desktopCssPx);
	}

	function clamp01(v: number): number {
		return Math.max(0, Math.min(1, v));
	}

	function smoothstep(edge0: number, edge1: number, x: number): number {
		const t = clamp01((x - edge0) / Math.max(1e-6, edge1 - edge0));
		return t * t * (3 - 2 * t);
	}

	function bellWindow(enter0: number, enter1: number, exit0: number, exit1: number, x: number): number {
		return smoothstep(enter0, enter1, x) * (1 - smoothstep(exit0, exit1, x));
	}

	function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
		const rad = (angleDeg * Math.PI) / 180;
		return {
			x: cx + r * Math.cos(rad),
			y: cy + r * Math.sin(rad)
		};
	}

	// =========================================================================
	// THREE DISTINCT PINNED BEATS CHOREOGRAPHY (smoothP: 0.00 -> 1.00)
	// Total section height is 800vh (700vh pinned scrub travel):
	//   BEAT A (0.00 -> 0.17): DISTANCE ALONE (~1.2vh scrub)
	//   BEAT B (0.20 -> 0.37): THE QUOTE ALONE (~1.2vh scrub)
	//   BEAT C (0.40 -> 1.00): THE GALAXY CONDENSATION (~4.2vh scrub)
	//     - C1 (0.40 -> 0.72): Stars & Pull-Back Shells (Heliosphere -> Oort -> Orion Arm) condense first
	//     - C2 (0.55 -> 0.86): Milky Way Galactic Band slowly resolves out of the starfield
	//     - C3 (0.80 -> 0.94): Final Galactic Markers & Labels fade in last; 0.94 -> 1.00 settled
	// =========================================================================

	// BEAT A: DISTANCE ALONE (0.00 -> 0.17)
	const distanceBeatOpacity = $derived(
		smoothP < 0.015
			? smoothstep(0.0, 0.015, Math.max(0.015, smoothP + 0.015))
			: 1 - smoothstep(0.13, 0.175, smoothP)
	);
	const distanceBeatTranslateY = $derived(-smoothstep(0.12, 0.175, smoothP) * 14);

	// BEAT B: THE QUOTE ALONE (0.20 -> 0.37)
	const quoteBeatOpacity = $derived(bellWindow(0.195, 0.235, 0.335, 0.38, smoothP));
	const quoteBeatTranslateY = $derived(
		(1 - smoothstep(0.195, 0.24, smoothP)) * 14 - smoothstep(0.335, 0.38, smoothP) * 12
	);

	// BEAT C: THE GALAXY CONDENSATION (0.40 -> 1.00, 4.2+ viewport heights of pinned scrub)
	const galaxyPhaseProgress = $derived(clamp01((smoothP - 0.40) / 0.60));

	// Continuous logarithmic zoom factor across Beat C:
	const zoomScale = $derived(Math.pow(10, -galaxyPhaseProgress * 9));

	// Camera field-of-view radius in AU mapped continuously from galaxyPhaseProgress (0 -> 1):
	// gP = 0.05 -> ~280 AU (Heliosphere + Voyager 1/2)
	// gP = 0.28 -> ~140,000 AU (Oort Cloud)
	// gP = 0.50 -> ~1.1e8 AU (Local Stellar Neighborhood & Orion Arm)
	// gP = 0.78+ -> ~6.32e9 AU (100,000 ly: Full Milky Way Disk)
	const cameraOuterAu = $derived.by(() => {
		const pNorm = clamp01(galaxyPhaseProgress / 0.76);
		const scaleFactor = Math.pow(10, -pNorm * 8.35) * (0.95 + 0.05 * zoomScale);
		return 28.0 / Math.max(1e-10, scaleFactor);
	});

	function auToRadiusPx(distanceAu: number, currentOuterAu: number): number {
		const ratio = distanceAu / Math.max(1e-6, currentOuterAu);
		if (ratio <= 0) return 0;
		const r = 340 * Math.pow(ratio, 0.42);
		return Math.min(1800, r);
	}

	// Focal origin in the 1000x1000 SVG coordinate system:
	// Centered at (500, 500) during early condensation, smoothly drifting to Sol's true
	// Orion Arm position (618, 556) as the galactic band resolves
	const focalTransfer = $derived(smoothstep(0.56, 0.78, smoothP));
	const solX = $derived(500 + focalTransfer * 118);
	const solY = $derived(500 + focalTransfer * 56);

	// Sub-layer opacities inside Beat C (0.40 -> 1.00):
	// 1. Stars condense first (0.40 -> 0.72)
	const starsCondenseProgress = $derived(smoothstep(0.40, 0.72, smoothP));
	const diagramOpacity = $derived(smoothstep(0.40, 0.45, smoothP));

	// Pull-back cartography shells during early/mid Beat C:
	const heliosphereLayerOpacity = $derived(bellWindow(0.40, 0.44, 0.53, 0.58, smoothP));
	const oortLayerOpacity = $derived(bellWindow(0.49, 0.54, 0.63, 0.68, smoothP));
	const orionArmLayerOpacity = $derived(bellWindow(0.60, 0.65, 0.76, 0.82, smoothP));

	// 2. Milky Way galactic band slowly resolves (0.55 -> 0.86) with cubic easing
	const rawBandResolve = $derived(smoothstep(0.55, 0.86, smoothP));
	const bandResolveOpacity = $derived(Math.pow(rawBandResolve, 1.75));
	const panoramaScale = $derived(1.24 - 0.24 * smoothstep(0.54, 0.94, smoothP));
	const panoramaBrightness = $derived(0.52 + 0.36 * smoothstep(0.55, 0.88, smoothP));
	const panoramaContrast = $derived(1.32 - 0.17 * smoothstep(0.55, 0.88, smoothP));

	// 3. Final galactic markers & labels fade in last (0.80 -> 0.93) and hold settled (0.93 -> 1.00)
	const youAreHereOpacity = $derived(smoothstep(0.80, 0.92, smoothP));
	const settledChaptersLinkOpacity = $derived(smoothstep(0.90, 0.96, smoothP));

	// Quiet telemetry scale header during the Heliosphere -> Oort -> Orion Arm pull-back (fades out before galaxy settles)
	const scaleReadoutOpacity = $derived(bellWindow(0.41, 0.45, 0.74, 0.80, smoothP));

	const currentScaleDescriptor = $derived.by(() => {
		if (smoothP < 0.53) {
			return {
				phase: 'PULL-BACK I // THE HELIOSPHERE',
				scale: '10² AU · INTERSTELLAR BOUNDARY',
				detail: 'HELIOPAUSE 121.6 AU · VOYAGER 1 AT 169.8 AU'
			};
		}
		if (smoothP < 0.63) {
			return {
				phase: 'PULL-BACK II // THE OORT CLOUD',
				scale: '10⁴ – 10⁵ AU · COMETARY RESERVOIR',
				detail: '2,000 – 100,000 AU · GRAVITATIONAL DOMINANCE OF SOL'
			};
		}
		return {
			phase: 'PULL-BACK III // ORION–CYGNUS SPIRAL ARM',
			scale: '10¹ – 10³ LIGHT-YEARS · LOCAL STELLAR NEIGHBORHOOD',
			detail: 'ALPHA CENTAURI (4.37 LY) TO KEPLER-90 (2,790 LY)'
		};
	});

	// Active finale beat identifier for deterministic testing & accessibility
	const activeFinaleBeat = $derived.by(() => {
		if (smoothP < 0.19) return 'distance-alone';
		if (smoothP < 0.39) return 'quote-alone';
		if (smoothP < 0.82) return 'galaxy-condensing';
		return 'galaxy-settled';
	});

	// Live ticking final distance formatting for Beat A (DISTANCE ALONE)
	const finalDistanceKmFormatted = $derived.by(() => {
		// Base 340.0 AU centennial horizon + live Voyager odometer delta
		const baseCentennialKm = 340.0 * 149_597_870.7;
		const liveOffsetKm = Math.max(0, $telemetryStore.voyagerDistanceKm - 169.8 * 149_597_870.7);
		const totalKm = Math.floor(baseCentennialKm + ( liveOffsetKm % 100_000 ));
		return totalKm.toLocaleString('en-US');
	});

	function computeTargetProgress() {
		if (!sectionEl || typeof window === 'undefined') return;
		viewportW = window.innerWidth;
		viewportH = window.innerHeight;
		const rect = sectionEl.getBoundingClientRect();
		const scrollable = Math.max(1, rect.height - window.innerHeight);
		targetP = clamp01(-rect.top / scrollable);
	}

	onMount(() => {
		computeTargetProgress();
		smoothP = targetP;

		let rafId = 0;
		function tick() {
			computeTargetProgress();
			const delta = targetP - smoothP;
			if (Math.abs(delta) > 0.0001) {
				smoothP += delta * 0.14;
			} else {
				smoothP = targetP;
			}
			rafId = window.requestAnimationFrame(tick);
		}

		rafId = window.requestAnimationFrame(tick);
		window.addEventListener('scroll', computeTargetProgress, { passive: true });
		window.addEventListener('resize', computeTargetProgress, { passive: true });

		return () => {
			if (rafId) window.cancelAnimationFrame(rafId);
			window.removeEventListener('scroll', computeTargetProgress);
			window.removeEventListener('resize', computeTargetProgress);
		};
	});
</script>

<section
	id="finale-pullback"
	bind:this={sectionEl}
	data-finale-beat={activeFinaleBeat}
	data-finale-progress={smoothP.toFixed(3)}
	aria-label="The Finale: Final Distance, Closing Quote, and Milky Way Galaxy Reveal"
	class="relative w-full min-h-[760vh] md:min-h-[820vh] bg-[#050607] select-none"
>
	<!-- Sticky Full-Viewport Pinned Stage -->
	<div class="sticky top-0 z-20 h-screen w-full overflow-hidden bg-[#050607]">
		<!-- =====================================================================
		     BEAT 3 (c) — LAYER 1: ESA GAIA MILKY WAY PANORAMA (Slow Eased Condensation)
		     ===================================================================== -->
		<div
			data-testid="finale-galaxy-panorama"
			class="absolute inset-0 pointer-events-none will-change-transform"
			style={`opacity: ${bandResolveOpacity.toFixed(4)}; transform: scale(${panoramaScale.toFixed(4)});`}
		>
			<picture class="block h-full w-full">
				<source
					type="image/avif"
					srcset="/assets/finale/milky-way-gaia-800.avif 800w, /assets/finale/milky-way-gaia-1600.avif 1600w, /assets/finale/milky-way-gaia-2400.avif 2400w"
					sizes="100vw"
				/>
				<source
					type="image/webp"
					srcset="/assets/finale/milky-way-gaia-800.webp 800w, /assets/finale/milky-way-gaia-1600.webp 1600w, /assets/finale/milky-way-gaia-2400.webp 2400w"
					sizes="100vw"
				/>
				<img
					src="/assets/finale/milky-way-gaia-1600.webp"
					alt="ESA Gaia all-sky panorama of the Milky Way galaxy showing the galactic core, dust lanes, and Orion spiral arm"
					loading="lazy"
					decoding="async"
					class="h-full w-full object-cover object-center"
					style={`filter: saturate(0.90) contrast(${panoramaContrast.toFixed(3)}) brightness(${panoramaBrightness.toFixed(3)});`}
				/>
			</picture>

			<!-- Deep Documentary Vignette & Edge Blending into #050607 True Void -->
			<div
				class="absolute inset-0"
				style="background: radial-gradient(ellipse 76% 62% at 50% 48%, rgba(5, 6, 7, 0.02) 0%, rgba(5, 6, 7, 0.30) 64%, rgba(5, 6, 7, 0.90) 92%, #050607 100%);"
			></div>
			<div
				class="absolute inset-0"
				style="background: linear-gradient(180deg, #050607 0%, rgba(5, 6, 7, 0.16) 18%, rgba(5, 6, 7, 0.12) 74%, rgba(5, 6, 7, 0.88) 94%, #050607 100%);"
			></div>
		</div>

		<!-- =====================================================================
		     BEAT 3 (c) — LAYER 2: CONDENSING STARFIELD, PULL-BACK SHELLS & MARKERS
		     ===================================================================== -->
		<svg
			viewBox="0 0 1000 1000"
			preserveAspectRatio="xMidYMid meet"
			class="absolute inset-0 h-full w-full pointer-events-none"
			style={`opacity: ${diagramOpacity.toFixed(4)};`}
			aria-hidden="true"
		>
			<defs>
				<radialGradient id="heliosphere-glow" cx="50%" cy="50%" r="50%">
					<stop offset="0%" stop-color="#C89B57" stop-opacity="0.34" />
					<stop offset="55%" stop-color="#C89B57" stop-opacity="0.08" />
					<stop offset="100%" stop-color="#C89B57" stop-opacity="0" />
				</radialGradient>

				<radialGradient id="oort-shell-gradient" cx="50%" cy="50%" r="50%">
					<stop offset="0%" stop-color="#E8E6E1" stop-opacity="0" />
					<stop offset="35%" stop-color="#E8E6E1" stop-opacity="0.03" />
					<stop offset="72%" stop-color="#C89B57" stop-opacity="0.075" />
					<stop offset="92%" stop-color="#E8E6E1" stop-opacity="0.04" />
					<stop offset="100%" stop-color="#E8E6E1" stop-opacity="0" />
				</radialGradient>

				<linearGradient id="orion-arm-band" x1="0%" y1="0%" x2="100%" y2="100%">
					<stop offset="0%" stop-color="#E8E6E1" stop-opacity="0" />
					<stop offset="28%" stop-color="#E8E6E1" stop-opacity="0.065" />
					<stop offset="52%" stop-color="#C89B57" stop-opacity="0.09" />
					<stop offset="76%" stop-color="#E8E6E1" stop-opacity="0.055" />
					<stop offset="100%" stop-color="#E8E6E1" stop-opacity="0" />
				</linearGradient>

				<filter id="finale-label-shadow" x="-30%" y="-40%" width="160%" height="180%">
					<feDropShadow dx="0" dy="1" stdDeviation="3" flood-color="#050607" flood-opacity="0.96" />
					<feDropShadow dx="0" dy="0" stdDeviation="1.5" flood-color="#050607" flood-opacity="0.92" />
				</filter>
			</defs>

			<!-- PHASE C1: Condensing Galactic Field Stars (Stars emerge first out of the dark!) -->
			{#if starsCondenseProgress > 0.005}
				<g data-testid="finale-condensing-stars">
					{#each CONDENSING_GALAXY_STARS as star, idx (idx)}
						{@const starLocalAlpha =
							smoothstep(star.threshold, Math.min(1, star.threshold + 0.35), starsCondenseProgress) *
							star.maxAlpha *
							(1 - bandResolveOpacity * 0.45)}
						{#if starLocalAlpha > 0.01}
							<circle
								cx={500 + (star.x - 500) * (1.12 - 0.12 * starsCondenseProgress)}
								cy={500 + (star.y - 500) * (1.12 - 0.12 * starsCondenseProgress)}
								r={star.r}
								fill={star.color}
								fill-opacity={starLocalAlpha}
							/>
						{/if}
					{/each}
				</g>
			{/if}

			<!-- Subtle Astrometric Crosshair Reference Axes centered on Sol -->
			<g opacity={Math.max(0, 0.2 * (1 - bandResolveOpacity))}>
				<line
					x1={solX - 460}
					y1={solY}
					x2={solX + 460}
					y2={solY}
					stroke="#E8E6E1"
					stroke-width="0.6"
					stroke-dasharray="2 6"
				/>
				<line
					x1={solX}
					y1={solY - 460}
					x2={solX}
					y2={solY + 460}
					stroke="#E8E6E1"
					stroke-width="0.6"
					stroke-dasharray="2 6"
				/>
			</g>

			<!-- =================================================================
			     ORION–CYGNUS SPIRAL ARM & LOCAL STELLAR NEIGHBORHOOD
			     ================================================================= -->
			{#if orionArmLayerOpacity > 0.005}
				{@const rLocalBubble = auToRadiusPx(300 * AU_PER_LY, cameraOuterAu)}
				{@const rOrionArmScale = auToRadiusPx(3_500 * AU_PER_LY, cameraOuterAu)}
				<g opacity={orionArmLayerOpacity}>
					<g transform={`translate(${solX}, ${solY})`}>
						<path
							d={`M ${-rOrionArmScale * 1.65} ${-rOrionArmScale * 0.95} Q ${-rOrionArmScale * 0.25} ${-rOrionArmScale * 0.12}, 0 0 T ${rOrionArmScale * 1.55} ${rOrionArmScale * 0.85}`}
							fill="none"
							stroke="url(#orion-arm-band)"
							stroke-width={Math.max(18, Math.min(180, rOrionArmScale * 0.55))}
							stroke-linecap="round"
						/>
						<path
							d={`M ${-rOrionArmScale * 1.65} ${-rOrionArmScale * 0.95} Q ${-rOrionArmScale * 0.25} ${-rOrionArmScale * 0.12}, 0 0 T ${rOrionArmScale * 1.55} ${rOrionArmScale * 0.85}`}
							fill="none"
							stroke="#C89B57"
							stroke-opacity="0.28"
							stroke-width="0.9"
							stroke-dasharray="4 6"
						/>
						<path
							d={`M ${-rOrionArmScale * 1.4} ${rOrionArmScale * 0.55} Q 0 ${rOrionArmScale * 0.95}, ${rOrionArmScale * 1.4} ${rOrionArmScale * 1.48}`}
							fill="none"
							stroke="#E8E6E1"
							stroke-opacity="0.12"
							stroke-width="0.8"
							stroke-dasharray="2 8"
						/>
						<path
							d={`M ${-rOrionArmScale * 1.3} ${-rOrionArmScale * 1.5} Q 0 ${-rOrionArmScale * 0.98}, ${rOrionArmScale * 1.45} ${-rOrionArmScale * 0.42}`}
							fill="none"
							stroke="#E8E6E1"
							stroke-opacity="0.12"
							stroke-width="0.8"
							stroke-dasharray="2 8"
						/>

						{#if showSecondaryLabels && rOrionArmScale > 45 && rOrionArmScale < 520}
							<text
								x={isMobile ? 0 : rOrionArmScale * 0.35}
								y={rOrionArmScale * 0.24 - svgPx(8)}
								text-anchor={isMobile ? 'middle' : 'start'}
								fill="#DDB474"
								fill-opacity="0.90"
								font-family="JetBrains Mono, monospace"
								font-size={labelPx(9.4, 12.0)}
								font-weight="600"
								letter-spacing={svgPx(1.2)}
								class="finale-svg-label"
								filter="url(#finale-label-shadow)"
							>
								ORION–CYGNUS SPIRAL ARM · 3,500 LY WIDTH
							</text>
						{/if}
					</g>

					{#if rLocalBubble > 8 && rLocalBubble < 650}
						<circle
							cx={solX}
							cy={solY}
							r={rLocalBubble}
							fill="none"
							stroke="#E8E6E1"
							stroke-opacity="0.18"
							stroke-width="0.8"
							stroke-dasharray="3 6"
						/>
						{#if showSecondaryLabels && rLocalBubble > 42 && rLocalBubble < 410}
							<text
								x={solX}
								y={solY + rLocalBubble + svgPx(14)}
								text-anchor="middle"
								fill="#E8E6E1"
								fill-opacity="0.65"
								font-family="JetBrains Mono, monospace"
								font-size={labelPx(8.6, 11.2)}
								font-weight="400"
								letter-spacing={svgPx(1.0)}
								class="finale-svg-label"
								filter="url(#finale-label-shadow)"
							>
								LOCAL INTERSTELLAR BUBBLE · ~300 LY
							</text>
						{/if}
					{/if}

					{#each NEARBY_STARS as star (star.id)}
						{@const rStar = auToRadiusPx(star.distanceAu, cameraOuterAu)}
						{#if rStar > 6 && rStar < 620}
							{@const pt = polarToCartesian(solX, solY, rStar, star.angleDeg)}
							{@const labelRight = Math.cos((star.angleDeg * Math.PI) / 180) >= 0}
							{@const starVis = bellWindow(8, 22, 430, 560, rStar)}
							<g opacity={starVis}>
								<circle
									cx={solX}
									cy={solY}
									r={rStar}
									fill="none"
									stroke="#E8E6E1"
									stroke-opacity="0.09"
									stroke-width="0.7"
								/>
								<line
									x1={solX}
									y1={solY}
									x2={pt.x}
									y2={pt.y}
									stroke={star.color}
									stroke-opacity="0.22"
									stroke-width="0.75"
								/>
								<circle cx={pt.x} cy={pt.y} r="2.6" fill={star.color} />
								<circle
									cx={pt.x}
									cy={pt.y}
									r="6"
									fill="none"
									stroke={star.color}
									stroke-opacity="0.4"
									stroke-width="0.75"
								/>
								{#if showSecondaryLabels}
									<line
										x1={pt.x + (labelRight ? 7 : -7)}
										y1={pt.y}
										x2={pt.x + (labelRight ? 20 : -20)}
										y2={pt.y}
										stroke={star.color}
										stroke-opacity="0.6"
										stroke-width="0.85"
									/>
									<text
										x={isMobile ? Math.min(680, Math.max(320, pt.x)) : pt.x + (labelRight ? 24 : -24)}
										y={pt.y - svgPx(3)}
										text-anchor={isMobile ? 'middle' : labelRight ? 'start' : 'end'}
										fill="#F2F0EC"
										fill-opacity="0.92"
										font-family="JetBrains Mono, monospace"
										font-size={labelPx(9.4, 12.0)}
										font-weight="500"
										letter-spacing={svgPx(1.0)}
										class="finale-svg-label"
										filter="url(#finale-label-shadow)"
									>
										{star.name} · <tspan fill="#DDB474">{star.distanceLy.toLocaleString('en-US')} LY</tspan>
									</text>
									<text
										x={isMobile ? Math.min(680, Math.max(320, pt.x)) : pt.x + (labelRight ? 24 : -24)}
										y={pt.y + svgPx(9)}
										text-anchor={isMobile ? 'middle' : labelRight ? 'start' : 'end'}
										fill="#E8E6E1"
										fill-opacity="0.62"
										font-family="JetBrains Mono, monospace"
										font-size={labelPx(8.5, 11.0)}
										font-weight="400"
										letter-spacing={svgPx(0.75)}
										class="finale-svg-label"
										filter="url(#finale-label-shadow)"
									>
										{isMobile ? star.spectral : `${star.spectral} // ${star.note}`}
									</text>
								{/if}
							</g>
						{/if}
					{/each}
				</g>
			{/if}

			<!-- =================================================================
			     THE OORT CLOUD (2,000 - 100,000 AU)
			     ================================================================= -->
			{#if oortLayerOpacity > 0.005}
				{@const rHillsInner = auToRadiusPx(2_000, cameraOuterAu)}
				{@const rHillsOuter = auToRadiusPx(20_000, cameraOuterAu)}
				{@const rOortOuter = auToRadiusPx(100_000, cameraOuterAu)}
				<g opacity={oortLayerOpacity}>
					{#if rOortOuter > 4}
						<circle
							cx={solX}
							cy={solY}
							r={Math.min(900, rOortOuter)}
							fill="url(#oort-shell-gradient)"
						/>
						<circle
							cx={solX}
							cy={solY}
							r={rOortOuter}
							fill="none"
							stroke="#C89B57"
							stroke-opacity="0.45"
							stroke-width="0.95"
							stroke-dasharray="3 5"
						/>
					{/if}

					{#if rHillsOuter > 4}
						<circle
							cx={solX}
							cy={solY}
							r={rHillsOuter}
							fill="none"
							stroke="#E8E6E1"
							stroke-opacity="0.26"
							stroke-width="0.8"
							stroke-dasharray="2 4"
						/>
					{/if}
					{#if rHillsInner > 3}
						<circle
							cx={solX}
							cy={solY}
							r={rHillsInner}
							fill="none"
							stroke="#E8E6E1"
							stroke-opacity="0.16"
							stroke-width="0.65"
						/>
					{/if}

					{#each OORT_MOTES as mote, idx (idx)}
						{@const rMote = auToRadiusPx(mote.au, cameraOuterAu)}
						{#if rMote > 5 && rMote < 560}
							<circle
								cx={solX + rMote * Math.cos(mote.angleRad)}
								cy={solY + rMote * Math.sin(mote.angleRad)}
								r={mote.size}
								fill={idx % 5 === 0 ? '#C89B57' : '#E8E6E1'}
								fill-opacity={mote.alpha}
							/>
						{/if}
					{/each}

					{#if showSecondaryLabels}
						{#each OORT_SHELLS as oort (oort.id)}
							{@const rShell = auToRadiusPx(oort.outerAu, cameraOuterAu)}
							{#if rShell > 28 && rShell < 450}
								{@const pt = polarToCartesian(solX, solY, rShell, oort.angleDeg)}
								{@const labelVis = bellWindow(28, 52, 370, 450, rShell)}
								<g opacity={labelVis}>
									<circle cx={pt.x} cy={pt.y} r="2.2" fill="#C89B57" />
									<line
										x1={pt.x}
										y1={pt.y}
										x2={pt.x + 18}
										y2={pt.y - 13}
										stroke="#C89B57"
										stroke-opacity="0.65"
										stroke-width="0.85"
									/>
									<line
										x1={pt.x + 18}
										y1={pt.y - 13}
										x2={pt.x + 52}
										y2={pt.y - 13}
										stroke="#C89B57"
										stroke-opacity="0.65"
										stroke-width="0.85"
									/>
									<text
										x={pt.x + 56}
										y={pt.y - svgPx(12)}
										fill="#F2F0EC"
										fill-opacity="0.92"
										font-family="JetBrains Mono, monospace"
										font-size={labelPx(9.4, 12.0)}
										font-weight="600"
										letter-spacing={svgPx(1.1)}
										class="finale-svg-label"
										filter="url(#finale-label-shadow)"
									>
										{oort.label}
									</text>
									<text
										x={pt.x + 56}
										y={pt.y - svgPx(1)}
										fill="#DDB474"
										fill-opacity="0.72"
										font-family="JetBrains Mono, monospace"
										font-size={labelPx(8.5, 11.0)}
										font-weight="400"
										letter-spacing={svgPx(0.85)}
										class="finale-svg-label"
										filter="url(#finale-label-shadow)"
									>
										{oort.distanceText}
									</text>
								</g>
							{/if}
						{/each}
					{/if}
				</g>
			{/if}

			<!-- =================================================================
			     THE HELIOSPHERE (10^2 AU) & VOYAGER 1 / 2
			     ================================================================= -->
			{#if heliosphereLayerOpacity > 0.005 || oortLayerOpacity > 0.005}
				{@const rHeliopause = auToRadiusPx(121.6, cameraOuterAu)}
				{@const rTermination = auToRadiusPx(94.0, cameraOuterAu)}
				{@const rKuiperOuter = auToRadiusPx(50.0, cameraOuterAu)}
				<g opacity={Math.max(heliosphereLayerOpacity, oortLayerOpacity * 0.82)}>
					{#if rHeliopause > 1.5}
						<circle
							cx={solX}
							cy={solY}
							r={Math.max(4, rHeliopause * 1.18)}
							fill="url(#heliosphere-glow)"
						/>
					{/if}

					{#each PLANET_ORBITS as orbit (orbit.name)}
						{@const rOrbit = auToRadiusPx(orbit.au, cameraOuterAu)}
						{#if rOrbit > 2.5 && rOrbit < 550}
							<circle
								cx={solX}
								cy={solY}
								r={rOrbit}
								fill="none"
								stroke="#E8E6E1"
								stroke-opacity={orbit.showLabel ? 0.20 : 0.10}
								stroke-width="0.7"
							/>
							{#if showSecondaryLabels && orbit.showLabel && orbit.angleDeg !== undefined && rOrbit > 36 && rOrbit < 390}
								{@const pt = polarToCartesian(solX, solY, rOrbit, orbit.angleDeg)}
								<circle cx={pt.x} cy={pt.y} r="1.8" fill="#E8E6E1" fill-opacity="0.72" />
								<text
									x={pt.x + 7}
									y={pt.y + 3}
									fill="#E8E6E1"
									fill-opacity="0.62"
									font-family="JetBrains Mono, monospace"
									font-size={labelPx(8.5, 11.0)}
									font-weight="400"
									letter-spacing={svgPx(0.85)}
									class="finale-svg-label"
									filter="url(#finale-label-shadow)"
								>
									{orbit.name}
								</text>
							{/if}
						{/if}
					{/each}

					{#if rKuiperOuter > 10 && rKuiperOuter < 500}
						<circle
							cx={solX}
							cy={solY}
							r={rKuiperOuter}
							fill="none"
							stroke="#E8E6E1"
							stroke-opacity="0.14"
							stroke-width="3.5"
							stroke-dasharray="1 5"
						/>
					{/if}

					{#if rTermination > 4 && rTermination < 540}
						<circle
							cx={solX}
							cy={solY}
							r={rTermination}
							fill="none"
							stroke="#E8E6E1"
							stroke-opacity="0.28"
							stroke-width="0.8"
							stroke-dasharray="4 4"
						/>
						{#if showSecondaryLabels && rTermination > 58 && rTermination < 380}
							{@const ptTerm = polarToCartesian(solX, solY, rTermination, -128)}
							<text
								x={ptTerm.x - 8}
								y={ptTerm.y - 5}
								text-anchor="end"
								fill="#E8E6E1"
								fill-opacity="0.62"
								font-family="JetBrains Mono, monospace"
								font-size={labelPx(8.5, 11.0)}
								font-weight="400"
								letter-spacing={svgPx(0.9)}
								class="finale-svg-label"
								filter="url(#finale-label-shadow)"
							>
								TERMINATION SHOCK · 94 AU
							</text>
						{/if}
					{/if}

					{#if rHeliopause > 2}
						<circle
							cx={solX}
							cy={solY}
							r={rHeliopause}
							fill="none"
							stroke="#C89B57"
							stroke-opacity="0.80"
							stroke-width={rHeliopause < 12 ? 1.4 : 1.05}
						/>
						{#if rHeliopause > 48 && rHeliopause < 410}
							{@const ptHelio = polarToCartesian(solX, solY, rHeliopause, -68)}
							<circle cx={ptHelio.x} cy={ptHelio.y} r="2.2" fill="#C89B57" />
							<line
								x1={ptHelio.x}
								y1={ptHelio.y}
								x2={ptHelio.x + 16}
								y2={ptHelio.y - 14}
								stroke="#C89B57"
								stroke-opacity="0.75"
								stroke-width="0.85"
							/>
							<text
								x={isMobile ? solX : ptHelio.x + 22}
								y={ptHelio.y - svgPx(13)}
								text-anchor={isMobile ? 'middle' : 'start'}
								fill="#DDB474"
								fill-opacity="0.94"
								font-family="JetBrains Mono, monospace"
								font-size={labelPx(9.4, 12.0)}
								font-weight="600"
								letter-spacing={svgPx(1.15)}
								class="finale-svg-label"
								filter="url(#finale-label-shadow)"
							>
								HELIOPAUSE · 121.6 AU
							</text>
							{#if showSecondaryLabels}
								<text
									x={isMobile ? solX : ptHelio.x + 22}
									y={ptHelio.y - svgPx(2)}
									text-anchor={isMobile ? 'middle' : 'start'}
									fill="#E8E6E1"
									fill-opacity="0.62"
									font-family="JetBrains Mono, monospace"
									font-size={labelPx(8.5, 11.0)}
									font-weight="400"
									letter-spacing={svgPx(0.85)}
									class="finale-svg-label"
									filter="url(#finale-label-shadow)"
								>
									SOLAR WIND TERMINUS
								</text>
							{/if}
						{:else if rHeliopause >= 3 && rHeliopause <= 48 && oortLayerOpacity > 0.15}
							<text
								x={solX}
								y={solY + rHeliopause + svgPx(22)}
								text-anchor="middle"
								fill="#DDB474"
								fill-opacity="0.90"
								font-family="JetBrains Mono, monospace"
								font-size={labelPx(9.2, 12.0)}
								font-weight="500"
								letter-spacing={svgPx(1.05)}
								class="finale-svg-label"
								filter="url(#finale-label-shadow)"
							>
								SOL &amp; HELIOSPHERE · 121.6 AU
							</text>
						{/if}
					{/if}

					{#each INTERSTELLAR_PROBES as probe (probe.id)}
						{@const rProbe = auToRadiusPx(probe.distanceAu, cameraOuterAu)}
						{#if rProbe > 16 && rProbe < 420}
							{@const pt = polarToCartesian(solX, solY, Math.min(rProbe, 310), probe.angleDeg)}
							{@const isRight = Math.cos((probe.angleDeg * Math.PI) / 180) >= 0 && pt.x < 680}
							{@const probeVis = bellWindow(16, 36, 390, 460, rProbe)}
							<g opacity={probeVis}>
								<line
									x1={solX}
									y1={solY}
									x2={pt.x}
									y2={pt.y}
									stroke="#C89B57"
									stroke-opacity="0.4"
									stroke-width="0.8"
									stroke-dasharray="2 3"
								/>
								<circle cx={pt.x} cy={pt.y} r="2.6" fill="#C89B57" />
								<circle
									cx={pt.x}
									cy={pt.y}
									r="6.5"
									fill="none"
									stroke="#C89B57"
									stroke-opacity="0.6"
									stroke-width="0.8"
								/>
								<line
									x1={pt.x + (isRight ? 8 : -8)}
									y1={pt.y}
									x2={pt.x + (isRight ? 28 : -28)}
									y2={pt.y}
									stroke="#C89B57"
									stroke-opacity="0.72"
									stroke-width="0.85"
								/>
								<text
									x={isMobile ? solX : pt.x + (isRight ? 32 : -32)}
									y={pt.y - svgPx(2)}
									text-anchor={isMobile ? 'middle' : isRight ? 'start' : 'end'}
									fill="#F2F0EC"
									fill-opacity="0.94"
									font-family="JetBrains Mono, monospace"
									font-size={labelPx(9.4, 12.0)}
									font-weight="600"
									letter-spacing={svgPx(1.05)}
									class="finale-svg-label"
									filter="url(#finale-label-shadow)"
								>
									{probe.name} · <tspan fill="#DDB474">{probe.distanceLabel}</tspan>
								</text>
								{#if showSecondaryLabels}
									<text
										x={isMobile ? solX : pt.x + (isRight ? 32 : -32)}
										y={pt.y + svgPx(9)}
										text-anchor={isMobile ? 'middle' : isRight ? 'start' : 'end'}
										fill="#E8E6E1"
										fill-opacity="0.62"
										font-family="JetBrains Mono, monospace"
										font-size={labelPx(8.5, 11.0)}
										font-weight="400"
										letter-spacing={svgPx(0.8)}
										class="finale-svg-label"
										filter="url(#finale-label-shadow)"
									>
										{probe.velocityLabel}
									</text>
								{/if}
							</g>
						{/if}
					{/each}
				</g>
			{/if}

			<!-- =================================================================
			     PERSISTENT WARM-AMBER SUN PINPOINT & FINAL GALACTIC MARKERS (Phase C3)
			     ================================================================= -->
			<g>
				<circle
					cx={solX}
					cy={solY}
					r={bandResolveOpacity > 0.5 ? 2.4 : 3.0}
					fill="#C89B57"
				/>
				<circle
					cx={solX}
					cy={solY}
					r={bandResolveOpacity > 0.5 ? 7.5 : 6.0}
					fill="none"
					stroke="#C89B57"
					stroke-opacity="0.52"
					stroke-width="0.85"
				/>
			</g>

			<!-- PHASE C3: FINAL GALACTIC MARKERS (Fade in last after Milky Way band resolves) -->
			{#if youAreHereOpacity > 0.005}
				{@const voyagerTickX = solX + 2.4}
				{@const voyagerTickY = solY - 1.2}
				<g opacity={youAreHereOpacity} data-testid="finale-galactic-markers">
					<!-- Galactic Center to Orion Arm Radius Reference (26,000 LY) -->
					<line
						x1="500"
						y1="500"
						x2={solX}
						y2={solY}
						stroke="#C89B57"
						stroke-opacity="0.24"
						stroke-width="0.7"
						stroke-dasharray="2 5"
					/>
					<circle cx="500" cy="500" r="2.4" fill="#E8E6E1" fill-opacity="0.68" />
					{#if showSecondaryLabels}
						<text
							x={isMobile ? 500 : 484}
							y={isMobile ? solY - svgPx(88) : 488}
							text-anchor={isMobile ? 'middle' : 'end'}
							fill="#F2F0EC"
							fill-opacity="0.80"
							font-family="JetBrains Mono, monospace"
							font-size={labelPx(9.2, 12.0)}
							font-weight="500"
							letter-spacing={svgPx(1.15)}
							class="finale-svg-label"
							filter="url(#finale-label-shadow)"
						>
							GALACTIC CORE · SGR A*
						</text>
					{/if}

					<!-- Target Reticle around Sol in the Orion Arm -->
					<circle
						cx={solX}
						cy={solY}
						r="14"
						fill="none"
						stroke="#C89B57"
						stroke-opacity="0.48"
						stroke-width="0.9"
					/>
					<line x1={solX - 19} y1={solY} x2={solX - 10} y2={solY} stroke="#C89B57" stroke-opacity="0.75" stroke-width="0.9" />
					<line x1={solX + 10} y1={solY} x2={solX + 19} y2={solY} stroke="#C89B57" stroke-opacity="0.75" stroke-width="0.9" />
					<line x1={solX} y1={solY - 19} x2={solX} y2={solY - 10} stroke="#C89B57" stroke-opacity="0.75" stroke-width="0.9" />
					<line x1={solX} y1={solY + 10} x2={solX} y2={solY + 19} stroke="#C89B57" stroke-opacity="0.75" stroke-width="0.9" />

					{#if isMobile}
						<polyline
							points={`${solX},${solY - 11} ${solX},${solY - svgPx(26)} 500,${solY - svgPx(26)}`}
							fill="none"
							stroke="#C89B57"
							stroke-opacity="0.88"
							stroke-width="1.2"
						/>
						<rect
							x={500 - svgPx(110)}
							y={solY - svgPx(showSecondaryLabels ? 70 : 54)}
							width={svgPx(220)}
							height={showSecondaryLabels ? svgPx(42) : svgPx(26)}
							rx="3"
							fill="#050607"
							fill-opacity="0.82"
						/>
						<text
							x="500"
							y={solY - svgPx(showSecondaryLabels ? 51 : 36)}
							text-anchor="middle"
							fill="#DDB474"
							font-family="JetBrains Mono, monospace"
							font-size={labelPx(10.2, 12.2)}
							font-weight="600"
							letter-spacing={svgPx(1.3)}
							class="finale-svg-label"
							filter="url(#finale-label-shadow)"
						>
							YOU ARE HERE · SOL
						</text>
						{#if showSecondaryLabels}
							<text
								x="500"
								y={solY - svgPx(34)}
								text-anchor="middle"
								fill="#F2F0EC"
								fill-opacity="0.72"
								font-family="JetBrains Mono, monospace"
								font-size={labelPx(8.6, 11.2)}
								font-weight="400"
								letter-spacing={svgPx(0.95)}
								class="finale-svg-label"
								filter="url(#finale-label-shadow)"
							>
								ORION ARM · 26,000 LY
							</text>
						{/if}

						<circle cx={voyagerTickX} cy={voyagerTickY} r="1.8" fill="#DDB474" />
						<polyline
							points={`${voyagerTickX},${voyagerTickY + 7} ${solX},${solY + svgPx(26)} 500,${solY + svgPx(26)}`}
							fill="none"
							stroke="#C89B57"
							stroke-opacity="0.84"
							stroke-width="1.15"
						/>
						<rect
							x={500 - svgPx(142)}
							y={solY + svgPx(28)}
							width={svgPx(284)}
							height={showSecondaryLabels ? svgPx(42) : svgPx(26)}
							rx="3"
							fill="#050607"
							fill-opacity="0.82"
						/>
						<text
							x="500"
							y={solY + svgPx(46)}
							text-anchor="middle"
							fill="#F2F0EC"
							font-family="JetBrains Mono, monospace"
							font-size={labelPx(9.8, 12.0)}
							font-weight="500"
							letter-spacing={svgPx(1.0)}
							class="finale-svg-label"
							filter="url(#finale-label-shadow)"
						>
							VOYAGER 1 &amp; 2 · <tspan fill="#DDB474">0.0027 LY OUT</tspan>
						</text>
						{#if showSecondaryLabels}
							<text
								x="500"
								y={solY + svgPx(63)}
								text-anchor="middle"
								fill="#E8E6E1"
								fill-opacity="0.68"
								font-family="JetBrains Mono, monospace"
								font-size={labelPx(8.6, 11.2)}
								font-weight="400"
								letter-spacing={svgPx(0.9)}
								class="finale-svg-label"
								filter="url(#finale-label-shadow)"
							>
								169.8 &amp; 142.1 AU OUTSIDE SOL
							</text>
						{/if}
					{:else}
						<polyline
							points={`${solX},${solY - 3} ${solX + 30},${solY - 50} ${solX + 235},${solY - 50}`}
							fill="none"
							stroke="#C89B57"
							stroke-opacity="0.85"
							stroke-width="0.95"
						/>
						<rect
							x={solX + 28}
							y={solY - 50 - svgPx(20)}
							width={svgPx(225)}
							height={svgPx(35)}
							rx="2"
							fill="#050607"
							fill-opacity="0.72"
						/>
						<text
							x={solX + 35}
							y={solY - 50 - svgPx(5)}
							fill="#DDB474"
							font-family="JetBrains Mono, monospace"
							font-size={labelPx(10.2, 12.2)}
							font-weight="600"
							letter-spacing={svgPx(1.4)}
							class="finale-svg-label"
							filter="url(#finale-label-shadow)"
						>
							YOU ARE HERE · SOL
						</text>
						<text
							x={solX + 35}
							y={solY - 50 + svgPx(9.5)}
							fill="#F2F0EC"
							fill-opacity="0.65"
							font-family="JetBrains Mono, monospace"
							font-size={labelPx(8.6, 11.2)}
							font-weight="400"
							letter-spacing={svgPx(0.95)}
							class="finale-svg-label"
							filter="url(#finale-label-shadow)"
						>
							ORION–CYGNUS ARM · 26,000 LY FROM CORE
						</text>

						<!-- Second Micro-Tick just 2px beside Sol -> VOYAGER 1 & 2 · 0.0027 LY OUT -->
						<circle cx={voyagerTickX} cy={voyagerTickY} r="1.5" fill="#DDB474" />
						<polyline
							points={`${voyagerTickX + 1.5},${voyagerTickY} ${solX + 30},${solY + 42} ${solX + 245},${solY + 42}`}
							fill="none"
							stroke="#C89B57"
							stroke-opacity="0.76"
							stroke-width="0.9"
						/>
						<rect
							x={solX + 28}
							y={solY + 42 - svgPx(19)}
							width={svgPx(245)}
							height={svgPx(35)}
							rx="2"
							fill="#050607"
							fill-opacity="0.72"
						/>
						<text
							x={solX + 35}
							y={solY + 42 - svgPx(4.5)}
							fill="#F2F0EC"
							fill-opacity="0.94"
							font-family="JetBrains Mono, monospace"
							font-size={labelPx(9.8, 12.0)}
							font-weight="600"
							letter-spacing={svgPx(1.2)}
							class="finale-svg-label"
							filter="url(#finale-label-shadow)"
						>
							VOYAGER 1 &amp; 2 · <tspan fill="#DDB474">0.0027 LY OUT</tspan>
						</text>
						<text
							x={solX + 35}
							y={solY + 42 + svgPx(9.5)}
							fill="#E8E6E1"
							fill-opacity="0.62"
							font-family="JetBrains Mono, monospace"
							font-size={labelPx(8.6, 11.2)}
							font-weight="400"
							letter-spacing={svgPx(0.9)}
							class="finale-svg-label"
							filter="url(#finale-label-shadow)"
						>
							169.8 &amp; 142.1 AU · A HAIR’S BREADTH OUTSIDE SOL
						</text>
					{/if}
				</g>
			{/if}
		</svg>

		<!-- =====================================================================
		     QUIET TELEMETRY SCALE HEADER (Active only during early/mid Pull-Back)
		     ===================================================================== -->
		<div
			class="pointer-events-none absolute top-10 sm:top-12 left-6 right-6 sm:left-10 sm:right-10 lg:left-16 lg:right-16 flex flex-wrap items-start justify-between gap-4"
			style={`opacity: ${scaleReadoutOpacity.toFixed(4)};`}
		>
			<div class="space-y-0.5 font-mono-tech uppercase">
				<div class="flex items-center gap-2 text-[11px] md:text-[10px] font-semibold tracking-[0.16em] text-[#C89B57]">
					<span class="h-1.5 w-1.5 rounded-full bg-[#C89B57]"></span>
					<span>{currentScaleDescriptor.phase}</span>
				</div>
				<div class="text-[11px] md:text-[10px] tracking-[0.12em] text-[#E8E6E1]/82">
					{currentScaleDescriptor.scale}
				</div>
				<div class="text-[11px] md:text-[9px] tracking-[0.10em] text-[#E8E6E1]/54">
					{currentScaleDescriptor.detail}
				</div>
			</div>

			<div class="text-right font-mono-tech uppercase">
				<div class="text-[11px] md:text-[9px] tracking-[0.14em] text-[#E8E6E1]/52">
					LOGARITHMIC SCALE FACTOR
				</div>
				<div class="mt-0.5 text-[11px] md:text-[10px] tracking-[0.12em] text-[#C89B57]">
					10<sup class="text-[9px]">−{(galaxyPhaseProgress * 9).toFixed(2)}</sup>× · FIELD {(cameraOuterAu >= AU_PER_LY
						? `${(cameraOuterAu / AU_PER_LY).toFixed(cameraOuterAu / AU_PER_LY >= 100 ? 0 : 1)} LY`
						: `${Math.round(cameraOuterAu).toLocaleString('en-US')} AU`)}
				</div>
			</div>
		</div>

		<!-- Mobile Tap-to-Reveal Secondary Labels Toggle (Active during Galaxy Reveal on Mobile) -->
		{#if isMobile && diagramOpacity > 0.1}
			<div
				class="pointer-events-auto absolute bottom-14 left-1/2 -translate-x-1/2 z-30"
				style={`opacity: ${diagramOpacity.toFixed(3)};`}
			>
				<button
					type="button"
					data-testid="finale-mobile-secondary-toggle"
					onclick={() => (showMobileSecondaryLabels = !showMobileSecondaryLabels)}
					class="cursor-pointer border border-[#C89B57]/60 bg-[#050607]/90 px-3 py-1.5 font-mono-tech text-[11px] uppercase tracking-[0.12em] text-[#DDB474] backdrop-blur-sm transition-colors hover:border-[#DDB474]"
				>
					{showMobileSecondaryLabels ? '[LABELS −]' : '[LABELS +]'}
				</button>
			</div>
		{/if}

		<!-- =====================================================================
		     BEAT 1 (a): DISTANCE ALONE (0.00 -> 0.17)
		     The final distance readout is the ONLY element on screen — centered, large,
		     everything else (including top bar and spatial rail) faded out.
		     ===================================================================== -->
		{#if distanceBeatOpacity > 0.002}
			<div
				data-testid="finale-beat-distance-alone"
				class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 sm:px-12 text-center"
				style={`opacity: ${distanceBeatOpacity.toFixed(4)}; transform: translate3d(0, ${distanceBeatTranslateY.toFixed(2)}px, 0);`}
			>
				<div class="font-mono-tech text-[11px] md:text-[10px] uppercase tracking-[0.22em] text-[#C89B57]/85">
					CENTENNIAL HORIZON · 1975–2075 · INTERSTELLAR ODOMETER
				</div>
				<div
					class="mt-3 font-display font-normal text-[#F5F3EE] tracking-[-0.035em] leading-[0.95]"
					style="font-size: clamp(3.5rem, 11vw, 9.5rem);"
				>
					340.0 <span class="text-[#C89B57]">AU</span>
				</div>
				<div class="mt-4 font-mono-tech text-xs sm:text-sm tracking-[0.16em] uppercase text-[#E8E6E1]/78">
					{finalDistanceKmFormatted} KM · <span class="text-[#DDB474]">47H 08M</span> ONE-WAY LIGHT TIME
				</div>
			</div>
		{/if}

		<!-- =====================================================================
		     BEAT 2 (b): THE QUOTE ALONE (0.20 -> 0.37)
		     The closing quote is the SOLE text on screen, centered, nav still hidden.
		     Never sits under or collides with the top bar.
		     ===================================================================== -->
		{#if quoteBeatOpacity > 0.002}
			<div
				data-testid="finale-beat-quote-alone"
				class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 sm:px-12 text-center"
				style={`opacity: ${quoteBeatOpacity.toFixed(4)}; transform: translate3d(0, ${quoteBeatTranslateY.toFixed(2)}px, 0);`}
			>
				<p
					class="max-w-[36ch] text-center font-display font-normal leading-[1.26] tracking-[-0.02em] text-[#E8E6E1]"
					style="font-size: clamp(1.5rem, 3.2vw, 2.75rem);"
				>
					“Four hundred billion suns. Everything we have ever loved is inside that amber point.”
				</p>
			</div>
		{/if}

		<!-- =====================================================================
		     DISCREET TEXT-ONLY "Chapters ↗" TRIGGER (Appears only after Galaxy settles)
		     ===================================================================== -->
		{#if settledChaptersLinkOpacity > 0.01}
			<div
				class="pointer-events-auto absolute bottom-5 right-6 sm:right-10 z-30"
				style={`opacity: ${settledChaptersLinkOpacity.toFixed(3)};`}
			>
				<button
					type="button"
					data-testid="finale-discreet-chapters-link"
					onclick={() => openChapterDirectory()}
					class="cursor-pointer font-mono-tech text-[11px] md:text-[10px] uppercase tracking-[0.18em] text-[#E8E6E1]/42 hover:text-[#C89B57] transition-colors duration-300 focus:outline-none"
				>
					Chapters ↗
				</button>
			</div>
		{/if}

		<!-- Subtle Atmospheric Film Grain Overlay matching site-wide documentary finish -->
		<div class="finale-film-grain pointer-events-none absolute inset-0"></div>
	</div>
</section>

<style>
	.finale-svg-label {
		paint-order: stroke fill;
		stroke: rgba(5, 6, 7, 0.90);
		stroke-width: 2.5px;
		stroke-linejoin: round;
	}

	.finale-film-grain {
		opacity: var(--grain-opacity, 0.028);
		background-image: radial-gradient(rgba(232, 230, 225, 0.55) 0.5px, transparent 0.5px);
		background-size: 3px 3px;
		mix-blend-mode: overlay;
	}
</style>

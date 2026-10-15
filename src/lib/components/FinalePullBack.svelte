<script lang="ts">
	import { onMount } from 'svelte';

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

	// Deterministic background dust/cometary particles for Oort Cloud & Orion Arm
	const OORT_MOTES = Array.from({ length: 72 }, (_, i) => {
		const goldenAngle = i * 137.50776405;
		const frac = (i + 0.5) / 72;
		const logAu = Math.log10(2_000) + frac * (Math.log10(100_000) - Math.log10(2_000));
		return {
			au: Math.pow(10, logAu),
			angleRad: (goldenAngle * Math.PI) / 180,
			size: 0.75 + (i % 3) * 0.4,
			alpha: 0.18 + ((i * 7) % 10) * 0.032
		};
	});

	let sectionEl: HTMLElement | undefined = $state();
	let targetP = $state(0);
	let smoothP = $state(0);

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

	// Continuous logarithmic zoom factor requested in specification:
	// scale = Math.pow(10, -smoothP * 9)
	const zoomScale = $derived(Math.pow(10, -smoothP * 9));

	// Camera field-of-view radius in AU mapped continuously from smoothP:
	// At smoothP = 0.15 -> ~280 AU (Heliosphere + Voyager 1/2 fill the stage)
	// At smoothP = 0.45 -> ~140,000 AU (Oort Cloud fills the stage)
	// At smoothP = 0.66 -> ~1.1e8 AU (~1,800 ly: Local Bubble -> Kepler-90 -> Orion Arm)
	// At smoothP = 0.90 -> ~6.32e9 AU (100,000 ly: Full Milky Way Disk)
	const cameraOuterAu = $derived.by(() => {
		const pNorm = clamp01((smoothP - 0.14) / 0.78);
		// Span 9 orders of magnitude anchored by zoomScale = 10^(-smoothP * 9)
		const scaleFactor = Math.pow(10, -pNorm * 8.35) * (0.95 + 0.05 * zoomScale);
		return 28.0 / Math.max(1e-10, scaleFactor);
	});

	// Convert any physical distance in AU to screen radius (in our 1000x1000 SVG coordinate space)
	// We blend projective radial scaling with subtle logarithmic compression so inner shells stay
	// crisp while outer shells sweep smoothly from the perimeter to the pinpoint center.
	function auToRadiusPx(distanceAu: number, currentOuterAu: number): number {
		const ratio = distanceAu / Math.max(1e-6, currentOuterAu);
		if (ratio <= 0) return 0;
		// Power-law / projective hybrid keeps concentric shells proportional while avoiding abrupt pop-in
		const r = 340 * Math.pow(ratio, 0.42);
		return Math.min(1800, r);
	}

	// Focal origin in the 1000x1000 SVG coordinate system:
	// Centered at (500, 500) during Heliosphere -> Oort -> Local Stars, then smoothly drifts
	// to Sol's position in the Orion–Cygnus Arm (~26,000 ly from Galactic Center: x=618, y=556)
	const focalTransfer = $derived(smoothstep(0.68, 0.86, smoothP));
	const solX = $derived(500 + focalTransfer * 118);
	const solY = $derived(500 + focalTransfer * 56);

	// Beat opacities following exact choreography windows
	// Beat 1: 0.00 - 0.18 (Near-Black Opening)
	const beat1Opacity = $derived(
		smoothP < 0.02
			? smoothstep(0.0, 0.02, Math.max(0.02, smoothP + 0.02))
			: 1 - smoothstep(0.11, 0.18, smoothP)
	);
	const beat1TranslateY = $derived(-smoothstep(0.1, 0.18, smoothP) * 18);

	// Beat 2: 0.15 - 0.38 (The Heliosphere, 10^2 AU)
	const beat2Opacity = $derived(bellWindow(0.13, 0.19, 0.33, 0.40, smoothP));

	// Beat 3: 0.35 - 0.58 (The Oort Cloud, 10^4 - 10^5 AU)
	const beat3Opacity = $derived(bellWindow(0.33, 0.40, 0.53, 0.60, smoothP));

	// Beat 4: 0.55 - 0.78 (Local Stellar Neighborhood & The Orion Arm, 10^1 - 10^3 ly)
	const beat4Opacity = $derived(bellWindow(0.53, 0.60, 0.72, 0.79, smoothP));

	// Beat 5: 0.72 - 1.00 (Full Milky Way Panorama & Final Line, 100,000 ly)
	const beat5Opacity = $derived(smoothstep(0.71, 0.86, smoothP));
	const panoramaScale = $derived(1.38 - 0.38 * smoothstep(0.72, 0.98, smoothP));
	const youAreHereOpacity = $derived(smoothstep(0.76, 0.88, smoothP));
	const finalQuoteOpacity = $derived(smoothstep(0.82, 0.93, smoothP));
	const finalQuoteTranslateY = $derived((1 - smoothstep(0.82, 0.93, smoothP)) * 18);

	// Overall spatial diagram visibility (active from Beat 2 through Beat 5)
	const diagramOpacity = $derived(smoothstep(0.12, 0.18, smoothP));

	// Live telemetry scale readout for top-left quiet indicator (fades out before final closing state so Beat 5 is pure)
	const scaleReadoutOpacity = $derived(bellWindow(0.14, 0.19, 0.76, 0.84, smoothP));

	const currentScaleDescriptor = $derived.by(() => {
		if (smoothP < 0.36) {
			return {
				phase: 'BEAT II // THE HELIOSPHERE',
				scale: '10² AU · INTERSTELLAR BOUNDARY',
				detail: 'HELIOPAUSE 121.6 AU · VOYAGER 1 AT 169.8 AU'
			};
		}
		if (smoothP < 0.56) {
			return {
				phase: 'BEAT III // THE OORT CLOUD',
				scale: '10⁴ – 10⁵ AU · COMETARY RESERVOIR',
				detail: '2,000 – 100,000 AU · GRAVITATIONAL DOMINANCE OF SOL'
			};
		}
		return {
			phase: 'BEAT IV // STELLAR NEIGHBORHOOD & ORION ARM',
			scale: '10¹ – 10³ LIGHT-YEARS · LOCAL SPIRAL SPUR',
			detail: 'ALPHA CENTAURI (4.37 LY) TO KEPLER-90 (2,790 LY)'
		};
	});

	function computeTargetProgress() {
		if (!sectionEl || typeof window === 'undefined') return;
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
				smoothP += delta * 0.12;
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
	aria-label="The Pull-Back: From the Heliosphere to the Milky Way Galaxy"
	class="relative w-full min-h-[200vh] md:min-h-[260vh] bg-[#050607] select-none"
>
	<!-- Sticky Full-Viewport Stage -->
	<div class="sticky top-0 z-20 h-screen w-full overflow-hidden bg-[#050607]">
		<!-- =====================================================================
		     LAYER 1: REAL ESA GAIA / NASA SVS ALL-SKY MILKY WAY PANORAMA (Beat 5)
		     ===================================================================== -->
		<div
			class="absolute inset-0 pointer-events-none will-change-transform"
			style={`opacity: ${beat5Opacity.toFixed(4)}; transform: scale(${panoramaScale.toFixed(4)});`}
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
					class="h-full w-full object-cover object-center finale-gaia-grade"
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
		     LAYER 2: CONTINUOUS LOGARITHMIC PULL-BACK CARTOGRAPHY (SVG)
		     ===================================================================== -->
		<svg
			viewBox="0 0 1000 1000"
			preserveAspectRatio="xMidYMid meet"
			class="absolute inset-0 h-full w-full pointer-events-none"
			style={`opacity: ${diagramOpacity.toFixed(4)};`}
			aria-hidden="true"
		>
			<defs>
				<!-- Warm Amber Heliosphere Core Glow -->
				<radialGradient id="heliosphere-glow" cx="50%" cy="50%" r="50%">
					<stop offset="0%" stop-color="#C89B57" stop-opacity="0.34" />
					<stop offset="55%" stop-color="#C89B57" stop-opacity="0.08" />
					<stop offset="100%" stop-color="#C89B57" stop-opacity="0" />
				</radialGradient>

				<!-- Spherical Oort Cloud Shell Gradient -->
				<radialGradient id="oort-shell-gradient" cx="50%" cy="50%" r="50%">
					<stop offset="0%" stop-color="#E8E6E1" stop-opacity="0" />
					<stop offset="35%" stop-color="#E8E6E1" stop-opacity="0.03" />
					<stop offset="72%" stop-color="#C89B57" stop-opacity="0.075" />
					<stop offset="92%" stop-color="#E8E6E1" stop-opacity="0.04" />
					<stop offset="100%" stop-color="#E8E6E1" stop-opacity="0" />
				</radialGradient>

				<!-- Orion-Cygnus Spiral Arm Luminous Spur Gradient -->
				<linearGradient id="orion-arm-band" x1="0%" y1="0%" x2="100%" y2="100%">
					<stop offset="0%" stop-color="#E8E6E1" stop-opacity="0" />
					<stop offset="28%" stop-color="#E8E6E1" stop-opacity="0.065" />
					<stop offset="52%" stop-color="#C89B57" stop-opacity="0.09" />
					<stop offset="76%" stop-color="#E8E6E1" stop-opacity="0.055" />
					<stop offset="100%" stop-color="#E8E6E1" stop-opacity="0" />
				</linearGradient>
			</defs>

			<!-- Subtle Astrometric Crosshair Reference Axes centered on Sol -->
			<g opacity={Math.max(0, 0.22 * (1 - beat5Opacity))}>
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
			     BEAT 4 LAYER: ORION-CYGNUS SPIRAL ARM & LOCAL STELLAR NEIGHBORHOOD
			     (0.55 - 0.78)
			     ================================================================= -->
			{#if beat4Opacity > 0.005}
				{@const rLocalBubble = auToRadiusPx(300 * AU_PER_LY, cameraOuterAu)}
				{@const rOrionArmScale = auToRadiusPx(3_500 * AU_PER_LY, cameraOuterAu)}
				<g opacity={beat4Opacity}>
					<!-- Orion–Cygnus Spiral Arm Sweeping Band passing through Sol -->
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
							stroke-width="1"
							stroke-dasharray="4 6"
						/>
						<!-- Sagittarius–Carina & Perseus Neighboring Spiral Arm Hints -->
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

						{#if rOrionArmScale > 45 && rOrionArmScale < 520}
							<text
								x={rOrionArmScale * 0.52}
								y={rOrionArmScale * 0.28 - 10}
								fill="#C89B57"
								fill-opacity="0.78"
								font-family="JetBrains Mono, monospace"
								font-size="9.5"
								letter-spacing="2.2"
							>
								ORION–CYGNUS SPIRAL ARM · 3,500 LY WIDTH
							</text>
						{/if}
					</g>

					<!-- Local Bubble Shell (~300 ly cavity) -->
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
						{#if rLocalBubble > 36 && rLocalBubble < 410}
							<text
								x={solX}
								y={solY + rLocalBubble + 14}
								text-anchor="middle"
								fill="#E8E6E1"
								fill-opacity="0.48"
								font-family="JetBrains Mono, monospace"
								font-size="8.5"
								letter-spacing="1.8"
							>
								LOCAL INTERSTELLAR BUBBLE · ~300 LY
							</text>
						{/if}
					{/if}

					<!-- Nearby Stellar Neighbors -->
					{#each NEARBY_STARS as star (star.id)}
						{@const rStar = auToRadiusPx(star.distanceAu, cameraOuterAu)}
						{#if rStar > 6 && rStar < 620}
							{@const pt = polarToCartesian(solX, solY, rStar, star.angleDeg)}
							{@const labelRight = Math.cos((star.angleDeg * Math.PI) / 180) >= 0}
							{@const starVis = bellWindow(8, 22, 430, 560, rStar)}
							<g opacity={starVis}>
								<!-- Faint radial distance ring -->
								<circle
									cx={solX}
									cy={solY}
									r={rStar}
									fill="none"
									stroke="#E8E6E1"
									stroke-opacity="0.09"
									stroke-width="0.7"
								/>
								<!-- Line from Sol toward star -->
								<line
									x1={solX}
									y1={solY}
									x2={pt.x}
									y2={pt.y}
									stroke={star.color}
									stroke-opacity="0.22"
									stroke-width="0.75"
								/>
								<!-- Star point -->
								<circle cx={pt.x} cy={pt.y} r="3" fill={star.color} />
								<circle
									cx={pt.x}
									cy={pt.y}
									r="7"
									fill="none"
									stroke={star.color}
									stroke-opacity="0.4"
									stroke-width="0.8"
								/>
								<!-- Leader tick + Telemetry Callout -->
								<line
									x1={pt.x + (labelRight ? 8 : -8)}
									y1={pt.y}
									x2={pt.x + (labelRight ? 24 : -24)}
									y2={pt.y}
									stroke={star.color}
									stroke-opacity="0.55"
									stroke-width="0.8"
								/>
								<text
									x={pt.x + (labelRight ? 29 : -29)}
									y={pt.y - 3}
									text-anchor={labelRight ? 'start' : 'end'}
									fill="#E8E6E1"
									fill-opacity="0.9"
									font-family="JetBrains Mono, monospace"
									font-size="9.5"
									letter-spacing="1.6"
								>
									{star.name} · <tspan fill="#C89B57">{star.distanceLy.toLocaleString('en-US')} LY</tspan>
								</text>
								<text
									x={pt.x + (labelRight ? 29 : -29)}
									y={pt.y + 9}
									text-anchor={labelRight ? 'start' : 'end'}
									fill="#E8E6E1"
									fill-opacity="0.48"
									font-family="JetBrains Mono, monospace"
									font-size="8"
									letter-spacing="1.5"
								>
									{star.spectral} // {star.note}
								</text>
							</g>
						{/if}
					{/each}
				</g>
			{/if}

			<!-- =================================================================
			     BEAT 3 LAYER: THE OORT CLOUD (2,000 - 100,000 AU)
			     (0.35 - 0.58)
			     ================================================================= -->
			{#if beat3Opacity > 0.005}
				{@const rHillsInner = auToRadiusPx(2_000, cameraOuterAu)}
				{@const rHillsOuter = auToRadiusPx(20_000, cameraOuterAu)}
				{@const rOortOuter = auToRadiusPx(100_000, cameraOuterAu)}
				<g opacity={beat3Opacity}>
					<!-- Spherical Outer Oort Cloud Halo -->
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
							stroke-width="1"
							stroke-dasharray="3 5"
						/>
					{/if}

					<!-- Inner Hills Cloud Torus -->
					{#if rHillsOuter > 4}
						<circle
							cx={solX}
							cy={solY}
							r={rHillsOuter}
							fill="none"
							stroke="#E8E6E1"
							stroke-opacity="0.28"
							stroke-width="0.85"
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
							stroke-opacity="0.18"
							stroke-width="0.7"
						/>
					{/if}

					<!-- Cometary Reservoir Dust Motes -->
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

					<!-- Oort Shell Callout Labels -->
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
									x2={pt.x + 22}
									y2={pt.y - 16}
									stroke="#C89B57"
									stroke-opacity="0.6"
									stroke-width="0.8"
								/>
								<line
									x1={pt.x + 22}
									y1={pt.y - 16}
									x2={pt.x + 68}
									y2={pt.y - 16}
									stroke="#C89B57"
									stroke-opacity="0.6"
									stroke-width="0.8"
								/>
								<text
									x={pt.x + 74}
									y={pt.y - 19}
									fill="#E8E6E1"
									fill-opacity="0.9"
									font-family="JetBrains Mono, monospace"
									font-size="9.5"
									letter-spacing="1.6"
								>
									{oort.label}
								</text>
								<text
									x={pt.x + 74}
									y={pt.y - 7}
									fill="#C89B57"
									fill-opacity="0.85"
									font-family="JetBrains Mono, monospace"
									font-size="8.5"
									letter-spacing="1.5"
								>
									{oort.distanceText}
								</text>
							</g>
						{/if}
					{/each}
				</g>
			{/if}

			<!-- =================================================================
			     BEAT 2 LAYER: THE HELIOSPHERE (10^2 AU) & VOYAGER 1 / 2
			     (0.15 - 0.38, contracting into a warm-amber pinpoint in Beat 3)
			     ================================================================= -->
			{#if beat2Opacity > 0.005 || beat3Opacity > 0.005}
				{@const rHeliopause = auToRadiusPx(121.6, cameraOuterAu)}
				{@const rTermination = auToRadiusPx(94.0, cameraOuterAu)}
				{@const rKuiperOuter = auToRadiusPx(50.0, cameraOuterAu)}
				<g opacity={Math.max(beat2Opacity, beat3Opacity * 0.85)}>
					<!-- Warm Amber Heliosphere Cavity Glow -->
					{#if rHeliopause > 1.5}
						<circle
							cx={solX}
							cy={solY}
							r={Math.max(4, rHeliopause * 1.18)}
							fill="url(#heliosphere-glow)"
						/>
					{/if}

					<!-- Planetary Orbits (1 AU to 30.1 AU Neptune) -->
					{#each PLANET_ORBITS as orbit (orbit.name)}
						{@const rOrbit = auToRadiusPx(orbit.au, cameraOuterAu)}
						{#if rOrbit > 2.5 && rOrbit < 550}
							<circle
								cx={solX}
								cy={solY}
								r={rOrbit}
								fill="none"
								stroke="#E8E6E1"
								stroke-opacity={orbit.showLabel ? 0.22 : 0.11}
								stroke-width="0.75"
							/>
							{#if orbit.showLabel && orbit.angleDeg !== undefined && rOrbit > 36 && rOrbit < 390}
								{@const pt = polarToCartesian(solX, solY, rOrbit, orbit.angleDeg)}
								<circle cx={pt.x} cy={pt.y} r="1.8" fill="#E8E6E1" fill-opacity="0.7" />
								<text
									x={pt.x + 7}
									y={pt.y + 3}
									fill="#E8E6E1"
									fill-opacity="0.52"
									font-family="JetBrains Mono, monospace"
									font-size="8"
									letter-spacing="1.5"
								>
									{orbit.name}
								</text>
							{/if}
						{/if}
					{/each}

					<!-- Kuiper Belt Outer Edge (50 AU) -->
					{#if rKuiperOuter > 10 && rKuiperOuter < 500}
						<circle
							cx={solX}
							cy={solY}
							r={rKuiperOuter}
							fill="none"
							stroke="#E8E6E1"
							stroke-opacity="0.15"
							stroke-width="4"
							stroke-dasharray="1 5"
						/>
					{/if}

					<!-- Termination Shock (94.0 AU) -->
					{#if rTermination > 4 && rTermination < 540}
						<circle
							cx={solX}
							cy={solY}
							r={rTermination}
							fill="none"
							stroke="#E8E6E1"
							stroke-opacity="0.32"
							stroke-width="0.9"
							stroke-dasharray="4 4"
						/>
						{#if rTermination > 58 && rTermination < 380}
							{@const ptTerm = polarToCartesian(solX, solY, rTermination, -128)}
							<text
								x={ptTerm.x - 8}
								y={ptTerm.y - 6}
								text-anchor="end"
								fill="#E8E6E1"
								fill-opacity="0.62"
								font-family="JetBrains Mono, monospace"
								font-size="8.5"
								letter-spacing="1.6"
							>
								TERMINATION SHOCK · 94 AU
							</text>
						{/if}
					{/if}

					<!-- Heliopause Boundary (121.6 AU) -->
					{#if rHeliopause > 2}
						<circle
							cx={solX}
							cy={solY}
							r={rHeliopause}
							fill="none"
							stroke="#C89B57"
							stroke-opacity="0.82"
							stroke-width={rHeliopause < 12 ? 1.5 : 1.15}
						/>
						{#if rHeliopause > 48 && rHeliopause < 410}
							{@const ptHelio = polarToCartesian(solX, solY, rHeliopause, -68)}
							<circle cx={ptHelio.x} cy={ptHelio.y} r="2.3" fill="#C89B57" />
							<line
								x1={ptHelio.x}
								y1={ptHelio.y}
								x2={ptHelio.x + 20}
								y2={ptHelio.y - 18}
								stroke="#C89B57"
								stroke-opacity="0.7"
								stroke-width="0.85"
							/>
							<text
								x={ptHelio.x + 26}
								y={ptHelio.y - 21}
								fill="#C89B57"
								font-family="JetBrains Mono, monospace"
								font-size="9.5"
								letter-spacing="1.8"
							>
								HELIOPAUSE · 121.6 AU
							</text>
							<text
								x={ptHelio.x + 26}
								y={ptHelio.y - 9}
								fill="#E8E6E1"
								fill-opacity="0.55"
								font-family="JetBrains Mono, monospace"
								font-size="8"
								letter-spacing="1.4"
							>
								SOLAR WIND TERMINUS
							</text>
						{:else if rHeliopause >= 3 && rHeliopause <= 48 && beat3Opacity > 0.15}
							<!-- Pinpoint Heliosphere label during Oort Cloud pull-back -->
							<text
								x={solX + rHeliopause + 10}
								y={solY + 3}
								fill="#C89B57"
								fill-opacity="0.88"
								font-family="JetBrains Mono, monospace"
								font-size="8.5"
								letter-spacing="1.6"
							>
								HELIOSPHERE PINPOINT · 121.6 AU
							</text>
						{/if}
					{/if}

					<!-- Voyager 1 (169.8 AU) & Voyager 2 (142.1 AU) Flagged Outside Heliopause -->
					{#each INTERSTELLAR_PROBES as probe (probe.id)}
						{@const rProbe = auToRadiusPx(probe.distanceAu, cameraOuterAu)}
						{#if rProbe > 16 && rProbe < 420}
							{@const pt = polarToCartesian(solX, solY, Math.min(rProbe, 310), probe.angleDeg)}
							{@const isRight = Math.cos((probe.angleDeg * Math.PI) / 180) >= 0 && pt.x < 680}
							{@const probeVis = bellWindow(16, 36, 390, 460, rProbe)}
							<g opacity={probeVis}>
								<!-- Escape trajectory ray from Sol through Heliopause to Probe -->
								<line
									x1={solX}
									y1={solY}
									x2={pt.x}
									y2={pt.y}
									stroke="#C89B57"
									stroke-opacity="0.42"
									stroke-width="0.85"
									stroke-dasharray="2 3"
								/>
								<!-- Target reticle on probe -->
								<circle cx={pt.x} cy={pt.y} r="3" fill="#C89B57" />
								<circle
									cx={pt.x}
									cy={pt.y}
									r="7.5"
									fill="none"
									stroke="#C89B57"
									stroke-opacity="0.65"
									stroke-width="0.85"
								/>
								<!-- Callout Hairline -->
								<line
									x1={pt.x + (isRight ? 9 : -9)}
									y1={pt.y}
									x2={pt.x + (isRight ? 34 : -34)}
									y2={pt.y}
									stroke="#C89B57"
									stroke-opacity="0.78"
									stroke-width="0.9"
								/>
								<text
									x={pt.x + (isRight ? 40 : -40)}
									y={pt.y - 3}
									text-anchor={isRight ? 'start' : 'end'}
									fill="#E8E6E1"
									font-family="JetBrains Mono, monospace"
									font-size="10"
									letter-spacing="1.7"
								>
									{probe.name} · <tspan fill="#C89B57">{probe.distanceLabel}</tspan>
								</text>
								<text
									x={pt.x + (isRight ? 40 : -40)}
									y={pt.y + 9}
									text-anchor={isRight ? 'start' : 'end'}
									fill="#E8E6E1"
									fill-opacity="0.54"
									font-family="JetBrains Mono, monospace"
									font-size="8"
									letter-spacing="1.4"
								>
									{probe.velocityLabel}
								</text>
							</g>
						{/if}
					{/each}
				</g>
			{/if}

			<!-- =================================================================
			     PERSISTENT WARM-AMBER SUN PINPOINT & BEAT 5 GALACTIC MARKERS
			     ================================================================= -->
			<!-- Sol Amber Point (always anchored at [solX, solY]) -->
			<g>
				<circle
					cx={solX}
					cy={solY}
					r={beat5Opacity > 0.5 ? 2.6 : 3.2}
					fill="#C89B57"
				/>
				<circle
					cx={solX}
					cy={solY}
					r={beat5Opacity > 0.5 ? 8.5 : 6.5}
					fill="none"
					stroke="#C89B57"
					stroke-opacity="0.55"
					stroke-width="0.9"
				/>
			</g>

			<!-- BEAT 5: WHISPER-THIN #C89B57 WARM-AMBER TARGET MARKER & 1PX HAIRLINES -->
			{#if youAreHereOpacity > 0.005}
				<!-- Voyager 1 & 2 Micro-Tick literally 2px beside Sol ("a hair's breadth outside it") -->
				{@const voyagerTickX = solX + 2.4}
				{@const voyagerTickY = solY - 1.2}
				<g opacity={youAreHereOpacity}>
					<!-- Galactic Center to Orion Arm Radius Reference (26,000 LY) -->
					<line
						x1="500"
						y1="500"
						x2={solX}
						y2={solY}
						stroke="#C89B57"
						stroke-opacity="0.26"
						stroke-width="0.75"
						stroke-dasharray="2 5"
					/>
					<circle cx="500" cy="500" r="2" fill="#E8E6E1" fill-opacity="0.45" />
					<text
						x="484"
						y="488"
						text-anchor="end"
						fill="#E8E6E1"
						fill-opacity="0.48"
						font-family="JetBrains Mono, monospace"
						font-size="8.5"
						letter-spacing="1.6"
					>
						GALACTIC CORE · SGR A*
					</text>

					<!-- Target Reticle around Sol in the Orion Arm -->
					<circle
						cx={solX}
						cy={solY}
						r="15"
						fill="none"
						stroke="#C89B57"
						stroke-opacity="0.38"
						stroke-width="0.75"
					/>
					<line
						x1={solX - 21}
						y1={solY}
						x2={solX - 11}
						y2={solY}
						stroke="#C89B57"
						stroke-opacity="0.7"
						stroke-width="0.85"
					/>
					<line
						x1={solX + 11}
						y1={solY}
						x2={solX + 21}
						y2={solY}
						stroke="#C89B57"
						stroke-opacity="0.7"
						stroke-width="0.85"
					/>
					<line
						x1={solX}
						y1={solY - 21}
						x2={solX}
						y2={solY - 11}
						stroke="#C89B57"
						stroke-opacity="0.7"
						stroke-width="0.85"
					/>
					<line
						x1={solX}
						y1={solY + 11}
						x2={solX}
						y2={solY + 21}
						stroke="#C89B57"
						stroke-opacity="0.7"
						stroke-width="0.85"
					/>

					<!-- 1px Amber Hairline #1 -> YOU ARE HERE · SOL (Upward-Right) -->
					<polyline
						points={`${solX},${solY - 3} ${solX + 34},${solY - 54} ${solX + 240},${solY - 54}`}
						fill="none"
						stroke="#C89B57"
						stroke-opacity="0.88"
						stroke-width="1"
					/>
					<text
						x={solX + 38}
						y={solY - 64}
						fill="#C89B57"
						font-family="JetBrains Mono, monospace"
						font-size="11"
						font-weight="500"
						letter-spacing="2.1"
					>
						YOU ARE HERE · SOL
					</text>
					<text
						x={solX + 38}
						y={solY - 40}
						fill="#E8E6E1"
						fill-opacity="0.62"
						font-family="JetBrains Mono, monospace"
						font-size="8.2"
						letter-spacing="1.5"
					>
						ORION–CYGNUS ARM · 26,000 LY FROM CORE
					</text>

					<!-- Second Micro-Tick just 2px beside Sol -> VOYAGER 1 & 2 · 0.0027 LIGHT-YEARS OUT -->
					<circle cx={voyagerTickX} cy={voyagerTickY} r="1.25" fill="#DDB474" />
					<polyline
						points={`${voyagerTickX + 1.5},${voyagerTickY} ${solX + 34},${solY + 42} ${solX + 240},${solY + 42}`}
						fill="none"
						stroke="#C89B57"
						stroke-opacity="0.72"
						stroke-width="0.9"
					/>
					<text
						x={solX + 38}
						y={solY + 33}
						fill="#E8E6E1"
						fill-opacity="0.92"
						font-family="JetBrains Mono, monospace"
						font-size="9.5"
						letter-spacing="1.6"
					>
						VOYAGER 1 &amp; 2 · <tspan fill="#C89B57">0.0027 LY OUT</tspan>
					</text>
					<text
						x={solX + 38}
						y={solY + 54}
						fill="#E8E6E1"
						fill-opacity="0.54"
						font-family="JetBrains Mono, monospace"
						font-size="8"
						letter-spacing="1.4"
					>
						169.8 &amp; 142.1 AU · A HAIR’S BREADTH OUTSIDE SOL
					</text>
				</g>
			{/if}
		</svg>

		<!-- =====================================================================
		     LAYER 3: QUIET TELEMETRY SCALE HEADER (Active during Beats 2–4)
		     ===================================================================== -->
		<div
			class="
				pointer-events-none absolute top-16 sm:top-20 left-6 right-6 sm:left-10 sm:right-10 lg:left-16 lg:right-48
				flex flex-wrap items-start justify-between gap-4
			"
			style={`opacity: ${scaleReadoutOpacity.toFixed(4)};`}
		>
			<div class="space-y-1 font-mono-tech uppercase">
				<div class="flex items-center gap-2.5 text-[11px] tracking-[0.16em] text-[#C89B57]">
					<span class="h-1.5 w-1.5 rounded-full bg-[#C89B57]"></span>
					<span>{currentScaleDescriptor.phase}</span>
				</div>
				<div class="text-xs sm:text-sm tracking-[0.14em] text-[#E8E6E1]/88">
					{currentScaleDescriptor.scale}
				</div>
				<div class="text-[10px] tracking-[0.16em] text-[#E8E6E1]/50">
					{currentScaleDescriptor.detail}
				</div>
			</div>

			<div class="text-right font-mono-tech uppercase">
				<div class="text-[10px] tracking-[0.16em] text-[#E8E6E1]/48">
					LOGARITHMIC SCALE FACTOR
				</div>
				<div class="mt-0.5 text-xs tracking-[0.14em] text-[#C89B57]">
					10<sup class="text-[9px]">−{(smoothP * 9).toFixed(2)}</sup>× · FIELD {(cameraOuterAu >= AU_PER_LY
						? `${(cameraOuterAu / AU_PER_LY).toFixed(cameraOuterAu / AU_PER_LY >= 100 ? 0 : 1)} LY`
						: `${Math.round(cameraOuterAu).toLocaleString('en-US')} AU`)}
				</div>
			</div>
		</div>

		<!-- =====================================================================
		     LAYER 4: BEAT 1 (0.00 - 0.18) — NEAR-BLACK OPENING COPY
		     ===================================================================== -->
		<div
			class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 sm:px-12"
			style={`opacity: ${beat1Opacity.toFixed(4)}; transform: translate3d(0, ${beat1TranslateY.toFixed(2)}px, 0);`}
		>
			<div class="font-mono-tech text-[10px] sm:text-[11px] uppercase tracking-[0.18em] text-[#C89B57]/85 text-center">
				FINAL HORIZON · 340 AU TO 100,000 LIGHT-YEARS · LOGARITHMIC PULL-BACK
			</div>
			<p
				class="max-w-[36ch] text-center font-display font-normal italic leading-[1.24] tracking-[-0.02em] text-[#E8E6E1]"
				style="font-size: clamp(1.5rem, 3vw, 2.5rem);"
			>
				“Fifty years of fire and radio, and we have barely stepped off the shoreline.”
			</p>
		</div>

		<!-- =====================================================================
		     LAYER 5: BEAT 5 (smoothP > 0.82) — FINAL CLOSING LINE AT BOTTOM-CENTER
		     ===================================================================== -->
		<div
			class="pointer-events-none absolute inset-x-0 bottom-12 sm:bottom-16 flex flex-col items-center justify-end px-6 sm:px-12"
			style={`opacity: ${finalQuoteOpacity.toFixed(4)}; transform: translate3d(0, ${finalQuoteTranslateY.toFixed(2)}px, 0);`}
		>
			<p
				class="max-w-[42ch] text-center font-display font-normal leading-[1.28] tracking-[-0.02em] text-[#E8E6E1]"
				style="font-size: clamp(1.35rem, 2.4vw, 2.15rem);"
			>
				“Four hundred billion suns. Everything we have ever loved is inside that amber point.”
			</p>
		</div>

		<!-- Subtle Atmospheric Film Grain Overlay matching site-wide documentary finish -->
		<div class="finale-film-grain pointer-events-none absolute inset-0"></div>
	</div>
</section>

<style>
	.finale-gaia-grade {
		filter: saturate(0.90) contrast(1.15) brightness(0.86);
	}

	.finale-film-grain {
		opacity: var(--grain-opacity, 0.028);
		background-image: radial-gradient(rgba(232, 230, 225, 0.55) 0.5px, transparent 0.5px);
		background-size: 3px 3px;
		mix-blend-mode: overlay;
	}
</style>

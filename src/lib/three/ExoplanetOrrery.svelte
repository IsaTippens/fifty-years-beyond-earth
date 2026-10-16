<script lang="ts">
	import { onMount, tick } from 'svelte';
	import * as THREE from 'three';
	import {
		EXOPLANET_SYSTEMS,
		EXOPLANET_SYSTEMS_BY_ID,
		EXOPLANET_CENSUS,
		type ExoplanetSystemId,
		type ExoplanetSystemData,
		type ExoplanetData,
		type PlanetShaderStyle
	} from '$lib/data/exoplanets';

	// --- Reactive State (Svelte 5 Runes) ---
	let selectedSystemId = $state<ExoplanetSystemId>('trappist-1');
	let selectedPlanetId = $state<string>('trappist-1-e');
	let timeSpeedDaysPerSec = $state<number>(1.0);
	let isPaused = $state<boolean>(false);
	let showHabitableZone = $state<boolean>(true);
	let showSolarScaleOverlay = $state<boolean>(false);
	let showOrbitLabels = $state<boolean>(true);
	let simulationDays = $state<number>(0);
	let hoveredWavelengthUm = $state<number | null>(null);
	let activeConjunctions = $state<
		Array<{ pairLabel: string; ratio: string; intensity: number; planetA: string; planetB: string }>
	>([]);
	let conjunctionCount = $state<number>(14);
	let isVisibleInViewport = $state<boolean>(true);
	let isDraggingCanvas = $state<boolean>(false);
	let cameraPreset = $state<'perspective' | 'top-down' | 'transit'>('perspective');
	let mobileLiteMode = $state<boolean>(false);
	let isMobileViewport = $state<boolean>(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
	let dataPanelOpen = $state<boolean>(typeof window !== 'undefined' ? window.innerWidth >= 768 : false);
	let orbitAzimuthDeg = $state<number>(Math.round((0.62 * 180) / Math.PI));
	let orbitElevationDeg = $state<number>(Math.round((0.56 * 180) / Math.PI));
	let cleanupOrreryWebGL: (() => void) | null = null;
	// Projected 2D screen coordinates for planet labels
	let projectedLabels = $state<
		Array<{
			id: string;
			letter: string;
			name: string;
			x: number;
			y: number;
			visible: boolean;
			inHz: boolean;
			isSelected: boolean;
			isRef: boolean;
		}>
	>([]);

	// Derived current system and planet
	let currentSystem = $derived<ExoplanetSystemData>(EXOPLANET_SYSTEMS_BY_ID[selectedSystemId]);
	let selectedPlanet = $derived<ExoplanetData>(
		currentSystem.planets.find((p) => p.id === selectedPlanetId) ?? currentSystem.planets[0]
	);

	// DOM References
	let containerEl: HTMLDivElement | undefined = $state();
	let canvasEl: HTMLCanvasElement | undefined = $state();

	// Camera Spherical Coordinates
	let targetAzimuth = 0.62;
	let targetElevation = 0.56; // radians above ecliptic plane
	let targetDistance = 24.5;
	let currentAzimuth = 0.62;
	let currentElevation = 0.56;
	let currentDistance = 24.5;

	// Helper: Map planet shader style to numeric ID for GLSL
	function styleToFloat(style: PlanetShaderStyle): number {
		switch (style) {
			case 'lava-rock':
				return 0.0;
			case 'venusian-rock':
				return 1.0;
			case 'temperate-terrestrial':
				return 2.0;
			case 'eyeball-ocean':
				return 3.0;
			case 'icy-waterworld':
				return 4.0;
			case 'cryo-rock':
				return 5.0;
			case 'super-earth':
				return 6.0;
			case 'mini-neptune':
				return 7.0;
			case 'warm-giant':
				return 8.0;
			case 'hot-jupiter':
				return 9.0;
			case 'earth-analog':
				return 10.0;
			default:
				return 3.0;
		}
	}

	// Helper: Map AU distance to 3D scene radius for a given system
	function auToSceneRadius(au: number, system: ExoplanetSystemData): number {
		const normalized = Math.max(0.001, au / system.maxOrbitAu);
		const curved = Math.pow(normalized, system.sceneRadiusPower);
		return (
			system.sceneMinRadius + curved * (system.sceneMaxRadius - system.sceneMinRadius)
		);
	}

	// Helper: Compute visual 3D planet radius in scene units
	function planetRadiusToScene(radiusEarth: number, isRef = false): number {
		const base = 0.24 * Math.pow(Math.max(0.35, radiusEarth), 0.36);
		return isRef ? base * 0.82 : Math.min(0.92, Math.max(0.2, base));
	}

	// --- Custom GLSL Shaders ---

	// 1. Host Star Photosphere Shader (Turbulent Convective Granulation + Limb Darkening + Sunspots/Plages)
	const STAR_VERTEX_SHADER = `
		varying vec3 vNormal;
		varying vec3 vPosition;
		varying vec3 vWorldPosition;

		void main() {
			vNormal = normalize(normalMatrix * normal);
			vPosition = position;
			vec4 worldPos = modelMatrix * vec4(position, 1.0);
			vWorldPosition = worldPos.xyz;
			gl_Position = projectionMatrix * viewMatrix * worldPos;
		}
	`;

	const STAR_FRAGMENT_SHADER = `
		uniform float uTime;
		uniform vec3 uCoreColor;
		uniform vec3 uMidColor;
		uniform vec3 uCoronaColor;
		uniform float uFlareIntensity;

		varying vec3 vNormal;
		varying vec3 vPosition;
		varying vec3 vWorldPosition;

		// 3D Simplex-like Value Noise
		float hash31(vec3 p) {
			p = fract(p * vec3(443.897, 441.423, 437.195));
			p += dot(p, p.yzx + 19.19);
			return fract((p.x + p.y) * p.z);
		}

		float noise3D(vec3 p) {
			vec3 i = floor(p);
			vec3 f = fract(p);
			f = f * f * (3.0 - 2.0 * f);

			float n000 = hash31(i + vec3(0.0, 0.0, 0.0));
			float n100 = hash31(i + vec3(1.0, 0.0, 0.0));
			float n010 = hash31(i + vec3(0.0, 1.0, 0.0));
			float n110 = hash31(i + vec3(1.0, 1.0, 0.0));
			float n001 = hash31(i + vec3(0.0, 0.0, 1.0));
			float n101 = hash31(i + vec3(1.0, 0.0, 1.0));
			float n011 = hash31(i + vec3(0.0, 1.0, 1.0));
			float n111 = hash31(i + vec3(1.0, 1.0, 1.0));

			float nx00 = mix(n000, n100, f.x);
			float nx10 = mix(n010, n110, f.x);
			float nx01 = mix(n001, n101, f.x);
			float nx11 = mix(n011, n111, f.x);

			float nxy0 = mix(nx00, nx10, f.y);
			float nxy1 = mix(nx01, nx11, f.y);

			return mix(nxy0, nxy1, f.z);
		}

		float fbm(vec3 p) {
			float val = 0.0;
			float amp = 0.5;
			float freq = 1.0;
			for (int i = 0; i < 5; i++) {
				val += amp * noise3D(p * freq);
				freq *= 2.07;
				amp *= 0.5;
			}
			return val;
		}

		void main() {
			vec3 viewDir = normalize(cameraPosition - vWorldPosition);
			float mu = clamp(dot(normalize(vNormal), viewDir), 0.0, 1.0);

			// Convective cells & magnetic active regions
			vec3 sphereCoord = normalize(vPosition);
			float granule = fbm(sphereCoord * 6.5 + vec3(uTime * 0.18, -uTime * 0.14, uTime * 0.11));
			float fineCell = fbm(sphereCoord * 16.0 - vec3(uTime * 0.35));
			float flareRibbon = pow(max(0.0, sin(granule * 9.5 + uTime * 1.4)), 4.0) * uFlareIntensity;

			// Eddington-style limb darkening
			float limb = pow(mu, 0.45);
			float edgeGlow = pow(1.0 - mu, 2.4);

			vec3 col = mix(uCoronaColor, uMidColor, clamp(limb * 0.85 + granule * 0.45, 0.0, 1.0));
			col = mix(col, uCoreColor, clamp(pow(limb, 1.5) * 0.75 + fineCell * 0.35 + flareRibbon * 0.4, 0.0, 1.0));
			col += uCoronaColor * edgeGlow * (0.65 + 0.35 * uFlareIntensity);

			gl_FragColor = vec4(col, 1.0);
		}
	`;

	// 2. Host Star Corona / Prominence Billboard Shader
	const CORONA_VERTEX_SHADER = `
		varying vec2 vUv;
		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
		}
	`;

	const CORONA_FRAGMENT_SHADER = `
		uniform float uTime;
		uniform vec3 uMidColor;
		uniform vec3 uCoronaColor;
		uniform float uFlareIntensity;
		varying vec2 vUv;

		void main() {
			vec2 p = (vUv - 0.5) * 2.0;
			float r = length(p);
			if (r > 1.0) discard;

			float angle = atan(p.y, p.x);
			float rays = sin(angle * 12.0 + uTime * 0.9) * 0.5 + 0.5;
			float filaments = sin(angle * 23.0 - uTime * 1.6 + r * 6.0) * 0.5 + 0.5;
			float flare = pow(rays * filaments, 1.6) * uFlareIntensity;

			float coreFalloff = exp(-r * 3.6);
			float outerHalo = smoothstep(1.0, 0.18, r) * pow(1.0 - r, 1.8);
			float alpha = clamp(coreFalloff * 0.85 + outerHalo * (0.45 + flare * 0.32), 0.0, 1.0);

			vec3 color = mix(uCoronaColor, uMidColor, clamp(coreFalloff + flare * 0.35, 0.0, 1.0));
			gl_FragColor = vec4(color, alpha * 0.78);
		}
	`;

	// 3. Habitable Zone ("Goldilocks Annulus") Ecliptic Disc Shader
	const HZ_VERTEX_SHADER = `
		varying vec2 vUv;
		varying vec3 vLocalPos;
		void main() {
			vUv = uv;
			vLocalPos = position;
			gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
		}
	`;

	const HZ_FRAGMENT_SHADER = `
		uniform float uTime;
		uniform float uInnerOpt;
		uniform float uInnerCons;
		uniform float uOuterCons;
		uniform float uOuterOpt;
		uniform float uOpacity;

		varying vec2 vUv;
		varying vec3 vLocalPos;

		void main() {
			float r = length(vLocalPos.xy);
			if (r < uInnerOpt || r > uOuterOpt) discard;

			// Smooth transitions across optimistic and conservative HZ boundaries
			float optMask = smoothstep(uInnerOpt, uInnerCons, r) * (1.0 - smoothstep(uOuterCons, uOuterOpt, r));
			float consMask = step(uInnerCons, r) * (1.0 - step(uOuterCons, r));

			float angle = atan(vLocalPos.y, vLocalPos.x);
			float sweep = 0.92 + 0.08 * sin(angle * 2.0 - uTime * 0.4);

			// Subtle restrained warm olive/gold wash
			vec3 warmOlive = vec3(0.56, 0.52, 0.31);
			vec3 warmGold = vec3(0.784, 0.608, 0.341);
			vec3 col = mix(warmOlive, warmGold, optMask);

			// Subtle inner and outer conservative boundary hairlines
			float innerEdgeLine = exp(-abs(r - uInnerCons) * 16.0);
			float outerEdgeLine = exp(-abs(r - uOuterCons) * 16.0);
			float edgeHighlight = clamp(innerEdgeLine + outerEdgeLine, 0.0, 1.0);

			col += vec3(0.86, 0.71, 0.45) * (edgeHighlight * 0.32);

			float baseAlpha = (0.04 + 0.055 * optMask + 0.015 * consMask + edgeHighlight * 0.06) * sweep * uOpacity;
			gl_FragColor = vec4(col, clamp(baseAlpha, 0.0, 0.14));
		}
	`;

	// 4. Procedural Exoplanet Surface + Terminator Cloud + Atmospheric Limb Shader
	const PLANET_VERTEX_SHADER = `
		varying vec3 vNormalWorld;
		varying vec3 vLocalPos;
		varying vec3 vWorldPos;

		void main() {
			vLocalPos = position;
			vec4 worldPosition = modelMatrix * vec4(position, 1.0);
			vWorldPos = worldPosition.xyz;
			vNormalWorld = normalize(mat3(modelMatrix) * normal);
			gl_Position = projectionMatrix * viewMatrix * worldPosition;
		}
	`;

	const PLANET_FRAGMENT_SHADER = `
		uniform float uTime;
		uniform float uStyle;
		uniform vec3 uPrimaryColor;
		uniform vec3 uSecondaryColor;
		uniform vec3 uAtmosphereColor;
		uniform float uCloudCover;
		uniform float uBandFreq;
		uniform float uTidallyLocked;
		uniform float uSelected;

		varying vec3 vNormalWorld;
		varying vec3 vLocalPos;
		varying vec3 vWorldPos;

		float hash31(vec3 p) {
			p = fract(p * vec3(443.897, 441.423, 437.195));
			p += dot(p, p.yzx + 19.19);
			return fract((p.x + p.y) * p.z);
		}

		float noise3D(vec3 p) {
			vec3 i = floor(p);
			vec3 f = fract(p);
			f = f * f * (3.0 - 2.0 * f);

			float n000 = hash31(i + vec3(0.0, 0.0, 0.0));
			float n100 = hash31(i + vec3(1.0, 0.0, 0.0));
			float n010 = hash31(i + vec3(0.0, 1.0, 0.0));
			float n110 = hash31(i + vec3(1.0, 1.0, 0.0));
			float n001 = hash31(i + vec3(0.0, 0.0, 1.0));
			float n101 = hash31(i + vec3(1.0, 0.0, 1.0));
			float n011 = hash31(i + vec3(0.0, 1.0, 1.0));
			float n111 = hash31(i + vec3(1.0, 1.0, 1.0));

			float nx00 = mix(n000, n100, f.x);
			float nx10 = mix(n010, n110, f.x);
			float nx01 = mix(n001, n101, f.x);
			float nx11 = mix(n011, n111, f.x);

			return mix(mix(nx00, nx10, f.y), mix(nx01, nx11, f.y), f.z);
		}

		float fbm(vec3 p) {
			float v = 0.0;
			float a = 0.5;
			for (int i = 0; i < 4; i++) {
				v += a * noise3D(p);
				p *= 2.04;
				a *= 0.5;
			}
			return v;
		}

		void main() {
			vec3 N = normalize(vNormalWorld);
			// Central star is at world origin (0,0,0)
			vec3 lightDir = normalize(-vWorldPos);
			vec3 viewDir = normalize(cameraPosition - vWorldPos);

			float ndotl = dot(N, lightDir);
			float dayFactor = smoothstep(-0.18, 0.25, ndotl);
			float terminatorZone = exp(-pow(ndotl * 3.2, 2.0));

			vec3 p = normalize(vLocalPos);
			float n1 = fbm(p * 3.8 + vec3(uTime * 0.03));
			float n2 = fbm(p * 8.2 - vec3(uTime * 0.05));

			vec3 surfaceCol = mix(uPrimaryColor, uSecondaryColor, n1);

			// Style 0: Lava-rock (TRAPPIST-1b, Kepler-90b)
			if (uStyle < 0.5) {
				float fissures = smoothstep(0.62, 0.78, n2);
				vec3 magma = vec3(1.0, 0.38, 0.06) * fissures * (0.45 + 0.55 * max(0.0, ndotl));
				surfaceCol = mix(vec3(0.14, 0.07, 0.06), uPrimaryColor, n1) + magma;
			}
			// Style 3: Tidally locked Eyeball Ocean (TRAPPIST-1e)
			else if (uStyle > 2.5 && uStyle < 3.5) {
				float substellarAngle = clamp(ndotl, -1.0, 1.0);
				// Substellar open ocean surrounded by terminator sea-ice ring and nightside glacier
				vec3 deepOcean = vec3(0.02, 0.28, 0.58);
				vec3 turquoiseShelf = vec3(0.06, 0.68, 0.76);
				vec3 nightGlacier = vec3(0.75, 0.88, 0.96);
				float oceanMask = smoothstep(0.15, 0.55, substellarAngle + (n1 - 0.5) * 0.22);
				surfaceCol = mix(nightGlacier, mix(turquoiseShelf, deepOcean, substellarAngle), oceanMask);
			}
			// Style 7, 8, 9: Banded Mini-Neptunes, Warm Giants & Hot Jupiters
			else if (uStyle > 6.5 && uStyle < 9.5) {
				float lat = p.y * uBandFreq + n1 * 1.6;
				float bands = sin(lat * 3.14159) * 0.5 + 0.5;
				float storm = smoothstep(0.66, 0.82, n2);
				surfaceCol = mix(uPrimaryColor, uSecondaryColor, bands);
				if (uStyle > 8.5) {
					// Hot Jupiter glowing thermal bands on nightside & dayside
					vec3 thermalGlow = vec3(1.0, 0.32, 0.08) * pow(bands, 2.0) * 0.42;
					surfaceCol += thermalGlow;
				} else {
					surfaceCol = mix(surfaceCol, uAtmosphereColor, storm * 0.35);
				}
			}
			// Style 10: Earth analog
			else if (uStyle > 9.5) {
				float continent = smoothstep(0.47, 0.54, n1);
				vec3 ocean = vec3(0.03, 0.32, 0.66);
				vec3 land = mix(vec3(0.08, 0.48, 0.22), vec3(0.68, 0.56, 0.32), n2);
				surfaceCol = mix(ocean, land, continent);
			}

			// Swirling cloud deck (stronger around terminator for tidally locked worlds)
			float cloudNoise = fbm(p * 6.4 + vec3(uTime * 0.08, 0.0, -uTime * 0.06));
			float cloudMask = smoothstep(0.46, 0.74, cloudNoise) * uCloudCover;
			if (uTidallyLocked > 0.5) {
				cloudMask *= (0.65 + 0.75 * terminatorZone);
			}
			surfaceCol = mix(surfaceCol, vec3(0.94, 0.97, 1.0), clamp(cloudMask * 0.75, 0.0, 0.85));

			// Dayside / Nightside lighting with ambient starlight floor for visibility
			float diffuse = mix(0.14, 1.08, dayFactor);
			vec3 litColor = surfaceCol * diffuse;

			// Softened atmospheric limb haze (zero harsh Fresnel rings)
			float ndotv = max(0.0, dot(N, viewDir));
			float fresnel = smoothstep(0.0, 0.88, 1.0 - ndotv) * pow(1.0 - ndotv, 3.4);
			float limbLight = mix(0.14, 0.52, dayFactor) + terminatorZone * 0.22;
			vec3 softAtmo = mix(uAtmosphereColor, vec3(0.90, 0.86, 0.78), 0.48);
			litColor += softAtmo * fresnel * limbLight * (0.26 + 0.12 * uSelected);

			gl_FragColor = vec4(litColor, 1.0);
		}
	`;

	// --- Switch System Handler ---
	function selectSystem(sysId: ExoplanetSystemId) {
		selectedSystemId = sysId;
		const sys = EXOPLANET_SYSTEMS_BY_ID[sysId];
		// Default to habitable-zone flagship planet if available, else first planet
		const defaultPlanet =
			sys.planets.find((p) => p.id === 'trappist-1-e') ??
			sys.planets.find((p) => p.id === 'kepler-90-i') ??
			sys.planets.find((p) => p.id === '51-pegasi-b') ??
			sys.planets.find((p) => p.id === 'sol-earth') ??
			sys.planets[0];
		selectedPlanetId = defaultPlanet.id;
		activeConjunctions = [];
	}

	function applyCameraPreset(preset: 'perspective' | 'top-down' | 'transit') {
		cameraPreset = preset;
		if (preset === 'perspective') {
			targetElevation = 0.56;
			targetDistance = 24.5;
		} else if (preset === 'top-down') {
			targetElevation = 1.48; // nearly 85 deg top-down ecliptic plan view
			targetDistance = 26.5;
		} else if (preset === 'transit') {
			targetElevation = 0.05; // edge-on transit geometry
			targetDistance = 22.0;
		}
	}

	function adjustZoom(delta: number) {
		targetDistance = Math.max(10.5, Math.min(42.0, targetDistance + delta));
	}

	// --- Synthetic Transit Light-Curve Path Generator (SVG) ---
	function buildTransitCurveSvg(planet: ExoplanetData): {
		linePath: string;
		areaPath: string;
		dipBottomY: number;
		ingressX: number;
		egressX: number;
	} {
		const width = 440;
		const height = 128;
		const baselineY = 26;
		// Scale visual dip depth logarithmically so both 9,200 ppm (51 Peg b) and 84 ppm (Earth) are clearly legible
		const depthNorm = Math.min(
			1.0,
			Math.max(0.18, Math.log10(Math.max(10, planet.baselineTransitDepthPpm)) / 4.1)
		);
		const maxDipPx = depthNorm * 74;
		const halfDurationSpan = Math.min(125, Math.max(46, planet.transitDurationHours * 11.5));
		const centerX = width / 2;
		const ingressStart = centerX - halfDurationSpan;
		const egressEnd = centerX + halfDurationSpan;

		const points: Array<[number, number]> = [];
		const steps = 72;
		for (let i = 0; i <= steps; i++) {
			const t = i / steps;
			const x = t * width;
			let y = baselineY;
			if (x > ingressStart && x < egressEnd) {
				const u = (x - centerX) / halfDurationSpan; // -1 to 1
				// Mandel-Agol style limb-darkened U-shaped transit bottom
				const flatEdge = 1.0 - Math.pow(Math.abs(u), 3.2);
				const limbDarkening = Math.sqrt(Math.max(0, 1.0 - u * u));
				const profile = 0.65 * flatEdge + 0.35 * limbDarkening;
				y = baselineY + maxDipPx * profile;
			}
			points.push([x, y]);
		}

		const linePath = points
			.map(([x, y], idx) => `${idx === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
			.join(' ');
		const areaPath = `${linePath} L${width},${height} L0,${height} Z`;

		return {
			linePath,
			areaPath,
			dipBottomY: baselineY + maxDipPx,
			ingressX: ingressStart,
			egressX: egressEnd
		};
	}

	// --- Synthetic JWST NIRSpec/MIRI Transmission Spectrum Generator (0.6 - 5.3 um) ---
	function buildSpectrumData(planet: ExoplanetData): {
		linePath: string;
		areaPath: string;
		minPpm: number;
		maxPpm: number;
		markers: Array<{
			x: number;
			y: number;
			molecule: string;
			label: string;
			wavelengthUm: number;
			depthPpm: number;
			color: string;
			confidence: string;
		}>;
		errorBars: Array<{ x: number; y: number; errPx: number; wl: number; ppm: number }>;
	} {
		const width = 460;
		const height = 148;
		const padLeft = 36;
		const padRight = 16;
		const padTop = 22;
		const padBottom = 26;
		const plotW = width - padLeft - padRight;
		const plotH = height - padTop - padBottom;

		const minWl = 0.6;
		const maxWl = 5.3;
		const basePpm = planet.baselineTransitDepthPpm;
		const maxFeatureDelta = Math.max(
			60,
			...planet.spectralFeatures.map((f) => f.depthPpm * 1.25)
		);

		const wlToX = (wl: number) => padLeft + ((wl - minWl) / (maxWl - minWl)) * plotW;
		const deltaToY = (deltaPpm: number) =>
			padTop + plotH - Math.min(1.0, Math.max(0.0, deltaPpm / maxFeatureDelta)) * plotH;

		const evalDeltaAtWl = (wl: number): number => {
			// Rayleigh / haze slope at short optical/NIR wavelengths
			let delta = 12 * Math.exp(-(wl - 0.6) * 0.9);
			for (const feat of planet.spectralFeatures) {
				const dist = (wl - feat.wavelengthUm) / Math.max(0.08, feat.widthUm * 0.65);
				delta += feat.depthPpm * Math.exp(-0.5 * dist * dist);
			}
			return delta;
		};

		const samples = 110;
		const pts: Array<[number, number]> = [];
		for (let i = 0; i <= samples; i++) {
			const wl = minWl + (i / samples) * (maxWl - minWl);
			const delta = evalDeltaAtWl(wl);
			pts.push([wlToX(wl), deltaToY(delta)]);
		}

		const linePath = pts
			.map(([x, y], idx) => `${idx === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
			.join(' ');
		const areaPath = `${linePath} L${ (padLeft + plotW).toFixed(1)},${(padTop + plotH).toFixed(1)} L${padLeft.toFixed(1)},${(padTop + plotH).toFixed(1)} Z`;

		const markers = planet.spectralFeatures.map((feat) => {
			const totalDelta = evalDeltaAtWl(feat.wavelengthUm);
			return {
				x: wlToX(feat.wavelengthUm),
				y: deltaToY(totalDelta),
				molecule: feat.molecule,
				label: feat.label,
				wavelengthUm: feat.wavelengthUm,
				depthPpm: Math.round(basePpm + totalDelta),
				color: feat.color,
				confidence: feat.confidence
			};
		});

		// Simulated JWST NIRSpec Prism binned data points with error bars
		const errorBars: Array<{ x: number; y: number; errPx: number; wl: number; ppm: number }> = [];
		for (let k = 0; k < 18; k++) {
			const wl = 0.8 + k * 0.25;
			const delta = evalDeltaAtWl(wl);
			const jitter = Math.sin(wl * 13.7 + basePpm) * (maxFeatureDelta * 0.035);
			const y = deltaToY(Math.max(4, delta + jitter));
			errorBars.push({
				x: wlToX(wl),
				y,
				errPx: 7.5,
				wl: Number(wl.toFixed(2)),
				ppm: Math.round(basePpm + delta)
			});
		}

		return {
			linePath,
			areaPath,
			minPpm: basePpm,
			maxPpm: Math.round(basePpm + maxFeatureDelta),
			markers,
			errorBars
		};
	}

	let transitSvg = $derived(buildTransitCurveSvg(selectedPlanet));
	let spectrumSvg = $derived(buildSpectrumData(selectedPlanet));

	// --- Three.js Scene & Render Loop ---
	async function enableInteractiveOrrery() {
		mobileLiteMode = false;
		await tick();
		if (!cleanupOrreryWebGL) {
			cleanupOrreryWebGL = mountOrreryWebGL() ?? null;
		}
	}

	function mountOrreryWebGL(): (() => void) | void {
		if (!canvasEl || !containerEl) return;

		const scene = new THREE.Scene();
		const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 300);

		let renderer: THREE.WebGLRenderer;
		try {
			renderer = new THREE.WebGLRenderer({
				canvas: canvasEl,
				antialias: true,
				alpha: true,
				powerPreference: 'high-performance'
			});
		} catch {
			mobileLiteMode = true;
			return;
		}
		renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
		renderer.setClearColor(0x050607, 0);
		renderer.toneMapping = THREE.ACESFilmicToneMapping;
		renderer.toneMappingExposure = 1.0;
		// Background subtle 3D star dust sphere inside the orrery
		const bgStarCount = 650;
		const bgPositions = new Float32Array(bgStarCount * 3);
		const bgColors = new Float32Array(bgStarCount * 3);
		for (let i = 0; i < bgStarCount; i++) {
			const r = 48 + Math.random() * 65;
			const theta = Math.random() * Math.PI * 2;
			const phi = Math.acos(2 * Math.random() - 1);
			bgPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
			bgPositions[i * 3 + 1] = r * Math.cos(phi);
			bgPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

			const tint = 0.75 + Math.random() * 0.25;
			bgColors[i * 3] = tint * 0.88;
			bgColors[i * 3 + 1] = tint * 0.94;
			bgColors[i * 3 + 2] = tint;
		}
		const bgStarGeo = new THREE.BufferGeometry();
		bgStarGeo.setAttribute('position', new THREE.BufferAttribute(bgPositions, 3));
		bgStarGeo.setAttribute('color', new THREE.BufferAttribute(bgColors, 3));
		const bgStarMat = new THREE.PointsMaterial({
			size: 0.26,
			vertexColors: true,
			transparent: true,
			opacity: 0.55,
			depthWrite: false
		});
		const bgStarPoints = new THREE.Points(bgStarGeo, bgStarMat);
		scene.add(bgStarPoints);

		// Central Host Star Mesh + Shader
		const starGeo = new THREE.SphereGeometry(1, 64, 64);
		const starUniforms = {
			uTime: { value: 0 },
			uCoreColor: { value: new THREE.Color('#fff1e6') },
			uMidColor: { value: new THREE.Color('#ff4d2e') },
			uCoronaColor: { value: new THREE.Color('#b91c1c') },
			uFlareIntensity: { value: 1.35 }
		};
		const starMat = new THREE.ShaderMaterial({
			vertexShader: STAR_VERTEX_SHADER,
			fragmentShader: STAR_FRAGMENT_SHADER,
			uniforms: starUniforms
		});
		const starMesh = new THREE.Mesh(starGeo, starMat);
		scene.add(starMesh);

		// Host Star Corona Billboard
		const coronaGeo = new THREE.PlaneGeometry(1, 1);
		const coronaUniforms = {
			uTime: { value: 0 },
			uMidColor: { value: new THREE.Color('#ff4d2e') },
			uCoronaColor: { value: new THREE.Color('#b91c1c') },
			uFlareIntensity: { value: 1.35 }
		};
		const coronaMat = new THREE.ShaderMaterial({
			vertexShader: CORONA_VERTEX_SHADER,
			fragmentShader: CORONA_FRAGMENT_SHADER,
			uniforms: coronaUniforms,
			transparent: true,
			blending: THREE.AdditiveBlending,
			depthWrite: false
		});
		const coronaMesh = new THREE.Mesh(coronaGeo, coronaMat);
		scene.add(coronaMesh);

		// Habitable Zone ("Goldilocks Annulus") Disc on Ecliptic Plane (XZ plane -> rotated X by -PI/2)
		const hzGeo = new THREE.PlaneGeometry(40, 40, 1, 1);
		const hzUniforms = {
			uTime: { value: 0 },
			uInnerOpt: { value: 6.5 },
			uInnerCons: { value: 7.8 },
			uOuterCons: { value: 13.2 },
			uOuterOpt: { value: 14.2 },
			uOpacity: { value: 1.0 }
		};
		const hzMat = new THREE.ShaderMaterial({
			vertexShader: HZ_VERTEX_SHADER,
			fragmentShader: HZ_FRAGMENT_SHADER,
			uniforms: hzUniforms,
			transparent: true,
			side: THREE.DoubleSide,
			depthWrite: false,
			blending: THREE.AdditiveBlending
		});
		const hzMesh = new THREE.Mesh(hzGeo, hzMat);
		hzMesh.rotation.x = -Math.PI / 2;
		hzMesh.position.y = -0.02;
		scene.add(hzMesh);

		// Selection Reticle Ring (tracks currently selected planet)
		const reticleGeo = new THREE.RingGeometry(1.25, 1.48, 48);
		const reticleMat = new THREE.MeshBasicMaterial({
			color: 0xc89b57,
			side: THREE.DoubleSide,
			transparent: true,
			opacity: 0.75,
			blending: THREE.AdditiveBlending,
			depthWrite: false
		});
		const reticleMesh = new THREE.Mesh(reticleGeo, reticleMat);
		reticleMesh.rotation.x = -Math.PI / 2;
		scene.add(reticleMesh);

		// Dynamic Groups for Planets, Orbit Lines, Conjunction Beams, and Scale Overlay
		const systemGroup = new THREE.Group();
		scene.add(systemGroup);

		const conjunctionGroup = new THREE.Group();
		scene.add(conjunctionGroup);

		const solarOverlayGroup = new THREE.Group();
		scene.add(solarOverlayGroup);

		// Track active planet meshes for raycasting & orbital updates
		interface PlanetNode {
			data: ExoplanetData;
			mesh: THREE.Mesh;
			material: THREE.ShaderMaterial;
			orbitLine: THREE.LineLoop;
			orbitMaterial: THREE.LineBasicMaterial;
			semiMajorScene: number;
			semiMinorScene: number;
			focalOffsetScene: number;
			initialPhaseRad: number;
			visualRadius: number;
		}
		let planetNodes: PlanetNode[] = [];
		let builtSystemId: ExoplanetSystemId | null = null;

		const sharedSphereGeo = new THREE.SphereGeometry(1, 48, 48);

		function disposeGroup(group: THREE.Group) {
			while (group.children.length > 0) {
				const child = group.children[0] as THREE.Object3D & {
					geometry?: THREE.BufferGeometry;
					material?: THREE.Material | THREE.Material[];
				};
				group.remove(child);
				if (child.geometry && child.geometry !== sharedSphereGeo) {
					child.geometry.dispose();
				}
				if (child.material) {
					if (Array.isArray(child.material)) {
						child.material.forEach((m) => m.dispose());
					} else {
						child.material.dispose();
					}
				}
			}
		}

		function buildRingLoop(
			rx: number,
			rz: number,
			offsetX: number,
			inclinationRad: number,
			colorHex: string,
			opacity: number
		): { line: THREE.LineLoop; mat: THREE.LineBasicMaterial } {
			const segments = 128;
			const pts: THREE.Vector3[] = [];
			for (let i = 0; i < segments; i++) {
				const theta = (i / segments) * Math.PI * 2;
				const x = Math.cos(theta) * rx - offsetX;
				const z = Math.sin(theta) * rz;
				const y = Math.sin(theta) * Math.sin(inclinationRad) * rx * 0.35;
				pts.push(new THREE.Vector3(x, y, z));
			}
			const geo = new THREE.BufferGeometry().setFromPoints(pts);
			const mat = new THREE.LineBasicMaterial({
				color: new THREE.Color(colorHex),
				transparent: true,
				opacity,
				depthWrite: false
			});
			return { line: new THREE.LineLoop(geo, mat), mat };
		}

		function rebuildSystemScene(sys: ExoplanetSystemData) {
			disposeGroup(systemGroup);
			disposeGroup(conjunctionGroup);
			disposeGroup(solarOverlayGroup);
			planetNodes = [];

			// Update Star Uniforms & Scale
			starUniforms.uCoreColor.value.set(sys.star.coreColor);
			starUniforms.uMidColor.value.set(sys.star.midColor);
			starUniforms.uCoronaColor.value.set(sys.star.coronaColor);
			starUniforms.uFlareIntensity.value = sys.star.flareIntensity;
			starMesh.scale.setScalar(sys.star.visualRadiusScene);

			coronaUniforms.uMidColor.value.set(sys.star.midColor);
			coronaUniforms.uCoronaColor.value.set(sys.star.coronaColor);
			coronaUniforms.uFlareIntensity.value = sys.star.flareIntensity;
			coronaMesh.scale.setScalar(sys.star.visualRadiusScene * 4.9);

			// Update Habitable Zone Annulus Radii in Scene Coordinates
			hzUniforms.uInnerOpt.value = auToSceneRadius(sys.optimisticHzInnerAu, sys);
			hzUniforms.uInnerCons.value = auToSceneRadius(sys.habitableZoneInnerAu, sys);
			hzUniforms.uOuterCons.value = auToSceneRadius(sys.habitableZoneOuterAu, sys);
			hzUniforms.uOuterOpt.value = auToSceneRadius(sys.optimisticHzOuterAu, sys);

			// Build Planets & Orbit Paths
			sys.planets.forEach((planet, idx) => {
				const semiMajorScene = auToSceneRadius(planet.semiMajorAxisAu, sys);
				const ecc = Math.min(0.35, planet.eccentricity);
				const semiMinorScene = semiMajorScene * Math.sqrt(1 - ecc * ecc);
				const focalOffsetScene = semiMajorScene * ecc * 0.45;
				const inclRad = ((90 - planet.inclinationDeg) * Math.PI) / 180;

				const orbitColor = planet.inHabitableZone
					? '#c89b57'
					: planet.isReferenceWorld
						? '#78756e'
						: '#b8b4ac';
				const baseOpacity = planet.isReferenceWorld
					? 0.22
					: planet.inHabitableZone
						? 0.45
						: 0.26;
				const { line: orbitLine, mat: orbitMaterial } = buildRingLoop(
					semiMajorScene,
					semiMinorScene,
					focalOffsetScene,
					inclRad,
					orbitColor,
					baseOpacity
				);
				systemGroup.add(orbitLine);

				const vRadius = planetRadiusToScene(planet.radiusEarth, planet.isReferenceWorld);
				const pMat = new THREE.ShaderMaterial({
					vertexShader: PLANET_VERTEX_SHADER,
					fragmentShader: PLANET_FRAGMENT_SHADER,
					uniforms: {
						uTime: { value: 0 },
						uStyle: { value: styleToFloat(planet.shaderStyle) },
						uPrimaryColor: { value: new THREE.Color(planet.primaryColor) },
						uSecondaryColor: { value: new THREE.Color(planet.secondaryColor) },
						uAtmosphereColor: { value: new THREE.Color(planet.atmosphereColor) },
						uCloudCover: { value: planet.cloudCover },
						uBandFreq: { value: planet.bandFrequency },
						uTidallyLocked: { value: planet.tidallyLocked ? 1.0 : 0.0 },
						uSelected: { value: planet.id === selectedPlanetId ? 1.0 : 0.0 }
					}
				});

				const pMesh = new THREE.Mesh(sharedSphereGeo, pMat);
				pMesh.scale.setScalar(vRadius);
				pMesh.userData = { planetId: planet.id };
				systemGroup.add(pMesh);

				// Golden-angle staggered starting phases so all planets are immediately distinguishable
				const initialPhaseRad = idx * 1.18 + 0.4;

				planetNodes.push({
					data: planet,
					mesh: pMesh,
					material: pMat,
					orbitLine,
					orbitMaterial,
					semiMajorScene,
					semiMinorScene,
					focalOffsetScene,
					initialPhaseRad,
					visualRadius: vRadius
				});
			});

			// Build Comparative Solar System Scale Overlay Rings (Mercury 0.387 AU, Venus 0.723 AU, Earth 1.000 AU)
			const solarRefs = [
				{ label: 'Mercury 0.387 AU', au: 0.387, color: '#8c8880' },
				{ label: 'Venus 0.723 AU', au: 0.723, color: '#c89b57' },
				{ label: 'Earth 1.000 AU', au: 1.0, color: '#e8e6e1' }
			];
			solarRefs.forEach((ref) => {
				const rScene = auToSceneRadius(ref.au, sys);
				if (rScene <= 28.0) {
					const { line } = buildRingLoop(rScene, rScene, 0, 0, ref.color, 0.38);
					solarOverlayGroup.add(line);
				}
			});

			// Pre-allocate up to 6 conjunction beam lines for Laplace Resonance Visualizer
			for (let i = 0; i < 6; i++) {
				const beamGeo = new THREE.BufferGeometry().setFromPoints([
					new THREE.Vector3(),
					new THREE.Vector3()
				]);
				const beamMat = new THREE.LineBasicMaterial({
					color: 0xc89b57,
					transparent: true,
					opacity: 0,
					blending: THREE.AdditiveBlending,
					depthWrite: false
				});
				const beamLine = new THREE.Line(beamGeo, beamMat);
				conjunctionGroup.add(beamLine);
			}

			builtSystemId = sys.id;
		}

		rebuildSystemScene(currentSystem);

		// --- Resize Observer ---
		const updateSize = () => {
			if (!containerEl) return;
			const rect = containerEl.getBoundingClientRect();
			const w = Math.max(300, rect.width);
			const h = Math.max(420, rect.height);
			camera.aspect = w / h;
			camera.updateProjectionMatrix();
			renderer.setSize(w, h, false);
		};
		updateSize();
		const resizeObserver = new ResizeObserver(updateSize);
		resizeObserver.observe(containerEl);

		// --- IntersectionObserver to pause rAF when off-screen ---
		const intersectionObserver = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					isVisibleInViewport = entry.isIntersecting;
				}
			},
			{ threshold: 0.02 }
		);
		intersectionObserver.observe(containerEl);

		// --- Pointer Drag & Raycast Planet Selection ---
		const raycaster = new THREE.Raycaster();
		const pointerNdc = new THREE.Vector2();
		let pointerDownPos = { x: 0, y: 0 };
		let lastPointerPos = { x: 0, y: 0 };
		let activePointers = new Map<number, { x: number; y: number }>();
		let lastPinchDist = 0;

		const onPointerDown = (e: PointerEvent) => {
			if (!canvasEl) return;
			canvasEl.setPointerCapture(e.pointerId);
			activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
			pointerDownPos = { x: e.clientX, y: e.clientY };
			lastPointerPos = { x: e.clientX, y: e.clientY };
			isDraggingCanvas = true;

			if (activePointers.size === 2) {
				const pts = Array.from(activePointers.values());
				lastPinchDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
			}
		};

		const onPointerMove = (e: PointerEvent) => {
			if (!canvasEl) return;
			if (activePointers.has(e.pointerId)) {
				activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
			}

			if (activePointers.size === 2) {
				const pts = Array.from(activePointers.values());
				const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
				if (lastPinchDist > 0) {
					const deltaPinch = (lastPinchDist - dist) * 0.06;
					targetDistance = Math.max(10.5, Math.min(42.0, targetDistance + deltaPinch));
				}
				lastPinchDist = dist;
				return;
			}

			if (isDraggingCanvas && activePointers.size === 1) {
				const dx = e.clientX - lastPointerPos.x;
				const dy = e.clientY - lastPointerPos.y;
				lastPointerPos = { x: e.clientX, y: e.clientY };
				targetAzimuth -= dx * 0.0065;
				targetElevation = Math.max(0.04, Math.min(1.52, targetElevation + dy * 0.006));
				orbitAzimuthDeg = Math.round((targetAzimuth * 180) / Math.PI);
				orbitElevationDeg = Math.round((targetElevation * 180) / Math.PI);
			}
		};

		const onPointerUp = (e: PointerEvent) => {
			if (!canvasEl) return;
			activePointers.delete(e.pointerId);
			if (activePointers.size < 2) lastPinchDist = 0;
			if (activePointers.size === 0) isDraggingCanvas = false;

			const moveDist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
			if (moveDist < 6) {
				// Raycast click to select 3D planet
				const rect = canvasEl.getBoundingClientRect();
				pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
				pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
				raycaster.setFromCamera(pointerNdc, camera);
				const meshes = planetNodes.map((n) => n.mesh);
				const hits = raycaster.intersectObjects(meshes, false);
				if (hits.length > 0) {
					const hitPlanetId = hits[0].object.userData?.planetId;
					if (hitPlanetId) {
						selectedPlanetId = hitPlanetId;
					}
				}
			}
		};

		const onWheel = (e: WheelEvent) => {
			// Allow smooth wheel zoom when cursor is inside the 3D viewport
			e.preventDefault();
			const zoomStep = e.deltaY * 0.015;
			targetDistance = Math.max(10.5, Math.min(42.0, targetDistance + zoomStep));
		};

		canvasEl.addEventListener('pointerdown', onPointerDown);
		canvasEl.addEventListener('pointermove', onPointerMove);
		canvasEl.addEventListener('pointerup', onPointerUp);
		canvasEl.addEventListener('pointercancel', onPointerUp);
		canvasEl.addEventListener('wheel', onWheel, { passive: false });

		// --- Animation Loop ---
		let rafId = 0;
		let prevTimeMs = performance.now();
		let labelSyncCounter = 0;
		const tempVec = new THREE.Vector3();

		const ratioLabels = ['8:5', '5:3', '3:2', '3:2', '4:3', '3:2'];

		const animate = (nowMs: number) => {
			rafId = requestAnimationFrame(animate);
			if (!isVisibleInViewport) {
				prevTimeMs = nowMs;
				return;
			}

			const dtSec = Math.min(0.1, (nowMs - prevTimeMs) / 1000);
			prevTimeMs = nowMs;
			const elapsedSec = nowMs * 0.001;

			// Rebuild scene if user switched exoplanet system
			if (builtSystemId !== selectedSystemId) {
				rebuildSystemScene(currentSystem);
			}

			// Advance simulation time
			if (!isPaused && timeSpeedDaysPerSec > 0) {
				simulationDays += dtSec * timeSpeedDaysPerSec;
			}

			// Smoothly damp camera spherical coordinates
			currentAzimuth += (targetAzimuth - currentAzimuth) * 0.12;
			currentElevation += (targetElevation - currentElevation) * 0.12;
			currentDistance += (targetDistance - currentDistance) * 0.12;

			camera.position.x =
				currentDistance * Math.cos(currentElevation) * Math.sin(currentAzimuth);
			camera.position.y = currentDistance * Math.sin(currentElevation);
			camera.position.z =
				currentDistance * Math.cos(currentElevation) * Math.cos(currentAzimuth);
			camera.lookAt(0, 0, 0);

			// Billboard the stellar corona toward camera
			coronaMesh.quaternion.copy(camera.quaternion);

			// Update Star & HZ Uniforms
			starUniforms.uTime.value = elapsedSec;
			coronaUniforms.uTime.value = elapsedSec;
			hzUniforms.uTime.value = elapsedSec;
			hzMesh.visible = showHabitableZone;
			solarOverlayGroup.visible = showSolarScaleOverlay;

			// Update Planet Positions & Shaders
			const currentAngles: number[] = [];
			for (let i = 0; i < planetNodes.length; i++) {
				const node = planetNodes[i];
				const omega = (Math.PI * 2) / node.data.orbitalPeriodDays;
				const angle = node.initialPhaseRad + simulationDays * omega;
				currentAngles.push(angle);

				const inclRad = ((90 - node.data.inclinationDeg) * Math.PI) / 180;
				const x = Math.cos(angle) * node.semiMajorScene - node.focalOffsetScene;
				const z = Math.sin(angle) * node.semiMinorScene;
				const y = Math.sin(angle) * Math.sin(inclRad) * node.semiMajorScene * 0.35;

				node.mesh.position.set(x, y, z);

				// Tidally locked worlds always keep their substellar hemisphere facing the star (0,0,0)
				if (node.data.tidallyLocked) {
					node.mesh.lookAt(0, 0, 0);
				} else {
					node.mesh.rotation.y = elapsedSec * 0.8 + i;
				}

				const isSel = node.data.id === selectedPlanetId;
				node.material.uniforms.uTime.value = elapsedSec;
				node.material.uniforms.uSelected.value = isSel ? 1.0 : 0.0;

				// Highlight selected planet's orbit ring
				if (isSel) {
					node.orbitMaterial.opacity = 0.92;
					reticleMesh.position.set(x, y - 0.02, z);
					reticleMesh.scale.setScalar(node.visualRadius * (1.28 + 0.12 * Math.sin(elapsedSec * 4.5)));
				} else {
					node.orbitMaterial.opacity = node.data.isReferenceWorld
						? 0.25
						: node.data.inHabitableZone
							? 0.5
							: 0.3;
				}
			}

			// Evaluate Laplace Resonance Inferior Conjunctions between adjacent planets
			const detectedConjunctions: Array<{
				pairLabel: string;
				ratio: string;
				intensity: number;
				planetA: string;
				planetB: string;
			}> = [];

			for (let i = 0; i < Math.min(6, planetNodes.length - 1); i++) {
				const beamLine = conjunctionGroup.children[i] as THREE.Line<
					THREE.BufferGeometry,
					THREE.LineBasicMaterial
				>;
				if (!beamLine) continue;

				const nodeA = planetNodes[i];
				const nodeB = planetNodes[i + 1];
				if (nodeA.data.isReferenceWorld || nodeB.data.isReferenceWorld) {
					beamLine.material.opacity = 0;
					continue;
				}

				const diff = Math.atan2(
					Math.sin(currentAngles[i] - currentAngles[i + 1]),
					Math.cos(currentAngles[i] - currentAngles[i + 1])
				);
				const absDiff = Math.abs(diff);
				const threshold = 0.24; // ~13.7 degrees alignment window

				if (absDiff < threshold) {
					const intensity = 1.0 - absDiff / threshold;
					const posAttr = beamLine.geometry.getAttribute('position') as THREE.BufferAttribute;
					posAttr.setXYZ(
						0,
						nodeA.mesh.position.x,
						nodeA.mesh.position.y,
						nodeA.mesh.position.z
					);
					posAttr.setXYZ(
						1,
						nodeB.mesh.position.x,
						nodeB.mesh.position.y,
						nodeB.mesh.position.z
					);
					posAttr.needsUpdate = true;
					beamLine.material.opacity = intensity * 0.85;

					detectedConjunctions.push({
						pairLabel: `${nodeA.data.letter}–${nodeB.data.letter}`,
						ratio: ratioLabels[i] ?? 'Resonant',
						intensity,
						planetA: nodeA.data.name,
						planetB: nodeB.data.name
					});
				} else {
					beamLine.material.opacity = 0;
				}
			}

			// Project 3D Planet Positions to 2D Overlay Coordinates (~20Hz throttle for crisp UI without DOM thrash)
			labelSyncCounter++;
			if (labelSyncCounter % 3 === 0 && canvasEl) {
				const rect = canvasEl.getBoundingClientRect();
				const w = rect.width;
				const h = rect.height;

				if (
					detectedConjunctions.length > 0 &&
					activeConjunctions.length === 0 &&
					!isPaused
				) {
					conjunctionCount += 1;
				}
				activeConjunctions = detectedConjunctions;

				projectedLabels = planetNodes.map((node) => {
					tempVec.copy(node.mesh.position);
					tempVec.y += node.visualRadius + 0.32;
					tempVec.project(camera);
					const x = (tempVec.x * 0.5 + 0.5) * w;
					const y = (-tempVec.y * 0.5 + 0.5) * h;
					const visible =
						tempVec.z < 1.0 && x > 24 && x < w - 24 && y > 24 && y < h - 24;
					return {
						id: node.data.id,
						letter: node.data.letter,
						name: node.data.name,
						x,
						y,
						visible,
						inHz: node.data.inHabitableZone,
						isSelected: node.data.id === selectedPlanetId,
						isRef: Boolean(node.data.isReferenceWorld)
					};
				});
			}

			renderer.render(scene, camera);
		};

		rafId = requestAnimationFrame(animate);

		return () => {
			cancelAnimationFrame(rafId);
			resizeObserver.disconnect();
			intersectionObserver.disconnect();
			if (canvasEl) {
				canvasEl.removeEventListener('pointerdown', onPointerDown);
				canvasEl.removeEventListener('pointermove', onPointerMove);
				canvasEl.removeEventListener('pointerup', onPointerUp);
				canvasEl.removeEventListener('pointercancel', onPointerUp);
				canvasEl.removeEventListener('wheel', onWheel);
			}
			disposeGroup(systemGroup);
			disposeGroup(conjunctionGroup);
			disposeGroup(solarOverlayGroup);
			sharedSphereGeo.dispose();
			bgStarGeo.dispose();
			bgStarMat.dispose();
			starGeo.dispose();
			starMat.dispose();
			coronaGeo.dispose();
			coronaMat.dispose();
			hzGeo.dispose();
			hzMat.dispose();
			reticleGeo.dispose();
			reticleMat.dispose();
			renderer.dispose();
		};
	};

	onMount(() => {
		const syncViewportMode = () => {
			const mobile = window.innerWidth < 768;
			if (mobile !== isMobileViewport) {
				isMobileViewport = mobile;
				dataPanelOpen = !mobile;
			}
		};
		isMobileViewport = window.innerWidth < 768;
		dataPanelOpen = !isMobileViewport;
		window.addEventListener('resize', syncViewportMode, { passive: true });
		cleanupOrreryWebGL = mountOrreryWebGL() ?? null;

		return () => {
			window.removeEventListener('resize', syncViewportMode);
			if (cleanupOrreryWebGL) {
				cleanupOrreryWebGL();
				cleanupOrreryWebGL = null;
			}
		};
	});
</script>

<section
	data-testid="orrery-scene-section"
	class="relative my-6 md:my-10 overflow-hidden border-y border-[rgba(232,230,225,0.12)] bg-[#050607] py-4 md:py-8 px-4 sm:px-6 lg:px-8"
	aria-label="Interactive 3D Exoplanet Orrery and JWST Atmospheric Spectrometer"
>
	{#if mobileLiteMode}
		<div class="flex flex-col gap-3 p-4" data-testid="orrery-mobile-lite">
			<div class="font-mono-tech text-xs uppercase tracking-[0.14em] text-[#C89B57]">
				SET PIECE 02 · {selectedPlanet.name} ({currentSystem.star.name})
			</div>
			<p class="font-sans text-base text-[#E8E6E1]/80">{selectedPlanet.subtitle}</p>
		</div>
	{:else}
	<!-- Top Header & Census Telemetry Banner -->
	<div class="mb-8 flex flex-col justify-between gap-6 border-b border-[rgba(232,230,225,0.12)] pb-6 lg:flex-row lg:items-end">
		<div>
			<div class="mb-3 flex flex-wrap items-center gap-4 font-mono-tech text-xs uppercase tracking-[0.16em]">
				<span class="text-[#C89B57]">
					SET PIECE 02 · WEBGL ORRERY &amp; JWST SPECTROMETER
				</span>
				<span class="text-[rgba(232,230,225,0.6)]">
					{EXOPLANET_CENSUS.confirmedPlanets.toLocaleString()}+ CONFIRMED WORLDS · {EXOPLANET_CENSUS.confirmedSystems.toLocaleString()}+ SYSTEMS
				</span>
			</div>
			<h3 class="font-display text-2xl font-normal tracking-[-0.02em] text-[#E8E6E1] sm:text-4xl leading-[1.08]">
				Alien Architectures: The Interactive Exoplanet Orrery
			</h3>
			<p class="mt-3 max-w-[65ch] font-sans text-base leading-[1.7] text-[rgba(232,230,225,0.72)]">
				{currentSystem.description}
			</p>
		</div>

		<!-- Detection Method Breakdown Hairline Ledger -->
		<div class="w-full shrink-0 border-l border-[rgba(232,230,225,0.14)] pl-4 lg:w-88">
			<div class="mb-2 flex items-center justify-between font-mono-tech text-[11px] uppercase tracking-[0.16em] text-[rgba(232,230,225,0.6)]">
				<span>DISCOVERY CENSUS</span>
				<span class="text-[#C89B57]">NASA EXOPLANET ARCHIVE</span>
			</div>
			<div class="flex h-1.5 w-full overflow-hidden bg-[rgba(232,230,225,0.08)]">
				{#each EXOPLANET_CENSUS.detectionMethods as dm, idx}
					{@const barShades = ['#C89B57', 'rgba(232,230,225,0.72)', 'rgba(232,230,225,0.44)', 'rgba(200,155,87,0.42)']}
					<div
						style="width: {dm.sharePct}%; background-color: {barShades[idx % barShades.length]};"
						title="{dm.method}: {dm.sharePct}%"
					></div>
				{/each}
			</div>
			<div class="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 font-mono-tech text-[11px] uppercase tracking-[0.16em] text-[rgba(232,230,225,0.6)]">
				{#each EXOPLANET_CENSUS.detectionMethods as dm, idx}
					<span class={idx === 0 ? 'text-[#C89B57]' : 'text-[rgba(232,230,225,0.6)]'}>
						{dm.method.split(' ')[0]} {dm.sharePct}%
					</span>
				{/each}
			</div>
		</div>
	</div>

	<!-- System Switcher Hairline Bar -->
	<div class="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[rgba(232,230,225,0.10)] pb-4">
		<div class="flex flex-wrap items-center divide-x divide-[rgba(232,230,225,0.12)] border border-[rgba(232,230,225,0.12)]" role="tablist" aria-label="Planetary System Switcher">
			{#each EXOPLANET_SYSTEMS as sys}
				{@const active = sys.id === selectedSystemId}
				<button
					type="button"
					role="tab"
					aria-selected={active}
					onclick={() => selectSystem(sys.id)}
					class="cursor-pointer px-4 py-2.5 text-left transition-colors duration-500 {active
						? 'bg-[rgba(200,155,87,0.12)] text-[#E8E6E1]'
						: 'bg-transparent text-[rgba(232,230,225,0.72)] hover:bg-[rgba(232,230,225,0.04)] hover:text-[#E8E6E1]'}"
				>
					<span class="block font-mono-tech text-[11px] uppercase tracking-[0.16em] {active ? 'text-[#C89B57]' : 'text-[rgba(232,230,225,0.6)]'}">
						{sys.star.spectralType.split(' ')[0]} · {sys.star.effectiveTempK} K
					</span>
					<span class="mt-0.5 block font-display text-sm font-normal">{sys.shortLabel}</span>
				</button>
			{/each}
		</div>

		<!-- Visual Layer Toggles -->
		<div class="flex flex-wrap items-center gap-5 font-mono-tech text-xs uppercase tracking-[0.14em]">
			<button
				type="button"
				onclick={() => (showHabitableZone = !showHabitableZone)}
				class="cursor-pointer border-b pb-1 transition-colors duration-500 {showHabitableZone
					? 'border-[#C89B57] text-[#C89B57]'
					: 'border-transparent text-[rgba(232,230,225,0.6)] hover:text-[#E8E6E1]'}"
			>
				HZ ANNULUS: {showHabitableZone ? 'ON' : 'OFF'}
			</button>

			<button
				type="button"
				onclick={() => (showSolarScaleOverlay = !showSolarScaleOverlay)}
				class="cursor-pointer border-b pb-1 transition-colors duration-500 {showSolarScaleOverlay
					? 'border-[#C89B57] text-[#C89B57]'
					: 'border-transparent text-[rgba(232,230,225,0.6)] hover:text-[#E8E6E1]'}"
			>
				SOLAR SCALE RINGS: {showSolarScaleOverlay ? 'ON' : 'OFF'}
			</button>

			<button
				type="button"
				onclick={() => (showOrbitLabels = !showOrbitLabels)}
				class="cursor-pointer border-b pb-1 transition-colors duration-500 {showOrbitLabels
					? 'border-[#C89B57] text-[#C89B57]'
					: 'border-transparent text-[rgba(232,230,225,0.6)] hover:text-[#E8E6E1]'}"
			>
				3D LABELS: {showOrbitLabels ? 'ON' : 'OFF'}
			</button>
		</div>
	</div>

	<!-- Main Two-Column Interactive Workspace: 3D Orrery Viewport (Left) + Editorial Telemetry & JWST Spectra (Right) -->
	<div class="grid grid-cols-1 gap-8 xl:grid-cols-12">
		<!-- Left Column (Expands to Full 12 Cols when DATA panel is collapsed): 3D WebGL Orrery Viewport -->
		<div class="flex flex-col gap-5 {dataPanelOpen ? 'xl:col-span-7' : 'xl:col-span-12'}">
			<!-- 3D Viewport Container -->
			<div
				bind:this={containerEl}
				data-testid="orrery-canvas-container"
				class="relative h-[370px] sm:h-[510px] w-full overflow-hidden border border-[rgba(232,230,225,0.12)] bg-[#050607]"
			>
				<canvas
					bind:this={canvasEl}
					data-testid="orrery-webgl-canvas"
					data-orbit-azimuth={orbitAzimuthDeg}
					data-orbit-elevation={orbitElevationDeg}
					class="h-full w-full touch-none {isDraggingCanvas ? 'cursor-grabbing' : 'cursor-grab'}"
				></canvas>

				<!-- Projected 2D Planet Marker Labels over 3D Scene (pointer-events-none container; >=12px buttons) -->
				{#if showOrbitLabels && (!isMobileViewport || dataPanelOpen)}
					<div class="pointer-events-none absolute inset-0 overflow-hidden">
						{#each projectedLabels as lbl (lbl.id)}
							{#if lbl.visible}
								<button
									type="button"
									onclick={() => (selectedPlanetId = lbl.id)}
									style="transform: translate3d({lbl.x}px, {lbl.y}px, 0) translate(-50%, -100%);"
									class="pointer-events-auto absolute top-0 left-0 cursor-pointer border px-1.5 py-0.5 font-mono-tech text-xs uppercase tracking-[0.12em] transition-colors {lbl.isSelected
										? 'border-[#C89B57] bg-[#050607] text-[#C89B57]'
										: lbl.inHz
											? 'border-[rgba(200,155,87,0.45)] bg-[rgba(5,6,7,0.85)] text-[#E8E6E1] hover:border-[#C89B57]'
											: 'border-[rgba(232,230,225,0.18)] bg-[rgba(5,6,7,0.82)] text-[rgba(232,230,225,0.75)] hover:border-[rgba(232,230,225,0.45)] hover:text-[#E8E6E1]'}"
								>
									{lbl.letter}
								</button>
							{/if}
						{/each}
					</div>
				{/if}

				<!-- Persistent Top-Right DATA − / DATA + Toggle Chip (Always in Margin; Collapsed by Default on Mobile) -->
				<div class="pointer-events-none absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex flex-col items-end gap-2">
					<div class="flex items-center gap-2">
						{#if !dataPanelOpen}
							<span class="hidden sm:inline-block border border-[rgba(232,230,225,0.14)] bg-[rgba(5,6,7,0.82)] px-2.5 py-1.5 font-mono-tech text-[11px] uppercase tracking-[0.14em] text-[rgba(232,230,225,0.72)] backdrop-blur-sm">
								{currentSystem.star.name} · {selectedPlanet.name}
							</span>
						{/if}
						<button
							type="button"
							data-testid="orrery-data-toggle"
							aria-expanded={dataPanelOpen}
							onclick={() => (dataPanelOpen = !dataPanelOpen)}
							class="pointer-events-auto cursor-pointer border border-[#C89B57]/75 bg-[rgba(5,6,7,0.9)] px-3 py-1.5 font-mono-tech text-xs font-medium uppercase tracking-[0.16em] text-[#C89B57] backdrop-blur-sm transition-colors hover:border-[#DDB474] hover:bg-[rgba(200,155,87,0.15)] hover:text-[#DDB474]"
						>
							{dataPanelOpen ? 'DATA −' : 'DATA +'}
						</button>
					</div>

					{#if !isMobileViewport && dataPanelOpen}
						<div class="pointer-events-auto flex items-center divide-x divide-[rgba(232,230,225,0.12)] border border-[rgba(232,230,225,0.12)] bg-[rgba(5,6,7,0.85)] backdrop-blur-sm">
							<button
								type="button"
								onclick={() => applyCameraPreset('perspective')}
								class="font-mono-tech cursor-pointer px-2.5 py-1.5 text-xs uppercase tracking-[0.14em] transition-colors {cameraPreset ===
								'perspective'
									? 'text-[#C89B57]'
									: 'text-[rgba(232,230,225,0.65)] hover:text-[#E8E6E1]'}"
							>
								3D TILT
							</button>
							<button
								type="button"
								onclick={() => applyCameraPreset('top-down')}
								class="font-mono-tech cursor-pointer px-2.5 py-1.5 text-xs uppercase tracking-[0.14em] transition-colors {cameraPreset ===
								'top-down'
									? 'text-[#C89B57]'
									: 'text-[rgba(232,230,225,0.65)] hover:text-[#E8E6E1]'}"
							>
								TOP-DOWN
							</button>
							<button
								type="button"
								onclick={() => applyCameraPreset('transit')}
								class="font-mono-tech cursor-pointer px-2.5 py-1.5 text-xs uppercase tracking-[0.14em] transition-colors {cameraPreset ===
								'transit'
									? 'text-[#C89B57]'
									: 'text-[rgba(232,230,225,0.65)] hover:text-[#E8E6E1]'}"
							>
								TRANSIT
							</button>
						</div>

						<div class="pointer-events-auto flex items-center divide-x divide-[rgba(232,230,225,0.12)] border border-[rgba(232,230,225,0.12)] bg-[rgba(5,6,7,0.85)] backdrop-blur-sm">
							<button
								type="button"
								onclick={() => adjustZoom(-3.0)}
								class="font-mono-tech cursor-pointer px-2.5 py-1 text-xs text-[#E8E6E1] hover:text-[#C89B57]"
								title="Zoom In"
							>
								+
							</button>
							<span class="font-mono-tech px-2 py-1 text-[11px] uppercase tracking-[0.14em] text-[rgba(232,230,225,0.65)]">ZOOM</span>
							<button
								type="button"
								onclick={() => adjustZoom(3.0)}
								class="font-mono-tech cursor-pointer px-2.5 py-1 text-xs text-[#E8E6E1] hover:text-[#C89B57]"
								title="Zoom Out"
							>
								−
							</button>
						</div>
					{/if}
				</div>

				<!-- DESKTOP ONLY Margin Overlays (Clear of Center Focal Point; pointer-events-none so drag works everywhere) -->
				{#if !isMobileViewport && dataPanelOpen}
					<!-- Top-Left Margin: Compact Host Star Telemetry -->
					<div
						data-testid="orrery-desktop-star-overlay"
						class="pointer-events-none absolute top-3.5 left-3.5 max-w-[235px] border-l border-[rgba(232,230,225,0.22)] bg-[rgba(5,6,7,0.8)] pl-3 pr-3 py-2 backdrop-blur-sm"
					>
						<div class="flex items-center gap-2">
							<span
								class="h-2 w-2 rounded-full"
								style="background-color: {currentSystem.star.midColor};"
							></span>
							<span class="font-display text-sm font-normal text-[#E8E6E1]">
								{currentSystem.star.name}
							</span>
							<span class="font-mono-tech text-xs uppercase tracking-[0.14em] text-[#C89B57]">
								{currentSystem.star.spectralType}
							</span>
						</div>
						<div class="mt-1.5 grid grid-cols-3 gap-2.5 border-t border-[rgba(232,230,225,0.10)] pt-1.5 font-mono-tech text-[11px] uppercase tracking-[0.12em]">
							<div>
								<span class="block text-[rgba(232,230,225,0.6)]">TEFF</span>
								<span class="text-xs text-[#E8E6E1]">{currentSystem.star.effectiveTempK} K</span>
							</div>
							<div>
								<span class="block text-[rgba(232,230,225,0.6)]">MASS</span>
								<span class="text-xs text-[#E8E6E1]">{currentSystem.star.massSolar} M☉</span>
							</div>
							<div>
								<span class="block text-[rgba(232,230,225,0.6)]">DIST</span>
								<span class="text-xs text-[#C89B57]">
									{currentSystem.star.distanceLightYears < 0.01
										? '1.00 AU'
										: `${currentSystem.star.distanceLightYears} LY`}
								</span>
							</div>
						</div>
					</div>

					<!-- Bottom Margin: Slim Laplace Resonance Conjunction Readout -->
					<div
						data-testid="orrery-desktop-resonance-overlay"
						class="pointer-events-none absolute bottom-0 left-0 right-0 flex flex-wrap items-center justify-between gap-3 border-t border-[rgba(232,230,225,0.12)] bg-[rgba(5,6,7,0.82)] px-4 py-2 backdrop-blur-sm"
					>
						<div class="flex flex-wrap items-center gap-3 font-mono-tech text-xs uppercase tracking-[0.14em]">
							<span
								class="h-1.5 w-1.5 rounded-full {activeConjunctions.length > 0
									? 'bg-[#C89B57]'
									: 'bg-[rgba(232,230,225,0.35)]'}"
							></span>
							<span class="text-[#E8E6E1]">
								{currentSystem.hasLaplaceResonance
									? 'LAPLACE RESONANCE (24:15:9:6:4:3:2)'
									: 'INFERIOR CONJUNCTION TRACKER'}
							</span>
							{#if activeConjunctions.length > 0}
								{#each activeConjunctions as conj}
									<span class="text-[#C89B57]">
										[{conj.pairLabel} · {conj.ratio} ALIGNED]
									</span>
								{/each}
							{:else}
								<span class="text-[11px] text-[rgba(232,230,225,0.6)]">
									DRAG TO ORBIT · SCROLL TO ZOOM · CLICK WORLD
								</span>
							{/if}
						</div>
						<div class="font-mono-tech text-xs uppercase tracking-[0.14em] text-[#C89B57]">
							T + {simulationDays.toFixed(1)} D · CONJUNCTIONS: {conjunctionCount}
						</div>
					</div>
				{/if}
			</div>

			<!-- MOBILE CAMERA & HOST STAR STRIP BELOW SCENE (Never overlaps 3D scene on mobile) -->
			{#if isMobileViewport}
				<div
					data-testid="orrery-mobile-controls-below"
					class="flex flex-wrap items-center justify-between gap-2 border border-[rgba(232,230,225,0.12)] bg-[#08090B] px-3 py-2 font-mono-tech text-xs uppercase tracking-[0.12em]"
				>
					<div class="flex items-center gap-2">
						<button
							type="button"
							onclick={() => applyCameraPreset('perspective')}
							class="cursor-pointer {cameraPreset === 'perspective' ? 'text-[#C89B57]' : 'text-[#E8E6E1]/65'}"
						>
							3D TILT
						</button>
						<span class="text-[#E8E6E1]/25">·</span>
						<button
							type="button"
							onclick={() => applyCameraPreset('top-down')}
							class="cursor-pointer {cameraPreset === 'top-down' ? 'text-[#C89B57]' : 'text-[#E8E6E1]/65'}"
						>
							TOP-DOWN
						</button>
						<span class="text-[#E8E6E1]/25">·</span>
						<button
							type="button"
							onclick={() => applyCameraPreset('transit')}
							class="cursor-pointer {cameraPreset === 'transit' ? 'text-[#C89B57]' : 'text-[#E8E6E1]/65'}"
						>
							TRANSIT
						</button>
					</div>
					<div class="text-[11px] text-[#C89B57]">
						{currentSystem.star.name} · T+{simulationDays.toFixed(0)}D
					</div>
				</div>
			{/if}
			<!-- Time-Warp Speed Scrubber Hairline Bar -->
			<div
				class="flex flex-wrap items-center justify-between gap-4 border-y border-[rgba(232,230,225,0.12)] py-3"
			>
				<div class="flex flex-wrap items-center gap-4 font-mono-tech text-[11px] uppercase tracking-[0.16em]">
					<span class="text-[rgba(232,230,225,0.6)]">
						TIME-WARP SPEED
					</span>
					{#each [
						{ label: 'PAUSE', speed: 0 },
						{ label: '1 D/S', speed: 1 },
						{ label: '10 D/S', speed: 10 },
						{ label: '60 D/S', speed: 60 }
					] as preset}
						{@const isCurrent =
							(preset.speed === 0 && isPaused) ||
							(!isPaused && Math.abs(timeSpeedDaysPerSec - preset.speed) < 0.2)}
						<button
							type="button"
							onclick={() => {
								if (preset.speed === 0) {
									isPaused = true;
								} else {
									isPaused = false;
									timeSpeedDaysPerSec = preset.speed;
								}
							}}
							class="cursor-pointer border-b pb-0.5 transition-colors duration-500 {isCurrent
								? 'border-[#C89B57] text-[#C89B57]'
								: 'border-transparent text-[rgba(232,230,225,0.6)] hover:text-[#E8E6E1]'}"
						>
							{preset.label}
						</button>
					{/each}
				</div>

				<div class="flex flex-1 items-center gap-3 min-w-[180px]">
					<input
						type="range"
						min="0.2"
						max="60"
						step="0.2"
						bind:value={timeSpeedDaysPerSec}
						oninput={() => (isPaused = false)}
						aria-label="Continuous orbital speed in days per second"
						class="h-1 flex-1 cursor-pointer appearance-none bg-[rgba(232,230,225,0.16)] accent-[#C89B57]"
					/>
					<span class="font-mono-tech w-20 text-right text-[11px] uppercase tracking-[0.16em] text-[#C89B57]">
						{isPaused ? 'PAUSED' : `${timeSpeedDaysPerSec.toFixed(1)} D/S`}
					</span>
				</div>
			</div>

			<!-- Editorial Planet Index Table (replaces neon pill selector) -->
			<div class="border-t border-[rgba(232,230,225,0.12)] pt-3">
				<div class="mb-2.5 flex items-center justify-between font-mono-tech text-[11px] uppercase tracking-[0.16em] text-[rgba(232,230,225,0.6)]">
					<span>ORBITING WORLD INDEX — SELECT FOR TELEMETRY &amp; JWST SPECTRUM</span>
					<span class="text-[#C89B57]">● HABITABLE ZONE</span>
				</div>
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 divide-y divide-[rgba(232,230,225,0.09)] border-y border-[rgba(232,230,225,0.12)]">
					{#each currentSystem.planets as planet, idx (planet.id)}
						{@const isSelected = planet.id === selectedPlanet.id}
						<button
							type="button"
							onclick={() => (selectedPlanetId = planet.id)}
							class="cursor-pointer flex items-baseline justify-between gap-2 py-2.5 px-2 text-left transition-colors duration-500 {isSelected
								? 'bg-[rgba(200,155,87,0.10)]'
								: 'hover:bg-[rgba(232,230,225,0.03)]'}"
						>
							<div class="flex flex-wrap items-baseline gap-2">
								<span class="font-mono-tech text-[11px] uppercase tracking-[0.16em] text-[#C89B57]">
									{String(idx + 1).padStart(2, '0')}
								</span>
								<span class="font-display text-base font-normal text-[#E8E6E1] whitespace-nowrap">
									{planet.name}
								</span>
								{#if planet.inHabitableZone}
									<span class="font-mono-tech text-[11px] uppercase tracking-[0.14em] text-[#C89B57] whitespace-nowrap">
										● HZ
									</span>
								{/if}
							</div>
							<span class="font-mono-tech text-[11px] uppercase tracking-[0.12em] text-[rgba(232,230,225,0.6)] shrink-0">
								{planet.semiMajorAxisAu} AU · {planet.orbitalPeriodDays.toFixed(1)}D
							</span>
						</button>
					{/each}
				</div>
			</div>
			<!-- Interactive SVG Transit Photometry Light-Curve -->
			{#if dataPanelOpen}
				<!-- Interactive SVG Transit Photometry Light-Curve -->
				<div class="border-t border-[rgba(232,230,225,0.12)] pt-4">
					<div class="mb-2.5 flex items-baseline justify-between gap-2">
						<div>
							<span class="font-mono-tech text-[11px] uppercase tracking-[0.16em] text-[rgba(232,230,225,0.6)]">
								KEPLER / TESS / JWST PHOTOMETRY
							</span>
							<h5 class="font-display mt-0.5 text-base font-normal text-[#E8E6E1]">
								Stellar Transit Light-Curve Profile
							</h5>
						</div>
						<div class="text-right font-mono-tech text-[11px] uppercase tracking-[0.16em]">
							<span class="text-xs text-[#C89B57]">
								ΔF = {selectedPlanet.transitDepthPct.toFixed(4)}%
							</span>
							<span class="block text-[rgba(232,230,225,0.6)]">
								{selectedPlanet.baselineTransitDepthPpm.toLocaleString()} PPM · {selectedPlanet.transitDurationHours}H
							</span>
						</div>
					</div>

					<div class="w-full overflow-x-auto pb-1">
						<div class="min-w-[440px] w-full">
							<svg
								viewBox="0 0 440 128"
								class="w-full h-auto overflow-visible border border-[rgba(232,230,225,0.12)] bg-[#050607]"
								role="img"
								aria-label="Transit Light Curve for {selectedPlanet.name}"
							>
								<defs>
									<linearGradient id="transitFillGrad" x1="0" y1="0" x2="0" y2="1">
										<stop offset="0%" stop-color="#C89B57" stop-opacity="0.22" />
										<stop offset="100%" stop-color="#050607" stop-opacity="0.0" />
									</linearGradient>
								</defs>

								<!-- Reference Flux = 1.0000 Line -->
								<line
									x1="0"
									y1="26"
									x2="440"
									y2="26"
									stroke="rgba(232, 230, 225, 0.16)"
									stroke-dasharray="3 3"
								/>
								<!-- Ingress / Egress Markers -->
								<line
									x1={transitSvg.ingressX}
									y1="14"
									x2={transitSvg.ingressX}
									y2="112"
									stroke="rgba(232, 230, 225, 0.14)"
									stroke-dasharray="2 3"
								/>
								<line
									x1={transitSvg.egressX}
									y1="14"
									x2={transitSvg.egressX}
									y2="112"
									stroke="rgba(232, 230, 225, 0.14)"
									stroke-dasharray="2 3"
								/>

								<path d={transitSvg.areaPath} fill="url(#transitFillGrad)" />
								<path
									d={transitSvg.linePath}
									fill="none"
									stroke="#E8E6E1"
									stroke-width="1.75"
									stroke-linecap="round"
								/>

								<!-- Mid-Transit Depth Annotation -->
								<circle cx="220" cy={transitSvg.dipBottomY} r="3.5" fill="#C89B57" />
								<text
									x="220"
									y={Math.min(106, transitSvg.dipBottomY + 16)}
									text-anchor="middle"
									fill="#C89B57"
									font-family="var(--font-mono)"
									font-size="12.5"
								>
									MID-TRANSIT −{selectedPlanet.baselineTransitDepthPpm.toLocaleString()} PPM
								</text>
								<text x="10" y="19" fill="rgba(232, 230, 225, 0.68)" font-family="var(--font-mono)" font-size="11.5">
									FLUX 1.0000
								</text>
								<text x="430" y="122" text-anchor="end" fill="rgba(232, 230, 225, 0.6)" font-family="var(--font-mono)" font-size="11.5">
									PHASE (−{selectedPlanet.transitDurationHours}H → +{selectedPlanet.transitDurationHours}H)
								</text>
							</svg>
						</div>
					</div>
				</div>
			{/if}
		</div>

		<!-- Right 5 Columns (or Below Scene on Mobile when DATA panel is open): Selected World Editorial Telemetry Table & JWST Spectra -->
		{#if dataPanelOpen}
		<div data-testid="orrery-telemetry-panel" class="flex flex-col gap-6 xl:col-span-5">
			<!-- Selected Planet Header & Key Physical Telemetry Hairline Table -->
			<div class="border-t border-[rgba(232,230,225,0.18)] pt-4">
				<div class="flex items-start justify-between gap-4">
					<div>
						<div class="flex flex-wrap items-center gap-3 font-mono-tech text-[11px] uppercase tracking-[0.16em]">
							<span class="text-[#C89B57]">
								DISC. {selectedPlanet.discoveryYear > 0 ? selectedPlanet.discoveryYear : 'ANTIQUITY'} · {selectedPlanet.discoveryMethod.split('(')[0]}
							</span>
							{#if selectedPlanet.inHabitableZone}
								<span class="text-[#E8E6E1]">
									[HABITABLE ZONE]
								</span>
							{/if}
							{#if selectedPlanet.tidallyLocked}
								<span class="text-[rgba(232,230,225,0.6)]">
									TIDALLY LOCKED
								</span>
							{/if}
						</div>
						<h4 class="font-display mt-2 text-3xl font-normal tracking-[-0.02em] text-[#E8E6E1]">
							{selectedPlanet.name}
						</h4>
						<p class="mt-1 font-sans text-base text-[rgba(232,230,225,0.72)]">{selectedPlanet.subtitle}</p>
					</div>

					{#if selectedPlanet.resonanceRatio}
						<div class="shrink-0 border-l border-[rgba(232,230,225,0.14)] pl-3 text-right font-mono-tech">
							<span class="block text-[11px] uppercase tracking-[0.16em] text-[rgba(232,230,225,0.6)]">RESONANCE</span>
							<span class="mt-0.5 block text-xs text-[#C89B57]">{selectedPlanet.resonanceRatio}</span>
						</div>
					{/if}
				</div>

				<!-- 6-Cell Hairline Telemetry Table -->
				<div class="mt-5 grid grid-cols-2 sm:grid-cols-3 border-y border-[rgba(232,230,225,0.12)] divide-y sm:divide-y-0 divide-[rgba(232,230,225,0.09)]">
					<div class="p-3 border-r border-b border-[rgba(232,230,225,0.09)]">
						<span class="font-mono-tech block text-[11px] uppercase tracking-[0.16em] text-[rgba(232,230,225,0.6)]">
							RADIUS (R⊕)
						</span>
						<span class="font-display mt-1 block text-xl font-normal text-[#E8E6E1]">
							{selectedPlanet.radiusEarth.toFixed(3)} R⊕
						</span>
						<span class="font-mono-tech text-[11px] uppercase tracking-[0.16em] text-[rgba(232,230,225,0.6)]">
							{(selectedPlanet.radiusEarth * 6371).toFixed(0)} KM
						</span>
					</div>

					<div class="p-3 sm:border-r border-b border-[rgba(232,230,225,0.09)]">
						<span class="font-mono-tech block text-[11px] uppercase tracking-[0.16em] text-[rgba(232,230,225,0.6)]">
							MASS (M⊕)
						</span>
						<span class="font-display mt-1 block text-xl font-normal text-[#E8E6E1]">
							{selectedPlanet.massEarth.toFixed(3)} M⊕
						</span>
						<span class="font-mono-tech text-[11px] uppercase tracking-[0.16em] text-[rgba(232,230,225,0.6)]">
							ρ = {selectedPlanet.densityGcm3.toFixed(2)} G/CM³
						</span>
					</div>

					<div class="p-3 border-r sm:border-r-0 border-b border-[rgba(232,230,225,0.09)]">
						<span class="font-mono-tech block text-[11px] uppercase tracking-[0.16em] text-[rgba(232,230,225,0.6)]">
							SEMI-MAJOR AXIS
						</span>
						<span class="font-display mt-1 block text-xl font-normal text-[#C89B57]">
							{selectedPlanet.semiMajorAxisAu.toFixed(4)} AU
						</span>
						<span class="font-mono-tech text-[11px] uppercase tracking-[0.16em] text-[rgba(232,230,225,0.6)]">
							{(selectedPlanet.semiMajorAxisAu * 149.6).toFixed(2)}M KM
						</span>
					</div>

					<div class="p-3 sm:border-r border-[rgba(232,230,225,0.09)]">
						<span class="font-mono-tech block text-[11px] uppercase tracking-[0.16em] text-[rgba(232,230,225,0.6)]">
							ORBITAL PERIOD
						</span>
						<span class="font-display mt-1 block text-xl font-normal text-[#E8E6E1]">
							{selectedPlanet.orbitalPeriodDays.toFixed(3)} D
						</span>
						<span class="font-mono-tech text-[11px] uppercase tracking-[0.16em] text-[rgba(232,230,225,0.6)]">
							e = {selectedPlanet.eccentricity.toFixed(4)}
						</span>
					</div>

					<div class="p-3 border-r border-[rgba(232,230,225,0.09)]">
						<span class="font-mono-tech block text-[11px] uppercase tracking-[0.16em] text-[rgba(232,230,225,0.6)]">
							EQUILIBRIUM TEMP
						</span>
						<span class="font-display mt-1 block text-xl font-normal text-[#C89B57]">
							{selectedPlanet.equilibriumTempK.toFixed(0)} K
						</span>
						<span class="font-mono-tech text-[11px] uppercase tracking-[0.16em] text-[rgba(232,230,225,0.6)]">
							{(selectedPlanet.equilibriumTempK - 273.15).toFixed(0)} °C
						</span>
					</div>

					<div class="p-3">
						<span class="font-mono-tech block text-[11px] uppercase tracking-[0.16em] text-[rgba(232,230,225,0.6)]">
							STELLAR FLUX (S⊕)
						</span>
						<span class="font-display mt-1 block text-xl font-normal text-[#E8E6E1]">
							{selectedPlanet.stellarFluxEarth.toFixed(2)} S⊕
						</span>
						<span class="font-mono-tech text-[11px] uppercase tracking-[0.16em] text-[rgba(232,230,225,0.6)]">
							g = {selectedPlanet.surfaceGravityG.toFixed(2)} G⊕
						</span>
					</div>
				</div>

				<!-- Science & JWST Observation Summary -->
				<div class="mt-4 border-l border-[#C89B57] pl-3.5 py-0.5 font-sans text-base leading-[1.68] text-[rgba(232,230,225,0.72)] max-w-[65ch]">
					<span class="font-mono-tech text-[11px] uppercase tracking-[0.16em] text-[#C89B57] block mb-1">JWST &amp; ARCHIVE BRIEFING</span>
					{selectedPlanet.jwstSummary}
				</div>
			</div>


			<!-- Interactive SVG JWST NIRSpec / MIRI Atmospheric Transmission Spectrum -->
			<div class="border-t border-[rgba(232,230,225,0.12)] pt-4">
				<div class="mb-2.5 flex items-baseline justify-between gap-2">
					<div>
						<span class="font-mono-tech text-[11px] uppercase tracking-[0.16em] text-[#C89B57]">
							JWST NIRSPEC PRISM / G395H SPECTROSCOPY (0.6–5.3 μm)
						</span>
						<h5 class="font-display mt-0.5 text-base font-normal text-[#E8E6E1]">
							Atmospheric Transmission Spectrum (CO₂ · H₂O · CH₄)
						</h5>
					</div>
					<span class="font-mono-tech text-[11px] uppercase tracking-[0.16em] text-[rgba(232,230,225,0.6)]">
						HOVER BANDS
					</span>
				</div>

				<div class="w-full overflow-x-auto pb-1">
					<div class="min-w-[460px] w-full">
						<svg
							viewBox="0 0 460 156"
							class="w-full h-auto overflow-visible border border-[rgba(232,230,225,0.12)] bg-[#050607]"
							role="img"
							aria-label="JWST Atmospheric Transmission Spectrum for {selectedPlanet.name}"
						>
							<defs>
								<linearGradient id="spectrumFillGrad" x1="0" y1="0" x2="0" y2="1">
									<stop offset="0%" stop-color="#C89B57" stop-opacity="0.24" />
									<stop offset="100%" stop-color="#050607" stop-opacity="0.02" />
								</linearGradient>
							</defs>

							<!-- Horizontal Grid Lines -->
							{#each [30, 62, 94, 122] as gy}
								<line
									x1="44"
									y1={gy}
									x2="444"
									y2={gy}
									stroke="rgba(232, 230, 225, 0.09)"
									stroke-dasharray="2 3"
								/>
							{/each}

							<!-- Y-Axis Labels -->
							<text x="40" y="30" text-anchor="end" fill="rgba(232, 230, 225, 0.68)" font-family="var(--font-mono)" font-size="11.5">
								{spectrumSvg.maxPpm}
							</text>
							<text x="40" y="124" text-anchor="end" fill="rgba(232, 230, 225, 0.68)" font-family="var(--font-mono)" font-size="11.5">
								{spectrumSvg.minPpm}
							</text>

							<!-- Continuous Model Spectrum Curve -->
							<path d={spectrumSvg.areaPath} fill="url(#spectrumFillGrad)" />
							<path
								d={spectrumSvg.linePath}
								fill="none"
								stroke="#C89B57"
								stroke-width="1.75"
								stroke-linecap="round"
							/>

							<!-- Simulated Binned NIRSpec Data Points + 1σ Error Bars -->
							{#each spectrumSvg.errorBars as eb}
								<line
									x1={eb.x}
									y1={eb.y - eb.errPx}
									x2={eb.x}
									y2={eb.y + eb.errPx}
									stroke="rgba(232, 230, 225, 0.36)"
									stroke-width="1"
								/>
								<circle cx={eb.x} cy={eb.y} r="1.8" fill="#E8E6E1" />
							{/each}

							<!-- Molecular Absorption Peak Callouts (Monochrome + Warm Amber) -->
							{#each spectrumSvg.markers as mk}
								{@const isHovered = hoveredWavelengthUm === mk.wavelengthUm}
								<g
									class="cursor-pointer"
									role="button"
									tabindex="0"
									onmouseenter={() => (hoveredWavelengthUm = mk.wavelengthUm)}
									onmouseleave={() => (hoveredWavelengthUm = null)}
									onfocus={() => (hoveredWavelengthUm = mk.wavelengthUm)}
									onblur={() => (hoveredWavelengthUm = null)}
								>
									<line
										x1={mk.x}
										y1={mk.y}
										x2={mk.x}
										y2="122"
										stroke={isHovered ? '#DDB474' : '#C89B57'}
										stroke-width="1"
										stroke-dasharray="2 2"
										opacity="0.65"
									/>
									<circle
										cx={mk.x}
										cy={mk.y}
										r={isHovered ? 5 : 3.5}
										fill={isHovered ? '#DDB474' : '#C89B57'}
										stroke="#050607"
										stroke-width="1.5"
									/>
									<text
										x={Math.min(415, Math.max(68, mk.x))}
										y={Math.max(16, mk.y - 8)}
										text-anchor="middle"
										fill="#E8E6E1"
										font-family="var(--font-mono)"
										font-size="12"
									>
										{mk.molecule} ({mk.wavelengthUm}μm)
									</text>
								</g>
							{/each}

							<!-- Wavelength X-Axis Ticks (0.6 to 5.3 um) -->
							{#each [1.0, 2.0, 3.0, 4.0, 5.0] as wl}
								{@const tx = 36 + ((wl - 0.6) / (5.3 - 0.6)) * (460 - 52)}
								<text
									x={tx}
									y="146"
									text-anchor="middle"
									fill="rgba(232, 230, 225, 0.68)"
									font-family="var(--font-mono)"
									font-size="11.5"
								>
									{wl.toFixed(1)} μm
								</text>
							{/each}
						</svg>
					</div>
				</div>

				<!-- Molecular Absorption Feature Hairline Table -->
				<div class="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 divide-y divide-[rgba(232,230,225,0.09)] border-t border-[rgba(232,230,225,0.12)]">
					{#each selectedPlanet.spectralFeatures as feat}
						{@const isHovered = hoveredWavelengthUm === feat.wavelengthUm}
						<div
							class="py-2 font-mono-tech text-[11px] uppercase tracking-[0.16em] transition-colors {isHovered
								? 'text-[#E8E6E1]'
								: 'text-[rgba(232,230,225,0.6)]'}"
						>
							<div class="flex items-center justify-between gap-2">
								<span class="text-[#C89B57]">{feat.molecule} · {feat.wavelengthUm} μm</span>
								<span class="text-[#E8E6E1]">+{feat.depthPpm} PPM</span>
							</div>
							<span class="mt-0.5 block font-sans text-base normal-case tracking-normal text-[rgba(232,230,225,0.72)]">{feat.label}</span>
						</div>
					{/each}
				</div>
			</div>
		</div>
		{/if}
	</div>
	{/if}
</section>

export type ExoplanetSystemId = 'trappist-1' | 'kepler-90' | '51-pegasi' | 'solar-system';

export type PlanetShaderStyle =
	| 'lava-rock'
	| 'venusian-rock'
	| 'temperate-terrestrial'
	| 'eyeball-ocean'
	| 'icy-waterworld'
	| 'cryo-rock'
	| 'super-earth'
	| 'mini-neptune'
	| 'warm-giant'
	| 'hot-jupiter'
	| 'earth-analog';

export interface SpectralFeature {
	molecule: 'CO2' | 'H2O' | 'CH4' | 'CO' | 'SO2' | 'Na/K' | 'O3' | 'Flat/Cloud-Deck';
	label: string;
	wavelengthUm: number;
	widthUm: number;
	depthPpm: number;
	confidence: string;
	color: string;
}

export interface ExoplanetData {
	id: string;
	letter: string;
	name: string;
	subtitle: string;
	discoveryYear: number;
	discoveryMethod: string;
	orbitalPeriodDays: number;
	semiMajorAxisAu: number;
	eccentricity: number;
	inclinationDeg: number;
	radiusEarth: number;
	massEarth: number;
	densityGcm3: number;
	surfaceGravityG: number;
	equilibriumTempK: number;
	stellarFluxEarth: number;
	inHabitableZone: boolean;
	habitableZoneNote: string;
	tidallyLocked: boolean;
	resonanceRatio?: string;
	resonanceOrder?: number;
	transitDepthPct: number;
	transitDurationHours: number;
	jwstSummary: string;
	scienceNotes: string;
	shaderStyle: PlanetShaderStyle;
	primaryColor: string;
	secondaryColor: string;
	atmosphereColor: string;
	cloudCover: number;
	bandFrequency: number;
	isReferenceWorld?: boolean;
	baselineTransitDepthPpm: number;
	spectralFeatures: SpectralFeature[];
}

export interface HostStarData {
	name: string;
	catalogId: string;
	spectralType: string;
	effectiveTempK: number;
	massSolar: number;
	radiusSolar: number;
	luminositySolar: number;
	distanceLightYears: number;
	constellation: string;
	ageGyr: string;
	coreColor: string;
	midColor: string;
	coronaColor: string;
	flareIntensity: number;
	visualRadiusScene: number;
}

export interface ReferenceOrbitRing {
	label: string;
	semiMajorAxisAu: number;
	color: string;
	dashed?: boolean;
}

export interface ExoplanetSystemData {
	id: ExoplanetSystemId;
	name: string;
	shortLabel: string;
	badge: string;
	tagline: string;
	description: string;
	architectureNote: string;
	star: HostStarData;
	habitableZoneInnerAu: number;
	habitableZoneOuterAu: number;
	optimisticHzInnerAu: number;
	optimisticHzOuterAu: number;
	maxOrbitAu: number;
	sceneMinRadius: number;
	sceneMaxRadius: number;
	sceneRadiusPower: number;
	hasLaplaceResonance: boolean;
	resonanceChainLabel?: string;
	referenceOrbits: ReferenceOrbitRing[];
	planets: ExoplanetData[];
	sourceUrl: string;
}

export interface DetectionMethodStat {
	method: string;
	sharePct: number;
	approxCount: number;
	color: string;
	description: string;
}

export interface ExoplanetCensusSummary {
	confirmedPlanets: number;
	confirmedSystems: number;
	multiPlanetSystems: number;
	milestone5000Date: string;
	tessConfirmed: number;
	tessCandidates: number;
	keplerConfirmed: number;
	jwstCharacterizedWorlds: number;
	detectionMethods: DetectionMethodStat[];
}

export const DETECTION_METHODS: DetectionMethodStat[] = [
	{
		method: 'Transit Photometry',
		sharePct: 74.5,
		approxCount: 4312,
		color: '#38bdf8',
		description:
			'Measures periodic micro-dimming of stellar flux as a planet crosses the host star disc (Kepler, K2, TESS, CoRoT).'
	},
	{
		method: 'Radial Velocity (Doppler)',
		sharePct: 19.2,
		approxCount: 1111,
		color: '#f59e0b',
		description:
			'Detects periodic redshift/blueshift wobble in stellar absorption lines induced by planetary reflex motion (ELODIE, HARPS, ESPRESSO).'
	},
	{
		method: 'Gravitational Microlensing',
		sharePct: 3.8,
		approxCount: 220,
		color: '#a855f7',
		description:
			'Relativistic magnification of a background star as a foreground planetary system crosses the line of sight (OGLE, MOA, KMTNet).'
	},
	{
		method: 'Direct Imaging',
		sharePct: 1.3,
		approxCount: 75,
		color: '#34d399',
		description:
			'Coronagraphic and adaptive-optics thermal imaging of young, wide-orbit giant worlds (JWST NIRCam/MIRI, VLT/SPHERE, Gemini/GPI).'
	},
	{
		method: 'Astrometry & Timing Variations',
		sharePct: 1.2,
		approxCount: 70,
		color: '#fb7185',
		description:
			'Pulsar timing (PSR B1257+12), transit timing variations (TTVs), and sub-milliarcsecond stellar sky-plane wobble (Gaia).'
	}
];

export const EXOPLANET_CENSUS: ExoplanetCensusSummary = {
	confirmedPlanets: 5780,
	confirmedSystems: 4320,
	multiPlanetSystems: 1015,
	milestone5000Date: 'March 21, 2022',
	tessConfirmed: 1008,
	tessCandidates: 8148,
	keplerConfirmed: 2778,
	jwstCharacterizedWorlds: 124,
	detectionMethods: DETECTION_METHODS
};

export const EXOPLANET_SYSTEMS: ExoplanetSystemData[] = [
	{
		id: 'trappist-1',
		name: 'TRAPPIST-1 System',
		shortLabel: 'TRAPPIST-1 (7 Worlds)',
		badge: '40.7 LY · AQUARIUS · M8V RED DWARF',
		tagline: 'Seven resonant rocky worlds packed inside a sixth of Mercury’s orbit',
		description:
			'Discovered by Michaël Gillon and collaborators (2016–2017) using the TRAPPIST telescope and NASA’s Spitzer Space Telescope, TRAPPIST-1 is an ultra-cool M8V red dwarf barely larger than Jupiter (0.0898 M☉, 2,566 K). All seven Earth-sized terrestrial planets (b through h) orbit between 0.0115 AU and 0.0619 AU in the longest known Laplace mean-motion resonance chain (24:15:9:6:4:3:2), with planets e, f, and g residing squarely inside the circumstellar Habitable Zone.',
		architectureNote:
			'Every orbit fits comfortably inside 0.062 AU (Mercury orbits at 0.387 AU). Because the host star emits only 0.055% of the Sun’s bolometric luminosity, its Habitable Zone hugs the star from 0.024 to 0.049 AU.',
		star: {
			name: 'TRAPPIST-1',
			catalogId: '2MASS J23062928-0502285',
			spectralType: 'M8V Ultra-Cool Red Dwarf',
			effectiveTempK: 2566,
			massSolar: 0.0898,
			radiusSolar: 0.1192,
			luminositySolar: 0.000553,
			distanceLightYears: 40.66,
			constellation: 'Aquarius',
			ageGyr: '7.6 ± 2.2 Gyr',
			coreColor: '#fff1e6',
			midColor: '#ff4d2e',
			coronaColor: '#b91c1c',
			flareIntensity: 1.35,
			visualRadiusScene: 1.55
		},
		habitableZoneInnerAu: 0.024,
		habitableZoneOuterAu: 0.049,
		optimisticHzInnerAu: 0.019,
		optimisticHzOuterAu: 0.053,
		maxOrbitAu: 0.065,
		sceneMinRadius: 3.4,
		sceneMaxRadius: 15.8,
		sceneRadiusPower: 0.86,
		hasLaplaceResonance: true,
		resonanceChainLabel: '24 : 15 : 9 : 6 : 4 : 3 : 2 Near-Exact Laplace Resonance Chain',
		referenceOrbits: [
			{
				label: 'HZ Inner Edge (0.024 AU)',
				semiMajorAxisAu: 0.024,
				color: '#34d399',
				dashed: true
			},
			{
				label: 'HZ Outer Edge (0.049 AU)',
				semiMajorAxisAu: 0.049,
				color: '#34d399',
				dashed: true
			}
		],
		sourceUrl: 'https://exoplanetarchive.ipac.caltech.edu/overview/Trappist-1',
		planets: [
			{
				id: 'trappist-1-b',
				letter: 'b',
				name: 'TRAPPIST-1 b',
				subtitle: 'Irradiated Bare-Rock Inner World',
				discoveryYear: 2016,
				discoveryMethod: 'Transit Photometry (TRAPPIST / Spitzer)',
				orbitalPeriodDays: 1.510826,
				semiMajorAxisAu: 0.01154,
				eccentricity: 0.00622,
				inclinationDeg: 89.728,
				radiusEarth: 1.116,
				massEarth: 1.374,
				densityGcm3: 5.425,
				surfaceGravityG: 1.103,
				equilibriumTempK: 397.6,
				stellarFluxEarth: 4.15,
				inHabitableZone: false,
				habitableZoneNote: 'Inner Scorched Zone (4.15× Earth insolation)',
				tidallyLocked: true,
				resonanceRatio: '24 (8:5 with c)',
				resonanceOrder: 24,
				transitDepthPct: 0.728,
				transitDurationHours: 0.6,
				jwstSummary:
					'JWST MIRI 15 μm secondary eclipse photometry (Greene et al., Nature 2023) measured a dayside brightness temperature of 503 ± 26 K, indicating zero heat redistribution and ruling out any thick CO₂-rich atmosphere.',
				scienceNotes:
					'Completes a full year in 36.3 hours. Subjected to intense XUV stellar wind stripping and tidal heating from the 8:5 resonance with TRAPPIST-1 c.',
				shaderStyle: 'lava-rock',
				primaryColor: '#7c2d12',
				secondaryColor: '#f97316',
				atmosphereColor: '#fb923c',
				cloudCover: 0.04,
				bandFrequency: 3.0,
				baselineTransitDepthPpm: 7280,
				spectralFeatures: [
					{
						molecule: 'Flat/Cloud-Deck',
						label: 'Bare Basaltic / Ultramafic Continuum (No CO₂ band)',
						wavelengthUm: 2.8,
						widthUm: 1.4,
						depthPpm: 25,
						confidence: 'JWST MIRI 15 μm Confirmed (Greene et al. 2023)',
						color: '#f97316'
					},
					{
						molecule: 'CO2',
						label: '4.3 μm CO₂ Non-Detection Upper Limit',
						wavelengthUm: 4.3,
						widthUm: 0.22,
						depthPpm: 35,
						confidence: '< 0.1 bar CO₂ ruled out at >3σ',
						color: '#94a3b8'
					}
				]
			},
			{
				id: 'trappist-1-c',
				letter: 'c',
				name: 'TRAPPIST-1 c',
				subtitle: 'Desiccated rocky Venus-analog',
				discoveryYear: 2016,
				discoveryMethod: 'Transit Photometry (TRAPPIST / Spitzer)',
				orbitalPeriodDays: 2.421937,
				semiMajorAxisAu: 0.0158,
				eccentricity: 0.00654,
				inclinationDeg: 89.778,
				radiusEarth: 1.097,
				massEarth: 1.308,
				densityGcm3: 5.447,
				surfaceGravityG: 1.087,
				equilibriumTempK: 339.7,
				stellarFluxEarth: 2.21,
				inHabitableZone: false,
				habitableZoneNote: 'Inner Warm Zone (2.21× Earth insolation, similar to Venus)',
				tidallyLocked: true,
				resonanceRatio: '15 (5:3 with d)',
				resonanceOrder: 15,
				transitDepthPct: 0.703,
				transitDurationHours: 0.71,
				jwstSummary:
					'JWST MIRI 15 μm thermal emission measurements (Zieba et al., Nature 2023) recorded a 380 ± 31 K dayside temperature, disfavoring a thick Venusian CO₂ atmosphere and pointing to a tenuous O₂/CO₂ envelope or bare silicate crust.',
				scienceNotes:
					'Receives roughly the same stellar flux as Venus in our Solar System, making it a critical benchmark for atmospheric escape around active M-dwarfs.',
				shaderStyle: 'venusian-rock',
				primaryColor: '#9a3412',
				secondaryColor: '#eab308',
				atmosphereColor: '#fdba74',
				cloudCover: 0.14,
				bandFrequency: 4.0,
				baselineTransitDepthPpm: 7030,
				spectralFeatures: [
					{
						molecule: 'O3',
						label: 'Tenuous Abiotic O₂ / Photochemical Continuum',
						wavelengthUm: 2.1,
						widthUm: 0.35,
						depthPpm: 48,
						confidence: 'JWST MIRI Constrained (Zieba et al. 2023)',
						color: '#facc15'
					},
					{
						molecule: 'CO2',
						label: 'Trace 4.3 μm CO₂ Band (< 0.1 bar)',
						wavelengthUm: 4.32,
						widthUm: 0.2,
						depthPpm: 82,
						confidence: 'MIRI 15 μm Photometry Constraint',
						color: '#fb923c'
					}
				]
			},
			{
				id: 'trappist-1-d',
				letter: 'd',
				name: 'TRAPPIST-1 d',
				subtitle: 'Sub-Earth Twilight Zone World',
				discoveryYear: 2016,
				discoveryMethod: 'Transit Photometry & TTVs (Spitzer / VLT)',
				orbitalPeriodDays: 4.049219,
				semiMajorAxisAu: 0.02227,
				eccentricity: 0.00837,
				inclinationDeg: 89.896,
				radiusEarth: 0.788,
				massEarth: 0.388,
				densityGcm3: 4.354,
				surfaceGravityG: 0.625,
				equilibriumTempK: 286.2,
				stellarFluxEarth: 1.115,
				inHabitableZone: false,
				habitableZoneNote: 'Optimistic Inner Habitable Zone Edge (1.12× Earth flux)',
				tidallyLocked: true,
				resonanceRatio: '9 (3:2 with e)',
				resonanceOrder: 9,
				transitDepthPct: 0.367,
				transitDurationHours: 0.82,
				jwstSummary:
					'JWST NIRSpec Prism transmission observations probe for high-altitude water-vapor (H₂O) steam bands versus cloud-top aerosols along the terminator.',
				scienceNotes:
					'Intermediate in mass and radius between Mars and Earth, with a low bulk density suggesting a significant volatile inventory or smaller iron core.',
				shaderStyle: 'temperate-terrestrial',
				primaryColor: '#b45309',
				secondaryColor: '#38bdf8',
				atmosphereColor: '#7dd3fc',
				cloudCover: 0.38,
				bandFrequency: 4.5,
				baselineTransitDepthPpm: 3670,
				spectralFeatures: [
					{
						molecule: 'H2O',
						label: '1.4 μm & 1.9 μm Water Vapor Overtones',
						wavelengthUm: 1.88,
						widthUm: 0.24,
						depthPpm: 95,
						confidence: 'Synthetic Secondary-Atmosphere Model',
						color: '#38bdf8'
					},
					{
						molecule: 'H2O',
						label: '2.7 μm H₂O Stretching Band',
						wavelengthUm: 2.7,
						widthUm: 0.28,
						depthPpm: 140,
						confidence: 'Synthetic Steam-Terminator Model',
						color: '#0ea5e9'
					},
					{
						molecule: 'CO2',
						label: '4.3 μm CO₂ Fundamental Band',
						wavelengthUm: 4.3,
						widthUm: 0.25,
						depthPpm: 185,
						confidence: 'JWST NIRSpec Target Band',
						color: '#34d399'
					}
				]
			},
			{
				id: 'trappist-1-e',
				letter: 'e',
				name: 'TRAPPIST-1 e',
				subtitle: 'Prime Habitable-Zone Eyeball Ocean Candidate',
				discoveryYear: 2017,
				discoveryMethod: 'Transit Photometry & TTVs (Spitzer)',
				orbitalPeriodDays: 6.101013,
				semiMajorAxisAu: 0.02925,
				eccentricity: 0.0051,
				inclinationDeg: 89.793,
				radiusEarth: 0.92,
				massEarth: 0.692,
				densityGcm3: 4.885,
				surfaceGravityG: 0.818,
				equilibriumTempK: 249.7,
				stellarFluxEarth: 0.646,
				inHabitableZone: true,
				habitableZoneNote: 'Conservative Habitable Zone Core (0.65× Earth flux)',
				tidallyLocked: true,
				resonanceRatio: '6 (3:2 with f)',
				resonanceOrder: 6,
				transitDepthPct: 0.492,
				transitDurationHours: 0.95,
				jwstSummary:
					'Primary astrobiology target for JWST NIRSpec Prism & G395H multi-transit campaigns: synthetic and observed transmission models focus on the 4.3 μm CO₂ peak, 2.7 μm H₂O band, and 3.3 μm CH₄ disequilibrium biosignature pair.',
				scienceNotes:
					'The only planet in the system with a higher uncompressed density than Earth, indicating a rocky silicate mantle, metallic core, and potential liquid ocean across its substellar hemisphere.',
				shaderStyle: 'eyeball-ocean',
				primaryColor: '#0284c7',
				secondaryColor: '#0f766e',
				atmosphereColor: '#38bdf8',
				cloudCover: 0.56,
				bandFrequency: 5.0,
				baselineTransitDepthPpm: 4920,
				spectralFeatures: [
					{
						molecule: 'H2O',
						label: '1.38 μm & 1.87 μm H₂O Vapor Bands',
						wavelengthUm: 1.87,
						widthUm: 0.22,
						depthPpm: 115,
						confidence: 'NIRSpec Prism Terminator Model',
						color: '#38bdf8'
					},
					{
						molecule: 'H2O',
						label: '2.70 μm H₂O Ocean-Terminator Absorption',
						wavelengthUm: 2.7,
						widthUm: 0.3,
						depthPpm: 168,
						confidence: 'NIRSpec Habitable-Zone Benchmark',
						color: '#0ea5e9'
					},
					{
						molecule: 'CH4',
						label: '3.32 μm CH₄ Disequilibrium Feature',
						wavelengthUm: 3.32,
						widthUm: 0.22,
						depthPpm: 145,
						confidence: 'Archean Earth / Methanogen Analog',
						color: '#f59e0b'
					},
					{
						molecule: 'CO2',
						label: '4.30 μm CO₂ Strong Fundamental Peak',
						wavelengthUm: 4.3,
						widthUm: 0.28,
						depthPpm: 265,
						confidence: 'Primary Secondary-Atmosphere Indicator',
						color: '#34d399'
					}
				]
			},
			{
				id: 'trappist-1-f',
				letter: 'f',
				name: 'TRAPPIST-1 f',
				subtitle: 'Volatile-Rich Habitable-Zone Water World',
				discoveryYear: 2017,
				discoveryMethod: 'Transit Photometry & TTVs (Spitzer)',
				orbitalPeriodDays: 9.20754,
				semiMajorAxisAu: 0.03849,
				eccentricity: 0.01007,
				inclinationDeg: 89.74,
				radiusEarth: 1.045,
				massEarth: 1.039,
				densityGcm3: 5.009,
				surfaceGravityG: 0.951,
				equilibriumTempK: 217.7,
				stellarFluxEarth: 0.373,
				inHabitableZone: true,
				habitableZoneNote: 'Conservative Habitable Zone Middle (0.37× Earth flux)',
				tidallyLocked: true,
				resonanceRatio: '4 (4:3 with g)',
				resonanceOrder: 4,
				transitDepthPct: 0.634,
				transitDurationHours: 1.04,
				jwstSummary:
					'Precise TTV mass-radius constraints (Agol et al. 2021) combined with JWST transmission models indicate either a global H₂O ocean/ice shell or a several-bar CO₂ greenhouse warming the dayside above 273 K.',
				scienceNotes:
					'Almost identical in size and mass to Earth (1.045 R⊕, 1.039 M⊕), yet ~9% less dense, pointing to an enriched volatile water/ice mantle.',
				shaderStyle: 'icy-waterworld',
				primaryColor: '#0369a1',
				secondaryColor: '#cbd5e1',
				atmosphereColor: '#67e8f9',
				cloudCover: 0.62,
				bandFrequency: 5.5,
				baselineTransitDepthPpm: 6340,
				spectralFeatures: [
					{
						molecule: 'H2O',
						label: '2.7 μm H₂O Vapor / Ice-Cloud Edge',
						wavelengthUm: 2.7,
						widthUm: 0.28,
						depthPpm: 130,
						confidence: 'Volatile-Rich Envelope Model',
						color: '#38bdf8'
					},
					{
						molecule: 'CH4',
						label: '3.3 μm CH₄ Absorption Band',
						wavelengthUm: 3.32,
						widthUm: 0.2,
						depthPpm: 120,
						confidence: 'Reducing Atmosphere Candidate',
						color: '#f59e0b'
					},
					{
						molecule: 'CO2',
						label: '4.3 μm Dense CO₂ Greenhouse Peak',
						wavelengthUm: 4.3,
						widthUm: 0.3,
						depthPpm: 245,
						confidence: 'Greenhouse Habitable Solution',
						color: '#34d399'
					}
				]
			},
			{
				id: 'trappist-1-g',
				letter: 'g',
				name: 'TRAPPIST-1 g',
				subtitle: 'Outer Habitable-Zone Super-Earth',
				discoveryYear: 2017,
				discoveryMethod: 'Transit Photometry & TTVs (Spitzer)',
				orbitalPeriodDays: 12.352446,
				semiMajorAxisAu: 0.04683,
				eccentricity: 0.00208,
				inclinationDeg: 89.742,
				radiusEarth: 1.129,
				massEarth: 1.321,
				densityGcm3: 5.042,
				surfaceGravityG: 1.036,
				equilibriumTempK: 197.3,
				stellarFluxEarth: 0.252,
				inHabitableZone: true,
				habitableZoneNote: 'Conservative Habitable Zone Outer Edge (0.25× Earth flux)',
				tidallyLocked: true,
				resonanceRatio: '3 (3:2 with h)',
				resonanceOrder: 3,
				transitDepthPct: 0.742,
				transitDurationHours: 1.14,
				jwstSummary:
					'Largest planet in the TRAPPIST-1 system; JWST spectroscopy models test whether high-altitude CO₂/CH₄ clouds mask deeper atmospheric scale heights.',
				scienceNotes:
					'Locked in a 4:3 mean-motion resonance with planet f and a 3:2 resonance with planet h; tidal dissipation could sustain a global subsurface ocean beneath an icy crust.',
				shaderStyle: 'icy-waterworld',
				primaryColor: '#1e3a8a',
				secondaryColor: '#93c5fd',
				atmosphereColor: '#60a5fa',
				cloudCover: 0.68,
				bandFrequency: 6.0,
				baselineTransitDepthPpm: 7420,
				spectralFeatures: [
					{
						molecule: 'CH4',
						label: '2.3 & 3.3 μm CH₄ Cold-Trap Bands',
						wavelengthUm: 3.32,
						widthUm: 0.24,
						depthPpm: 140,
						confidence: 'Outer HZ Cloud-Top Model',
						color: '#f59e0b'
					},
					{
						molecule: 'CO2',
						label: '4.3 μm CO₂ Fundamental Band',
						wavelengthUm: 4.3,
						widthUm: 0.28,
						depthPpm: 210,
						confidence: 'Outer HZ Greenhouse Model',
						color: '#34d399'
					}
				]
			},
			{
				id: 'trappist-1-h',
				letter: 'h',
				name: 'TRAPPIST-1 h',
				subtitle: 'Frozen Outer Resonant Sentinel',
				discoveryYear: 2017,
				discoveryMethod: 'Transit Photometry & K2 / Spitzer TTVs',
				orbitalPeriodDays: 18.772866,
				semiMajorAxisAu: 0.06189,
				eccentricity: 0.00567,
				inclinationDeg: 89.805,
				radiusEarth: 0.755,
				massEarth: 0.326,
				densityGcm3: 4.147,
				surfaceGravityG: 0.572,
				equilibriumTempK: 171.7,
				stellarFluxEarth: 0.144,
				inHabitableZone: false,
				habitableZoneNote: 'Beyond Outer Snow Line (0.14× Earth insolation)',
				tidallyLocked: true,
				resonanceRatio: '2 (2:3 with g)',
				resonanceOrder: 2,
				transitDepthPct: 0.335,
				transitDurationHours: 1.28,
				jwstSummary:
					'Orbits beyond the system’s frost line at 172 K; low bulk density (4.15 g/cm³) indicates an Enceladus/Europa-like ice-rock interior.',
				scienceNotes:
					'Its 18.77-day orbital period was predicted theoretically using three-body Laplace resonance relations before K2 observations confirmed its exact period.',
				shaderStyle: 'cryo-rock',
				primaryColor: '#475569',
				secondaryColor: '#e2e8f0',
				atmosphereColor: '#94a3b8',
				cloudCover: 0.25,
				bandFrequency: 3.5,
				baselineTransitDepthPpm: 3350,
				spectralFeatures: [
					{
						molecule: 'CH4',
						label: '3.3 μm Tenuous Cryo-Methane Feature',
						wavelengthUm: 3.32,
						widthUm: 0.2,
						depthPpm: 65,
						confidence: 'Frost-Line Cryo-Atmosphere Model',
						color: '#f59e0b'
					},
					{
						molecule: 'CO2',
						label: '4.3 μm Sublimated CO₂ Trace',
						wavelengthUm: 4.3,
						widthUm: 0.22,
						depthPpm: 80,
						confidence: 'Cold Terminator Model',
						color: '#38bdf8'
					}
				]
			}
		]
	},
	{
		id: 'kepler-90',
		name: 'Kepler-90 System',
		shortLabel: 'Kepler-90 (8 Worlds)',
		badge: '2,790 LY · DRACO · G0V SUN-LIKE STAR',
		tagline: 'First exoplanet system matching the Solar System’s eight-planet count',
		description:
			'Located 2,790 light-years away in Draco, Kepler-90 (KOI-351) is a slightly warmer, more massive G0V cousin of our Sun (1.20 M☉, 6,080 K). In December 2017, Christopher Shallue and Andrew Vanderburg trained a Google Brain deep convolutional neural network on 15,000 Kepler light curves to uncover Kepler-90 i—making Kepler-90 the first known star system to tie our Solar System with eight confirmed planets, all compressed inside 1.01 AU.',
		architectureNote:
			'Ordered strictly by size from inside out: three rocky super-Earths (b, c, i), three warm mini-Neptunes in a 2:3:4 resonance (d, e, f), a low-density "super-puff" giant (g), and a Jupiter-sized outer giant (h) at 1.01 AU.',
		star: {
			name: 'Kepler-90 (KOI-351)',
			catalogId: 'KIC 11442793',
			spectralType: 'G0V / F8V Main-Sequence Star',
			effectiveTempK: 6080,
			massSolar: 1.2,
			radiusSolar: 1.2,
			luminositySolar: 1.7,
			distanceLightYears: 2790,
			constellation: 'Draco',
			ageGyr: '2.0 ± 0.8 Gyr',
			coreColor: '#ffffff',
			midColor: '#fde047',
			coronaColor: '#f59e0b',
			flareIntensity: 0.75,
			visualRadiusScene: 1.95
		},
		habitableZoneInnerAu: 1.18,
		habitableZoneOuterAu: 2.08,
		optimisticHzInnerAu: 0.96,
		optimisticHzOuterAu: 2.25,
		maxOrbitAu: 1.15,
		sceneMinRadius: 3.6,
		sceneMaxRadius: 16.5,
		sceneRadiusPower: 0.54,
		hasLaplaceResonance: false,
		resonanceChainLabel: 'Inner 5:4 Pair (b:c) & Middle 2:3:4 Resonance Chain (d:e:f)',
		referenceOrbits: [
			{
				label: 'Mercury Orbit (0.387 AU)',
				semiMajorAxisAu: 0.387,
				color: '#94a3b8',
				dashed: true
			},
			{
				label: 'Earth Orbit (1.000 AU)',
				semiMajorAxisAu: 1.0,
				color: '#38bdf8',
				dashed: true
			}
		],
		sourceUrl: 'https://exoplanetarchive.ipac.caltech.edu/overview/Kepler-90',
		planets: [
			{
				id: 'kepler-90-b',
				letter: 'b',
				name: 'Kepler-90 b',
				subtitle: 'Innermost Super-Earth in 5:4 Resonance',
				discoveryYear: 2013,
				discoveryMethod: 'Transit Photometry (Kepler)',
				orbitalPeriodDays: 7.00815,
				semiMajorAxisAu: 0.074,
				eccentricity: 0.01,
				inclinationDeg: 89.4,
				radiusEarth: 1.31,
				massEarth: 2.52,
				densityGcm3: 6.15,
				surfaceGravityG: 1.47,
				equilibriumTempK: 1056,
				stellarFluxEarth: 295.0,
				inHabitableZone: false,
				habitableZoneNote: 'Scorched Inner Zone (295× Earth flux)',
				tidallyLocked: true,
				resonanceRatio: '5:4 with c',
				transitDepthPct: 0.011,
				transitDurationHours: 3.9,
				jwstSummary:
					'High-temperature silicate world at 1,056 K; thermal emission dominated by ionized alkali vapor and silicate mineral continuum.',
				scienceNotes:
					'Orbits in a tight 5:4 mean-motion resonance with Kepler-90 c, completing 5 orbits for every 4 orbits of planet c.',
				shaderStyle: 'lava-rock',
				primaryColor: '#7f1d1d',
				secondaryColor: '#fb923c',
				atmosphereColor: '#f97316',
				cloudCover: 0.05,
				bandFrequency: 3.0,
				baselineTransitDepthPpm: 110,
				spectralFeatures: [
					{
						molecule: 'Na/K',
						label: 'Optical/NIR Alkali Vapor & Silicate Continuum',
						wavelengthUm: 1.2,
						widthUm: 0.35,
						depthPpm: 18,
						confidence: 'Hot Super-Earth Radiative Model',
						color: '#f97316'
					},
					{
						molecule: 'CO',
						label: '4.6 μm Carbon Monoxide Thermal Band',
						wavelengthUm: 4.6,
						widthUm: 0.3,
						depthPpm: 24,
						confidence: 'High-T Equilibrium Model',
						color: '#fb7185'
					}
				]
			},
			{
				id: 'kepler-90-c',
				letter: 'c',
				name: 'Kepler-90 c',
				subtitle: 'Resonant Rocky Super-Earth Partner',
				discoveryYear: 2013,
				discoveryMethod: 'Transit Photometry (Kepler)',
				orbitalPeriodDays: 8.71938,
				semiMajorAxisAu: 0.089,
				eccentricity: 0.01,
				inclinationDeg: 89.68,
				radiusEarth: 1.19,
				massEarth: 1.95,
				densityGcm3: 6.36,
				surfaceGravityG: 1.38,
				equilibriumTempK: 963,
				stellarFluxEarth: 204.0,
				inHabitableZone: false,
				habitableZoneNote: 'Scorched Inner Zone (204× Earth flux)',
				tidallyLocked: true,
				resonanceRatio: '4:5 with b',
				transitDepthPct: 0.009,
				transitDurationHours: 4.2,
				jwstSummary:
					'Refractory rocky world stripped of primordial H/He by extreme early stellar irradiation.',
				scienceNotes:
					'Exchanges angular momentum with Kepler-90 b, producing measurable transit timing variations despite their small rocky masses.',
				shaderStyle: 'venusian-rock',
				primaryColor: '#92400e',
				secondaryColor: '#f59e0b',
				atmosphereColor: '#fbbf24',
				cloudCover: 0.1,
				bandFrequency: 3.5,
				baselineTransitDepthPpm: 90,
				spectralFeatures: [
					{
						molecule: 'CO2',
						label: '4.3 μm Outgassed CO₂ Band',
						wavelengthUm: 4.3,
						widthUm: 0.25,
						depthPpm: 22,
						confidence: 'Secondary Outgassing Model',
						color: '#34d399'
					}
				]
			},
			{
				id: 'kepler-90-i',
				letter: 'i',
				name: 'Kepler-90 i',
				subtitle: 'Google Brain Neural-Network Discovery (8th World)',
				discoveryYear: 2017,
				discoveryMethod: 'Deep Convolutional Neural Network + Kepler Photometry',
				orbitalPeriodDays: 14.44912,
				semiMajorAxisAu: 0.107,
				eccentricity: 0.015,
				inclinationDeg: 89.2,
				radiusEarth: 1.32,
				massEarth: 2.3,
				densityGcm3: 5.5,
				surfaceGravityG: 1.32,
				equilibriumTempK: 709,
				stellarFluxEarth: 141.0,
				inHabitableZone: false,
				habitableZoneNote: 'Hot Inner Zone (709 K equilibrium temperature)',
				tidallyLocked: true,
				transitDepthPct: 0.0095,
				transitDurationHours: 2.8,
				jwstSummary:
					'Sizzling 709 K rocky super-Earth (~800°F) whose weak 95 ppm transit signal was recovered by machine learning after being missed by automated pipeline searches.',
				scienceNotes:
					'Discovered by Shallue & Vanderburg (2018) using a neural network that achieved 96% accuracy distinguishing real planetary transits from astrophysical false positives.',
				shaderStyle: 'super-earth',
				primaryColor: '#b45309',
				secondaryColor: '#38bdf8',
				atmosphereColor: '#f59e0b',
				cloudCover: 0.18,
				bandFrequency: 4.0,
				baselineTransitDepthPpm: 95,
				spectralFeatures: [
					{
						molecule: 'H2O',
						label: '2.7 μm High-Temperature Steam Feature',
						wavelengthUm: 2.7,
						widthUm: 0.25,
						depthPpm: 20,
						confidence: 'Outgassed Steam Envelope Model',
						color: '#38bdf8'
					},
					{
						molecule: 'CO2',
						label: '4.3 μm CO₂ Spectral Band',
						wavelengthUm: 4.3,
						widthUm: 0.26,
						depthPpm: 32,
						confidence: 'High-Metallicity Super-Earth Model',
						color: '#34d399'
					}
				]
			},
			{
				id: 'kepler-90-d',
				letter: 'd',
				name: 'Kepler-90 d',
				subtitle: 'Warm Sub-Neptune in 2:3:4 Resonance',
				discoveryYear: 2013,
				discoveryMethod: 'Transit Photometry (Kepler)',
				orbitalPeriodDays: 59.73667,
				semiMajorAxisAu: 0.32,
				eccentricity: 0.02,
				inclinationDeg: 89.71,
				radiusEarth: 2.87,
				massEarth: 8.5,
				densityGcm3: 1.98,
				surfaceGravityG: 1.03,
				equilibriumTempK: 518,
				stellarFluxEarth: 16.6,
				inHabitableZone: false,
				habitableZoneNote: 'Warm Interior Orbit (0.32 AU, inside Mercury scale)',
				tidallyLocked: false,
				resonanceRatio: '2:3:4 chain (d:e:f)',
				transitDepthPct: 0.052,
				transitDurationHours: 7.4,
				jwstSummary:
					'Sub-Neptune with a thick H₂/He and H₂O/CH₄ envelope exhibiting pronounced infrared water and methane absorption.',
				scienceNotes:
					'Marks the sharp architectural transition in Kepler-90 from rocky super-Earths (<1.4 R⊕) to volatile-rich mini-Neptunes (~2.8 R⊕) across the radius valley.',
				shaderStyle: 'mini-neptune',
				primaryColor: '#0284c7',
				secondaryColor: '#38bdf8',
				atmosphereColor: '#7dd3fc',
				cloudCover: 0.72,
				bandFrequency: 6.5,
				baselineTransitDepthPpm: 520,
				spectralFeatures: [
					{
						molecule: 'H2O',
						label: '1.9 & 2.7 μm H₂O Envelope Bands',
						wavelengthUm: 2.7,
						widthUm: 0.32,
						depthPpm: 85,
						confidence: 'Sub-Neptune H₂/H₂O Model',
						color: '#38bdf8'
					},
					{
						molecule: 'CH4',
						label: '3.32 μm Methane Absorption Peak',
						wavelengthUm: 3.32,
						widthUm: 0.26,
						depthPpm: 110,
						confidence: 'Warm Sub-Neptune Equilibrium Model',
						color: '#f59e0b'
					},
					{
						molecule: 'CO2',
						label: '4.3 μm Metal-Enriched CO₂ Feature',
						wavelengthUm: 4.3,
						widthUm: 0.28,
						depthPpm: 95,
						confidence: '100× Solar Metallicity Model',
						color: '#34d399'
					}
				]
			},
			{
				id: 'kepler-90-e',
				letter: 'e',
				name: 'Kepler-90 e',
				subtitle: 'Resonant Sub-Neptune World',
				discoveryYear: 2013,
				discoveryMethod: 'Transit Photometry (Kepler)',
				orbitalPeriodDays: 91.93913,
				semiMajorAxisAu: 0.42,
				eccentricity: 0.02,
				inclinationDeg: 89.79,
				radiusEarth: 2.66,
				massEarth: 7.8,
				densityGcm3: 2.28,
				surfaceGravityG: 1.1,
				equilibriumTempK: 448,
				stellarFluxEarth: 9.6,
				inHabitableZone: false,
				habitableZoneNote: 'Warm Zone (0.42 AU, comparable to Mercury’s 0.39 AU)',
				tidallyLocked: false,
				resonanceRatio: '3:2 with d · 4:3 with f',
				transitDepthPct: 0.045,
				transitDurationHours: 8.4,
				jwstSummary:
					'Intermediate-temperature (448 K) sub-Neptune where photochemical hazes and methane bands shape near-IR transmission spectra.',
				scienceNotes:
					'Middle link of the 2:3:4 Laplace-like resonance chain linking planets d (59.7 d), e (91.9 d), and f (124.9 d).',
				shaderStyle: 'mini-neptune',
				primaryColor: '#0e7490',
				secondaryColor: '#67e8f9',
				atmosphereColor: '#22d3ee',
				cloudCover: 0.75,
				bandFrequency: 7.0,
				baselineTransitDepthPpm: 450,
				spectralFeatures: [
					{
						molecule: 'H2O',
						label: '2.7 μm Water Vapor Band',
						wavelengthUm: 2.7,
						widthUm: 0.28,
						depthPpm: 75,
						confidence: 'Sub-Neptune Envelope Model',
						color: '#38bdf8'
					},
					{
						molecule: 'CH4',
						label: '3.32 μm Strong CH₄ Band',
						wavelengthUm: 3.32,
						widthUm: 0.28,
						depthPpm: 125,
						confidence: '450 K Methane-Dominated Model',
						color: '#f59e0b'
					}
				]
			},
			{
				id: 'kepler-90-f',
				letter: 'f',
				name: 'Kepler-90 f',
				subtitle: 'Outer Resonant Sub-Neptune',
				discoveryYear: 2013,
				discoveryMethod: 'Transit Photometry (Kepler)',
				orbitalPeriodDays: 124.9144,
				semiMajorAxisAu: 0.48,
				eccentricity: 0.01,
				inclinationDeg: 89.77,
				radiusEarth: 2.88,
				massEarth: 8.9,
				densityGcm3: 2.05,
				surfaceGravityG: 1.07,
				equilibriumTempK: 410,
				stellarFluxEarth: 7.4,
				inHabitableZone: false,
				habitableZoneNote: 'Warm Zone (0.48 AU, between Mercury and Venus scale)',
				tidallyLocked: false,
				resonanceRatio: '4:3 with e',
				transitDepthPct: 0.053,
				transitDurationHours: 9.3,
				jwstSummary:
					'Cooler sub-Neptune (410 K) with deep H₂/He scale height and methane-water absorption.',
				scienceNotes:
					'Forms a sibling triplet with planets d and e—all three have radii between 2.66 and 2.88 R⊕.',
				shaderStyle: 'mini-neptune',
				primaryColor: '#1d4ed8',
				secondaryColor: '#93c5fd',
				atmosphereColor: '#60a5fa',
				cloudCover: 0.78,
				bandFrequency: 7.5,
				baselineTransitDepthPpm: 530,
				spectralFeatures: [
					{
						molecule: 'H2O',
						label: '2.7 μm Water Vapor Feature',
						wavelengthUm: 2.7,
						widthUm: 0.28,
						depthPpm: 80,
						confidence: 'Sub-Neptune Envelope Model',
						color: '#38bdf8'
					},
					{
						molecule: 'CH4',
						label: '3.32 μm Methane Band',
						wavelengthUm: 3.32,
						widthUm: 0.28,
						depthPpm: 135,
						confidence: 'Sub-Neptune Envelope Model',
						color: '#f59e0b'
					}
				]
			},
			{
				id: 'kepler-90-g',
				letter: 'g',
				name: 'Kepler-90 g',
				subtitle: 'Low-Density "Super-Puff" Gas Giant',
				discoveryYear: 2013,
				discoveryMethod: 'Transit Photometry & Large TTVs (Kepler)',
				orbitalPeriodDays: 210.60697,
				semiMajorAxisAu: 0.71,
				eccentricity: 0.049,
				inclinationDeg: 89.8,
				radiusEarth: 8.13,
				massEarth: 15.0,
				densityGcm3: 0.15,
				surfaceGravityG: 0.23,
				equilibriumTempK: 340,
				stellarFluxEarth: 3.37,
				inHabitableZone: false,
				habitableZoneNote: 'Inner Optimistic Zone Edge (0.71 AU, Venus-like distance)',
				tidallyLocked: false,
				transitDepthPct: 0.42,
				transitDurationHours: 11.4,
				jwstSummary:
					'Classic "super-puff" planet: nearly Saturn’s radius (8.1 R⊕) but only Neptune’s mass (~15 M⊕, density 0.15 g/cm³), producing huge atmospheric scale heights ideal for transmission spectroscopy.',
				scienceNotes:
					'Exhibits transit timing variations up to 25.7 hours due to gravitational perturbations with outer giant Kepler-90 h.',
				shaderStyle: 'warm-giant',
				primaryColor: '#4338ca',
				secondaryColor: '#c084fc',
				atmosphereColor: '#a855f7',
				cloudCover: 0.88,
				bandFrequency: 9.0,
				baselineTransitDepthPpm: 4200,
				spectralFeatures: [
					{
						molecule: 'H2O',
						label: '1.4, 1.9 & 2.7 μm Huge Scale-Height H₂O Bands',
						wavelengthUm: 2.7,
						widthUm: 0.35,
						depthPpm: 380,
						confidence: 'Low-Gravity Super-Puff Model',
						color: '#38bdf8'
					},
					{
						molecule: 'CH4',
						label: '3.32 μm Deep Methane Band',
						wavelengthUm: 3.32,
						widthUm: 0.32,
						depthPpm: 440,
						confidence: '340 K Giant Envelope Model',
						color: '#f59e0b'
					},
					{
						molecule: 'CO2',
						label: '4.3 μm CO₂ Photochemical Peak',
						wavelengthUm: 4.3,
						widthUm: 0.28,
						depthPpm: 290,
						confidence: 'Super-Puff Transmission Model',
						color: '#34d399'
					}
				]
			},
			{
				id: 'kepler-90-h',
				letter: 'h',
				name: 'Kepler-90 h',
				subtitle: 'Outer Jupiter-Sized Gas Giant at 1.01 AU',
				discoveryYear: 2013,
				discoveryMethod: 'Transit Photometry & TTVs (Kepler)',
				orbitalPeriodDays: 331.60059,
				semiMajorAxisAu: 1.01,
				eccentricity: 0.025,
				inclinationDeg: 89.6,
				radiusEarth: 11.32,
				massEarth: 203.0,
				densityGcm3: 0.77,
				surfaceGravityG: 1.58,
				equilibriumTempK: 292,
				stellarFluxEarth: 1.67,
				inHabitableZone: true,
				habitableZoneNote: 'Optimistic Inner Habitable Zone (1.01 AU, 292 K equilibrium)',
				tidallyLocked: false,
				transitDepthPct: 0.82,
				transitDurationHours: 13.7,
				jwstSummary:
					'Temperate 292 K gas giant with water-cloud decks and strong ammonia/methane/water infrared signatures; potential host for habitable rocky exomoons.',
				scienceNotes:
					'Orbits at 1.01 AU—almost exactly Earth’s distance from the Sun—completing the entire 8-planet Kepler-90 architecture within a single Astronomical Unit.',
				shaderStyle: 'warm-giant',
				primaryColor: '#b45309',
				secondaryColor: '#fde68a',
				atmosphereColor: '#f59e0b',
				cloudCover: 0.92,
				bandFrequency: 11.0,
				baselineTransitDepthPpm: 8200,
				spectralFeatures: [
					{
						molecule: 'H2O',
						label: '2.7 μm Temperate Water-Cloud Band',
						wavelengthUm: 2.7,
						widthUm: 0.34,
						depthPpm: 310,
						confidence: 'Temperate Jovian Model',
						color: '#38bdf8'
					},
					{
						molecule: 'CH4',
						label: '2.3 & 3.32 μm Dominant Jovian CH₄ Bands',
						wavelengthUm: 3.32,
						widthUm: 0.35,
						depthPpm: 480,
						confidence: 'Temperate Gas Giant Model',
						color: '#f59e0b'
					},
					{
						molecule: 'CO2',
						label: '4.3 μm Tropospheric CO₂ Feature',
						wavelengthUm: 4.3,
						widthUm: 0.25,
						depthPpm: 190,
						confidence: 'Jovian Equilibrium Model',
						color: '#34d399'
					}
				]
			}
		]
	},
	{
		id: '51-pegasi',
		name: '51 Pegasi System (Helvetios)',
		shortLabel: '51 Pegasi (Hot Jupiter)',
		badge: '50.6 LY · PEGASUS · 1995 NOBEL PRIZE DISCOVERY',
		tagline: 'Mayor & Queloz’s 1995 discovery of the first exoplanet around a Sun-like star',
		description:
			'On October 6, 1995, Swiss astronomers Michel Mayor and Didier Queloz announced the radial-velocity detection of 51 Pegasi b (officially named "Dimidium") using the ELODIE fiber-fed spectrograph at Observatoire de Haute-Provence. A half-Jupiter-mass giant (0.47 MJ) roaring around its Sun-like G2V star in just 4.23 days at 0.0527 AU (seven times closer than Mercury), 51 Pegasi b shattered classical planet formation dogma, proved orbital migration, and earned the 2019 Nobel Prize in Physics.',
		architectureNote:
			'Shown alongside scaled inner Solar System reference worlds (Mercury at 0.387 AU, Venus at 0.723 AU, Earth at 1.000 AU) to illustrate the extreme 0.0527 AU orbital proximity of the archetype Hot Jupiter.',
		star: {
			name: '51 Pegasi (Helvetios)',
			catalogId: 'HD 217014 · GJ 882',
			spectralType: 'G2IV–V Metal-Rich Solar Analog',
			effectiveTempK: 5793,
			massSolar: 1.11,
			radiusSolar: 1.237,
			luminositySolar: 1.36,
			distanceLightYears: 50.6,
			constellation: 'Pegasus',
			ageGyr: '6.1 ± 1.5 Gyr',
			coreColor: '#ffffff',
			midColor: '#fef08a',
			coronaColor: '#f59e0b',
			flareIntensity: 0.65,
			visualRadiusScene: 1.85
		},
		habitableZoneInnerAu: 1.08,
		habitableZoneOuterAu: 1.9,
		optimisticHzInnerAu: 0.86,
		optimisticHzOuterAu: 2.05,
		maxOrbitAu: 1.15,
		sceneMinRadius: 3.4,
		sceneMaxRadius: 16.2,
		sceneRadiusPower: 0.52,
		hasLaplaceResonance: false,
		resonanceChainLabel: 'Archetype Hot Jupiter (0.0527 AU) vs Inner Solar System Scale',
		referenceOrbits: [
			{
				label: 'Mercury Reference (0.387 AU)',
				semiMajorAxisAu: 0.387,
				color: '#94a3b8',
				dashed: true
			},
			{
				label: 'Venus Reference (0.723 AU)',
				semiMajorAxisAu: 0.723,
				color: '#f59e0b',
				dashed: true
			},
			{
				label: 'Earth Reference (1.000 AU)',
				semiMajorAxisAu: 1.0,
				color: '#38bdf8',
				dashed: true
			}
		],
		sourceUrl: 'https://science.nasa.gov/exoplanet-catalog/51-pegasi-b/',
		planets: [
			{
				id: '51-pegasi-b',
				letter: 'b',
				name: '51 Pegasi b (Dimidium)',
				subtitle: 'Archetype Hot Jupiter · 1995 Nobel Discovery',
				discoveryYear: 1995,
				discoveryMethod: 'Radial Velocity Wobble (56 m/s · ELODIE)',
				orbitalPeriodDays: 4.230785,
				semiMajorAxisAu: 0.0527,
				eccentricity: 0.013,
				inclinationDeg: 80.0,
				radiusEarth: 14.1,
				massEarth: 149.4,
				densityGcm3: 0.29,
				surfaceGravityG: 0.75,
				equilibriumTempK: 1284,
				stellarFluxEarth: 489.0,
				inHabitableZone: false,
				habitableZoneNote: 'Extreme Roaster Zone (489× Earth insolation · 1,284 K)',
				tidallyLocked: true,
				transitDepthPct: 0.92,
				transitDurationHours: 3.1,
				jwstSummary:
					'High-resolution dayside spectroscopy (Birkby et al. 2017, VLT/CRIRES) directly detected water vapor (H₂O) and carbon monoxide (CO) in its 1,284 K puffed-up atmosphere, establishing a true mass of 0.476 MJ.',
				scienceNotes:
					'Tidally locked with equatorial super-rotating jet streams exceeding 4,000 km/h and silicate/iron cloud condensates along its terminator.',
				shaderStyle: 'hot-jupiter',
				primaryColor: '#991b1b',
				secondaryColor: '#f97316',
				atmosphereColor: '#fb7185',
				cloudCover: 0.85,
				bandFrequency: 8.5,
				baselineTransitDepthPpm: 9200,
				spectralFeatures: [
					{
						molecule: 'H2O',
						label: '1.4, 1.9 & 2.7 μm Hot H₂O Absorption Bands',
						wavelengthUm: 2.7,
						widthUm: 0.36,
						depthPpm: 520,
						confidence: 'VLT/CRIRES Confirmed (Birkby et al. 2017)',
						color: '#38bdf8'
					},
					{
						molecule: 'CO2',
						label: '4.3 μm Photochemical CO₂ Peak',
						wavelengthUm: 4.3,
						widthUm: 0.28,
						depthPpm: 340,
						confidence: 'Hot-Jupiter Equilibrium Model',
						color: '#34d399'
					},
					{
						molecule: 'CO',
						label: '4.67 μm Strong Carbon Monoxide R/P Branch',
						wavelengthUm: 4.65,
						widthUm: 0.34,
						depthPpm: 590,
						confidence: 'High-T C/O Ratio Signature',
						color: '#fb7185'
					}
				]
			},
			{
				id: '51-peg-ref-mercury',
				letter: 'Me',
				name: 'Mercury (Scale Ref)',
				subtitle: 'Solar System Inner Planet Reference at 0.387 AU',
				discoveryYear: -3000,
				discoveryMethod: 'Comparative Solar System Scale Overlay',
				orbitalPeriodDays: 87.969,
				semiMajorAxisAu: 0.3871,
				eccentricity: 0.2056,
				inclinationDeg: 7.0,
				radiusEarth: 0.3829,
				massEarth: 0.0553,
				densityGcm3: 5.427,
				surfaceGravityG: 0.378,
				equilibriumTempK: 440,
				stellarFluxEarth: 6.67,
				inHabitableZone: false,
				habitableZoneNote: 'Comparative Scale Reference (7.3× farther out than 51 Peg b)',
				tidallyLocked: false,
				transitDepthPct: 0.0012,
				transitDurationHours: 5.5,
				jwstSummary:
					'Airless cratered iron-rich planet shown at exact comparative orbital scale (0.387 AU vs 51 Pegasi b at 0.0527 AU).',
				scienceNotes:
					'Demonstrates why 51 Pegasi b astonished astronomers in 1995: a gas giant orbiting more than seven times closer to its star than Mercury orbits the Sun.',
				shaderStyle: 'cryo-rock',
				primaryColor: '#64748b',
				secondaryColor: '#94a3b8',
				atmosphereColor: '#cbd5e1',
				cloudCover: 0.0,
				bandFrequency: 2.0,
				isReferenceWorld: true,
				baselineTransitDepthPpm: 12,
				spectralFeatures: [
					{
						molecule: 'Flat/Cloud-Deck',
						label: 'Airless Exosphere (Flat Transmission Line)',
						wavelengthUm: 3.0,
						widthUm: 2.0,
						depthPpm: 5,
						confidence: 'Solar System Reference',
						color: '#94a3b8'
					}
				]
			},
			{
				id: '51-peg-ref-venus',
				letter: 'Ve',
				name: 'Venus (Scale Ref)',
				subtitle: 'Solar System Reference at 0.723 AU',
				discoveryYear: -3000,
				discoveryMethod: 'Comparative Solar System Scale Overlay',
				orbitalPeriodDays: 224.701,
				semiMajorAxisAu: 0.7233,
				eccentricity: 0.0067,
				inclinationDeg: 3.39,
				radiusEarth: 0.9499,
				massEarth: 0.815,
				densityGcm3: 5.243,
				surfaceGravityG: 0.904,
				equilibriumTempK: 232,
				stellarFluxEarth: 1.91,
				inHabitableZone: false,
				habitableZoneNote: 'Comparative Scale Reference (Runaway Greenhouse Benchmark)',
				tidallyLocked: false,
				transitDepthPct: 0.0076,
				transitDurationHours: 6.8,
				jwstSummary:
					'92-bar CO₂ atmosphere with H₂SO₄ cloud deck at ~60 km altitude producing strong 4.3 μm CO₂ absorption.',
				scienceNotes:
					'Orbits 13.7× farther from its star than 51 Pegasi b.',
				shaderStyle: 'venusian-rock',
				primaryColor: '#d97706',
				secondaryColor: '#fef08a',
				atmosphereColor: '#fde047',
				cloudCover: 0.96,
				bandFrequency: 5.0,
				isReferenceWorld: true,
				baselineTransitDepthPpm: 76,
				spectralFeatures: [
					{
						molecule: 'SO2',
						label: '4.0 μm Sulfuric Haze / SO₂ Band',
						wavelengthUm: 4.0,
						widthUm: 0.22,
						depthPpm: 28,
						confidence: 'Venus Reference',
						color: '#facc15'
					},
					{
						molecule: 'CO2',
						label: '2.7 & 4.3 μm Saturated CO₂ Bands',
						wavelengthUm: 4.3,
						widthUm: 0.32,
						depthPpm: 65,
						confidence: 'Venus Reference',
						color: '#34d399'
					}
				]
			},
			{
				id: '51-peg-ref-earth',
				letter: 'Ea',
				name: 'Earth (Scale Ref)',
				subtitle: 'Solar System Habitable Benchmark at 1.000 AU',
				discoveryYear: -3000,
				discoveryMethod: 'Comparative Solar System Scale Overlay',
				orbitalPeriodDays: 365.256,
				semiMajorAxisAu: 1.0,
				eccentricity: 0.0167,
				inclinationDeg: 0.0,
				radiusEarth: 1.0,
				massEarth: 1.0,
				densityGcm3: 5.514,
				surfaceGravityG: 1.0,
				equilibriumTempK: 255,
				stellarFluxEarth: 1.0,
				inHabitableZone: true,
				habitableZoneNote: '1.000 AU Reference Benchmark (19× farther out than 51 Peg b)',
				tidallyLocked: false,
				transitDepthPct: 0.0084,
				transitDurationHours: 13.0,
				jwstSummary:
					'Reference terrestrial transmission spectrum displaying simultaneous H₂O, CO₂, O₃, and CH₄ thermodynamic disequilibrium.',
				scienceNotes:
					'Included in the 51 Pegasi view for direct 1:1 radial comparison with Dimidium’s 0.0527 AU orbit.',
				shaderStyle: 'earth-analog',
				primaryColor: '#0284c7',
				secondaryColor: '#15803d',
				atmosphereColor: '#38bdf8',
				cloudCover: 0.52,
				bandFrequency: 5.0,
				isReferenceWorld: true,
				baselineTransitDepthPpm: 84,
				spectralFeatures: [
					{
						molecule: 'H2O',
						label: '1.4, 1.9 & 2.7 μm Tropospheric H₂O Bands',
						wavelengthUm: 2.7,
						widthUm: 0.3,
						depthPpm: 38,
						confidence: 'Earth Reference Spectrum',
						color: '#38bdf8'
					},
					{
						molecule: 'CH4',
						label: '3.32 μm Biogenic Methane Feature',
						wavelengthUm: 3.32,
						widthUm: 0.22,
						depthPpm: 26,
						confidence: 'Earth Biosignature Reference',
						color: '#f59e0b'
					},
					{
						molecule: 'CO2',
						label: '4.30 μm Stratospheric CO₂ Peak',
						wavelengthUm: 4.3,
						widthUm: 0.28,
						depthPpm: 58,
						confidence: 'Earth Reference Spectrum',
						color: '#34d399'
					},
					{
						molecule: 'O3',
						label: '4.75 μm Ozone (O₃) Overtones',
						wavelengthUm: 4.75,
						widthUm: 0.22,
						depthPpm: 34,
						confidence: 'Oxygenic Photosynthesis Tracer',
						color: '#a855f7'
					}
				]
			}
		]
	},
	{
		id: 'solar-system',
		name: 'Inner Solar System Reference',
		shortLabel: 'Solar System Scale',
		badge: '0.0 LY · SOL · G2V YELLOW DWARF BENCHMARK',
		tagline: 'Mercury, Venus, Earth, and Mars as our comparative yardstick for alien architectures',
		description:
			'Our home star Sol (G2V, 5,778 K, 1.00 M☉) hosts four inner terrestrial planets spaced across 1.52 AU—from cratered Mercury (0.387 AU) to runaway-greenhouse Venus (0.723 AU), ocean-covered Earth (1.000 AU), and cold desert Mars (1.524 AU). Comparing this spacious layout with TRAPPIST-1 (all 7 planets inside 0.062 AU) or Kepler-90 (8 planets inside 1.01 AU) reveals how remarkably diverse planetary system architectures are across the Milky Way.',
		architectureNote:
			'Notice the empty inner cavity inside Mercury’s 0.387 AU orbit—precisely where hot Jupiters like 51 Pegasi b (0.053 AU) and compact multi-planet chains like TRAPPIST-1 (<0.062 AU) reside.',
		star: {
			name: 'Sol (The Sun)',
			catalogId: 'G2V Main-Sequence Star',
			spectralType: 'G2V Yellow Dwarf',
			effectiveTempK: 5778,
			massSolar: 1.0,
			radiusSolar: 1.0,
			luminositySolar: 1.0,
			distanceLightYears: 0.0000158,
			constellation: 'Local Bubble / Orion Arm',
			ageGyr: '4.567 Gyr',
			coreColor: '#ffffff',
			midColor: '#fde047',
			coronaColor: '#f59e0b',
			flareIntensity: 0.6,
			visualRadiusScene: 1.75
		},
		habitableZoneInnerAu: 0.95,
		habitableZoneOuterAu: 1.67,
		optimisticHzInnerAu: 0.75,
		optimisticHzOuterAu: 1.77,
		maxOrbitAu: 1.65,
		sceneMinRadius: 4.2,
		sceneMaxRadius: 15.8,
		sceneRadiusPower: 0.85,
		hasLaplaceResonance: false,
		resonanceChainLabel: 'Spacious Terrestrial Architecture (0.387 AU – 1.524 AU)',
		referenceOrbits: [
			{
				label: 'TRAPPIST-1 Entire System (< 0.062 AU)',
				semiMajorAxisAu: 0.062,
				color: '#fb7185',
				dashed: true
			},
			{
				label: '51 Pegasi b Orbit (0.053 AU)',
				semiMajorAxisAu: 0.053,
				color: '#f59e0b',
				dashed: true
			}
		],
		sourceUrl: 'https://science.nasa.gov/solar-system/planets/',
		planets: [
			{
				id: 'sol-mercury',
				letter: 'I',
				name: 'Mercury',
				subtitle: 'Iron-Core Innermost Terrestrial Planet',
				discoveryYear: -3000,
				discoveryMethod: 'Naked-Eye Antiquity / Mariner 10 & MESSENGER',
				orbitalPeriodDays: 87.9691,
				semiMajorAxisAu: 0.387098,
				eccentricity: 0.20563,
				inclinationDeg: 7.005,
				radiusEarth: 0.3829,
				massEarth: 0.0553,
				densityGcm3: 5.427,
				surfaceGravityG: 0.378,
				equilibriumTempK: 440,
				stellarFluxEarth: 6.67,
				inHabitableZone: false,
				habitableZoneNote: 'Inner Scorched Zone (6.67× Solar constant)',
				tidallyLocked: false,
				resonanceRatio: '3:2 Spin-Orbit Resonance',
				transitDepthPct: 0.0012,
				transitDurationHours: 5.5,
				jwstSummary:
					'Benchmark for airless high-density exoplanets (iron core comprises ~85% of planetary radius).',
				scienceNotes:
					'Locked in a 3:2 spin-orbit resonance, rotating three times on its axis for every two orbits around the Sun.',
				shaderStyle: 'cryo-rock',
				primaryColor: '#64748b',
				secondaryColor: '#94a3b8',
				atmosphereColor: '#cbd5e1',
				cloudCover: 0.0,
				bandFrequency: 2.5,
				baselineTransitDepthPpm: 12,
				spectralFeatures: [
					{
						molecule: 'Flat/Cloud-Deck',
						label: 'Airless Surface Continuum (Sodium Exosphere Trace)',
						wavelengthUm: 2.5,
						widthUm: 1.8,
						depthPpm: 4,
						confidence: 'MESSENGER / BepiColombo Ground Truth',
						color: '#94a3b8'
					}
				]
			},
			{
				id: 'sol-venus',
				letter: 'II',
				name: 'Venus',
				subtitle: '92-Bar CO₂ Runaway Greenhouse World',
				discoveryYear: -3000,
				discoveryMethod: 'Naked-Eye Antiquity / Venera & Magellan',
				orbitalPeriodDays: 224.701,
				semiMajorAxisAu: 0.723332,
				eccentricity: 0.00677,
				inclinationDeg: 3.394,
				radiusEarth: 0.9499,
				massEarth: 0.815,
				densityGcm3: 5.243,
				surfaceGravityG: 0.904,
				equilibriumTempK: 232,
				stellarFluxEarth: 1.91,
				inHabitableZone: false,
				habitableZoneNote: 'Inner Runaway-Greenhouse Boundary (737 K surface temperature)',
				tidallyLocked: false,
				transitDepthPct: 0.0076,
				transitDurationHours: 7.6,
				jwstSummary:
					'Solar transit observations of Venus show how high-altitude sulfuric acid (H₂SO₄) clouds mute lower-atmosphere spectral bands above 65 km while leaving sharp stratospheric CO₂ spikes.',
				scienceNotes:
					'Crucial exoplanet cautionary tale: nearly identical to Earth in radius (0.95 R⊕) and mass (0.82 M⊕), yet its 96.5% CO₂ atmosphere traps extreme heat.',
				shaderStyle: 'venusian-rock',
				primaryColor: '#d97706',
				secondaryColor: '#fde047',
				atmosphereColor: '#facc15',
				cloudCover: 0.96,
				bandFrequency: 5.5,
				baselineTransitDepthPpm: 76,
				spectralFeatures: [
					{
						molecule: 'CO2',
						label: '2.0 & 2.7 μm Stratospheric CO₂ Bands',
						wavelengthUm: 2.72,
						widthUm: 0.24,
						depthPpm: 32,
						confidence: 'Solar Transit Ground Truth',
						color: '#34d399'
					},
					{
						molecule: 'SO2',
						label: '4.0 μm H₂SO₄ / SO₂ Aerosol Feature',
						wavelengthUm: 4.0,
						widthUm: 0.22,
						depthPpm: 26,
						confidence: 'Venus Express / Akatsuki Ground Truth',
						color: '#facc15'
					},
					{
						molecule: 'CO2',
						label: '4.30 μm Strong CO₂ Fundamental Peak',
						wavelengthUm: 4.3,
						widthUm: 0.3,
						depthPpm: 68,
						confidence: 'Solar Transit Ground Truth',
						color: '#34d399'
					}
				]
			},
			{
				id: 'sol-earth',
				letter: 'III',
				name: 'Earth',
				subtitle: 'Living Ocean World & Biosignature Template',
				discoveryYear: -3000,
				discoveryMethod: 'Home World / Pale Blue Dot Benchmark',
				orbitalPeriodDays: 365.25636,
				semiMajorAxisAu: 1.0,
				eccentricity: 0.01671,
				inclinationDeg: 0.0,
				radiusEarth: 1.0,
				massEarth: 1.0,
				densityGcm3: 5.514,
				surfaceGravityG: 1.0,
				equilibriumTempK: 255,
				stellarFluxEarth: 1.0,
				inHabitableZone: true,
				habitableZoneNote: 'Conservative Habitable Zone Reference (288 K mean surface temp)',
				tidallyLocked: false,
				transitDepthPct: 0.0084,
				transitDurationHours: 13.0,
				jwstSummary:
					'Earthshine and lunar-eclipse transmission spectra serve as the gold-standard template for JWST and the future Habitable Worlds Observatory: simultaneous H₂O, CO₂, O₃, and CH₄.',
				scienceNotes:
					'A distant observer watching Earth transit the Sun sees an 84 ppm dip every 365.25 days, with atmospheric absorption adding ~15–55 ppm across infrared bands.',
				shaderStyle: 'earth-analog',
				primaryColor: '#0284c7',
				secondaryColor: '#15803d',
				atmosphereColor: '#38bdf8',
				cloudCover: 0.52,
				bandFrequency: 5.0,
				baselineTransitDepthPpm: 84,
				spectralFeatures: [
					{
						molecule: 'H2O',
						label: '1.4, 1.9 & 2.7 μm Tropospheric Water Vapor',
						wavelengthUm: 2.7,
						widthUm: 0.3,
						depthPpm: 38,
						confidence: 'Earthshine / ACE-FTS Ground Truth',
						color: '#38bdf8'
					},
					{
						molecule: 'CH4',
						label: '3.32 μm Biogenic Methane Band',
						wavelengthUm: 3.32,
						widthUm: 0.22,
						depthPpm: 26,
						confidence: 'Disequilibrium Biosignature',
						color: '#f59e0b'
					},
					{
						molecule: 'CO2',
						label: '4.30 μm CO₂ Fundamental Band',
						wavelengthUm: 4.3,
						widthUm: 0.28,
						depthPpm: 58,
						confidence: 'Earth Transmission Ground Truth',
						color: '#34d399'
					},
					{
						molecule: 'O3',
						label: '4.75 μm Stratospheric Ozone (O₃)',
						wavelengthUm: 4.75,
						widthUm: 0.24,
						depthPpm: 35,
						confidence: 'Photosynthetic O₂ Photolysis Product',
						color: '#a855f7'
					}
				]
			},
			{
				id: 'sol-mars',
				letter: 'IV',
				name: 'Mars',
				subtitle: 'Cold Arid Outer Habitable-Zone World',
				discoveryYear: -3000,
				discoveryMethod: 'Naked-Eye Antiquity / Viking to Perseverance',
				orbitalPeriodDays: 686.98,
				semiMajorAxisAu: 1.52368,
				eccentricity: 0.0934,
				inclinationDeg: 1.85,
				radiusEarth: 0.532,
				massEarth: 0.107,
				densityGcm3: 3.934,
				surfaceGravityG: 0.379,
				equilibriumTempK: 210,
				stellarFluxEarth: 0.431,
				inHabitableZone: true,
				habitableZoneNote: 'Conservative Habitable Zone Outer Region (0.43× Solar flux)',
				tidallyLocked: false,
				transitDepthPct: 0.0024,
				transitDurationHours: 16.0,
				jwstSummary:
					'JWST NIRSpec & NIRCam observations of Mars in 2022 mapped its 6 mbar CO₂ atmosphere, Hellas Basin pressure depth, and trace H₂O/CO distribution.',
				scienceNotes:
					'Receives 43% of Earth’s solar flux—comparable to TRAPPIST-1 f (37%)—demonstrating how planetary mass and magnetic field loss govern atmospheric retention.',
				shaderStyle: 'temperate-terrestrial',
				primaryColor: '#c2410c',
				secondaryColor: '#fdba74',
				atmosphereColor: '#fb923c',
				cloudCover: 0.15,
				bandFrequency: 3.5,
				baselineTransitDepthPpm: 24,
				spectralFeatures: [
					{
						molecule: 'H2O',
						label: '2.7 μm Trace Water Vapor & CO₂ Combination',
						wavelengthUm: 2.7,
						widthUm: 0.22,
						depthPpm: 14,
						confidence: 'JWST NIRSpec 2022 Observation',
						color: '#38bdf8'
					},
					{
						molecule: 'CO2',
						label: '4.30 μm 6-mbar CO₂ Atmosphere Peak',
						wavelengthUm: 4.3,
						widthUm: 0.26,
						depthPpm: 28,
						confidence: 'JWST NIRSpec 2022 Observation',
						color: '#34d399'
					}
				]
			}
		]
	}
];

export const EXOPLANET_SYSTEMS_BY_ID: Record<ExoplanetSystemId, ExoplanetSystemData> = {
	'trappist-1': EXOPLANET_SYSTEMS[0],
	'kepler-90': EXOPLANET_SYSTEMS[1],
	'51-pegasi': EXOPLANET_SYSTEMS[2],
	'solar-system': EXOPLANET_SYSTEMS[3]
};

import { writable, type Writable } from 'svelte/store';
import { scrollToPosition } from '$lib/stores/landingScroll';

export interface TelemetryState {
	scrollProgress: number; // 0 to 1
	currentYear: number; // 1975 to 2075
	activeChapterId: string;
	activeChapterIndex: number;
	activeMilestoneId: string;
	voyagerDistanceAu: number; // live ticking AU
	voyagerDistanceKm: number; // live ticking km
	voyagerLightSeconds: number; // live ticking light-seconds
	voyagerLightHoursFormatted: string; // e.g. "23h 18m 42.1s"
	cameraDistanceAu: number;
	cameraAltitudeFormatted: string;
	spatialRegionLabel: string;
	signalPowerDbm: number;
	rtgPowerWatts: number;
	inFinale: boolean;
}

export const chapterDirectoryOpenStore: Writable<boolean> = writable<boolean>(false);

export function openChapterDirectory(): void {
	chapterDirectoryOpenStore.set(true);
}

export const AU_IN_KM = 149_597_870.7;
export const SPEED_OF_LIGHT_KM_S = 299_792.458;
export const VOYAGER_VELOCITY_KM_S = 16.9995; // ~4.25 km per 250ms tick
export const VOYAGER_TICK_MS = 250;
const LEO_ALTITUDE_KM = 222;
const LEO_ALTITUDE_AU = LEO_ALTITUDE_KM / AU_IN_KM; // ~1.483978e-6 AU

export interface SpatialChapterAnchor {
	chapterId: string;
	chapterNumber: string;
	shortLabel: string;
	title: string;
	startProgress: number;
	endProgress: number;
	startYear: number;
	endYear: number;
	accentColor: string;
}

export const CHAPTER_SCROLL_ANCHORS: SpatialChapterAnchor[] = [
	{
		chapterId: 'prologue',
		chapterNumber: 'PROLOGUE',
		shortLabel: '1975 · Handshake',
		title: 'The Handshake',
		startProgress: 0.0,
		endProgress: 0.17,
		startYear: 1975,
		endYear: 1980,
		accentColor: '#C89B57'
	},
	{
		chapterId: 'ch1-living-there',
		chapterNumber: 'CHAPTER I',
		shortLabel: '1981 · Orbit',
		title: 'Learning to Live There',
		startProgress: 0.17,
		endProgress: 0.27,
		startYear: 1981,
		endYear: 1998,
		accentColor: '#C89B57'
	},
	{
		chapterId: 'ch2-eyes-universe',
		chapterNumber: 'CHAPTER II',
		shortLabel: '1990 · Deep Sight',
		title: 'Eyes on the Universe',
		startProgress: 0.27,
		endProgress: 0.37,
		startYear: 1990,
		endYear: 2005,
		accentColor: '#C89B57'
	},
	{
		chapterId: 'ch3-long-reach',
		chapterNumber: 'CHAPTER III',
		shortLabel: '2006 · Heliopause',
		title: 'The Long Reach',
		startProgress: 0.37,
		endProgress: 0.47,
		startYear: 2006,
		endYear: 2015,
		accentColor: '#C89B57'
	},
	{
		chapterId: 'ch4-reusable-revolution',
		chapterNumber: 'CHAPTER IV',
		shortLabel: '2015 · Reusability',
		title: 'The Reusable Revolution',
		startProgress: 0.47,
		endProgress: 0.57,
		startYear: 2015,
		endYear: 2020,
		accentColor: '#C89B57'
	},
	{
		chapterId: 'ch5-new-golden-age',
		chapterNumber: 'CHAPTER V',
		shortLabel: '2021 · Golden Age',
		title: 'The New Golden Age',
		startProgress: 0.57,
		endProgress: 0.67,
		startYear: 2021,
		endYear: 2026,
		accentColor: '#C89B57'
	},
	{
		chapterId: 'epilogue',
		chapterNumber: 'EPILOGUE',
		shortLabel: '2075 · Horizon',
		title: 'The Next Fifty Years',
		startProgress: 0.67,
		endProgress: 1.0,
		startYear: 2026,
		endYear: 2075,
		accentColor: '#C89B57'
	}
];

interface TrajectoryWaypoint {
	progress: number;
	year: number;
	distanceAu: number;
	mode: 'log' | 'power';
}

/**
 * Piecewise logarithmic & power-law trajectory waypoints mapping scrollProgress (0 -> 1)
 * across the compact 8–12vh landing page trailer cut: from 222 km Low Earth Orbit (Apollo-Soyuz, 1975)
 * through Cislunar space, Mars (1.5 AU), Jupiter/Saturn (9.5 AU), Termination Shock (94 AU),
 * Pluto/Heliopause (121.6 AU), Present-Day Voyager 1 (~169.8 AU / ~23h 34m light-time),
 * out to the 340 AU Centennial Horizon (2075) and the Finale Pull-Back.
 */
const TRAJECTORY_WAYPOINTS: TrajectoryWaypoint[] = [
	{ progress: 0.0, year: 1975.0, distanceAu: LEO_ALTITUDE_AU, mode: 'log' }, // 222 km LEO (Apollo-Soyuz)
	{ progress: 0.05, year: 1976.0, distanceAu: 384_400 / AU_IN_KM, mode: 'log' }, // 384,400 km Moon (1.28 ls)
	{ progress: 0.1, year: 1976.6, distanceAu: 1.52368, mode: 'log' }, // 1.52 AU Mars (Viking 1 & 2)
	{ progress: 0.17, year: 1980.9, distanceAu: 9.53707, mode: 'log' }, // 9.54 AU Saturn (Voyager 1)
	{ progress: 0.27, year: 1994.0, distanceAu: 58.0, mode: 'power' }, // Outer Solar System / Kuiper approach
	{ progress: 0.37, year: 2005.0, distanceAu: 94.0, mode: 'power' }, // Termination Shock & Cassini at Saturn
	{ progress: 0.43, year: 2012.6, distanceAu: 121.6, mode: 'power' }, // Heliopause Crossing (Aug 25, 2012)
	{ progress: 0.47, year: 2015.7, distanceAu: 133.3, mode: 'power' }, // New Horizons Pluto & LIGO GW150914
	{ progress: 0.57, year: 2020.5, distanceAu: 152.0, mode: 'power' }, // Reusable Era & Event Horizon
	{ progress: 0.67, year: 2026.0, distanceAu: 169.8, mode: 'power' }, // Present-Day Voyager 1 (~23h 32m light-time)
	{ progress: 0.77, year: 2075.0, distanceAu: 340.0, mode: 'power' }, // 2075 Centennial Horizon (340 AU)
	{ progress: 1.0, year: 2075.0, distanceAu: 340.0, mode: 'power' } // Finale Pull-Back & Continue the Journey
];

/**
 * Piecewise logarithmic / power-law interpolation of spatial distance (AU) and epoch year
 * from normalized scroll progress (0 -> 1).
 */
export function interpolateSpatialTrajectory(progress: number): {
	distanceAu: number;
	year: number;
} {
	const p = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));

	for (let i = 0; i < TRAJECTORY_WAYPOINTS.length - 1; i++) {
		const a = TRAJECTORY_WAYPOINTS[i];
		const b = TRAJECTORY_WAYPOINTS[i + 1];
		if (p >= a.progress && p <= b.progress) {
			const span = b.progress - a.progress;
			const t = span > 0 ? (p - a.progress) / span : 0;
			const year = a.year + (b.year - a.year) * t;

			let distanceAu: number;
			if (a.mode === 'log') {
				const logA = Math.log10(Math.max(a.distanceAu, 1e-9));
				const logB = Math.log10(Math.max(b.distanceAu, 1e-9));
				distanceAu = Math.pow(10, logA + (logB - logA) * t);
			} else {
				// Smooth power-law curve in outer heliosphere & interstellar space
				const curvedT = Math.pow(t, 1.08);
				distanceAu = a.distanceAu + (b.distanceAu - a.distanceAu) * curvedT;
			}
			return { distanceAu, year };
		}
	}

	const last = TRAJECTORY_WAYPOINTS[TRAJECTORY_WAYPOINTS.length - 1];
	return { distanceAu: last.distanceAu, year: last.year };
}

/**
 * Formats one-way light time as "XXh XXm XX.Xs" (with sub-second precision in near-Earth space).
 */
export function formatLightTime(lightSeconds: number): string {
	const safeSec = Math.max(0, Number.isFinite(lightSeconds) ? lightSeconds : 0);
	const hours = Math.floor(safeSec / 3600);
	const minutes = Math.floor((safeSec % 3600) / 60);
	const seconds = safeSec % 60;

	const hStr = String(hours).padStart(2, '0');
	const mStr = String(minutes).padStart(2, '0');

	if (safeSec < 10) {
		const sStr = seconds.toFixed(3).padStart(6, '0');
		return `${hStr}h ${mStr}m ${sStr}s`;
	}
	const sStr = seconds.toFixed(1).padStart(4, '0');
	return `${hStr}h ${mStr}m ${sStr}s`;
}

/**
 * Returns the concise spatial regime label for the current heliocentric distance.
 */
export function formatSpatialRegion(distanceAu: number): string {
	const km = distanceAu * AU_IN_KM;
	if (km < 2_000) return 'Low Earth Orbit';
	if (km < 1_000_000) return 'Cislunar';
	if (distanceAu < 0.1) return 'Inner Space';
	if (distanceAu < 2.5) return 'Mars / Inner System';
	if (distanceAu < 35.0) return 'Gas Giant Realm';
	if (distanceAu < 118.0) return 'Heliosheath';
	if (distanceAu < 126.0) return 'Heliopause';
	if (distanceAu < 200.0) return 'Interstellar Space';
	return 'Centennial Horizon';
}

/**
 * Formats camera spatial altitude across 9 orders of magnitude (222 km LEO -> 340 AU Horizon).
 */
export function formatCameraAltitude(distanceAu: number): string {
	const region = formatSpatialRegion(distanceAu);
	if (distanceAu < 0.1) {
		return `${distanceAu.toFixed(4)} AU · ${region}`;
	}
	return `${distanceAu.toFixed(1)} AU · ${region}`;
}

/**
 * Computes realistic Deep Space Network (DSN) X-band downlink signal power (dBm)
 * dropping from -95.0 dBm in Low Earth Orbit to -161.4 dBm at the 340 AU horizon
 * via inverse-square free-space path loss (20 * log10(r)).
 */
export function computeDsnSignalPowerDbm(distanceAu: number): number {
	const safeAu = Math.max(distanceAu, LEO_ALTITUDE_AU);
	if (safeAu <= 1.0) {
		// Transition from near-Earth low-gain omni link (-95.0 dBm at 222 km) to 1 AU high-gain dish (-110.77 dBm)
		const logMin = Math.log10(LEO_ALTITUDE_AU);
		const logCur = Math.log10(safeAu);
		const frac = Math.max(0, Math.min(1, (logCur - logMin) / (0 - logMin)));
		return Number((-95.0 - frac * 15.772).toFixed(2));
	}
	// Pure inverse-square law (20 * log10(r)) from 1 AU (-110.772 dBm) out to 340 AU (-161.40 dBm)
	const dbm = -110.772 - 20 * Math.log10(safeAu);
	return Number(Math.max(-168.0, Math.min(-95.0, dbm)).toFixed(2));
}

/**
 * Computes Voyager 1's 3x MHW-RTG Plutonium-238 electrical output (Watts),
 * decaying from 470.0 W at 1977 launch with an 87.7-year Pu-238 half-life
 * plus SiGe bimetallic thermocouple degradation.
 */
export function computeRtgPowerWatts(year: number): number {
	const yearsSinceLaunch = Math.max(0, year - 1977.68);
	const pu238Decay = Math.pow(0.5, yearsSinceLaunch / 87.7);
	const thermocoupleDegradation = Math.exp(-0.00725 * yearsSinceLaunch);
	const watts = 470.0 * pu238Decay * thermocoupleDegradation;
	return Number( watts.toFixed(1) );
}

function resolveChapterFromProgress(
	progress: number,
	explicitChapterId?: string
): { chapterId: string; chapterIndex: number } {
	if (explicitChapterId) {
		const idx = CHAPTER_SCROLL_ANCHORS.findIndex((c) => c.chapterId === explicitChapterId);
		if (idx !== -1) {
			return { chapterId: explicitChapterId, chapterIndex: idx };
		}
	}
	for (let i = CHAPTER_SCROLL_ANCHORS.length - 1; i >= 0; i--) {
		if (progress >= CHAPTER_SCROLL_ANCHORS[i].startProgress) {
			return {
				chapterId: CHAPTER_SCROLL_ANCHORS[i].chapterId,
				chapterIndex: i
			};
		}
	}
	return { chapterId: 'prologue', chapterIndex: 0 };
}

// Persistent live odometer accumulation (km) driven by startLiveVoyagerTicker()
let liveAccumulatedKm = 0;

function buildTelemetryState(
	scrollProgress: number,
	activeChapterId?: string,
	activeMilestoneId?: string,
	inFinale: boolean = false
): TelemetryState {
	const clampedProgress = Math.max(0, Math.min(1, Number.isFinite(scrollProgress) ? scrollProgress : 0));
	const { distanceAu: baseDistanceAu, year } = interpolateSpatialTrajectory(clampedProgress);
	const { chapterId, chapterIndex } = resolveChapterFromProgress(
		clampedProgress,
		activeChapterId
	);

	// Combine scroll-interpolated historical distance with live real-time Voyager velocity ticker
	const liveDeltaAu = liveAccumulatedKm / AU_IN_KM;
	const voyagerDistanceAu = baseDistanceAu + liveDeltaAu;
	const voyagerDistanceKm = voyagerDistanceAu * AU_IN_KM;
	const voyagerLightSeconds = voyagerDistanceKm / SPEED_OF_LIGHT_KM_S;
	const voyagerLightHoursFormatted = formatLightTime(voyagerLightSeconds);

	const cameraDistanceAu = voyagerDistanceAu;
	const cameraAltitudeFormatted = formatCameraAltitude(cameraDistanceAu);
	const spatialRegionLabel = formatSpatialRegion(cameraDistanceAu);
	const signalPowerDbm = computeDsnSignalPowerDbm(voyagerDistanceAu);
	const rtgPowerWatts = computeRtgPowerWatts(year);

	return {
		scrollProgress: clampedProgress,
		currentYear: Math.round(year),
		activeChapterId: chapterId,
		activeChapterIndex: chapterIndex,
		activeMilestoneId: activeMilestoneId ?? 'apollo-soyuz-1975',
		voyagerDistanceAu,
		voyagerDistanceKm,
		voyagerLightSeconds,
		voyagerLightHoursFormatted,
		cameraDistanceAu,
		cameraAltitudeFormatted,
		spatialRegionLabel,
		signalPowerDbm,
		rtgPowerWatts,
		inFinale
	};
}

export const telemetryStore: Writable<TelemetryState> = writable<TelemetryState>(
	buildTelemetryState(0, 'prologue', 'apollo-soyuz-1975')
);

/**
 * Updates scroll telemetry state from normalized scrollProgress (0 -> 1)
 * and optional active chapter / milestone IDs.
 */
export function updateScrollTelemetry(
	progress: number,
	activeChapterId?: string,
	activeMilestoneId?: string,
	inFinale?: boolean
): void {
	telemetryStore.update((prev) =>
		buildTelemetryState(
			progress,
			activeChapterId,
			activeMilestoneId ?? prev.activeMilestoneId,
			inFinale ?? prev.inFinale
		)
	);
}

/**
 * Runs a 250ms interval adding Voyager 1's real heliocentric velocity
 * (16.9995 km/s ≈ 4.249875 km per 250ms tick) to voyagerDistanceKm, voyagerDistanceAu,
 * and voyagerLightSeconds while reducing reactive store updates by 75% for iGPU smoothness.
 */
let tickerSubscriberCount = 0;
let activeTickerInterval: number | null = null;
let lastTickTimestamp = 0;

export function startLiveVoyagerTicker(): () => void {
	if (typeof window === 'undefined') {
		return () => {};
	}
	tickerSubscriberCount += 1;
	if (!activeTickerInterval) {
		lastTickTimestamp = typeof performance !== 'undefined' ? performance.now() : Date.now();
		activeTickerInterval = window.setInterval(() => {
			const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
			const dtSeconds = Math.max(0.01, Math.min(0.6, (now - lastTickTimestamp) / 1000));
			lastTickTimestamp = now;

			const deltaKm = VOYAGER_VELOCITY_KM_S * dtSeconds;
			liveAccumulatedKm += deltaKm;
			telemetryStore.update((state) => {
				const voyagerDistanceKm = state.voyagerDistanceKm + deltaKm;
				const voyagerDistanceAu = voyagerDistanceKm / AU_IN_KM;
				const voyagerLightSeconds = voyagerDistanceKm / SPEED_OF_LIGHT_KM_S;
				const voyagerLightHoursFormatted = formatLightTime(voyagerLightSeconds);
				const cameraDistanceAu = voyagerDistanceAu;
				const cameraAltitudeFormatted = formatCameraAltitude(cameraDistanceAu);
				const spatialRegionLabel = formatSpatialRegion(cameraDistanceAu);
				const signalPowerDbm = computeDsnSignalPowerDbm(voyagerDistanceAu);

				return {
					...state,
					voyagerDistanceAu,
					voyagerDistanceKm,
					voyagerLightSeconds,
					voyagerLightHoursFormatted,
					cameraDistanceAu,
					cameraAltitudeFormatted,
					spatialRegionLabel,
					signalPowerDbm
				};
			});
		}, VOYAGER_TICK_MS);
	}

	let cleanedUp = false;
	return () => {
		if (cleanedUp) return;
		cleanedUp = true;
		tickerSubscriberCount = Math.max(0, tickerSubscriberCount - 1);
		if (tickerSubscriberCount === 0 && activeTickerInterval) {
			window.clearInterval(activeTickerInterval);
			activeTickerInterval = null;
		}
	};
}

/**
 * Brings a target chapter, milestone, or section element ID into view, trying exact IDs as well
 * as semantic fallbacks. On the landing page this is a fast-travel fly-through (scrollToPosition).
 */
export function scrollToSection(elementId: string): void {
	if (typeof document === 'undefined' || !elementId) return;

	const cleanId = elementId.replace(/^#/, '').trim();
	const candidateIds = [
		cleanId,
		`chapter-${cleanId}`,
		`milestone-${cleanId}`,
		`section-${cleanId}`
	];

	// Semantic aliases for navigation buttons
	if (cleanId === 'chapters') {
		candidateIds.push('prologue', 'chapter-prologue', 'narrative-start');
	} else if (cleanId === 'decade-matrix' || cleanId === 'decade-timeline' || cleanId === 'timeline') {
		candidateIds.push('decade-timeline', 'decade-matrix', 'timeline-explorer');
	} else if (cleanId === 'sources' || cleanId === 'references') {
		candidateIds.push('sources', 'sources-panel', 'verified-sources');
	} else if (
		cleanId === 'ai-architecture' ||
		cleanId === 'ai-showcase' ||
		cleanId === 'built-by-ai'
	) {
		candidateIds.push('ai-showcase', 'ai-architecture', 'built-by-ai');
	}

	let target: HTMLElement | null = null;
	for (const candidate of candidateIds) {
		const el = document.getElementById(candidate);
		if (el) {
			target = el;
			break;
		}
	}

	if (!target) {
		target =
			document.querySelector<HTMLElement>(`[data-chapter-id="${cleanId}"]`) ??
			document.querySelector<HTMLElement>(`[data-milestone-id="${cleanId}"]`) ??
			document.querySelector<HTMLElement>(`[data-section="${cleanId}"]`);
	}

	if (target) {
		const headerOffset = 72;
		const elementPosition = target.getBoundingClientRect().top + window.scrollY;
		scrollToPosition(elementPosition - headerOffset);
	}
}

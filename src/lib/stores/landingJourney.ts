import { writable, type Writable } from 'svelte/store';

/**
 * Landing flight choreography — one continuous camera journey outward through the solar system.
 *
 * Every waypoint repeats the same four beats, all scrubbed by scroll:
 *  1. panel   the chapter panel sits over the waypoint while the camera drifts slowly;
 *  2. solo    the panel has scrolled off the top: the waypoint alone, one small label at most;
 *  3. flight  the camera eases away toward the next waypoint;
 *  4. arrival the next panel rises while the camera settles on the next waypoint.
 * A waypoint without a chapter (`chapterId: null`) is a planet-only interlude: beats 2–3 only.
 */
export type JourneyWaypointId =
	| 'earth'
	| 'mars'
	| 'jupiter'
	| 'saturn'
	| 'pluto'
	| 'heliopause'
	| 'interstellar'
	| 'deep-void';

export interface JourneyWaypoint {
	id: JourneyWaypointId;
	/** Chapter whose landing panel sits over this waypoint; null for a planet-only interlude. */
	chapterId: string | null;
	/** Solo-beat label, line 1. */
	name: string;
	/** Solo-beat label, line 2. */
	distanceLabel: string;
}

/** Real waypoints in outward order. The first entry also carries the hero. */
export const JOURNEY_WAYPOINTS: readonly JourneyWaypoint[] = [
	{ id: 'earth', chapterId: 'prologue', name: 'TERRA · 1.00 AU', distanceLabel: '222 KM LOW EARTH ORBIT' },
	{ id: 'mars', chapterId: 'ch1-living-there', name: 'MARS · 1.52 AU', distanceLabel: '227.9M KM · 12M 40S OWLT' },
	{ id: 'jupiter', chapterId: null, name: 'JUPITER · 5.20 AU', distanceLabel: '778.5M KM · 43M 16S OWLT' },
	{ id: 'saturn', chapterId: 'ch2-eyes-universe', name: 'SATURN · 9.54 AU', distanceLabel: '1.43B KM · 1H 19M OWLT' },
	{ id: 'pluto', chapterId: 'ch3-long-reach', name: 'PLUTO & CHARON · 39.5 AU', distanceLabel: '5.91B KM · 5H 28M OWLT' },
	{ id: 'heliopause', chapterId: 'ch4-reusable-revolution', name: 'HELIOPAUSE · 121.6 AU', distanceLabel: '18.19B KM · 16H 51M OWLT' },
	{ id: 'interstellar', chapterId: 'ch5-new-golden-age', name: 'INTERSTELLAR MEDIUM · 169.8 AU', distanceLabel: '25.4B KM · 23H 34M OWLT' },
	{ id: 'deep-void', chapterId: 'epilogue', name: 'CENTENNIAL HORIZON · 340.0 AU', distanceLabel: '50.9B KM · 47H 08M OWLT' }
];

/** Beat lengths in viewport heights of scroll. */
const BEATS = {
	/** The camera settles on a waypoint once its panel's top edge has risen to this viewport fraction. */
	settleAt: 0.5,
	/** Planet-only observe beat, starting when a panel has fully left the top of the viewport. */
	solo: 0.65,
	/** Flight with nothing on screen before the next panel starts to rise. */
	openFlight: 0.3,
	/** Flight into a planet-only interlude (no panel rises at its end). */
	interludeFlight: 0.75,
	/** Scene-only tail after the last solo beat before the finale rises. */
	finaleLeadIn: 0.1,
	/** Solo label fades in over this much scroll once the panel is gone. */
	labelIn: 0.12,
	/** Solo label fades out across the start of the flight. */
	labelOut: 0.18
} as const;

function waypointIndexForChapter(chapterId: string): number {
	return JOURNEY_WAYPOINTS.findIndex((w) => w.chapterId === chapterId);
}

/**
 * Scroll spacer below a chapter panel, in vh. The panel needs one full viewport to clear the screen
 * before anything is scene-only; the rest is the solo beat, any interludes, and the open flight.
 */
export function journeyGapAfterChapterVh(chapterId: string): number {
	const index = waypointIndexForChapter(chapterId);
	let sceneOnly = BEATS.solo;
	let next = index + 1;
	while (next < JOURNEY_WAYPOINTS.length && JOURNEY_WAYPOINTS[next].chapterId === null) {
		sceneOnly += BEATS.interludeFlight + BEATS.solo;
		next += 1;
	}
	sceneOnly += next < JOURNEY_WAYPOINTS.length ? BEATS.openFlight : BEATS.finaleLeadIn;
	return Math.round((1 + sceneOnly) * 100);
}

export function journeyWaypointForChapter(chapterId: string): JourneyWaypoint | undefined {
	return JOURNEY_WAYPOINTS[waypointIndexForChapter(chapterId)];
}

export interface JourneyState {
	/**
	 * Continuous flight coordinate. Waypoint k holds over [2k, 2k + 1]; the flight from k to k + 1
	 * spans [2k + 1, 2k + 2]. Fractions are linear in scroll; consumers apply their own easing.
	 */
	position: number;
	/** Opacity of the single solo-beat label (0 while any panel is on screen). */
	labelOpacity: number;
}

export const journeyStore: Writable<JourneyState> = writable<JourneyState>({
	position: 0,
	labelOpacity: 0
});

interface HoldSpan {
	start: number;
	soloStart: number;
	end: number;
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/**
 * Reads the landing panels (`[data-journey-panel]`) and publishes the camera's flight coordinate
 * for the current scroll position. Call on scroll/resize while the landing page is mounted.
 */
export function syncLandingJourney(): void {
	if (typeof window === 'undefined') return;
	const vh = Math.max(1, window.innerHeight);
	const y = window.scrollY;

	const panels = new Map<string, { top: number; bottom: number }>();
	for (const el of document.querySelectorAll<HTMLElement>('[data-journey-panel]')) {
		const rect = el.getBoundingClientRect();
		panels.set(el.dataset.journeyPanel ?? '', { top: rect.top + y, bottom: rect.bottom + y });
	}
	if (panels.size === 0) return;

	const holds: HoldSpan[] = [];
	for (let k = 0; k < JOURNEY_WAYPOINTS.length; k++) {
		const prevEnd = k > 0 ? holds[k - 1].end : 0;
		const panel = panels.get(JOURNEY_WAYPOINTS[k].id);
		let start: number;
		let soloStart: number;
		if (panel) {
			// The first waypoint holds from the very top: the hero sits over it too
			start = k === 0 ? 0 : Math.max(prevEnd + 1, panel.top - BEATS.settleAt * vh);
			soloStart = Math.max(start, panel.bottom);
		} else {
			start = prevEnd + BEATS.interludeFlight * vh;
			soloStart = start;
		}
		holds.push({ start, soloStart, end: soloStart + BEATS.solo * vh });
	}

	let position = 2 * (holds.length - 1) + 1;
	let labelOpacity = 0;
	for (let k = 0; k < holds.length; k++) {
		const h = holds[k];
		if (k > 0 && y < h.start) {
			const prev = holds[k - 1];
			position = 2 * (k - 1) + 1 + clamp01((y - prev.end) / Math.max(1, h.start - prev.end));
			labelOpacity = 1 - clamp01((y - prev.end) / (BEATS.labelOut * vh));
			break;
		}
		if (y <= h.end || k === holds.length - 1) {
			position = 2 * k + clamp01((y - h.start) / Math.max(1, h.end - h.start));
			labelOpacity = clamp01((y - h.soloStart) / (BEATS.labelIn * vh));
			break;
		}
	}

	journeyStore.set({ position, labelOpacity });
}

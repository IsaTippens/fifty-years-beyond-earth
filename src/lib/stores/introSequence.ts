import { get, writable, type Writable } from 'svelte/store';

/**
 * Landing intro choreography — staged like the finale, one element at a time.
 *
 *  void      State 0: top of the page before any scroll. Drifting stars and the title only;
 *                     every piece of chrome is hidden and Earth has not arrived.
 *  departure State 1: first scroll. The departure cue resolves and Earth rises into frame
 *                     while the camera eases back. Chrome is still hidden.
 *  journey   State 2: departure resolved. Mission-control chrome fades in, staggered.
 *
 * Returning to the very top reverses the sequence back to `void`.
 */
export type IntroPhase = 'void' | 'departure' | 'journey';

export const introPhaseStore: Writable<IntroPhase> = writable<IntroPhase>('void');

/** Scroll distance that counts as "scrolling has begun". */
const DEPARTURE_TRIGGER_PX = 4;
/** At or below this offset the page is "at the very top" (absorbs sub-pixel and overscroll). */
const TOP_OF_PAGE_PX = 1;
/**
 * How long the departure beat holds before mission control comes online: the cue resolves and
 * dissolves on its own inside this window while Earth finishes rising into frame.
 */
const DEPARTURE_BEAT_MS = 2400;
/** Past this fraction of the viewport the hero is out of view: skip the departure beat. */
const SKIP_DEPARTURE_VIEWPORT_FRACTION = 0.6;

/**
 * Drives the intro phase from the window scroll position while the landing page is mounted.
 * Returns a cleanup that detaches listeners and resets to `void` for the next landing visit.
 */
export function startIntroSequence(): () => void {
	let departureTimer = 0;
	let rafId = 0;

	const clearDepartureTimer = () => {
		if (departureTimer !== 0) {
			window.clearTimeout(departureTimer);
			departureTimer = 0;
		}
	};

	const evaluate = () => {
		rafId = 0;
		const y = window.scrollY;
		const phase = get(introPhaseStore);
		const heroLeftView = y > window.innerHeight * SKIP_DEPARTURE_VIEWPORT_FRACTION;

		if (y <= TOP_OF_PAGE_PX) {
			clearDepartureTimer();
			if (phase !== 'void') introPhaseStore.set('void');
			return;
		}

		if (phase === 'void' && y > DEPARTURE_TRIGGER_PX) {
			if (heroLeftView) {
				// Restored or jumped scroll position: the hero isn't on screen to stage a departure.
				introPhaseStore.set('journey');
				return;
			}
			introPhaseStore.set('departure');
			departureTimer = window.setTimeout(() => {
				departureTimer = 0;
				if (get(introPhaseStore) === 'departure') introPhaseStore.set('journey');
			}, DEPARTURE_BEAT_MS);
			return;
		}

		if (phase === 'departure' && heroLeftView) {
			clearDepartureTimer();
			introPhaseStore.set('journey');
		}
	};

	const schedule = () => {
		if (rafId === 0) rafId = window.requestAnimationFrame(evaluate);
	};

	window.addEventListener('scroll', schedule, { passive: true });
	window.addEventListener('resize', schedule, { passive: true });
	schedule();

	return () => {
		window.removeEventListener('scroll', schedule);
		window.removeEventListener('resize', schedule);
		if (rafId !== 0) window.cancelAnimationFrame(rafId);
		clearDepartureTimer();
		introPhaseStore.set('void');
	};
}

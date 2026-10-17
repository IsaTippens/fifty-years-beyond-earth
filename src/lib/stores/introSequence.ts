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
 * Scroll is held at the top while the intro plays: the first downward wheel/swipe/key gesture
 * starts the departure instead of moving the page, and the page only scrolls on toward the first
 * chapter once every piece of hero text and chrome is on screen. An upward gesture at the top (or
 * scrolling back up to the top) reverses the sequence back to `void`.
 */
export type IntroPhase = 'void' | 'departure' | 'journey';

export const introPhaseStore: Writable<IntroPhase> = writable<IntroPhase>('void');

/** Scroll distance that counts as "scrolling has begun" (scrollbar drags and programmatic jumps). */
const DEPARTURE_TRIGGER_PX = 4;
/** At or below this offset the page is "at the very top" (absorbs sub-pixel and overscroll). */
const TOP_OF_PAGE_PX = 1;
/**
 * How long the departure beat holds before mission control comes online: the cue resolves and
 * dissolves on its own inside this window while Earth finishes rising into frame.
 */
const DEPARTURE_BEAT_MS = 2400;
/**
 * Scroll stays held this long after the journey begins: the last stagger slot (stats, 1140ms in
 * `app.css`) has faded in before the page may move on to the first chapter.
 */
const CHROME_SETTLE_MS = 1700;
/** Past this fraction of the viewport the hero is out of view: skip the departure beat. */
const SKIP_DEPARTURE_VIEWPORT_FRACTION = 0.6;
/** Finger travel that reads as a deliberate swipe rather than a tap. */
const TOUCH_INTENT_PX = 6;

const SCROLL_DOWN_KEYS = new Set(['ArrowDown', 'PageDown', 'End', ' ']);
const SCROLL_UP_KEYS = new Set(['ArrowUp', 'PageUp', 'Home']);

/** Gestures over the top bar (chapter menu / telemetry drawer) scroll their own panels. */
function isOwnScrollRegion(target: EventTarget | null): boolean {
	return target instanceof Element && target.closest('header') !== null;
}

function isTextEntry(target: EventTarget | null): boolean {
	return (
		target instanceof HTMLElement &&
		(target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))
	);
}

/**
 * Drives the intro phase while the landing page is mounted and holds the page at the top until
 * the intro has fully played. Returns a cleanup that detaches listeners and resets to `void` for
 * the next landing visit.
 */
export function startIntroSequence(): () => void {
	let departureTimer = 0;
	let settleTimer = 0;
	let rafId = 0;
	/** True from departure until the chrome has settled: downward scroll at the top is swallowed. */
	let scrollHeld = false;
	let lastScrollY = window.scrollY;
	let touchStartY: number | null = null;

	const clearTimers = () => {
		window.clearTimeout(departureTimer);
		window.clearTimeout(settleTimer);
		departureTimer = 0;
		settleTimer = 0;
	};

	const enterJourney = () => {
		clearTimers();
		introPhaseStore.set('journey');
		settleTimer = window.setTimeout(() => {
			settleTimer = 0;
			scrollHeld = false;
		}, CHROME_SETTLE_MS);
	};

	const beginDeparture = () => {
		clearTimers();
		scrollHeld = true;
		introPhaseStore.set('departure');
		departureTimer = window.setTimeout(enterJourney, DEPARTURE_BEAT_MS);
	};

	const rewind = () => {
		clearTimers();
		scrollHeld = false;
		introPhaseStore.set('void');
	};

	const atTop = () => window.scrollY <= TOP_OF_PAGE_PX;

	/**
	 * Downward intent at the top: starts the departure from the void and swallows the gesture while
	 * the intro is still playing. Returns true when the gesture was consumed.
	 */
	const holdDownwardIntent = (): boolean => {
		if (!atTop()) return false;
		if (get(introPhaseStore) === 'void') {
			beginDeparture();
			return true;
		}
		return scrollHeld;
	};

	/** Upward intent at the top reverses the sequence (chrome retires, Earth recedes). */
	const releaseUpwardIntent = () => {
		if (atTop() && get(introPhaseStore) !== 'void') rewind();
	};

	const handleWheel = (event: WheelEvent) => {
		if (event.ctrlKey || event.deltaY === 0 || isOwnScrollRegion(event.target)) return;
		if (event.deltaY > 0) {
			if (holdDownwardIntent()) event.preventDefault();
		} else {
			releaseUpwardIntent();
		}
	};

	const handleTouchStart = (event: TouchEvent) => {
		touchStartY = event.touches.length === 1 ? event.touches[0].clientY : null;
	};

	const handleTouchMove = (event: TouchEvent) => {
		if (touchStartY === null || isOwnScrollRegion(event.target)) return;
		const swipe = touchStartY - event.touches[0].clientY; // > 0: finger up, page would scroll down
		if (swipe > TOUCH_INTENT_PX) {
			if (holdDownwardIntent() && event.cancelable) event.preventDefault();
		} else if (swipe < -TOUCH_INTENT_PX) {
			releaseUpwardIntent();
		}
	};

	const handleTouchEnd = () => {
		touchStartY = null;
	};

	const handleKeydown = (event: KeyboardEvent) => {
		if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
		if (isTextEntry(event.target) || isOwnScrollRegion(event.target)) return;
		// Space on a focused control activates it; leave it alone
		if (event.key === ' ' && event.target instanceof Element && event.target.closest('button, a'))
			return;
		const down = SCROLL_DOWN_KEYS.has(event.key) && !(event.key === ' ' && event.shiftKey);
		const up = SCROLL_UP_KEYS.has(event.key) || (event.key === ' ' && event.shiftKey);
		if (down) {
			if (holdDownwardIntent()) event.preventDefault();
		} else if (up) {
			releaseUpwardIntent();
		}
	};

	// Fallback for movement the gesture hold cannot see (scrollbar drags, restored or jumped positions)
	const evaluateScroll = () => {
		rafId = 0;
		const y = window.scrollY;
		const cameFromBelow = lastScrollY > TOP_OF_PAGE_PX;
		lastScrollY = y;
		const phase = get(introPhaseStore);
		const heroLeftView = y > window.innerHeight * SKIP_DEPARTURE_VIEWPORT_FRACTION;

		if (y <= TOP_OF_PAGE_PX) {
			// Scrolling back up to the very top reverses the sequence
			if (cameFromBelow && phase !== 'void') rewind();
			return;
		}

		if (phase === 'void' && y > DEPARTURE_TRIGGER_PX) {
			// Hero already out of view: there is nothing to stage a departure over
			if (heroLeftView) enterJourney();
			else beginDeparture();
			return;
		}

		if (phase === 'departure' && heroLeftView) enterJourney();
	};

	const scheduleScroll = () => {
		if (rafId === 0) rafId = window.requestAnimationFrame(evaluateScroll);
	};

	window.addEventListener('wheel', handleWheel, { passive: false });
	window.addEventListener('touchstart', handleTouchStart, { passive: true });
	window.addEventListener('touchmove', handleTouchMove, { passive: false });
	window.addEventListener('touchend', handleTouchEnd, { passive: true });
	window.addEventListener('touchcancel', handleTouchEnd, { passive: true });
	window.addEventListener('keydown', handleKeydown);
	window.addEventListener('scroll', scheduleScroll, { passive: true });
	window.addEventListener('resize', scheduleScroll, { passive: true });
	scheduleScroll();

	return () => {
		window.removeEventListener('wheel', handleWheel);
		window.removeEventListener('touchstart', handleTouchStart);
		window.removeEventListener('touchmove', handleTouchMove);
		window.removeEventListener('touchend', handleTouchEnd);
		window.removeEventListener('touchcancel', handleTouchEnd);
		window.removeEventListener('keydown', handleKeydown);
		window.removeEventListener('scroll', scheduleScroll);
		window.removeEventListener('resize', scheduleScroll);
		if (rafId !== 0) window.cancelAnimationFrame(rafId);
		clearTimers();
		introPhaseStore.set('void');
	};
}

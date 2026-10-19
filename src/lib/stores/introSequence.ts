import { writable, type Writable } from 'svelte/store';

/**
 * Landing intro gate — the one bounded place the landing page holds scroll.
 *
 * The intro is a timeline in natural seconds, staged like the finale:
 *  void      [0, departure)       State 0: drifting stars and the title alone.
 *  departure [departure, chrome)  State 1: the departure cue resolves and Earth rises into frame.
 *  journey   [chrome, end]        State 2: mission-control chrome fades in, staggered.
 *
 * While the gate is locked the page cannot move: the landing stage is pinned in place and every
 * scroll input (wheel, touch drag, keys, scrollbar) scrubs the timeline instead, never faster than
 * MAX_SCRUB_RATE× natural speed, so a flick compresses the intro but cannot skip it. Left alone,
 * it plays on by itself. At the end the gate releases into the native, Lenis-weighted journey.
 *
 * Escape hatches: the skip affordance, Esc, the chapters menu or telemetry drawer, keyboard focus
 * leaving the hero, and in-page navigation all skip. The gate never engages for reduced motion,
 * a return visit in the same session, or a page that loads already scrolled or deep-linked.
 *
 * The DOM side of the intro is pure CSS: the gate writes the timeline position to `--intro-s` on
 * <html>, and each element derives its own window from it (app.css, HeroSection). Unset means the
 * intro is complete. `app.html` sets the first-paint state before hydration.
 */
export type IntroPhase = 'void' | 'departure' | 'journey';

/** Natural (1×) timeline beats in seconds. The CSS windows in app.css and HeroSection match these. */
export const INTRO_BEATS = {
	/** End of the title-alone hold: the departure cue and Earth begin. */
	departure: 0.6,
	/** Earth finishes rising into frame. */
	earthEnd: 3.4,
	/** Mission-control chrome starts fading in (last slot lands at 5.54). */
	chrome: 3.2,
	/** Timeline end: the gate releases. */
	end: 5.6
} as const;

/** Input fast-forwards the intro at most this many times natural speed (≥ 2.8 s end to end). */
const MAX_SCRUB_RATE = 2;
/** Left idle, the intro advances on its own at this multiple of natural speed. */
const IDLE_RATE = 0.8;
/** With no input at all, it starts by itself once the title and eyebrow have landed (~4.3 s). */
const IDLE_START_MS = 5000;
/** After input stops mid-intro, it carries on by itself after this pause. */
const IDLE_RESUME_MS = 1200;
/**
 * The skip affordance appears this long into the gate and retires once mission control comes
 * online (INTRO_BEATS.chrome), when the chapters menu takes over as the visible way out.
 */
const SKIP_AFFORDANCE_MS = 1000;
/** Scroll distance, in viewport heights, that scrubs the whole timeline. */
const VIEWPORTS_PER_INTRO = 1;
/** A skipped intro plays its remaining beats this fast, with the page already free. */
const SKIP_FINISH_SECONDS = 0.45;

const SESSION_KEY = 'fybe:intro-played';

/** Scroll keys and how far each scrubs, in viewport heights (Space handled with Shift). */
const KEY_SCRUB_VIEWPORTS: Record<string, number> = {
	ArrowDown: 0.1,
	ArrowUp: -0.1,
	PageDown: 0.875,
	PageUp: -0.875
};

/** Position along the intro timeline, in natural seconds (INTRO_BEATS.end once complete). */
export const introTimeStore: Writable<number> = writable<number>(0);

export const introPhaseStore: Writable<IntroPhase> = writable<IntroPhase>('void');

/** The discreet skip control is on offer (from ~1 s into the gate until the chrome arrives). */
export const introSkipStore: Writable<boolean> = writable<boolean>(false);

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Earth's linear arrival (0 → 1) at a timeline position; consumers apply their own easing. */
export function introEarthArrival(seconds: number): number {
	return clamp(
		(seconds - INTRO_BEATS.departure) / (INTRO_BEATS.earthEnd - INTRO_BEATS.departure),
		0,
		1
	);
}

function phaseAt(seconds: number): IntroPhase {
	if (seconds < INTRO_BEATS.departure) return 'void';
	if (seconds < INTRO_BEATS.chrome) return 'departure';
	return 'journey';
}

function hasPlayedThisSession(): boolean {
	try {
		return sessionStorage.getItem(SESSION_KEY) === '1';
	} catch {
		return false;
	}
}

function markPlayed(): void {
	try {
		sessionStorage.setItem(SESSION_KEY, '1');
	} catch {
		// Storage unavailable (private mode): the next visit simply plays the intro again
	}
}

/** Mirrors the first-paint check in app.html, plus conditions only known once mounted. */
function shouldGate(): boolean {
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
	if (hasPlayedThisSession()) return false;
	if (window.scrollY > 1) return false;
	const hash = decodeURIComponent(window.location.hash.slice(1));
	return !(hash && document.getElementById(hash));
}

/** Gestures over the top bar (chapter menu / telemetry drawer) scroll their own panels. */
function isOwnScrollRegion(target: EventTarget | null): boolean {
	return target instanceof Element && target.closest('header') !== null;
}

let activeSkip: (() => void) | null = null;

/** Skips a locked intro at once (no-op when no gate is locked). */
export function skipIntro(): void {
	activeSkip?.();
}

export interface IntroGateOptions {
	/** The landing content. Pinned in place while locked, so nothing on the page can move. */
	stage: HTMLElement;
	/** Called once the page is free to scroll: at release, or immediately if there is no gate. */
	onRelease: () => void;
}

/**
 * Runs the intro gate for the landing page. Returns a teardown for unmount; a gate still locked
 * at teardown unpins without counting the intro as played.
 */
export function startIntroGate({ stage, onRelease }: IntroGateOptions): () => void {
	const root = document.documentElement;
	let time = 0;

	const publish = (seconds: number) => {
		time = seconds;
		root.style.setProperty('--intro-s', seconds.toFixed(3));
		introTimeStore.set(seconds);
		introPhaseStore.set(phaseAt(seconds));
	};

	const complete = () => {
		time = INTRO_BEATS.end;
		root.style.removeProperty('--intro-s');
		introTimeStore.set(INTRO_BEATS.end);
		introPhaseStore.set('journey');
	};

	if (!shouldGate()) {
		// Post-intro from the first frame: no title rise, Earth on station, chrome online
		root.dataset.introPlayed = 'true';
		complete();
		introSkipStore.set(false);
		onRelease();
		return () => {};
	}

	// ---------------------------------------------------------------------------------------------
	// Lock: pin the stage where it sits and keep the document's height with a spacer, so the native
	// scrollbar stays visible and draggable while the content cannot move
	// ---------------------------------------------------------------------------------------------
	window.scrollTo({ top: 0, behavior: 'instant' });
	const spacer = document.createElement('div');
	spacer.setAttribute('aria-hidden', 'true');
	const syncSpacer = () => {
		spacer.style.height = `${stage.offsetHeight}px`;
	};
	stage.style.position = 'fixed';
	stage.style.top = '0';
	stage.style.left = '0';
	stage.style.right = '0';
	stage.after(spacer);
	syncSpacer();
	const resizeObserver = new ResizeObserver(syncSpacer);
	resizeObserver.observe(stage);

	const unpin = () => {
		resizeObserver.disconnect();
		spacer.remove();
		stage.style.removeProperty('position');
		stage.style.removeProperty('top');
		stage.style.removeProperty('left');
		stage.style.removeProperty('right');
	};

	publish(0);

	// ---------------------------------------------------------------------------------------------
	// Input: every gesture becomes a requested timeline position; the frame loop moves toward it
	// no faster than MAX_SCRUB_RATE× natural speed
	// ---------------------------------------------------------------------------------------------
	const startedAt = performance.now();
	let goal = 0;
	let lastInputAt: number | null = null;
	let touchY: number | null = null;

	const requestScrub = (px: number) => {
		if (px === 0) return;
		// Scrub onward from wherever the intro already is (auto-advance may have moved past the goal)
		const from = px > 0 ? Math.max(goal, time) : Math.min(goal, time);
		// One viewport of scroll scrubs the whole timeline
		const pxPerSecond = (Math.max(1, window.innerHeight) * VIEWPORTS_PER_INTRO) / INTRO_BEATS.end;
		goal = clamp(from + px / pxPerSecond, 0, INTRO_BEATS.end);
		lastInputAt = performance.now();
	};

	const requestPosition = (seconds: number) => {
		goal = seconds;
		lastInputAt = performance.now();
	};

	const handleWheel = (event: WheelEvent) => {
		if (event.ctrlKey || isOwnScrollRegion(event.target)) return;
		event.preventDefault();
		const unit =
			event.deltaMode === WheelEvent.DOM_DELTA_LINE
				? 16
				: event.deltaMode === WheelEvent.DOM_DELTA_PAGE
					? window.innerHeight
					: 1;
		requestScrub(event.deltaY * unit);
	};

	const handleTouchStart = (event: TouchEvent) => {
		touchY = event.touches.length === 1 ? event.touches[0].clientY : null;
	};

	const handleTouchMove = (event: TouchEvent) => {
		// Two fingers is a pinch-zoom: never block it
		if (touchY === null || event.touches.length !== 1 || isOwnScrollRegion(event.target)) return;
		if (event.cancelable) event.preventDefault();
		const y = event.touches[0].clientY;
		requestScrub(touchY - y);
		touchY = y;
	};

	const handleTouchEnd = () => {
		touchY = null;
	};

	const handleKeydown = (event: KeyboardEvent) => {
		if (event.key === 'Escape') {
			skip();
			return;
		}
		if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
		const target = event.target;
		const isTextEntry =
			target instanceof HTMLElement &&
			(target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
		if (isTextEntry || isOwnScrollRegion(target)) return;
		// Space on a focused control activates it
		if (event.key === ' ' && target instanceof Element && target.closest('button, a'))
			return;
		const vh = window.innerHeight;
		if (event.key === 'End') requestPosition(INTRO_BEATS.end);
		else if (event.key === 'Home') requestPosition(0);
		else if (event.key === ' ') requestScrub((event.shiftKey ? -0.875 : 0.875) * vh);
		else if (event.key in KEY_SCRUB_VIEWPORTS) requestScrub(KEY_SCRUB_VIEWPORTS[event.key] * vh);
		else return;
		event.preventDefault();
	};

	// Scrollbar drags, middle-click autoscroll, find-in-page: the pinned stage cannot move, so the
	// offset is read as scrub input and returned to the top
	const handleScroll = () => {
		const y = window.scrollY;
		if (y === 0) return;
		requestScrub(y);
		window.scrollTo({ top: 0, behavior: 'instant' });
	};

	// Keyboard focus leaving the hero (Tab into the chapters) skips, then shows the focused element
	const handleFocusIn = (event: FocusEvent) => {
		const target = event.target;
		if (!(target instanceof Element) || !stage.contains(target) || target.closest('#hero')) return;
		skip();
		target.scrollIntoView({ block: 'center' });
	};

	window.addEventListener('wheel', handleWheel, { passive: false });
	window.addEventListener('touchstart', handleTouchStart, { passive: true });
	window.addEventListener('touchmove', handleTouchMove, { passive: false });
	window.addEventListener('touchend', handleTouchEnd, { passive: true });
	window.addEventListener('touchcancel', handleTouchEnd, { passive: true });
	window.addEventListener('keydown', handleKeydown);
	window.addEventListener('scroll', handleScroll, { passive: true });
	document.addEventListener('focusin', handleFocusIn);

	const detachInput = () => {
		window.removeEventListener('wheel', handleWheel);
		window.removeEventListener('touchstart', handleTouchStart);
		window.removeEventListener('touchmove', handleTouchMove);
		window.removeEventListener('touchend', handleTouchEnd);
		window.removeEventListener('touchcancel', handleTouchEnd);
		window.removeEventListener('keydown', handleKeydown);
		window.removeEventListener('scroll', handleScroll);
		document.removeEventListener('focusin', handleFocusIn);
	};

	// ---------------------------------------------------------------------------------------------
	// Release: unpin in place (scroll is 0, so nothing moves or re-lays out), then hand off
	// ---------------------------------------------------------------------------------------------
	let rafId = 0;
	let locked = true;

	const release = () => {
		locked = false;
		activeSkip = null;
		detachInput();
		unpin();
		markPlayed();
		introSkipStore.set(false);
		onRelease();
	};

	let prev = startedAt;
	let skipOnOffer = false;
	const frame = (now: number) => {
		const dt = Math.min(0.1, Math.max(0, (now - prev) / 1000));
		prev = now;

		const idle =
			lastInputAt === null ? now - startedAt >= IDLE_START_MS : now - lastInputAt >= IDLE_RESUME_MS;
		if (idle && goal <= time) goal = Math.min(INTRO_BEATS.end, time + IDLE_RATE * dt);

		const maxStep = MAX_SCRUB_RATE * dt;
		const next = time + clamp(goal - time, -maxStep, maxStep);
		if (next !== time) publish(next);

		const skipAvailable = now - startedAt >= SKIP_AFFORDANCE_MS && time < INTRO_BEATS.chrome;
		if (skipAvailable !== skipOnOffer) {
			skipOnOffer = skipAvailable;
			introSkipStore.set(skipAvailable);
		}

		if (time >= INTRO_BEATS.end) {
			rafId = 0;
			release();
			complete();
			return;
		}
		rafId = window.requestAnimationFrame(frame);
	};
	rafId = window.requestAnimationFrame(frame);

	// Skipping frees the page at once; the remaining beats finish quickly on their own
	const skip = () => {
		if (!locked) return;
		window.cancelAnimationFrame(rafId);
		release();
		const from = time;
		const startedFinish = performance.now();
		const finish = (now: number) => {
			const t = clamp((now - startedFinish) / 1000 / SKIP_FINISH_SECONDS, 0, 1);
			if (t >= 1) {
				rafId = 0;
				complete();
				return;
			}
			publish(from + (INTRO_BEATS.end - from) * t);
			rafId = window.requestAnimationFrame(finish);
		};
		rafId = window.requestAnimationFrame(finish);
	};
	activeSkip = skip;

	return () => {
		window.cancelAnimationFrame(rafId);
		if (locked) {
			locked = false;
			activeSkip = null;
			detachInput();
			unpin();
			introSkipStore.set(false);
		}
		complete();
	};
}

import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { writable, type Writable } from 'svelte/store';
import { skipIntro } from '$lib/stores/introSequence';

/**
 * Landing scroll weight — mass, not brakes.
 *
 * Lenis gives wheel input inertia (lerp 0.1 ≈ 6/s, about 115 ms to half of each step) and a
 * finger-exact touch drag with a light release glide. The scrollbar, keyboard, find-in-page and
 * text selection stay native: Lenis re-syncs to any scroll it did not make. Everything scrubbed
 * by scroll (camera, parallax, finale pull-back) then trails the smoothed scroll with
 * SCRUB_CATCH_UP_RATE, so a flick settles in ~0.9 s end to end, while the camera also has a speed
 * ceiling (StarfieldCanvas). In-page navigation bypasses all of it as a short eased fly-through.
 *
 * Reduced motion: no Lenis, no fly-throughs (jumps are instant), and scrubs follow scroll exactly.
 */

/**
 * Catch-up rate (1/s) for scroll-scrubbed motion behind the Lenis-smoothed scroll. Stacked on
 * Lenis it reaches half of a step in ~0.3 s and 95 % in ~0.9 s.
 */
export const SCRUB_CATCH_UP_RATE = 5;

/** Frame-rate independent catch-up of a scrubbed value toward its scroll-driven target. */
export function scrubToward(
	current: number,
	target: number,
	dt: number,
	rate: number = SCRUB_CATCH_UP_RATE
): number {
	return current + (target - current) * (1 - Math.exp(-dt * rate));
}

let reducedMotionQuery: MediaQueryList | null = null;

/** Live reduced-motion preference; cheap enough to read every frame (one cached query). */
export function prefersReducedMotion(): boolean {
	reducedMotionQuery ??= window.matchMedia('(prefers-reduced-motion: reduce)');
	return reducedMotionQuery.matches;
}

/** True during a fly-through: the camera lifts its speed cap so it arrives with the page. */
export const fastTravelStore: Writable<boolean> = writable<boolean>(false);

const LENIS_OPTIONS = {
	/** Weight, not lag: each wheel step eases in over ~0.5 s. */
	lerp: 0.1,
	wheelMultiplier: 0.9,
	smoothWheel: true,
	/** Touch drag follows the finger 1:1; only the release glide is smoothed, and lightly. */
	syncTouch: true,
	syncTouchLerp: 0.1,
	autoRaf: false
} as const;

/** Fly-through length: short hops stay brief, the whole journey still lands inside 2.4 s. */
const FLY_MIN_SECONDS = 0.9;
const FLY_MAX_SECONDS = 2.4;
const FLY_SECONDS_PER_VIEWPORT = 0.05;

/** Default lag smoothing restored when leaving the landing page (gsap.ticker defaults). */
const GSAP_LAG_THRESHOLD = 500;
const GSAP_LAG_ADJUSTED = 33;

let lenis: Lenis | null = null;
let fastTravelTimer = 0;

/**
 * Starts weighted scrolling for the landing page: Lenis driven by gsap.ticker, with ScrollTrigger
 * updated from Lenis. Returns a teardown for unmount.
 */
export function startLandingScroll(): () => void {
	gsap.registerPlugin(ScrollTrigger);
	if (prefersReducedMotion()) {
		ScrollTrigger.refresh();
		return () => {};
	}

	const instance = new Lenis(LENIS_OPTIONS);
	lenis = instance;
	instance.on('scroll', ScrollTrigger.update);
	const tick = (time: number) => instance.raf(time * 1000);
	gsap.ticker.add(tick);
	gsap.ticker.lagSmoothing(0);
	ScrollTrigger.refresh();

	return () => {
		gsap.ticker.remove(tick);
		gsap.ticker.lagSmoothing(GSAP_LAG_THRESHOLD, GSAP_LAG_ADJUSTED);
		window.clearTimeout(fastTravelTimer);
		fastTravelStore.set(false);
		instance.destroy();
		if (lenis === instance) lenis = null;
	};
}

/**
 * Scrolls to a document offset. On the landing page this skips a locked intro and flies there:
 * a short eased fast-travel the camera keeps up with. Elsewhere it is a native smooth scroll;
 * with reduced motion it is always an instant jump.
 */
export function scrollToPosition(top: number): void {
	skipIntro();
	const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
	const target = Math.max(0, Math.min(maxScroll, top));

	if (prefersReducedMotion()) {
		window.scrollTo({ top: target, behavior: 'instant' });
		return;
	}
	if (!lenis) {
		window.scrollTo({ top: target, behavior: 'smooth' });
		return;
	}

	const distanceViewports = Math.abs(target - lenis.scroll) / Math.max(1, window.innerHeight);
	const duration = Math.min(
		FLY_MAX_SECONDS,
		FLY_MIN_SECONDS + distanceViewports * FLY_SECONDS_PER_VIEWPORT
	);
	fastTravelStore.set(true);
	window.clearTimeout(fastTravelTimer);
	// Cleared on a timer, not onComplete: user input that interrupts the flight never completes it
	fastTravelTimer = window.setTimeout(() => fastTravelStore.set(false), duration * 1000 + 250);
	lenis.scrollTo(target, {
		duration,
		easing: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
		force: true
	});
}

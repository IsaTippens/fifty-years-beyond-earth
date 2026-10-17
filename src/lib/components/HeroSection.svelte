<script lang="ts">
	import { onMount } from 'svelte';
	import { scrollToSection } from '$lib/stores/scrollTelemetry';
	import { introPhaseStore, startIntroSequence } from '$lib/stores/introSequence';

	// Exact UTC timestamp of Apollo-Soyuz orbital docking & handshake: July 17, 1975 16:09:00 UTC
	const ASTP_EPOCH_MS = Date.UTC(1975, 6, 17, 16, 9, 0);

	interface MissionClock {
		years: number;
		days: string;
		hours: string;
		minutes: string;
		seconds: string;
	}

	function computeMissionElapsed(nowMs: number): MissionClock {
		const elapsedMs = Math.max(0, nowMs - ASTP_EPOCH_MS);
		const totalSeconds = Math.floor(elapsedMs / 1000);

		const avgYearSeconds = 365.2425 * 86400;
		const years = Math.floor(totalSeconds / avgYearSeconds);
		const remAfterYears = totalSeconds - Math.floor(years * avgYearSeconds);

		const days = Math.floor(remAfterYears / 86400);
		const hours = Math.floor((remAfterYears % 86400) / 3600);
		const minutes = Math.floor((remAfterYears % 3600) / 60);
		const seconds = remAfterYears % 60;

		return {
			years,
			days: String(days).padStart(3, '0'),
			hours: String(hours).padStart(2, '0'),
			minutes: String(minutes).padStart(2, '0'),
			seconds: String(seconds).padStart(2, '0')
		};
	}

	let missionClock = $state<MissionClock>(computeMissionElapsed(Date.now()));

	// Subtle scroll-reactive parallax and fade over the 3D Rayleigh Earth horizon, in viewport heights
	// scrolled (not whole-page progress, so the landing flight's length never retimes the hero)
	let heroScrollViewports = $state(0);
	const heroParallaxY = $derived(Math.min(180, heroScrollViewports * 66));
	const heroOpacity = $derived(Math.max(0, 1 - heroScrollViewports * 0.53));

	// Intro staging: Earth (and its archival airglow) arrives on departure; chrome waits for the journey
	const earthArrived = $derived($introPhaseStore !== 'void');
	const chromeHidden = $derived($introPhaseStore !== 'journey');

	onMount(() => {
		const stopIntroSequence = startIntroSequence();
		const clockInterval = window.setInterval(() => {
			missionClock = computeMissionElapsed(Date.now());
		}, 1000);

		let rafId = 0;
		const syncHeroScroll = () => {
			rafId = 0;
			heroScrollViewports = window.scrollY / Math.max(1, window.innerHeight);
		};
		const scheduleHeroScroll = () => {
			if (rafId === 0) rafId = window.requestAnimationFrame(syncHeroScroll);
		};
		syncHeroScroll();
		window.addEventListener('scroll', scheduleHeroScroll, { passive: true });
		window.addEventListener('resize', scheduleHeroScroll, { passive: true });

		return () => {
			stopIntroSequence();
			window.clearInterval(clockInterval);
			if (rafId !== 0) window.cancelAnimationFrame(rafId);
			window.removeEventListener('scroll', scheduleHeroScroll);
			window.removeEventListener('resize', scheduleHeroScroll);
		};
	});
</script>

<section
	id="hero"
	class="relative min-h-svh md:min-h-screen w-full overflow-hidden pt-20 pb-8 md:pt-28 md:pb-16 flex flex-col justify-between"
	aria-label="Fifty Years Beyond Earth Hero Opener"
>
	<!-- Subtle Archival Airglow Whisper + Localized Left Scrim — arrives with Earth on departure -->
	<div
		class="intro-arrival hero-airglow pointer-events-none absolute inset-0 z-0 overflow-hidden"
		data-arrived={earthArrived}
		aria-hidden="true"
	>
		<picture class="block h-full w-full">
			<source
				type="image/avif"
				srcset="/assets/chapters/iss-earth-limb-800.avif 800w, /assets/chapters/iss-earth-limb-1600.avif 1600w, /assets/chapters/iss-earth-limb-2400.avif 2400w"
				sizes="100vw"
			/>
			<source
				type="image/webp"
				srcset="/assets/chapters/iss-earth-limb-800.webp 800w, /assets/chapters/iss-earth-limb-1600.webp 1600w, /assets/chapters/iss-earth-limb-2400.webp 2400w"
				sizes="100vw"
			/>
			<img
				src="/assets/chapters/iss-earth-limb-1600.webp"
				alt="Earth's atmospheric limb and airglow at orbital sunset photographed from the International Space Station"
				fetchpriority="high"
				decoding="async"
				class="hero-ken-burns h-full w-full object-cover object-center opacity-22 mix-blend-screen"
				style="filter: saturate(0.88) contrast(1.12) brightness(1.05);"
			/>
		</picture>
		<!-- Localized Left-Side Typography Scrim leaving Right/Horizon Open for the 3D Earth Globe -->
		<div
			class="absolute inset-0"
			style="background: radial-gradient(ellipse 64% 72% at 26% 48%, rgba(5,6,7,0.82) 0%, rgba(5,6,7,0.42) 56%, rgba(5,6,7,0.06) 100%), linear-gradient(180deg, rgba(5,6,7,0.55) 0%, rgba(5,6,7,0.05) 45%, rgba(5,6,7,0.38) 100%);"
		></div>
	</div>

	<!-- Documentary Title Card with Vast Negative Space Over 3D Rayleigh Earth Horizon -->
	<div
		class="relative z-10 mx-auto max-w-[1320px] px-5 sm:px-10 lg:px-16 w-full my-auto"
		style={`transform: translate3d(0, ${-heroParallaxY * 0.16}px, 0); opacity: ${heroOpacity};`}
	>
		<!-- Quiet Tracked-Out Telemetry Eyebrow (fades in a beat after the title) -->
		<div class="line-reveal-mask mb-4 sm:mb-8">
			<p
				class="intro-eyebrow font-mono-tech text-[11px] tracking-[0.16em] uppercase text-[#E8E6E1] opacity-60"
			>
				1975 — 2026 · FIFTY YEARS OF HUMAN &amp; ROBOTIC EXPLORATION
			</p>
		</div>

		<!-- Massive Fraunces Display Title — State 0: arrives alone, slow masked line-by-line rise -->
		<h1
			class="font-display font-normal text-[#E8E6E1] text-[clamp(2.4rem,9.5vw,9rem)] leading-[0.94] tracking-[-0.032em]"
		>
			<span class="line-reveal-mask">
				<span class="intro-title-line intro-title-line--first">Fifty Years</span>
			</span>
			<span class="line-reveal-mask">
				<span class="intro-title-line intro-title-line--second">Beyond Earth</span>
			</span>
		</h1>

		<!-- Clean Inter Editorial Lead Paragraph Sitting Directly on the Void -->
		<div
			class="intro-stage intro-stage--rise intro-slot-subcopy mt-5 sm:mt-10"
			data-intro-hidden={chromeHidden}
		>
			<p
				class="font-sans text-base sm:text-lg md:text-xl max-w-[58ch] leading-[1.65] text-[#F2F0EC]/95"
				style="text-shadow: 0 1px 12px rgba(5, 6, 7, 0.96), 0 2px 24px rgba(5, 6, 7, 0.92);"
			>
				From a Cold War handshake <span class="text-[#C89B57]">222 kilometers</span> above the
				Atlantic to a lonely golden phonograph record racing past
				<span class="text-[#C89B57]">169.8 Astronomical Units</span> into the interstellar dark.
				Scroll to travel outward through half a century of human courage, robotic discovery, and the
				next fifty years on the cosmic frontier.
			</p>
		</div>

		<!-- State 1 Departure Cue, then the Quiet Typographic Scroll Invitation in the same slot -->
		<div class="relative mt-6 sm:mt-14">
			<div
				class="departure-cue"
				data-active={$introPhaseStore === 'departure'}
				data-testid="departure-cue"
				aria-hidden="true"
			>
				<span class="departure-cue__line"></span>
				<span
					class="departure-cue__label font-mono-tech text-[11px] sm:text-xs tracking-[0.16em] uppercase text-[#E8E6E1]/80"
				>
					Departure · Low Earth Orbit · <span class="text-[#C89B57]">222 km</span>
				</span>
			</div>
			<div class="intro-stage intro-stage--rise intro-slot-action" data-intro-hidden={chromeHidden}>
				<button
					type="button"
					onclick={() => scrollToSection('prologue')}
					class="font-mono-tech text-[11px] sm:text-xs tracking-[0.16em] uppercase text-[#E8E6E1]/70 hover:text-[#C89B57] transition-colors duration-700 cursor-pointer focus:outline-none"
				>
					↓ Begin Outward Journey · 222 km Low Earth Orbit
				</button>
			</div>
		</div>
	</div>

	<!-- Single Bottom Horizontal Hairline with 4 Borderless Editorial Index Metrics -->
	<div
		class="intro-stage intro-stage--rise intro-slot-stats relative z-10 mx-auto max-w-[1320px] px-5 sm:px-10 lg:px-16 w-full mt-8 md:mt-12"
		data-intro-hidden={chromeHidden}
	>
		<div
			class="border-t border-[#E8E6E1]/12 pt-4 md:pt-6 grid grid-cols-2 lg:grid-cols-4 gap-y-3 gap-x-4 md:gap-y-6 md:gap-x-8"
		>
			<div>
				<div class="font-mono-tech text-[11px] tracking-[0.16em] uppercase text-[#E8E6E1]/60">
					01 · VERIFIED ARCHIVE
				</div>
				<div class="mt-1.5 font-display text-xl sm:text-2xl text-[#E8E6E1] tracking-[-0.02em]">
					<span class="text-[#C89B57]">29</span> Milestones
				</div>
			</div>

			<div>
				<div class="font-mono-tech text-[11px] tracking-[0.16em] uppercase text-[#E8E6E1]/60">
					02 · SPATIAL SCALE
				</div>
				<div class="mt-1.5 font-display text-xl sm:text-2xl text-[#E8E6E1] tracking-[-0.02em]">
					<span class="text-[#C89B57]">340 AU</span> Span
				</div>
			</div>

			<div>
				<div class="font-mono-tech text-[11px] tracking-[0.16em] uppercase text-[#E8E6E1]/60">
					03 · CENSUS HORIZON
				</div>
				<div class="mt-1.5 font-display text-xl sm:text-2xl text-[#E8E6E1] tracking-[-0.02em]">
					<span class="text-[#C89B57]">6,445</span> Exoplanets
				</div>
			</div>

			<div>
				<div class="font-mono-tech text-[11px] tracking-[0.16em] uppercase text-[#E8E6E1]/60">
					04 · APOLLO–SOYUZ ELAPSED
				</div>
				<div class="mt-1.5 font-mono-tech text-sm sm:text-base text-[#C89B57] tracking-[0.06em]">
					T+ {missionClock.years}y {missionClock.days}d {missionClock.hours}:{missionClock.minutes}:{missionClock.seconds}
				</div>
			</div>
		</div>
	</div>
</section>

<style>
	@keyframes heroKenBurns {
		0% {
			transform: scale(1) translate3d(0, 0, 0);
		}
		100% {
			transform: scale(1.08) translate3d(-1.2%, -0.8%, 0);
		}
	}

	/* The airglow plate feathers into the scene below instead of ending on a hard edge */
	.hero-airglow {
		-webkit-mask-image: linear-gradient(180deg, #000 0%, #000 62%, transparent 100%);
		mask-image: linear-gradient(180deg, #000 0%, #000 62%, transparent 100%);
	}

	.hero-ken-burns {
		will-change: transform;
		animation: heroKenBurns 28s cubic-bezier(0.22, 1, 0.36, 1) infinite alternate;
	}

	/* State 0: the title arrives alone in a slow masked rise; the eyebrow follows a beat later */
	.intro-title-line {
		display: block;
		will-change: transform, opacity;
		animation: maskedLineRise 2.4s var(--ease-out-quint) both;
	}

	.intro-title-line--first {
		animation-delay: 0.5s;
	}

	.intro-title-line--second {
		animation-delay: 0.9s;
	}

	.intro-eyebrow {
		display: block;
		animation: maskedLineRise 1.6s var(--ease-out-quint) 2.7s both;
	}

	/* State 1: archival airglow arrives with Earth and retires with it on return to the void */
	.intro-arrival {
		opacity: 0;
		transition: opacity 1.6s var(--ease-in-out-cubic);
	}

	.intro-arrival[data-arrived='true'] {
		opacity: 1;
		transition: opacity 2.6s var(--ease-in-out-cubic);
	}

	/* State 1: departure cue — a hairline draws, the readout resolves, then the cue dissolves on its
	   own (~2s) so Earth finishes its arrival alone before mission control comes online */
	.departure-cue {
		position: absolute;
		top: 0;
		left: 0;
		display: inline-flex;
		flex-direction: column;
		gap: 0.65rem;
		white-space: nowrap;
		pointer-events: none;
		opacity: 0;
		text-shadow: 0 1px 10px rgba(5, 6, 7, 0.96);
		transition: opacity 0.5s var(--ease-in-out-cubic);
	}

	.departure-cue[data-active='true'] {
		animation: departureCueBeat 2s var(--ease-in-out-cubic) both;
	}

	@keyframes departureCueBeat {
		0% {
			opacity: 0;
		}
		6% {
			opacity: 1;
		}
		70% {
			opacity: 1;
		}
		100% {
			opacity: 0;
		}
	}

	.departure-cue__line {
		display: block;
		height: 1px;
		width: 100%;
		background: linear-gradient(90deg, rgba(200, 155, 87, 0.9), rgba(200, 155, 87, 0.12));
		transform: scaleX(0);
		transform-origin: left center;
		transition: transform 0s linear 0.5s;
	}

	.departure-cue[data-active='true'] .departure-cue__line {
		transform: scaleX(1);
		transition: transform 0.75s var(--ease-out-expo);
	}

	.departure-cue__label {
		display: block;
		opacity: 0;
		transform: translate3d(0, 6px, 0);
		transition:
			opacity 0s linear 0.5s,
			transform 0s linear 0.5s;
	}

	.departure-cue[data-active='true'] .departure-cue__label {
		opacity: 1;
		transform: none;
		transition:
			opacity 0.45s var(--ease-out-quint) 0.35s,
			transform 0.6s var(--ease-out-expo) 0.35s;
	}

	@keyframes introFadeOnly {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.hero-ken-burns {
			animation: none;
			transform: none;
		}

		.intro-title-line,
		.intro-eyebrow {
			animation-name: introFadeOnly;
		}

		.departure-cue__line,
		.departure-cue[data-active='true'] .departure-cue__line {
			transform: none;
		}

		.departure-cue__label,
		.departure-cue[data-active='true'] .departure-cue__label {
			transform: none;
		}
	}
</style>

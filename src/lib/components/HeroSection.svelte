<script lang="ts">
	import { onMount } from 'svelte';
	import { telemetryStore, scrollToSection } from '$lib/stores/scrollTelemetry';

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

	// Subtle scroll-reactive parallax and fade over the 3D Rayleigh Earth horizon
	const heroParallaxY = $derived(Math.min(180, $telemetryStore.scrollProgress * 650));
	const heroOpacity = $derived(Math.max(0, 1 - $telemetryStore.scrollProgress * 5.2));

	onMount(() => {
		const clockInterval = window.setInterval(() => {
			missionClock = computeMissionElapsed(Date.now());
		}, 1000);

		return () => {
			window.clearInterval(clockInterval);
		};
	});
</script>

<section
	id="hero"
	class="relative min-h-[78vh] md:min-h-screen w-full overflow-hidden pt-16 pb-8 md:pt-28 md:pb-16 flex flex-col justify-between"
	aria-label="Fifty Years Beyond Earth Hero Opener"
>
	<!-- Subtle Full-Bleed Archival Photograph Backdrop (ISS Earth Limb at Orbital Sunset) -->
	<div class="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
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
				class="hero-ken-burns h-full w-full object-cover object-center opacity-28 mix-blend-screen"
				style="filter: grayscale(28%) contrast(1.08);"
			/>
		</picture>
		<!-- Multi-Stop Dark Documentary Gradient Scrim -->
		<div
			class="absolute inset-0"
			style="background: linear-gradient(180deg, rgba(5,6,7,0.88) 0%, rgba(5,6,7,0.52) 45%, rgba(5,6,7,0.92) 100%);"
		></div>
	</div>

	<!-- Documentary Title Card with Vast Negative Space Over 3D Rayleigh Earth Horizon -->
	<div
		class="relative z-10 mx-auto max-w-[1320px] px-5 sm:px-10 lg:px-16 w-full my-auto"
		style={`transform: translate3d(0, ${-heroParallaxY * 0.16}px, 0); opacity: ${heroOpacity};`}
	>
		<!-- Quiet Tracked-Out Telemetry Eyebrow -->
		<div class="line-reveal-mask mb-4 sm:mb-8">
			<p
				class="line-reveal-expo font-mono-tech text-[11px] tracking-[0.16em] uppercase text-[#E8E6E1] opacity-60"
			>
				1975 — 2026 · FIFTY YEARS OF HUMAN &amp; ROBOTIC EXPLORATION
			</p>
		</div>

		<!-- Massive Fraunces Display Title with Masked Line-by-Line Rise Reveal -->
		<h1
			class="font-display font-normal text-[#E8E6E1] text-[clamp(2.4rem,9.5vw,9rem)] leading-[0.94] tracking-[-0.032em]"
		>
			<span class="line-reveal-mask">
				<span
					class="block will-change-transform animate-[maskedLineRise_1s_cubic-bezier(0.16,1,0.3,1)_0.08s_both]"
				>
					Fifty Years
				</span>
			</span>
			<span class="line-reveal-mask">
				<span
					class="block will-change-transform animate-[maskedLineRise_1s_cubic-bezier(0.16,1,0.3,1)_0.22s_both]"
				>
					Beyond Earth
				</span>
			</span>
		</h1>

		<!-- Clean Inter Editorial Lead Paragraph Sitting Directly on the Void -->
		<div class="line-reveal-mask mt-5 sm:mt-10">
			<p
				class="font-sans text-base sm:text-lg md:text-xl max-w-[58ch] leading-[1.65] text-[#E8E6E1]/80 animate-[maskedLineRise_1s_cubic-bezier(0.16,1,0.3,1)_0.36s_both]"
			>
				From a Cold War handshake <span class="text-[#C89B57]">222 kilometers</span> above the
				Atlantic to a lonely golden phonograph record racing past
				<span class="text-[#C89B57]">169.8 Astronomical Units</span> into the interstellar dark.
				Scroll to travel outward through half a century of human courage, robotic discovery, and the
				next fifty years on the cosmic frontier.
			</p>
		</div>

		<!-- Quiet Typographic Scroll Invitation -->
		<div class="mt-6 sm:mt-14">
			<button
				type="button"
				onclick={() => scrollToSection('prologue')}
				class="font-mono-tech text-[11px] sm:text-xs tracking-[0.16em] uppercase text-[#E8E6E1]/70 hover:text-[#C89B57] transition-colors duration-700 cursor-pointer focus:outline-none"
			>
				↓ Begin Outward Journey · 222 km Low Earth Orbit
			</button>
		</div>
	</div>

	<!-- Single Bottom Horizontal Hairline with 4 Borderless Editorial Index Metrics -->
	<div class="relative z-10 mx-auto max-w-[1320px] px-5 sm:px-10 lg:px-16 w-full mt-8 md:mt-12">
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

	.hero-ken-burns {
		will-change: transform;
		animation: heroKenBurns 28s cubic-bezier(0.22, 1, 0.36, 1) infinite alternate;
	}

	@media (prefers-reduced-motion: reduce) {
		.hero-ken-burns {
			animation: none;
			transform: none;
		}
	}
</style>

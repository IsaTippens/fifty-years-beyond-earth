<script lang="ts">
	import { onMount } from 'svelte';
	import {
		telemetryStore,
		CHAPTER_SCROLL_ANCHORS,
		startLiveVoyagerTicker,
		updateScrollTelemetry,
		scrollToSection
	} from '$lib/stores/scrollTelemetry';

	interface RailBenchmark {
		id: string;
		label: string;
		progress: number;
		targetId: string;
	}

	// At most 3 quiet labels on the right-edge spatial scale rail
	const RAIL_BENCHMARKS: RailBenchmark[] = [
		{
			id: 'leo',
			label: 'LEO · 222 KM',
			progress: 0.0,
			targetId: 'prologue'
		},
		{
			id: 'heliopause',
			label: 'HELIOPAUSE · 122 AU',
			progress: 0.54,
			targetId: 'voyager-heliopause-2012'
		},
		{
			id: 'horizon-2075',
			label: 'HORIZON · 340 AU',
			progress: 1.0,
			targetId: 'epilogue'
		}
	];

	let telemetryDrawerOpen = $state(false);

	const activeChapterMeta = $derived(
		CHAPTER_SCROLL_ANCHORS.find((c) => c.chapterId === $telemetryStore.activeChapterId) ??
			CHAPTER_SCROLL_ANCHORS[0]
	);

	const formattedAu = $derived.by(() => {
		const au = $telemetryStore.voyagerDistanceAu;
		if (au < 1) {
			return au.toFixed(6);
		}
		return au.toFixed(4);
	});

	const formattedKmSplit = $derived.by(() => {
		const km = $telemetryStore.voyagerDistanceKm;
		const wholeKm = Math.floor(km);
		const fracKm = Math.floor((km - wholeKm) * 100);
		return {
			whole: wholeKm.toLocaleString('en-US'),
			frac: String(fracKm).padStart(2, '0')
		};
	});

	// Signal bar percentage: -95 dBm -> 100%, -162 dBm -> 8%
	const signalStrengthPct = $derived(
		Math.max(8, Math.min(100, (($telemetryStore.signalPowerDbm + 164) / 69) * 100))
	);

	// RTG output percentage: 470 W -> 100%, 0 W -> 0%
	const rtgOutputPct = $derived(
		Math.max(10, Math.min(100, ($telemetryStore.rtgPowerWatts / 470) * 100))
	);

	let scrollRafId = 0;

	function syncScrollTelemetryNow() {
		scrollRafId = 0;
		if (typeof window === 'undefined' || typeof document === 'undefined') return;

		const docHeight = Math.max(
			1,
			document.documentElement.scrollHeight - window.innerHeight
		);
		const rawProgress = Math.max(0, Math.min(1, window.scrollY / docHeight));

		let detectedChapterId: string | undefined;
		let detectedMilestoneId: string | undefined;
		const viewportAnchorY = window.innerHeight * 0.38;

		const chapterEls = document.querySelectorAll<HTMLElement>('[data-chapter-id]');
		for (const el of chapterEls) {
			const rect = el.getBoundingClientRect();
			if (rect.top <= viewportAnchorY && rect.bottom >= 80) {
				detectedChapterId = el.dataset.chapterId;
				break;
			}
		}

		const milestoneEls = document.querySelectorAll<HTMLElement>('[data-milestone-id]');
		for (const el of milestoneEls) {
			const rect = el.getBoundingClientRect();
			if (rect.top <= viewportAnchorY && rect.bottom >= 60) {
				detectedMilestoneId = el.dataset.milestoneId;
				break;
			}
		}

		updateScrollTelemetry(rawProgress, detectedChapterId, detectedMilestoneId);
	}

	function handleScrollSync() {
		if (scrollRafId !== 0 || typeof window === 'undefined') return;
		scrollRafId = window.requestAnimationFrame(syncScrollTelemetryNow);
	}

	function jumpToTarget(targetId: string, fallbackProgress?: number) {
		telemetryDrawerOpen = false;
		const cleanId = targetId.replace(/^#/, '');
		const el =
			document.getElementById(cleanId) ??
			document.getElementById(`chapter-${cleanId}`) ??
			document.querySelector<HTMLElement>(`[data-chapter-id="${cleanId}"]`) ??
			document.querySelector<HTMLElement>(`[data-milestone-id="${cleanId}"]`);

		if (el) {
			scrollToSection(cleanId);
		} else if (typeof fallbackProgress === 'number' && typeof window !== 'undefined') {
			const docHeight = Math.max(
				1,
				document.documentElement.scrollHeight - window.innerHeight
			);
			window.scrollTo({
				top: fallbackProgress * docHeight,
				behavior: 'smooth'
			});
		} else {
			scrollToSection(cleanId);
		}
	}

	onMount(() => {
		const stopTicker = startLiveVoyagerTicker();
		syncScrollTelemetryNow();
		window.addEventListener('scroll', handleScrollSync, { passive: true });
		window.addEventListener('resize', handleScrollSync, { passive: true });

		return () => {
			stopTicker();
			if (scrollRafId !== 0) {
				window.cancelAnimationFrame(scrollRafId);
				scrollRafId = 0;
			}
			window.removeEventListener('scroll', handleScrollSync);
			window.removeEventListener('resize', handleScrollSync);
		};
	});
</script>

<!-- BORDERLESS, QUIET DOCUMENTARY TOP BAR (CHROME DIET) -->
<header
	class="fixed top-0 left-0 right-0 z-40 bg-gradient-to-b from-[#050607] via-[#050607]/90 to-transparent"
	aria-label="Voyager 1 Deep Space Network Live Telemetry HUD"
>
	<div class="mx-auto max-w-[1440px] px-3 sm:px-8 lg:px-12">
		<div
			class="flex items-center justify-between gap-2 sm:gap-4 h-12 sm:h-13 font-mono-tech text-[10px] sm:text-[11px] tracking-[0.10em] sm:tracking-[0.16em] uppercase opacity-75 hover:opacity-100 focus-within:opacity-100 transition-opacity duration-700"
			class:opacity-100={telemetryDrawerOpen}
		>
			<!-- 1. Wordmark Button -->
			<button
				type="button"
				onclick={() => {
					telemetryDrawerOpen = false;
					window.scrollTo({ top: 0, behavior: 'smooth' });
				}}
				class="text-left text-[#E8E6E1] hover:text-[#C89B57] transition-colors duration-500 cursor-pointer focus:outline-none shrink-0"
				title="Return to Low Earth Orbit (222 km)"
			>
				FIFTY YEARS BEYOND EARTH
			</button>

			<!-- 2. Active Chapter Indicator (Desktop) -->
			<div class="hidden lg:block text-[#E8E6E1]/72 truncate text-center">
				{activeChapterMeta.chapterNumber} — {activeChapterMeta.title.toUpperCase()}
			</div>

			<!-- 3. Spatial Scale Readout (folded into mobile top bar) + Live Voyager Readout + [TELEMETRY +] Drawer Toggle -->
			<div class="flex items-center gap-2.5 sm:gap-5 min-w-0">
				<span
					class="lg:hidden text-[#C89B57] truncate max-w-[115px] sm:max-w-[220px]"
					data-testid="mobile-spatial-scale-readout"
					title={$telemetryStore.cameraAltitudeFormatted}
				>
					{$telemetryStore.cameraAltitudeFormatted}
				</span>

				<span class="hidden lg:inline text-[#E8E6E1]/72 shrink-0">
					VOYAGER 1 · <span class="text-[#C89B57]">{formattedAu}</span> AU · <span class="text-[#E8E6E1]/60">{$telemetryStore.cameraAltitudeFormatted}</span>
				</span>

				<button
					type="button"
					onclick={() => (telemetryDrawerOpen = !telemetryDrawerOpen)}
					aria-expanded={telemetryDrawerOpen}
					aria-controls="voyager-telemetry-drawer"
					class="text-[#E8E6E1]/85 hover:text-[#C89B57] transition-colors duration-500 cursor-pointer focus:outline-none shrink-0"
				>
					{telemetryDrawerOpen ? '[TELEMETRY −]' : '[TELEMETRY +]'}
				</button>
			</div>
		</div>
	</div>

	<!-- SINGLE COLLAPSIBLE TELEMETRY & INDEX DRAWER -->
	{#if telemetryDrawerOpen}
		<div
			id="voyager-telemetry-drawer"
			class="bg-[#090A0C]/95 backdrop-blur-md border-t border-b border-[#E8E6E1]/10 transition-all duration-700"
		>
			<div class="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12 py-4 sm:py-6 space-y-5">
				<!-- Live Voyager 1 Telemetry Strip -->
				<div
					class="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pb-4 sm:pb-6 border-b border-[#E8E6E1]/10 font-mono-tech"
				>
					<!-- Heliocentric Odometer -->
					<div class="space-y-1">
						<div class="text-[11px] tracking-[0.16em] uppercase text-[#E8E6E1]/60">
							HELIOCENTRIC ODOMETER · EPOCH {$telemetryStore.currentYear}
						</div>
						<div class="text-sm sm:text-base text-[#E8E6E1]">
							{formattedKmSplit.whole}<span class="text-[#C89B57]">.{formattedKmSplit.frac}</span>
							<span class="text-[11px] text-[#E8E6E1]/60">KM</span>
						</div>
						<div class="text-[11px] tracking-[0.12em] uppercase text-[#E8E6E1]/44">
							V∞ 16.9995 KM/S · {$telemetryStore.cameraAltitudeFormatted}
						</div>
					</div>

					<!-- One-Way Light Time (OWLT) -->
					<div class="space-y-1 sm:border-l sm:border-[#E8E6E1]/10 sm:pl-6">
						<div class="text-[11px] tracking-[0.16em] uppercase text-[#E8E6E1]/60">
							ONE-WAY LIGHT TIME (OWLT)
						</div>
						<div class="text-sm sm:text-base text-[#C89B57]">
							{$telemetryStore.voyagerLightHoursFormatted}
						</div>
						<div class="text-[11px] tracking-[0.12em] uppercase text-[#E8E6E1]/44">
							C = 299,792.458 KM/S
						</div>
					</div>

					<!-- Deep Space Network Signal (dBm) -->
					<div class="space-y-1.5 lg:border-l lg:border-[#E8E6E1]/10 lg:pl-6">
						<div class="flex items-center justify-between text-[11px] tracking-[0.16em] uppercase">
							<span class="text-[#E8E6E1]/60">DSN X-BAND DOWNLINK</span>
							<span class="text-[#E8E6E1]">{$telemetryStore.signalPowerDbm.toFixed(2)} dBm</span>
						</div>
						<div class="h-px w-full bg-[#E8E6E1]/14 overflow-hidden">
							<div
								class="h-full bg-[#C89B57] transition-all duration-500"
								style={`width: ${signalStrengthPct}%`}
							></div>
						</div>
						<div class="text-[11px] tracking-[0.12em] uppercase text-[#E8E6E1]/44">
							INVERSE-SQUARE ATTENUATION (8.4 GHZ)
						</div>
					</div>

					<!-- RTG Electrical Output (W) -->
					<div class="space-y-1.5 sm:border-l sm:border-[#E8E6E1]/10 sm:pl-6">
						<div class="flex items-center justify-between text-[11px] tracking-[0.16em] uppercase">
							<span class="text-[#E8E6E1]/60">3× MHW-RTG OUTPUT</span>
							<span class="text-[#C89B57]">{$telemetryStore.rtgPowerWatts.toFixed(1)} W</span>
						</div>
						<div class="h-px w-full bg-[#E8E6E1]/14 overflow-hidden">
							<div
								class="h-full bg-[#C89B57] transition-all duration-500"
								style={`width: ${rtgOutputPct}%`}
							></div>
						</div>
						<div class="text-[11px] tracking-[0.12em] uppercase text-[#E8E6E1]/44">
							PU-238 HALF-LIFE 87.7 YRS (470 W AT LAUNCH)
						</div>
					</div>
				</div>

				<!-- Chapter & Archive Navigation Index -->
				<div class="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
					<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 flex-1">
						{#each CHAPTER_SCROLL_ANCHORS as ch, idx}
							{@const isCurrent = $telemetryStore.activeChapterId === ch.chapterId}
							<button
								type="button"
								onclick={() => jumpToTarget(ch.chapterId, ch.startProgress)}
								class="group text-left border-t pt-2.5 transition-colors duration-500 cursor-pointer {isCurrent
									? 'border-[#C89B57]'
									: 'border-[#E8E6E1]/12 hover:border-[#E8E6E1]/40'}"
							>
								<div
									class="font-mono-tech text-[11px] tracking-[0.16em] uppercase {isCurrent
										? 'text-[#C89B57]'
										: 'text-[#E8E6E1]/50 group-hover:text-[#C89B57]'}"
								>
									0{idx + 1} · {ch.startYear}–{ch.endYear}
								</div>
								<div class="mt-1 font-sans text-xs text-[#E8E6E1] group-hover:text-[#C89B57] truncate">
									{ch.title}
								</div>
							</button>
						{/each}
					</div>

					<!-- Direct Section Links -->
					<div
						class="flex flex-wrap items-center gap-5 pt-4 lg:pt-0 border-t lg:border-t-0 border-[#E8E6E1]/10 font-mono-tech text-[11px] tracking-[0.16em] uppercase shrink-0"
					>
						<button
							type="button"
							onclick={() => jumpToTarget('decade-timeline')}
							class="text-[#E8E6E1]/72 hover:text-[#C89B57] transition-colors duration-500 cursor-pointer"
						>
							Decade Index
						</button>
						<button
							type="button"
							onclick={() => jumpToTarget('sources')}
							class="text-[#E8E6E1]/72 hover:text-[#C89B57] transition-colors duration-500 cursor-pointer"
						>
							Sources
						</button>
						<button
							type="button"
							onclick={() => jumpToTarget('ai-showcase')}
							class="text-[#C89B57] hover:text-[#DDB474] transition-colors duration-500 cursor-pointer"
						>
							AI Architecture
						</button>
					</div>
				</div>
			</div>
		</div>
	{/if}
</header>

<!-- WHISPER-THIN 1PX RIGHT-EDGE SPATIAL SCALE RAIL -->
<aside
	class="hidden lg:flex fixed right-6 top-24 bottom-12 z-30 flex-col items-end justify-between pointer-events-none select-none"
	aria-label="Logarithmic Spatial Distance Scale Rail"
>
	<div class="relative flex-1 w-40 pointer-events-auto">
		<!-- 1px Vertical Hairline Spine -->
		<div class="absolute right-0 top-0 bottom-0 w-px bg-[#E8E6E1]/14"></div>

		<!-- 5px Horizontal Chapter Tick Marks -->
		{#each CHAPTER_SCROLL_ANCHORS as ch, idx}
			{@const tickPos =
				idx === 0
					? 0
					: idx === CHAPTER_SCROLL_ANCHORS.length - 1
						? 1
						: ch.startProgress}
			{@const isActive = $telemetryStore.activeChapterId === ch.chapterId}
			<button
				type="button"
				onclick={() => jumpToTarget(ch.chapterId, ch.startProgress)}
				style={`top: ${(tickPos * 100).toFixed(2)}%`}
				aria-label={`Jump to ${ch.chapterNumber}: ${ch.title}`}
				title={`${ch.chapterNumber} — ${ch.title} (${ch.startYear}–${ch.endYear})`}
				class="absolute right-0 -translate-y-1/2 w-[5px] h-px transition-colors duration-500 cursor-pointer {isActive
					? 'bg-[#C89B57]'
					: 'bg-[#E8E6E1]/35 hover:bg-[#C89B57]'}"
			></button>
		{/each}

		<!-- At Most 3 Quiet Scale Labels: LEO (top), HELIOPAUSE (middle), HORIZON (bottom) -->
		{#each RAIL_BENCHMARKS as marker}
			<button
				type="button"
				onclick={() => jumpToTarget(marker.targetId, marker.progress)}
				style={`top: ${(marker.progress * 100).toFixed(2)}%`}
				class="absolute right-3 -translate-y-1/2 text-right font-mono-tech text-[11px] tracking-[0.16em] uppercase text-[#E8E6E1]/60 hover:text-[#C89B57] transition-colors duration-500 cursor-pointer focus:outline-none whitespace-nowrap"
			>
				{marker.label}
			</button>
		{/each}

		<!-- Subtle #C89B57 Active Progress Dot -->
		<div
			style={`top: ${($telemetryStore.scrollProgress * 100).toFixed(2)}%`}
			class="absolute right-0 translate-x-[2px] -translate-y-1/2 h-[5px] w-[5px] rounded-full bg-[#C89B57] pointer-events-none transition-all duration-300"
		></div>
	</div>
</aside>

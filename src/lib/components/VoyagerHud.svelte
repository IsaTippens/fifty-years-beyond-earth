<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import {
		telemetryStore,
		CHAPTER_SCROLL_ANCHORS,
		startLiveVoyagerTicker,
		updateScrollTelemetry,
		scrollToSection
	} from '$lib/stores/scrollTelemetry';
	import { CHAPTER_HIGHLIGHTS, getHighlightBySlug } from '$lib/data/highlights';

	interface RailBenchmark {
		id: string;
		label: string;
		progress: number;
		targetId: string;
	}

	// At most 3 quiet labels on the right-edge spatial scale rail (landing page only)
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
			progress: 0.43,
			targetId: 'ch3-long-reach'
		},
		{
			id: 'horizon-2075',
			label: 'HORIZON · 340 AU',
			progress: 1.0,
			targetId: 'epilogue'
		}
	];

	let telemetryDrawerOpen = $state(false);
	let chapterMenuOpen = $state(false);

	const currentPathname = $derived($page?.url?.pathname ?? '/');
	const isLandingPage = $derived(currentPathname === '/');
	const isColophonPage = $derived(currentPathname.startsWith('/colophon'));
	const subpageChapterHighlight = $derived.by(() => {
		if (!currentPathname.startsWith('/chapters/')) return null;
		const slug = currentPathname.replace('/chapters/', '').split('/')[0];
		return getHighlightBySlug(slug);
	});

	// Close menus on route change
	$effect(() => {
		currentPathname;
		telemetryDrawerOpen = false;
		chapterMenuOpen = false;
	});

	const activeChapterMeta = $derived(
		CHAPTER_SCROLL_ANCHORS.find((c) => c.chapterId === $telemetryStore.activeChapterId) ??
			CHAPTER_SCROLL_ANCHORS[0]
	);

	const formattedAu = $derived.by(() => {
		const au = $telemetryStore.voyagerDistanceAu;
		if (au < 0.1) {
			return au.toFixed(4);
		}
		return au.toFixed(1);
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
		chapterMenuOpen = false;
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

	function toggleChapterMenu() {
		chapterMenuOpen = !chapterMenuOpen;
		if (chapterMenuOpen) {
			telemetryDrawerOpen = false;
		}
	}

	function toggleTelemetryDrawer() {
		telemetryDrawerOpen = !telemetryDrawerOpen;
		if (telemetryDrawerOpen) {
			chapterMenuOpen = false;
		}
	}

	function handleWordmarkClick(e: MouseEvent) {
		telemetryDrawerOpen = false;
		chapterMenuOpen = false;
		if (isLandingPage && typeof window !== 'undefined') {
			e.preventDefault();
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	}

	onMount(() => {
		const stopTicker = startLiveVoyagerTicker();
		syncScrollTelemetryNow();
		window.addEventListener('scroll', handleScrollSync, { passive: true });
		window.addEventListener('resize', handleScrollSync, { passive: true });

		const handleKeydown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				chapterMenuOpen = false;
				telemetryDrawerOpen = false;
			}
		};
		window.addEventListener('keydown', handleKeydown);

		return () => {
			stopTicker();
			if (scrollRafId !== 0) {
				window.cancelAnimationFrame(scrollRafId);
				scrollRafId = 0;
			}
			window.removeEventListener('scroll', handleScrollSync);
			window.removeEventListener('resize', handleScrollSync);
			window.removeEventListener('keydown', handleKeydown);
		};
	});
</script>

<!-- BORDERLESS, QUIET DOCUMENTARY TOP BAR (CHROME DIET) -->
<header
	class="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-[#050607] via-[#050607]/92 to-transparent"
	aria-label="Fifty Years Beyond Earth Navigation & Telemetry HUD"
>
	<div class="mx-auto max-w-[1440px] px-3 sm:px-8 lg:px-12">
		<div
			class="flex flex-wrap sm:flex-nowrap items-center justify-between gap-x-2 gap-y-0.5 py-1.5 sm:py-0 min-h-11 sm:h-13 font-mono-tech text-[10px] sm:text-[11px] tracking-[0.06em] sm:tracking-[0.16em] uppercase opacity-85 hover:opacity-100 focus-within:opacity-100 transition-opacity duration-500"
			class:opacity-100={telemetryDrawerOpen || chapterMenuOpen}
		>
			<!-- 1. Wordmark Link (Returns Home) -->
			<a
				href="/"
				onclick={handleWordmarkClick}
				class="text-left text-[#E8E6E1] hover:text-[#C89B57] transition-colors duration-500 cursor-pointer focus:outline-none shrink-0"
				title="Return to Fifty Years Beyond Earth Home (Low Earth Orbit · 222 km)"
			>
				FIFTY YEARS BEYOND EARTH
			</a>

			<!-- 2. Active Context Indicator (Desktop) -->
			<div class="hidden lg:block text-[#E8E6E1]/75 text-center truncate px-4">
				{#if isLandingPage}
					{activeChapterMeta.chapterNumber} — {activeChapterMeta.title.toUpperCase()}
				{:else if subpageChapterHighlight}
					<span class="text-[#C89B57]">{subpageChapterHighlight.chapterNumber}</span>
					<span class="mx-1.5 text-[#E8E6E1]/35">·</span>
					<span>{subpageChapterHighlight.title.toUpperCase()}</span>
					<span class="mx-1.5 text-[#E8E6E1]/35">·</span>
					<span class="text-[#E8E6E1]/55">{subpageChapterHighlight.yearRange}</span>
				{:else if isColophonPage}
					<span class="text-[#C89B57]">COLOPHON &amp; ARCHIVE</span>
					<span class="mx-1.5 text-[#E8E6E1]/35">·</span>
					<span>SOURCES · ASSETS.MD · AI ARCHITECTURE</span>
				{/if}
			</div>

			<!-- 3. Route-Aware Controls: Chapter Menu Overlay + (Landing Only) Spatial Scale & Telemetry Drawer -->
			<div class="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-4 w-full sm:w-auto min-w-0">
				{#if isLandingPage}
					<span
						class="lg:hidden text-[#C89B57] whitespace-nowrap truncate"
						data-testid="mobile-spatial-scale-readout"
						title={$telemetryStore.cameraAltitudeFormatted}
					>
						{formattedAu} AU · <span class="text-[#E8E6E1]/70">{$telemetryStore.spatialRegionLabel}</span>
					</span>

					<span class="hidden lg:inline text-[#E8E6E1]/75 shrink-0 whitespace-nowrap">
						VOYAGER 1 · <span class="text-[#C89B57]">{formattedAu} AU</span> · <span class="text-[#E8E6E1]/68">{$telemetryStore.spatialRegionLabel}</span>
					</span>
				{:else}
					<a
						href="/"
						class="text-[#E8E6E1]/72 hover:text-[#C89B57] transition-colors duration-300 whitespace-nowrap"
					>
						← JOURNEY
					</a>
				{/if}

				<div class="flex items-center gap-2.5 sm:gap-4 shrink-0">
					<button
						type="button"
						data-testid="chapter-menu-toggle"
						onclick={toggleChapterMenu}
						aria-expanded={chapterMenuOpen}
						aria-controls="chapter-menu-overlay"
						class="text-[#E8E6E1]/90 hover:text-[#C89B57] transition-colors duration-300 cursor-pointer focus:outline-none shrink-0 whitespace-nowrap {chapterMenuOpen ? 'text-[#C89B57]' : ''}"
					>
						{chapterMenuOpen ? '[CHAPTERS −]' : '[CHAPTERS +]'}
					</button>

					{#if isLandingPage}
						<button
							type="button"
							data-testid="telemetry-drawer-toggle"
							onclick={toggleTelemetryDrawer}
							aria-expanded={telemetryDrawerOpen}
							aria-controls="voyager-telemetry-drawer"
							class="text-[#E8E6E1]/85 hover:text-[#C89B57] transition-colors duration-300 cursor-pointer focus:outline-none shrink-0 whitespace-nowrap {telemetryDrawerOpen ? 'text-[#C89B57]' : ''}"
						>
							{telemetryDrawerOpen ? '[TELEMETRY −]' : '[TELEMETRY +]'}
						</button>
					{:else}
						<a
							href="/colophon"
							class="hidden sm:inline transition-colors duration-300 whitespace-nowrap {isColophonPage
								? 'text-[#C89B57]'
								: 'text-[#E8E6E1]/75 hover:text-[#C89B57]'}"
						>
							COLOPHON
						</a>
					{/if}
				</div>
			</div>
		</div>
	</div>

	<!-- OVERLAY CHAPTER MENU INDEX (ALL 7 CHAPTERS + COLOPHON) -->
	{#if chapterMenuOpen}
		<nav
			id="chapter-menu-overlay"
			aria-label="Chapter & Colophon Directory"
			class="bg-[#07080A]/96 backdrop-blur-xl border-t border-b border-[#E8E6E1]/14 max-h-[calc(100vh-3.25rem)] overflow-y-auto transition-all duration-500"
		>
			<div class="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12 py-5 sm:py-8 space-y-6">
				<div class="flex flex-wrap items-baseline justify-between gap-3 border-b border-[#E8E6E1]/10 pb-3.5">
					<div class="font-mono-tech text-[11px] tracking-[0.16em] uppercase text-[#C89B57]">
						CHRONICLE DIRECTORY · 7 DEEP-DIVE CHAPTERS &amp; COLOPHON ARCHIVE
					</div>
					<div class="flex items-center gap-5 font-mono-tech text-[11px] tracking-[0.14em] uppercase">
						<a
							href="/"
							onclick={() => (chapterMenuOpen = false)}
							class="text-[#E8E6E1]/75 hover:text-[#C89B57] transition-colors duration-300"
						>
							{isLandingPage ? '↑ Top of Trailer Cut' : '← Return to Trailer Cut (/)'}
						</a>
						<button
							type="button"
							onclick={() => (chapterMenuOpen = false)}
							class="text-[#E8E6E1]/55 hover:text-[#E8E6E1] cursor-pointer"
						>
							[ESC · CLOSE]
						</button>
					</div>
				</div>

				<!-- 7 Chapters Deep-Dive Grid -->
				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
					{#each CHAPTER_HIGHLIGHTS as ch}
						{@const isActiveRoute =
							subpageChapterHighlight?.chapterId === ch.chapterId ||
							(isLandingPage && $telemetryStore.activeChapterId === ch.chapterId)}
						<a
							href={`/chapters/${ch.slug}`}
							onclick={() => (chapterMenuOpen = false)}
							class="group flex flex-col justify-between border p-3.5 sm:p-4 transition-colors duration-300 {isActiveRoute
								? 'border-[#C89B57] bg-[#C89B57]/[0.06]'
								: 'border-[#E8E6E1]/12 bg-[#050607]/70 hover:border-[#C89B57]/60 hover:bg-[#E8E6E1]/[0.02]'}"
						>
							<div>
								<div class="flex items-center justify-between gap-2 font-mono-tech text-[10px] tracking-[0.16em] uppercase">
									<span class={isActiveRoute ? 'text-[#C89B57]' : 'text-[#E8E6E1]/55 group-hover:text-[#C89B57]'}>
										{ch.indexNumber} · {ch.chapterNumber}
									</span>
									<span class="text-[#C89B57]">{ch.yearRange}</span>
								</div>
								<div class="mt-1.5 font-display text-lg sm:text-xl text-[#E8E6E1] group-hover:text-[#DDB474] transition-colors duration-300 leading-tight">
									{ch.title}
								</div>
								<p class="mt-1 font-sans text-xs text-[#E8E6E1]/62 line-clamp-2 leading-relaxed">
									{ch.subtitle}
								</p>
							</div>

							<div class="mt-3 pt-2.5 border-t border-[#E8E6E1]/10 flex items-center justify-between gap-2 font-mono-tech text-[10px] tracking-[0.14em] uppercase">
								<span class="text-[#E8E6E1]/50">{ch.milestoneCount} MILESTONES · {ch.killerStat.value}</span>
								<span class="text-[#C89B57] group-hover:translate-x-0.5 transition-transform duration-300">
									ENTER ↗
								</span>
							</div>
						</a>
					{/each}

					<!-- 8th Card: Colophon & Verification Archive -->
					<a
						href="/colophon"
						onclick={() => (chapterMenuOpen = false)}
						class="group flex flex-col justify-between border p-3.5 sm:p-4 transition-colors duration-300 {isColophonPage
							? 'border-[#C89B57] bg-[#C89B57]/[0.08]'
							: 'border-[#C89B57]/35 bg-[#08090B]/90 hover:border-[#C89B57] hover:bg-[#C89B57]/[0.05]'}"
					>
						<div>
							<div class="flex items-center justify-between gap-2 font-mono-tech text-[10px] tracking-[0.16em] uppercase">
								<span class="text-[#C89B57]">08 · COLOPHON</span>
								<span class="text-[#E8E6E1]/60">ARCHIVE &amp; SPEC</span>
							</div>
							<div class="mt-1.5 font-display text-lg sm:text-xl text-[#E8E6E1] group-hover:text-[#DDB474] transition-colors duration-300 leading-tight">
								Sources, Attributions &amp; AI Architecture
							</div>
							<p class="mt-1 font-sans text-xs text-[#E8E6E1]/65 leading-relaxed">
								Consolidated primary citations by chapter, full ASSETS.md provenance ledger, and the multi-agent AI engineering showcase.
							</p>
						</div>

						<div class="mt-3 pt-2.5 border-t border-[#E8E6E1]/10 flex items-center justify-between gap-2 font-mono-tech text-[10px] tracking-[0.14em] uppercase">
							<span class="text-[#E8E6E1]/55">SOURCES · ASSETS · AI DAG</span>
							<span class="text-[#C89B57] group-hover:translate-x-0.5 transition-transform duration-300">
								OPEN ↗
							</span>
						</div>
					</a>
				</div>
			</div>
		</nav>
	{/if}

	<!-- LANDING-ONLY COLLAPSIBLE TELEMETRY DRAWER -->
	{#if isLandingPage && telemetryDrawerOpen}
		<div
			id="voyager-telemetry-drawer"
			class="bg-[#090A0C]/95 backdrop-blur-md border-t border-b border-[#E8E6E1]/10 transition-all duration-500"
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
							V∞ 16.9995 KM/S · {$telemetryStore.spatialRegionLabel}
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

				<!-- Landing Trailer Beat Scrub + Deep-Dive Links -->
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
								<div class="mt-1 font-sans text-xs text-[#E8E6E1] group-hover:text-[#C89B57] leading-snug">
									{ch.title}
								</div>
							</button>
						{/each}
					</div>

					<!-- Direct Subpage & Finale Links -->
					<div
						class="flex flex-wrap items-center gap-5 pt-4 lg:pt-0 border-t lg:border-t-0 border-[#E8E6E1]/10 font-mono-tech text-[11px] tracking-[0.16em] uppercase shrink-0"
					>
						<button
							type="button"
							onclick={() => jumpToTarget('finale-pullback')}
							class="text-[#E8E6E1]/72 hover:text-[#C89B57] transition-colors duration-300 cursor-pointer"
						>
							Finale Pull-Back ↓
						</button>
						<a
							href="/colophon#sources"
							onclick={() => (telemetryDrawerOpen = false)}
							class="text-[#E8E6E1]/72 hover:text-[#C89B57] transition-colors duration-300"
						>
							Sources ↗
						</a>
						<a
							href="/colophon#ai-architecture"
							onclick={() => (telemetryDrawerOpen = false)}
							class="text-[#C89B57] hover:text-[#DDB474] transition-colors duration-300"
						>
							Colophon &amp; AI ↗
						</a>
					</div>
				</div>
			</div>
		</div>
	{/if}
</header>

<!-- WHISPER-THIN 1PX RIGHT-EDGE SPATIAL SCALE RAIL (LANDING PAGE ONLY) -->
{#if isLandingPage}
	<aside
		class="hidden lg:flex fixed right-6 top-24 bottom-12 z-30 flex-col items-end justify-between pointer-events-none select-none transition-opacity duration-500 {$telemetryStore.scrollProgress >
		0.76
			? 'opacity-0'
			: 'opacity-100'}"
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
{/if}

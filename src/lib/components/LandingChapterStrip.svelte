<script lang="ts">
	import { onMount } from 'svelte';
	import { CHAPTER_HIGHLIGHTS } from '$lib/data/highlights';
	import {
		journeyGapAfterChapterVh,
		journeyWaypointForChapter,
		syncLandingJourney
	} from '$lib/stores/landingJourney';
	import { prefersReducedMotion, scrubToward } from '$lib/stores/landingScroll';

	interface PanelMotion {
		/** Panel centre relative to viewport centre, in viewport heights (−1 … 1). */
		offset: number;
		/** Scrubbed entrance: 0 while the panel top sits at the viewport bottom, 1 once it has risen. */
		entry: number;
	}

	const ENTRY_RISE_VIEWPORT = 0.62;
	const STAGGER_STEP = 0.1;
	const STAGGER_SPAN = 0.7;

	let stripEl: HTMLElement | undefined = $state();
	/** Scrubbed motion per panel: trails the scroll-driven targets with the shared catch-up. */
	let panelMotion = $state<Record<string, PanelMotion>>({});

	const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
	const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

	/** Masked title rise, scrubbed by the panel's own entrance. */
	function titleRise(entry: number): string {
		return `transform: translate3d(0, ${((1 - easeOutCubic(entry)) * 102).toFixed(2)}%, 0);`;
	}

	/** Staggered slide for the copy rows; slot 0 leads. */
	function staggerRise(entry: number, slot: number): string {
		const t = clamp01((entry - slot * STAGGER_STEP) / STAGGER_SPAN);
		return `transform: translate3d(0, ${((1 - easeOutCubic(t)) * 28).toFixed(1)}px, 0);`;
	}

	/** Where each panel's motion should be at the current scroll position. */
	function readMotionTargets(): Record<string, PanelMotion> {
		const vh = Math.max(1, window.innerHeight);
		const targets: Record<string, PanelMotion> = {};
		if (!stripEl) return targets;
		for (const el of stripEl.querySelectorAll<HTMLElement>('[data-journey-panel]')) {
			const id = el.dataset.chapterPanel;
			if (!id) continue;
			const rect = el.getBoundingClientRect();
			targets[id] = {
				offset: Math.max(-1, Math.min(1, (rect.top + rect.height * 0.5 - vh * 0.5) / vh)),
				entry: clamp01((vh - rect.top) / (vh * ENTRY_RISE_VIEWPORT))
			};
		}
		return targets;
	}

	onMount(() => {
		if (!stripEl) return;

		let rafId = 0;
		let prev = 0;
		// Runs while scrolling and until every panel has caught up, then idles
		const step = (now: number) => {
			const dt = prev === 0 ? 1 / 60 : Math.min(0.05, (now - prev) / 1000);
			prev = now;
			syncLandingJourney();
			const targets = readMotionTargets();
			const instant = prefersReducedMotion();
			const next: Record<string, PanelMotion> = {};
			let settled = true;
			for (const [id, target] of Object.entries(targets)) {
				const current = panelMotion[id] ?? target;
				const offset = instant ? target.offset : scrubToward(current.offset, target.offset, dt);
				const entry = instant ? target.entry : scrubToward(current.entry, target.entry, dt);
				const done = Math.abs(target.offset - offset) < 0.0005 && Math.abs(target.entry - entry) < 0.0005;
				next[id] = done ? target : { offset, entry };
				if (!done) settled = false;
			}
			panelMotion = next;
			if (settled) {
				rafId = 0;
				prev = 0;
			} else {
				rafId = window.requestAnimationFrame(step);
			}
		};
		const schedule = () => {
			if (rafId === 0) rafId = window.requestAnimationFrame(step);
		};

		panelMotion = readMotionTargets();
		syncLandingJourney();
		window.addEventListener('scroll', schedule, { passive: true });
		window.addEventListener('resize', schedule, { passive: true });
		// Late-loading plates and fonts move every panel below them
		const resizeObserver = new ResizeObserver(schedule);
		resizeObserver.observe(stripEl);

		return () => {
			if (rafId) window.cancelAnimationFrame(rafId);
			window.removeEventListener('scroll', schedule);
			window.removeEventListener('resize', schedule);
			resizeObserver.disconnect();
		};
	});
</script>

<div bind:this={stripEl} id="chapter-strip" aria-label="Rapid-Fire Seven-Chapter Chronicle Strip">
	{#each CHAPTER_HIGHLIGHTS as ch, index (ch.chapterId)}
		{@const isTextLeft = index % 2 === 0}
		{@const motion = panelMotion[ch.chapterId] ?? { offset: 0, entry: 1 }}
		{@const offset = motion.offset}
		{@const imageTranslateY = offset * -24}
		{@const imageScale = 1.05 + (1 - Math.min(1, Math.abs(offset))) * 0.035}
		{@const stageTranslateY = offset * 14}
		{@const waypoint = journeyWaypointForChapter(ch.chapterId)}
		<!-- Panel over its waypoint, then the scene-only stretch: solo beat → flight → next panel rises -->
		<section
			id={ch.chapterId}
			data-chapter-id={ch.chapterId}
			data-chapter-index={index}
			data-trailer-beat={ch.chapterId}
			data-layout-alignment={isTextLeft ? 'text-left-plate-right' : 'plate-left-text-right'}
			aria-label={`${ch.chapterNumber}: ${ch.title}`}
			class="relative w-full px-5 sm:px-10 lg:pl-16 lg:pr-44 scroll-mt-14"
		>
			<div
				data-journey-panel={waypoint?.id}
				data-chapter-panel={ch.chapterId}
				data-testid={`chapter-panel-${ch.slug}`}
				class="relative z-10 mx-auto w-full max-w-[1320px] grid grid-cols-1 md:grid-cols-12 items-center gap-7 md:gap-10 lg:gap-12 py-6 will-change-transform"
				style={`transform: translate3d(0, ${stageTranslateY.toFixed(1)}px, 0);`}
			>
				<!-- =================================================================
				     1. FRAMED ARCHIVAL PLATE (Hard Cutoff: ~58% Width on Desktop, Top on Mobile)
				     ================================================================= -->
				<div
					data-testid={`chapter-plate-${ch.slug}`}
					class="order-1 {isTextLeft ? 'md:order-2 md:col-span-7' : 'md:order-1 md:col-span-7'} w-full"
				>
					<figure
						class="relative w-full overflow-hidden border border-[#E8E6E1]/20 bg-[#050607] shadow-[0_24px_80px_rgba(0,0,0,0.85)]"
					>
						<!-- Corner Calibration Ticks -->
						<span class="pointer-events-none absolute top-2 left-2 z-20 h-2 w-2 border-t border-l border-[#C89B57]/70" aria-hidden="true"></span>
						<span class="pointer-events-none absolute top-2 right-2 z-20 h-2 w-2 border-t border-r border-[#C89B57]/70" aria-hidden="true"></span>
						<span class="pointer-events-none absolute bottom-9 left-2 z-20 h-2 w-2 border-b border-l border-[#C89B57]/70" aria-hidden="true"></span>
						<span class="pointer-events-none absolute bottom-9 right-2 z-20 h-2 w-2 border-b border-r border-[#C89B57]/70" aria-hidden="true"></span>

						<!-- Hard-Cropped Plate Viewport -->
						<div class="relative aspect-[16/10] sm:aspect-[16/10] lg:h-[54vh] lg:max-h-[540px] w-full overflow-hidden bg-[#050607]">
							<div
								class="h-full w-full will-change-transform"
								style={`transform: translate3d(0, ${imageTranslateY.toFixed(1)}px, 0) scale(${imageScale.toFixed(3)});`}
							>
								{#if ch.visual.kind === 'responsive-plate'}
									<picture class="block h-full w-full">
										<source
											type="image/avif"
											srcset={`${ch.visual.basePath}-800.avif 800w, ${ch.visual.basePath}-1600.avif 1600w, ${ch.visual.basePath}-2400.avif 2400w`}
											sizes="(min-width: 768px) 58vw, 92vw"
										/>
										<source
											type="image/webp"
											srcset={`${ch.visual.basePath}-800.webp 800w, ${ch.visual.basePath}-1600.webp 1600w, ${ch.visual.basePath}-2400.webp 2400w`}
											sizes="(min-width: 768px) 58vw, 92vw"
										/>
										<img
											src={ch.visual.fallbackSrc}
											alt={ch.visual.alt}
											loading={index <= 1 ? 'eager' : 'lazy'}
											decoding="async"
											class="h-full w-full object-cover"
											style={ch.visual.filterStyle}
										/>
									</picture>
								{:else}
									<img
										src={ch.visual.fallbackSrc}
										alt={ch.visual.alt}
										loading={index <= 1 ? 'eager' : 'lazy'}
										decoding="async"
										class="h-full w-full object-cover"
										style={ch.visual.filterStyle}
									/>
								{/if}
							</div>

							<!-- Subtle Inner Plate Vignette -->
							<div
								class="pointer-events-none absolute inset-0"
								style="background: linear-gradient(180deg, rgba(5,6,7,0.16) 0%, rgba(5,6,7,0) 24%, rgba(5,6,7,0) 76%, rgba(5,6,7,0.48) 100%);"
							></div>
						</div>

						<!-- Archival Plate Footer Caption Bar -->
						<figcaption
							class="flex items-center justify-between gap-3 border-t border-[#E8E6E1]/14 bg-[#07080A] px-3.5 py-2 font-mono-tech text-[11px] md:text-[10px] uppercase tracking-[0.14em] text-[#E8E6E1]/68"
						>
							<span class="text-[#C89B57] shrink-0">PLATE {ch.indexNumber} // {ch.visual.archiveId}</span>
							<span class="truncate text-right text-[#E8E6E1]/58">{ch.visual.creditLine}</span>
						</figcaption>
					</figure>
				</div>

				<!-- =================================================================
				     2. EDITORIAL TEXT COLUMN (Alternating Left/Right on Desktop, Below Plate on Mobile)
				     ================================================================= -->
				<div
					data-testid={`chapter-copy-${ch.slug}`}
					class="order-2 {isTextLeft ? 'md:order-1 md:col-span-5' : 'md:order-2 md:col-span-5'} relative w-full"
				>
					<!-- Localized Soft Scrim Behind Copy Only (Never Blocks Surrounding Space Flight).
					     closest-side keeps the falloff inside the box, so it never ends on a hard edge over a planet -->
					<div
						class="pointer-events-none absolute -inset-x-12 -inset-y-16 -z-10"
						style="background: radial-gradient(closest-side, rgba(5, 6, 7, 0.84) 0%, rgba(5, 6, 7, 0.6) 58%, rgba(5, 6, 7, 0) 100%);"
						aria-hidden="true"
					></div>

					<!-- Chapter Number & Epoch Telemetry -->
					<div
						class="flex flex-wrap items-baseline gap-x-3 gap-y-1 font-mono-tech uppercase will-change-transform"
						style={`text-shadow: 0 1px 12px rgba(5, 6, 7, 0.96); ${staggerRise(motion.entry, 0)}`}
					>
						<span class="font-display text-2xl sm:text-3xl text-[#C89B57] tracking-[-0.02em]">
							{ch.indexNumber}
						</span>
						<span class="text-xs tracking-[0.18em] text-[#E8E6E1]">
							{ch.chapterNumber}
						</span>
						<span class="text-[#E8E6E1]/35">·</span>
						<span class="text-xs tracking-[0.16em] text-[#DDB474]">
							{ch.yearRange}
						</span>
						<span class="hidden sm:inline text-[#E8E6E1]/35">·</span>
						<span class="hidden sm:inline text-[11px] tracking-[0.14em] text-[#E8E6E1]/68">
							{ch.voyagerDistanceRangeLabel}
						</span>
					</div>

					<!-- Chapter Title -->
					<h2
						class="mt-2 sm:mt-3 font-title text-[#F5F3EE] overflow-hidden pb-1.5 break-words"
						style="font-size: clamp(2.25rem, 5.2vw, 4.75rem); line-height: 0.95; letter-spacing: -0.03em; text-shadow: 0 2px 28px rgba(5, 6, 7, 0.96), 0 1px 8px rgba(5, 6, 7, 0.92);"
					>
						<span class="block will-change-transform" style={titleRise(motion.entry)}>
							{ch.title}
						</span>
					</h2>

					<!-- Strictly ONE Logline Sentence -->
					<p
						class="mt-3.5 sm:mt-5 max-w-[52ch] font-prose text-base sm:text-lg leading-[1.62] text-[#F2F0EC] will-change-transform"
						style={`text-shadow: 0 1px 14px rgba(5, 6, 7, 0.98), 0 2px 24px rgba(5, 6, 7, 0.95); ${staggerRise(motion.entry, 1)}`}
					>
						{ch.logline}
					</p>

					<!-- Strictly ONE Hero Stat + Enter Chapter CTA -->
					<div
						class="mt-5 sm:mt-7 pt-4 sm:pt-5 border-t border-[#E8E6E1]/18 flex flex-col sm:flex-row sm:items-end justify-between gap-5 will-change-transform"
						style={staggerRise(motion.entry, 2)}
					>
						<div>
							<div
								class="font-mono-tech text-[11px] uppercase tracking-[0.16em] text-[#E8E6E1]/68"
								style="text-shadow: 0 1px 10px rgba(5, 6, 7, 0.96);"
							>
								{ch.killerStat.label}
							</div>
							<div
								class="mt-1 font-display font-normal text-[#C89B57] tracking-[-0.025em]"
								style="font-size: clamp(1.85rem, 3.6vw, 3.1rem); line-height: 1.04; text-shadow: 0 2px 24px rgba(5, 6, 7, 0.95);"
							>
								{ch.killerStat.value}
							</div>
							<div
								class="mt-1.5 font-caption text-xs sm:text-sm text-[#E8E6E1]/75 max-w-[42ch]"
								style="text-shadow: 0 1px 10px rgba(5, 6, 7, 0.96);"
							>
								{ch.killerStat.context}
							</div>
						</div>

						<!-- Enter Chapter ↗ Link -->
						<div class="shrink-0">
							<a
								href={`/chapters/${ch.slug}`}
								data-testid={`enter-chapter-${ch.slug}`}
								class="group inline-flex items-center gap-3 border border-[#C89B57]/65 bg-[#050607]/85 hover:bg-[#C89B57]/15 hover:border-[#DDB474] px-4.5 py-2.5 font-mono-tech text-xs uppercase tracking-[0.16em] text-[#E8E6E1] hover:text-[#DDB474] transition-all duration-300"
							>
								<span>Enter Chapter</span>
								<span class="text-[#C89B57] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300">
									↗
								</span>
							</a>
						</div>
					</div>
				</div>
			</div>
			<div
				class="pointer-events-none relative w-full"
				style={`height: ${journeyGapAfterChapterVh(ch.chapterId)}vh;`}
				data-testid={`journey-gap-${waypoint?.id ?? ch.chapterId}`}
				aria-hidden="true"
			></div>
			{#if index === CHAPTER_HIGHLIGHTS.length - 1}
				<!-- The deep void dims to the finale's black as its section rises. A direct child of the
				     section so it spans the full viewport width, not the padded content box -->
				<div
					class="pointer-events-none absolute inset-x-0 bottom-0 h-[60vh]"
					style="background: linear-gradient(180deg, rgba(5, 6, 7, 0) 0%, #050607 100%);"
					aria-hidden="true"
				></div>
			{/if}
		</section>
	{/each}
</div>

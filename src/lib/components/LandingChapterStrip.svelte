<script lang="ts">
	import { onMount } from 'svelte';
	import gsap from 'gsap';
	import { CHAPTER_HIGHLIGHTS, type ChapterLandingHighlight } from '$lib/data/highlights';

	let stripEl: HTMLElement | undefined = $state();
	let beatProgress = $state<Record<string, number>>(
		Object.fromEntries(CHAPTER_HIGHLIGHTS.map((c) => [c.chapterId, 0]))
	);
	let revealedChapters = $state<Record<string, boolean>>({});

	function getBackdropScrim(chapterId: string): string {
		const localizedProseScrim =
			'radial-gradient(ellipse 68% 74% at 32% 50%, rgba(5, 6, 7, 0.86) 0%, rgba(5, 6, 7, 0.64) 52%, rgba(5, 6, 7, 0.24) 80%, rgba(5, 6, 7, 0) 100%)';
		if (chapterId === 'epilogue') {
			return `background: ${localizedProseScrim}, radial-gradient(ellipse 96% 88% at 64% 48%, rgba(5, 6, 7, 0.04) 0%, rgba(5, 6, 7, 0.28) 74%, rgba(5, 6, 7, 0.82) 100%), linear-gradient(180deg, #050607 0%, rgba(5, 6, 7, 0.08) 15%, rgba(5, 6, 7, 0.12) 85%, #050607 100%);`;
		}
		return `background: ${localizedProseScrim}, radial-gradient(ellipse 94% 86% at 68% 46%, rgba(5, 6, 7, 0.06) 0%, rgba(5, 6, 7, 0.34) 74%, rgba(5, 6, 7, 0.86) 100%), linear-gradient(180deg, #050607 0%, rgba(5, 6, 7, 0.12) 16%, rgba(5, 6, 7, 0.16) 84%, #050607 100%);`;
	}

	function syncViewportMotion() {
		if (!stripEl || typeof window === 'undefined') return;
		const vh = Math.max(1, window.innerHeight);
		const cards = stripEl.querySelectorAll<HTMLElement>('[data-trailer-beat]');
		const next: Record<string, number> = {};
		for (const el of cards) {
			const id = el.dataset.trailerBeat;
			if (!id) continue;
			const rect = el.getBoundingClientRect();
			const centerOffset = (rect.top + rect.height * 0.5 - vh * 0.5) / vh;
			next[id] = Math.max(-1, Math.min(1, centerOffset));
		}
		beatProgress = next;
	}

	onMount(() => {
		if (!stripEl) return;

		let rafId = 0;
		const onScrollOrResize = () => {
			if (rafId !== 0) return;
			rafId = window.requestAnimationFrame(() => {
				rafId = 0;
				syncViewportMotion();
			});
		};

		syncViewportMotion();
		window.addEventListener('scroll', onScrollOrResize, { passive: true });
		window.addEventListener('resize', onScrollOrResize, { passive: true });

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					const el = entry.target as HTMLElement;
					const id = el.dataset.trailerBeat;
					if (entry.isIntersecting && id && !revealedChapters[id]) {
						revealedChapters = { ...revealedChapters, [id]: true };
						const titleEl = el.querySelector('.trailer-title-rise');
						const items = el.querySelectorAll('.trailer-stagger-item');
						if (titleEl) {
							gsap.fromTo(
								titleEl,
								{ yPercent: 102, opacity: 0 },
								{
									yPercent: 0,
									opacity: 1,
									duration: 0.9,
									ease: 'expo.out'
								}
							);
						}
						if (items.length > 0) {
							gsap.fromTo(
								items,
								{ y: 22, opacity: 0 },
								{
									y: 0,
									opacity: 1,
									duration: 0.85,
									stagger: 0.08,
									ease: 'expo.out'
								}
							);
						}
					}
				}
			},
			{ threshold: 0.18 }
		);

		const beatEls = stripEl.querySelectorAll<HTMLElement>('[data-trailer-beat]');
		beatEls.forEach((el) => observer.observe(el));

		return () => {
			if (rafId) window.cancelAnimationFrame(rafId);
			window.removeEventListener('scroll', onScrollOrResize);
			window.removeEventListener('resize', onScrollOrResize);
			observer.disconnect();
		};
	});
</script>

<div bind:this={stripEl} id="chapter-strip" aria-label="Rapid-Fire Seven-Chapter Chronicle Strip">
	{#each CHAPTER_HIGHLIGHTS as ch, index (ch.chapterId)}
		{@const offset = beatProgress[ch.chapterId] ?? 0}
		{@const imageTranslateY = offset * -34}
		{@const imageScale = 1.06 + (1 - Math.min(1, Math.abs(offset))) * 0.04}
		{@const stageTranslateY = offset * 16}
		<section
			id={ch.chapterId}
			data-chapter-id={ch.chapterId}
			data-chapter-index={index}
			data-trailer-beat={ch.chapterId}
			aria-label={`${ch.chapterNumber}: ${ch.title}`}
			class="relative min-h-[84vh] md:min-h-[92vh] w-full overflow-hidden border-t border-[#E8E6E1]/10 flex flex-col justify-center px-5 sm:px-10 lg:px-16 py-12 md:py-16 scroll-mt-14"
		>
			<!-- 1. Single Strongest Visual (Scroll-Driven Motion Plate) -->
			<div class="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
				<div
					class="h-full w-full will-change-transform transition-transform duration-300 ease-out"
					style={`transform: translate3d(0, ${imageTranslateY.toFixed(1)}px, 0) scale(${imageScale.toFixed(3)});`}
				>
					{#if ch.visual.kind === 'responsive-plate'}
						<picture class="block h-full w-full">
							<source
								type="image/avif"
								srcset={`${ch.visual.basePath}-800.avif 800w, ${ch.visual.basePath}-1600.avif 1600w, ${ch.visual.basePath}-2400.avif 2400w`}
								sizes="100vw"
							/>
							<source
								type="image/webp"
								srcset={`${ch.visual.basePath}-800.webp 800w, ${ch.visual.basePath}-1600.webp 1600w, ${ch.visual.basePath}-2400.webp 2400w`}
								sizes="100vw"
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

				<!-- Documentary Edge & Prose Contrast Scrim -->
				<div class="absolute inset-0" style={getBackdropScrim(ch.chapterId)}></div>
			</div>

			<!-- 2. Pinned Moment Foreground Content (Number + Title, 1 Logline, 1 Killer Stat, Enter Chapter Link) -->
			<div
				class="relative z-10 mx-auto w-full max-w-[1320px] will-change-transform"
				style={`transform: translate3d(0, ${stageTranslateY.toFixed(1)}px, 0);`}
			>
				<div class="max-w-4xl">
					<!-- Huge Chapter Number & Epoch Telemetry -->
					<div
						class="trailer-stagger-item flex flex-wrap items-baseline gap-x-3.5 gap-y-1 font-mono-tech uppercase"
						style="text-shadow: 0 1px 12px rgba(5, 6, 7, 0.96);"
					>
						<span class="font-display text-2xl sm:text-3xl md:text-4xl text-[#C89B57] tracking-[-0.02em]">
							{ch.indexNumber}
						</span>
						<span class="text-xs sm:text-sm tracking-[0.18em] text-[#E8E6E1]">
							{ch.chapterNumber}
						</span>
						<span class="text-[#E8E6E1]/35">·</span>
						<span class="text-xs sm:text-sm tracking-[0.16em] text-[#DDB474]">
							{ch.yearRange}
						</span>
						<span class="hidden sm:inline text-[#E8E6E1]/35">·</span>
						<span class="hidden sm:inline text-[11px] tracking-[0.16em] text-[#E8E6E1]/72">
							VOYAGER 1: {ch.voyagerDistanceRangeLabel}
						</span>
					</div>

					<!-- Enormous Chapter Title -->
					<h2
						class="mt-2 sm:mt-3 font-display font-normal text-[#F5F3EE] overflow-hidden pb-1.5 break-words"
						style="font-size: clamp(2.5rem, 8.2vw, 7.25rem); line-height: 0.93; letter-spacing: -0.032em; text-shadow: 0 2px 32px rgba(5, 6, 7, 0.96), 0 1px 8px rgba(5, 6, 7, 0.92);"
					>
						<span class="trailer-title-line trailer-title-rise block">
							{ch.title}
						</span>
					</h2>

					<!-- Strictly ONE Logline Sentence -->
					<p
						class="trailer-stagger-item mt-4 sm:mt-6 max-w-[56ch] font-sans text-base sm:text-lg md:text-[21px] leading-[1.6] text-[#F2F0EC] font-normal"
						style="text-shadow: 0 1px 14px rgba(5, 6, 7, 0.98), 0 2px 28px rgba(5, 6, 7, 0.95);"
					>
						{ch.logline}
					</p>

					<!-- Strictly ONE Killer Stat + Enter Chapter CTA Row -->
					<div
						class="trailer-stagger-item mt-6 sm:mt-9 pt-5 sm:pt-6 border-t border-[#E8E6E1]/18 flex flex-col sm:flex-row sm:items-end justify-between gap-6 max-w-3xl"
					>
						<div>
							<div
								class="font-mono-tech text-xs uppercase tracking-[0.16em] text-[#E8E6E1]/70"
								style="text-shadow: 0 1px 10px rgba(5, 6, 7, 0.96);"
							>
								{ch.killerStat.label}
							</div>
							<div
								class="mt-1 font-display font-normal text-[#C89B57] tracking-[-0.025em]"
								style="font-size: clamp(2rem, 4.6vw, 3.6rem); line-height: 1.02; text-shadow: 0 2px 24px rgba(5, 6, 7, 0.95);"
							>
								{ch.killerStat.value}
							</div>
							<div
								class="mt-1.5 font-sans text-xs sm:text-sm text-[#E8E6E1]/75 max-w-[46ch]"
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
								class="group inline-flex items-center gap-3 border border-[#C89B57]/65 bg-[#050607]/80 hover:bg-[#C89B57]/15 hover:border-[#DDB474] px-5 py-3 font-mono-tech text-xs uppercase tracking-[0.16em] text-[#E8E6E1] hover:text-[#DDB474] transition-all duration-300"
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

			<!-- Mandatory Archival Plate Credit -->
			<div
				class="pointer-events-none mt-6 md:mt-0 md:absolute md:bottom-5 md:right-10 lg:right-48 z-10 max-w-[90vw] text-right font-mono-tech text-[11px] uppercase tracking-[0.16em] text-[#E8E6E1]/68"
				style="text-shadow: 0 1px 14px rgba(5, 6, 7, 0.98);"
			>
				ARCHIVE PLATE // {ch.visual.archiveId} · {ch.visual.creditLine}
			</div>
		</section>
	{/each}
</div>

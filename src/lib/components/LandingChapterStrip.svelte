<script lang="ts">
	import { onMount } from 'svelte';
	import gsap from 'gsap';
	import { CHAPTER_HIGHLIGHTS } from '$lib/data/highlights';

	let stripEl: HTMLElement | undefined = $state();
	let beatProgress = $state<Record<string, number>>(
		Object.fromEntries(CHAPTER_HIGHLIGHTS.map((c) => [c.chapterId, 0]))
	);
	let revealedChapters = $state<Record<string, boolean>>({});

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
		{@const isTextLeft = index % 2 === 0}
		{@const offset = beatProgress[ch.chapterId] ?? 0}
		{@const imageTranslateY = offset * -24}
		{@const imageScale = 1.05 + (1 - Math.min(1, Math.abs(offset))) * 0.035}
		{@const stageTranslateY = offset * 14}
		<section
			id={ch.chapterId}
			data-chapter-id={ch.chapterId}
			data-chapter-index={index}
			data-trailer-beat={ch.chapterId}
			data-layout-alignment={isTextLeft ? 'text-left-plate-right' : 'plate-left-text-right'}
			aria-label={`${ch.chapterNumber}: ${ch.title}`}
			class="relative min-h-[86vh] md:min-h-[94vh] w-full flex flex-col justify-center px-5 sm:px-10 lg:pl-16 lg:pr-44 py-14 md:py-20 scroll-mt-14"
		>
			<div
				class="relative z-10 mx-auto w-full max-w-[1320px] grid grid-cols-1 md:grid-cols-12 items-center gap-7 md:gap-10 lg:gap-12 will-change-transform"
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
								class="h-full w-full will-change-transform transition-transform duration-300 ease-out"
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
					<!-- Localized Soft Scrim Behind Copy Only (Never Blocks Surrounding Space Flight) -->
					<div
						class="pointer-events-none absolute -inset-6 -z-10 rounded-sm"
						style="background: radial-gradient(ellipse 85% 80% at 50% 50%, rgba(5, 6, 7, 0.84) 0%, rgba(5, 6, 7, 0.52) 64%, rgba(5, 6, 7, 0) 100%);"
						aria-hidden="true"
					></div>

					<!-- Chapter Number & Epoch Telemetry -->
					<div
						class="trailer-stagger-item flex flex-wrap items-baseline gap-x-3 gap-y-1 font-mono-tech uppercase"
						style="text-shadow: 0 1px 12px rgba(5, 6, 7, 0.96);"
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
						class="mt-2 sm:mt-3 font-display font-normal text-[#F5F3EE] overflow-hidden pb-1.5 break-words"
						style="font-size: clamp(2.25rem, 5.2vw, 4.75rem); line-height: 0.95; letter-spacing: -0.03em; text-shadow: 0 2px 28px rgba(5, 6, 7, 0.96), 0 1px 8px rgba(5, 6, 7, 0.92);"
					>
						<span class="trailer-title-line trailer-title-rise block">
							{ch.title}
						</span>
					</h2>

					<!-- Strictly ONE Logline Sentence -->
					<p
						class="trailer-stagger-item mt-3.5 sm:mt-5 max-w-[52ch] font-sans text-base sm:text-lg leading-[1.62] text-[#F2F0EC] font-normal"
						style="text-shadow: 0 1px 14px rgba(5, 6, 7, 0.98), 0 2px 24px rgba(5, 6, 7, 0.95);"
					>
						{ch.logline}
					</p>

					<!-- Strictly ONE Hero Stat + Enter Chapter CTA -->
					<div
						class="trailer-stagger-item mt-5 sm:mt-7 pt-4 sm:pt-5 border-t border-[#E8E6E1]/18 flex flex-col sm:flex-row sm:items-end justify-between gap-5"
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
								class="mt-1.5 font-sans text-xs sm:text-sm text-[#E8E6E1]/75 max-w-[42ch]"
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
		</section>
	{/each}
</div>

<script lang="ts">
	import { onMount, type Component } from 'svelte';
	import gsap from 'gsap';
	import { ScrollTrigger } from 'gsap/ScrollTrigger';
	import { CHAPTER_HIGHLIGHTS } from '$lib/data/highlights';
	import HeroSection from '$lib/components/HeroSection.svelte';
	import LandingChapterStrip from '$lib/components/LandingChapterStrip.svelte';
	import FinalePullBack from '$lib/components/FinalePullBack.svelte';

	let StarfieldCanvasComponent = $state<Component | null>(null);

	onMount(() => {
		gsap.registerPlugin(ScrollTrigger);
		ScrollTrigger.refresh();
		import('$lib/three/StarfieldCanvas.svelte').then((mod) => {
			StarfieldCanvasComponent = mod.default;
		});
	});
</script>

<!-- Persistent Full-Viewport WebGL Starfield, Volumetric Nebula & LEO-to-Interstellar Camera -->
{#if StarfieldCanvasComponent}
	<StarfieldCanvasComponent />
{/if}
<!-- Foreground Trailer Cut Scrollytelling Journey -->
<main class="relative z-10 w-full overflow-x-clip">
	<!-- 1. Opening Full-Screen Hero (Untouched) -->
	<HeroSection />

	<!-- 2. Rapid-Fire Seven-Chapter Trailer Strip (Prologue, Ch. I–V, Epilogue) -->
	<LandingChapterStrip />

	<!-- 3. The Finale ("The Pull-Back"): Heliosphere -> Oort Cloud -> Orion Arm -> Milky Way Panorama -->
	<FinalePullBack />

	<!-- 4. Quiet Chapter Index Grid ("Continue the Journey") Linking into Deep Dives & Colophon -->
	<section
		id="continue-the-journey"
		aria-label="Continue the Journey — Deep-Dive Chapter Index"
		class="relative z-20 w-full border-t border-[#E8E6E1]/10 bg-[#050607] py-14 sm:py-20 px-5 sm:px-10 lg:px-16"
	>
		<div class="mx-auto max-w-[1320px]">
			<div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E8E6E1]/12 pb-6">
				<div>
					<div class="font-mono-tech text-[11px] uppercase tracking-[0.16em] text-[#C89B57]">
						DEEP-DIVE ARCHIVE · SEVEN EPOCHS (1975–2075)
					</div>
					<h2
						class="mt-2 font-display font-normal text-[#E8E6E1] tracking-[-0.025em] leading-[1.05]"
						style="font-size: clamp(1.85rem, 4.2vw, 3.5rem);"
					>
						Continue the Journey
					</h2>
					<p class="mt-2 font-sans text-sm sm:text-base text-[#E8E6E1]/68 max-w-[58ch]">
						Enter any chapter for the complete narrative prose, all 29 mission engineering dossiers,
						interactive 3D set pieces, technical schematics, archival footage, and primary citations.
					</p>
				</div>

				<a
					href="/colophon"
					class="shrink-0 inline-flex items-center gap-2 font-mono-tech text-xs uppercase tracking-[0.16em] text-[#C89B57] hover:text-[#DDB474] transition-colors duration-300"
				>
					<span>Colophon, Sources &amp; AI Architecture</span>
					<span aria-hidden="true">↗</span>
				</a>
			</div>

			<div class="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
				{#each CHAPTER_HIGHLIGHTS as ch}
					<a
						href={`/chapters/${ch.slug}`}
						data-testid={`index-card-${ch.slug}`}
						class="group flex flex-col justify-between border border-[#E8E6E1]/12 bg-[#08090B]/80 hover:border-[#C89B57]/70 hover:bg-[#E8E6E1]/[0.02] p-5 transition-colors duration-300"
					>
						<div>
							<div class="flex items-center justify-between gap-2 font-mono-tech text-[10px] uppercase tracking-[0.16em]">
								<span class="text-[#E8E6E1]/55 group-hover:text-[#C89B57] transition-colors">
									{ch.indexNumber} · {ch.chapterNumber}
								</span>
								<span class="text-[#C89B57]">{ch.yearRange}</span>
							</div>
							<h3 class="mt-2 font-display text-xl sm:text-2xl font-normal text-[#E8E6E1] group-hover:text-[#DDB474] transition-colors leading-tight">
								{ch.title}
							</h3>
							<p class="mt-1.5 font-sans text-xs sm:text-sm text-[#E8E6E1]/62 leading-relaxed line-clamp-2">
								{ch.subtitle}
							</p>
						</div>

						<div class="mt-5 pt-3 border-t border-[#E8E6E1]/10 flex items-center justify-between gap-2 font-mono-tech text-[10px] uppercase tracking-[0.14em]">
							<span class="text-[#E8E6E1]/50">{ch.milestoneCount} MILESTONES · {ch.killerStat.value}</span>
							<span class="text-[#C89B57] group-hover:translate-x-0.5 transition-transform">
								ENTER ↗
							</span>
						</div>
					</a>
				{/each}

				<!-- 8th Card: Colophon, Sources, ASSETS.md & AI Architecture -->
				<a
					href="/colophon"
					data-testid="index-card-colophon"
					class="group flex flex-col justify-between border border-[#C89B57]/35 bg-[#08090B] hover:border-[#C89B57] hover:bg-[#C89B57]/[0.04] p-5 transition-colors duration-300"
				>
					<div>
						<div class="flex items-center justify-between gap-2 font-mono-tech text-[10px] uppercase tracking-[0.16em]">
							<span class="text-[#C89B57]">08 · COLOPHON</span>
							<span class="text-[#E8E6E1]/55">VERIFICATION LEDGER</span>
						</div>
						<h3 class="mt-2 font-display text-xl sm:text-2xl font-normal text-[#E8E6E1] group-hover:text-[#DDB474] transition-colors leading-tight">
							Sources, Attributions &amp; AI Architecture
						</h3>
						<p class="mt-1.5 font-sans text-xs sm:text-sm text-[#E8E6E1]/65 leading-relaxed">
							Consolidated primary citations grouped by chapter, full ASSETS.md licenses &amp; credits, and the autonomous AI engineering panel.
						</p>
					</div>

					<div class="mt-5 pt-3 border-t border-[#E8E6E1]/10 flex items-center justify-between gap-2 font-mono-tech text-[10px] uppercase tracking-[0.14em]">
						<span class="text-[#E8E6E1]/55">72+ SOURCES · 27 ASSETS</span>
						<span class="text-[#C89B57] group-hover:translate-x-0.5 transition-transform">
							OPEN COLOPHON ↗
						</span>
					</div>
				</a>
			</div>
		</div>
	</section>
</main>

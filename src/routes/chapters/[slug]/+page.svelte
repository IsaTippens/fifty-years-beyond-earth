<script lang="ts">
	import type { Component } from 'svelte';
	import { CHAPTER_HIGHLIGHTS } from '$lib/data/missions';
	import ChapterSection from '$lib/components/ChapterSection.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let SaturnSceneComponent = $state<Component | null>(null);
	let ExoplanetOrreryComponent = $state<Component | null>(null);

	// Route-level code splitting: load heavy 3D WebGL set pieces only on the chapter routes that need them
	$effect(() => {
		const id = data.chapter.chapterId;
		if (id === 'ch2-eyes-universe' && !SaturnSceneComponent) {
			import('$lib/three/SaturnCassiniScene.svelte').then((mod) => {
				SaturnSceneComponent = mod.default;
			});
		}
		if (id === 'ch5-new-golden-age' && !ExoplanetOrreryComponent) {
			import('$lib/three/ExoplanetOrrery.svelte').then((mod) => {
				ExoplanetOrreryComponent = mod.default;
			});
		}
	});
</script>

<main class="relative z-10 w-full overflow-x-clip bg-[#050607]">
	{#snippet saturnSceneSnippet()}
		{#if SaturnSceneComponent}
			<SaturnSceneComponent />
		{:else}
			<div
				class="h-[360px] w-full border border-[#E8E6E1]/10 bg-[#08090B] flex items-center justify-center font-mono-tech text-xs uppercase tracking-[0.16em] text-[#C89B57]"
			>
				Initializing Cassini–Huygens 3D Saturn &amp; Ring System…
			</div>
		{/if}
	{/snippet}

	{#snippet exoplanetOrrerySnippet()}
		{#if ExoplanetOrreryComponent}
			<ExoplanetOrreryComponent />
		{:else}
			<div
				class="h-[360px] w-full border border-[#E8E6E1]/10 bg-[#08090B] flex items-center justify-center font-mono-tech text-xs uppercase tracking-[0.16em] text-[#C89B57]"
			>
				Initializing 3D Exoplanet Laplace-Resonance Orrery…
			</div>
		{/if}
	{/snippet}

	{#key data.chapter.chapterId}
		<ChapterSection
			chapter={data.chapter}
			index={data.index}
			saturnSetPiece={data.chapter.chapterId === 'ch2-eyes-universe' ? saturnSceneSnippet : undefined}
			exoplanetSetPiece={data.chapter.chapterId === 'ch5-new-golden-age'
				? exoplanetOrrerySnippet
				: undefined}
		/>
	{/key}

	<!-- ====================================================================== -->
	<!-- CHAPTER FOOTER: PREV / NEXT CHAPTER NAVIGATION & BACK TO THE JOURNEY   -->
	<!-- ====================================================================== -->
	<footer
		aria-label="Chapter Navigation Footer"
		data-testid="chapter-footer-nav"
		class="relative z-10 w-full border-t border-[#E8E6E1]/14 bg-[#050607] py-12 sm:py-20 px-6 sm:px-10 lg:px-16"
	>
		<div class="mx-auto max-w-5xl space-y-10">
			<!-- Prev / Next Chapter Cards -->
			<nav
				aria-label="Previous and Next Chapter Navigation"
				class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6"
			>
				{#if data.prev}
					<a
						href={`/chapters/${data.prev.slug}`}
						data-testid="prev-chapter-link"
						class="group flex flex-col justify-between border border-[#E8E6E1]/14 bg-[#08090B]/90 hover:border-[#C89B57] hover:bg-[#E8E6E1]/[0.02] p-5 sm:p-7 transition-colors duration-300"
					>
						<div class="font-mono-tech text-[11px] uppercase tracking-[0.16em] text-[#E8E6E1]/55 group-hover:text-[#C89B57] transition-colors">
							← PREVIOUS CHAPTER · {data.prev.indexNumber} // {data.prev.chapterNumber}
						</div>
						<div class="mt-3">
							<div class="font-display text-2xl sm:text-3xl text-[#E8E6E1] group-hover:text-[#DDB474] transition-colors leading-tight">
								{data.prev.title}
							</div>
							<div class="mt-1 font-mono-tech text-xs text-[#C89B57]">
								{data.prev.yearRange} · {data.prev.milestoneCount} Milestones
							</div>
						</div>
					</a>
				{:else}
					<a
						href="/"
						data-testid="prev-chapter-home-link"
						class="group flex flex-col justify-between border border-[#E8E6E1]/14 bg-[#08090B]/90 hover:border-[#C89B57] hover:bg-[#E8E6E1]/[0.02] p-5 sm:p-7 transition-colors duration-300"
					>
						<div class="font-mono-tech text-[11px] uppercase tracking-[0.16em] text-[#E8E6E1]/55 group-hover:text-[#C89B57] transition-colors">
							← OPENING STAGE · LOW EARTH ORBIT (222 KM)
						</div>
						<div class="mt-3">
							<div class="font-display text-2xl sm:text-3xl text-[#E8E6E1] group-hover:text-[#DDB474] transition-colors leading-tight">
								Back to the Journey
							</div>
							<div class="mt-1 font-mono-tech text-xs text-[#C89B57]">
								1975–2075 Trailer Cut &amp; Voyager 1 Telemetry HUD
							</div>
						</div>
					</a>
				{/if}

				{#if data.next}
					<a
						href={`/chapters/${data.next.slug}`}
						data-testid="next-chapter-link"
						class="group flex flex-col justify-between border border-[#E8E6E1]/14 bg-[#08090B]/90 hover:border-[#C89B57] hover:bg-[#E8E6E1]/[0.02] p-5 sm:p-7 text-left md:text-right transition-colors duration-300"
					>
						<div class="font-mono-tech text-[11px] uppercase tracking-[0.16em] text-[#E8E6E1]/55 group-hover:text-[#C89B57] transition-colors">
							NEXT CHAPTER · {data.next.indexNumber} // {data.next.chapterNumber} →
						</div>
						<div class="mt-3">
							<div class="font-display text-2xl sm:text-3xl text-[#E8E6E1] group-hover:text-[#DDB474] transition-colors leading-tight">
								{data.next.title}
							</div>
							<div class="mt-1 font-mono-tech text-xs text-[#C89B57]">
								{data.next.yearRange} · {data.next.milestoneCount} Milestones
							</div>
						</div>
					</a>
				{:else}
					<a
						href="/#finale-pullback"
						data-testid="next-chapter-finale-link"
						class="group flex flex-col justify-between border border-[#C89B57]/45 bg-[#08090B]/90 hover:border-[#C89B57] hover:bg-[#C89B57]/[0.05] p-5 sm:p-7 text-left md:text-right transition-colors duration-300"
					>
						<div class="font-mono-tech text-[11px] uppercase tracking-[0.16em] text-[#C89B57]">
							FINAL HORIZON · 340 AU TO 100,000 LIGHT-YEARS →
						</div>
						<div class="mt-3">
							<div class="font-display text-2xl sm:text-3xl text-[#E8E6E1] group-hover:text-[#DDB474] transition-colors leading-tight">
								Return to The Finale Pull-Back
							</div>
							<div class="mt-1 font-mono-tech text-xs text-[#C89B57]">
								Heliosphere → Oort Cloud → Orion Arm → Milky Way Reveal
							</div>
						</div>
					</a>
				{/if}
			</nav>

			<!-- Compact All-Chapters Strip + Back to the Journey & Colophon Links -->
			<div class="pt-6 border-t border-[#E8E6E1]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<a
					href="/"
					data-testid="back-to-journey-link"
					class="inline-flex items-center gap-2 font-mono-tech text-xs uppercase tracking-[0.16em] text-[#E8E6E1] hover:text-[#C89B57] transition-colors duration-300"
				>
					<span class="text-[#C89B57]">←</span>
					<span>Back to the Journey</span>
				</a>

				<div class="flex flex-wrap items-center gap-2 font-mono-tech text-[11px] uppercase tracking-[0.14em]">
					{#each CHAPTER_HIGHLIGHTS as ch}
						{@const active = ch.slug === data.highlight.slug}
						<a
							href={`/chapters/${ch.slug}`}
							title={`${ch.chapterNumber}: ${ch.title}`}
							class="px-2 py-1 border transition-colors duration-200 {active
								? 'border-[#C89B57] bg-[#C89B57]/15 text-[#C89B57]'
								: 'border-[#E8E6E1]/12 text-[#E8E6E1]/55 hover:border-[#E8E6E1]/35 hover:text-[#E8E6E1]'}"
						>
							{ch.indexNumber}
						</a>
					{/each}
				</div>

				<a
					href="/colophon"
					data-testid="chapter-footer-colophon-link"
					class="inline-flex items-center gap-2 font-mono-tech text-xs uppercase tracking-[0.16em] text-[#C89B57] hover:text-[#DDB474] transition-colors duration-300"
				>
					<span>Colophon, Sources &amp; ASSETS.md</span>
					<span aria-hidden="true">↗</span>
				</a>
			</div>
		</div>
	</footer>
</main>

<script lang="ts">
	import { onMount } from 'svelte';
	import gsap from 'gsap';
	import { ScrollTrigger } from 'gsap/ScrollTrigger';
	import { CHAPTERS } from '$lib/data/missions';
	import StarfieldCanvas from '$lib/three/StarfieldCanvas.svelte';
	import VoyagerHud from '$lib/components/VoyagerHud.svelte';
	import HeroSection from '$lib/components/HeroSection.svelte';
	import ChapterSection from '$lib/components/ChapterSection.svelte';
	import SaturnCassiniScene from '$lib/three/SaturnCassiniScene.svelte';
	import ExoplanetOrrery from '$lib/three/ExoplanetOrrery.svelte';
	import DecadeTimeline from '$lib/components/DecadeTimeline.svelte';
	import SourcesSection from '$lib/components/SourcesSection.svelte';
	import BuiltByAiPanel from '$lib/components/BuiltByAiPanel.svelte';
	import FinalePullBack from '$lib/components/FinalePullBack.svelte';

	onMount(() => {
		gsap.registerPlugin(ScrollTrigger);
		ScrollTrigger.refresh();
	});
</script>

<!-- Persistent Full-Viewport WebGL Starfield, Volumetric Nebula & LEO-to-Interstellar Camera -->
<StarfieldCanvas />

<!-- Persistent Mission-Control Voyager 1 Live Telemetry HUD & Logarithmic Distance Scrollbar Rail -->
<VoyagerHud />

<!-- Foreground Scrollytelling Narrative Journey -->
<main class="relative z-10 w-full overflow-x-clip">
	<!-- Opening Full-Screen Hero -->
	<HeroSection />

	<!-- Seven Chronological Chapters (Prologue, Ch. I–V, Epilogue) -->
	{#snippet saturnSceneSnippet()}
		<SaturnCassiniScene />
	{/snippet}

	{#snippet exoplanetOrrerySnippet()}
		<ExoplanetOrrery />
	{/snippet}

	{#each CHAPTERS as chapter, index (chapter.chapterId)}
		<ChapterSection
			{chapter}
			{index}
			saturnSetPiece={chapter.chapterId === 'ch2-eyes-universe' ? saturnSceneSnippet : undefined}
			exoplanetSetPiece={chapter.chapterId === 'ch5-new-golden-age'
				? exoplanetOrrerySnippet
				: undefined}
		/>
	{/each}

	<!-- Interactive 5-Decade Mission Matrix & Logarithmic Distance Trajectory Explorer -->
	<DecadeTimeline />

	<!-- Rendered SOURCES.md Primary Archive Verification Ledger -->
	<SourcesSection />

	<!-- "Built Entirely by AI" Capability & Engineering Showcase Panel -->
	<BuiltByAiPanel />

	<!-- The Finale ("The Pull-Back"): Heliosphere -> Oort Cloud -> Orion Arm -> Milky Way Panorama -->
	<FinalePullBack />
</main>

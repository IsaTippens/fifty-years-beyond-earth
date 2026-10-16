<script lang="ts">
	import { onMount, type Component } from 'svelte';
	import gsap from 'gsap';
	import { ScrollTrigger } from 'gsap/ScrollTrigger';
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

	<!-- 3. The Finale: Distance Alone -> The Quote Alone -> Slow Milky Way Condensation -->
	<FinalePullBack />
</main>

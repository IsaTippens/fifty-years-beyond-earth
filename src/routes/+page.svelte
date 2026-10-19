<script lang="ts">
	import { onMount, type Component } from 'svelte';
	import { fade } from 'svelte/transition';
	import HeroSection from '$lib/components/HeroSection.svelte';
	import LandingChapterStrip from '$lib/components/LandingChapterStrip.svelte';
	import FinalePullBack from '$lib/components/FinalePullBack.svelte';
	import { introSkipStore, skipIntro, startIntroGate } from '$lib/stores/introSequence';
	import { startLandingScroll } from '$lib/stores/landingScroll';

	let StarfieldCanvasComponent = $state<Component | null>(null);
	let stageEl: HTMLElement | undefined = $state();

	onMount(() => {
		let stopScroll: (() => void) | null = null;
		// The intro gate holds the page first; weighted scrolling takes over the moment it releases
		const stopGate = stageEl
			? startIntroGate({
					stage: stageEl,
					onRelease: () => {
						stopScroll = startLandingScroll();
					}
				})
			: null;
		import('$lib/three/StarfieldCanvas.svelte').then((mod) => {
			StarfieldCanvasComponent = mod.default;
		});
		return () => {
			stopGate?.();
			stopScroll?.();
		};
	});
</script>

<!-- Persistent Full-Viewport WebGL Starfield, Volumetric Nebula & LEO-to-Interstellar Camera -->
{#if StarfieldCanvasComponent}
	<StarfieldCanvasComponent />
{/if}
<!-- Foreground Trailer Cut Scrollytelling Journey -->
<main bind:this={stageEl} class="relative z-10 w-full overflow-x-clip">
	<!-- 1. Opening Full-Screen Hero (gated intro: title → departure → Earth → chrome) -->
	<HeroSection />

	<!-- 2. Rapid-Fire Seven-Chapter Trailer Strip (Prologue, Ch. I–V, Epilogue) -->
	<LandingChapterStrip />

	<!-- 3. The Finale: Distance Alone -> The Quote Alone -> Slow Milky Way Condensation -->
	<FinalePullBack />
</main>

<!-- Discreet intro escape hatch: on offer ~1 s into the gate until mission control comes online -->
{#if $introSkipStore}
	<button
		type="button"
		data-testid="intro-skip"
		onclick={skipIntro}
		transition:fade={{ duration: 600 }}
		class="fixed bottom-5 right-5 sm:bottom-6 sm:right-8 z-40 py-2 px-1 font-mono-tech text-[11px] tracking-[0.16em] uppercase text-[#E8E6E1]/55 hover:text-[#C89B57] focus-visible:text-[#C89B57] transition-colors duration-300 cursor-pointer"
		style="text-shadow: 0 1px 10px rgba(5, 6, 7, 0.96);"
	>
		Skip intro<span class="hidden md:inline text-[#E8E6E1]/35">&nbsp;·&nbsp;Esc</span>
	</button>
{/if}

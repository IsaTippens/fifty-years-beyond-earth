<script lang="ts">
	import '@fontsource-variable/fraunces';
	import '@fontsource-variable/inter';
	import '@fontsource-variable/jetbrains-mono';
	import '../lib/styles/tokens.css';
	import '../app.css';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<svelte:head>
	<title>Fifty Years Beyond Earth (1975–2026) — Interactive Space Exploration Chronicle</title>
	<meta
		name="description"
		content="An interactive scroll-driven WebGL narrative chronicling fifty years of humanity's greatest space exploration achievements from Apollo–Soyuz and Voyager to JWST, Artemis, and the 6,400+ exoplanet census."
	/>
</svelte:head>

<div
	class="relative min-h-screen bg-[#050607] text-[#E8E6E1] font-sans selection:bg-[#C89B57]/25 selection:text-[#E8E6E1]"
>
	<div class="vignette-overlay" aria-hidden="true"></div>
	<div class="film-grain-overlay" aria-hidden="true"></div>
	{@render children()}
</div>

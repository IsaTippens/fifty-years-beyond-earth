<script lang="ts">
	import '@fontsource-variable/fraunces';
	import '@fontsource-variable/inter';
	import '@fontsource-variable/jetbrains-mono';
	import '../lib/styles/tokens.css';
	import '../app.css';
	import type { Snippet } from 'svelte';
	import { page } from '$app/stores';

	let { children }: { children: Snippet } = $props();

	const DEFAULT_ORIGIN = 'https://fifty-years-beyond-earth.pages.dev';
	const siteTitle = 'Fifty Years Beyond Earth (1975–2026+)';
	const siteDescription =
		'From Apollo–Soyuz to interstellar space: an interactive scroll-driven chronicle of humanity’s journey across fifty years of planetary exploration, space observatories, and the cosmic frontier.';

	let currentOrigin = $derived(
		$page?.url?.origin &&
			$page.url.origin !== 'null' &&
			!$page.url.origin.includes('localhost') &&
			!$page.url.origin.includes('127.0.0.1')
			? $page.url.origin
			: DEFAULT_ORIGIN
	);

	let canonicalUrl = $derived(`${currentOrigin}/`);
	let ogImageUrl = $derived(`${currentOrigin}/og-image.jpg`);

	let structuredData = $derived({
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'WebSite',
				'@id': `${canonicalUrl}#website`,
				url: canonicalUrl,
				name: 'Fifty Years Beyond Earth',
				description: siteDescription,
				publisher: {
					'@type': 'Person',
					name: 'Isa Tippens',
					url: 'https://github.com/IsaTippens'
				},
				inLanguage: 'en-US'
			},
			{
				'@type': 'CreativeWork',
				'@id': `${canonicalUrl}#chronicle`,
				url: canonicalUrl,
				name: siteTitle,
				headline: 'Fifty Years Beyond Earth — From Apollo–Soyuz to Interstellar Frontiers',
				description: siteDescription,
				image: ogImageUrl,
				author: {
					'@type': 'Person',
					name: 'Isa Tippens',
					url: 'https://github.com/IsaTippens'
				},
				genre: 'Space Exploration History & Interactive Data Visualization',
				keywords:
					'space exploration, Apollo-Soyuz, Voyager 1, Golden Record, Hubble Space Telescope, Cassini-Huygens, JWST, Artemis, exoplanets, astronomy, WebGL, scrollytelling',
				datePublished: '2026-10-14',
				inLanguage: 'en-US'
			}
		]
	});
</script>

<svelte:head>
	<title>{siteTitle}</title>
	<meta name="description" content={siteDescription} />
	<meta
		name="keywords"
		content="space exploration, Apollo-Soyuz, Voyager 1, Golden Record, Hubble Space Telescope, Cassini-Huygens, JWST, Artemis, exoplanets, astronomy, WebGL, scrollytelling, science history"
	/>
	<meta name="author" content="Isa Tippens" />
	<meta name="creator" content="Isa Tippens" />
	<meta name="publisher" content="Fifty Years Beyond Earth" />
	<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />

	<!-- Canonical Link -->
	<link rel="canonical" href={canonicalUrl} />

	<!-- Open Graph / Facebook / LinkedIn / Discord / Slack / WhatsApp -->
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="Fifty Years Beyond Earth" />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:title" content={siteTitle} />
	<meta property="og:description" content={siteDescription} />
	<meta property="og:image" content={ogImageUrl} />
	<meta property="og:image:secure_url" content={ogImageUrl} />
	<meta property="og:image:type" content="image/jpeg" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta
		property="og:image:alt"
		content="Fifty Years Beyond Earth — 1975–2026+ Interactive Space Exploration Chronicle banner featuring Earth limb at orbital sunset"
	/>
	<meta property="og:locale" content="en_US" />

	<!-- Twitter / X Cards -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:url" content={canonicalUrl} />
	<meta name="twitter:title" content={siteTitle} />
	<meta name="twitter:description" content={siteDescription} />
	<meta name="twitter:image" content={ogImageUrl} />
	<meta
		name="twitter:image:alt"
		content="Fifty Years Beyond Earth — 1975–2026+ Interactive Space Exploration Chronicle banner featuring Earth limb at orbital sunset"
	/>

	<!-- Schema.org JSON-LD Structured Data -->
	{@html `<script type="application/ld+json">${JSON.stringify(structuredData)}</script>`}
</svelte:head>

<div
	class="relative min-h-screen bg-[#050607] text-[#E8E6E1] font-sans selection:bg-[#C89B57]/25 selection:text-[#E8E6E1]"
>
	<div class="vignette-overlay" aria-hidden="true"></div>
	<div class="film-grain-overlay" aria-hidden="true"></div>
	{@render children()}
</div>

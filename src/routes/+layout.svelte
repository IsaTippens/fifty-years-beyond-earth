<script lang="ts">
	import '@fontsource-variable/fraunces';
	import '@fontsource-variable/inter';
	import '@fontsource-variable/jetbrains-mono';
	import '../lib/styles/tokens.css';
	import '../app.css';
	import type { Snippet } from 'svelte';
	import { page } from '$app/stores';
	import VoyagerHud from '$lib/components/VoyagerHud.svelte';

	let { children }: { children: Snippet } = $props();

	const DEFAULT_ORIGIN = 'https://fifty-years-beyond-earth.pages.dev';
	const defaultTitle = 'Fifty Years Beyond Earth (1975–2026+)';
	const defaultDescription =
		'From Apollo–Soyuz to interstellar space: an interactive scroll-driven chronicle of humanity’s journey across fifty years of planetary exploration, space observatories, and the cosmic frontier.';
	const defaultOgAlt =
		'Fifty Years Beyond Earth — 1975–2026+ Interactive Space Exploration Chronicle banner featuring Earth limb at orbital sunset';

	let currentOrigin = $derived(
		$page?.url?.origin &&
			$page.url.origin !== 'null' &&
			!$page.url.origin.includes('localhost') &&
			!$page.url.origin.includes('127.0.0.1')
			? $page.url.origin
			: DEFAULT_ORIGIN
	);

	let routeSeo = $derived(($page?.data as Record<string, any> | undefined)?.seo);
	let pageTitle = $derived(routeSeo?.title ?? defaultTitle);
	let pageDescription = $derived(routeSeo?.description ?? defaultDescription);
	let canonicalPath = $derived($page?.url?.pathname ?? '/');
	let canonicalUrl = $derived(`${currentOrigin}${canonicalPath}`);
	let ogImagePath = $derived(routeSeo?.ogImage ?? '/og-image.jpg');
	let ogImageUrl = $derived(
		ogImagePath.startsWith('http') ? ogImagePath : `${currentOrigin}${ogImagePath}`
	);
	let ogImageType = $derived(ogImagePath.endsWith('.webp') ? 'image/webp' : 'image/jpeg');
	let ogImageAlt = $derived(routeSeo?.ogImageAlt ?? defaultOgAlt);

	let structuredData = $derived({
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'WebSite',
				'@id': `${currentOrigin}/#website`,
				url: `${currentOrigin}/`,
				name: 'Fifty Years Beyond Earth',
				description: defaultDescription,
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
				name: pageTitle,
				headline: pageTitle,
				description: pageDescription,
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
	<title>{pageTitle}</title>
	<meta name="description" content={pageDescription} />
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
	<meta property="og:title" content={pageTitle} />
	<meta property="og:description" content={pageDescription} />
	<meta property="og:image" content={ogImageUrl} />
	<meta property="og:image:secure_url" content={ogImageUrl} />
	<meta property="og:image:type" content={ogImageType} />
	<meta property="og:image:width" content="1600" />
	<meta property="og:image:height" content="900" />
	<meta property="og:image:alt" content={ogImageAlt} />
	<meta property="og:locale" content="en_US" />

	<!-- Twitter / X Cards -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:url" content={canonicalUrl} />
	<meta name="twitter:title" content={pageTitle} />
	<meta name="twitter:description" content={pageDescription} />
	<meta name="twitter:image" content={ogImageUrl} />
	<meta name="twitter:image:alt" content={ogImageAlt} />

	<!-- Schema.org JSON-LD Structured Data -->
	{@html `<script type="application/ld+json">${JSON.stringify(structuredData)}</script>`}
</svelte:head>

<div
	class="relative min-h-screen bg-[#050607] text-[#E8E6E1] font-sans selection:bg-[#C89B57]/25 selection:text-[#E8E6E1]"
>
	<div class="vignette-overlay" aria-hidden="true"></div>
	<div class="film-grain-overlay" aria-hidden="true"></div>
	<VoyagerHud />
	{@render children()}
</div>

import type { PageLoad } from './$types';

export const load: PageLoad = () => {
	return {
		seo: {
			title: 'Colophon, Sources Archive & AI Architecture — Fifty Years Beyond Earth',
			description:
				'Consolidated primary sources archive grouped by chapter, full ASSETS.md imagery, texture, and video attributions, and the multi-agent AI engineering architecture.',
			ogImage: '/og-image.jpg',
			ogImageAlt:
				'Fifty Years Beyond Earth — Colophon, Primary Sources Archive, ASSETS.md Provenance & Multi-Agent AI Architecture'
		}
	};
};

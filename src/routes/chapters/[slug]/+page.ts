import { error } from '@sveltejs/kit';
import { CHAPTER_HIGHLIGHTS, getChapterBySlug } from '$lib/data/missions';
import type { EntryGenerator, PageLoad } from './$types';

export const entries: EntryGenerator = () => {
	return CHAPTER_HIGHLIGHTS.map((ch) => ({ slug: ch.slug }));
};

export const load: PageLoad = ({ params }) => {
	const resolved = getChapterBySlug(params.slug);
	if (!resolved) {
		throw error(404, `Chapter "${params.slug}" not found`);
	}

	const { chapter, highlight, index, prev, next } = resolved;

	return {
		chapter,
		highlight,
		index,
		prev,
		next,
		seo: {
			title: `${chapter.chapterNumber}: ${chapter.title} (${chapter.yearRange}) — Fifty Years Beyond Earth`,
			description: `${chapter.subtitle} (${chapter.yearRange}). ${highlight.logline}`,
			ogImage: highlight.ogImagePath,
			ogImageAlt: highlight.visual.alt
		}
	};
};

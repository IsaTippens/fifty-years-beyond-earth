export interface ChapterLandingHighlight {
	slug: string;
	chapterId: string;
	indexNumber: string;
	chapterNumber: string;
	title: string;
	subtitle: string;
	yearRange: string;
	startYear: number;
	endYear: number;
	voyagerDistanceAu: number;
	voyagerDistanceRangeLabel: string;
	voyagerLightTime: string;
	logline: string;
	killerStat: {
		value: string;
		label: string;
		context: string;
	};
	visual: {
		kind: 'responsive-plate' | 'poster-plate';
		basePath: string;
		fallbackSrc: string;
		alt: string;
		archiveId: string;
		creditLine: string;
		filterStyle: string;
	};
	ogImagePath: string;
	milestoneCount: number;
}

export const CHAPTER_HIGHLIGHTS: ChapterLandingHighlight[] = [
	{
		slug: 'prologue',
		chapterId: 'prologue',
		indexNumber: '01',
		chapterNumber: 'PROLOGUE',
		title: 'The Handshake',
		subtitle: 'Détente in Low Earth Orbit & First Touch on the Red Planet',
		yearRange: '1975–1980',
		startYear: 1975,
		endYear: 1980,
		voyagerDistanceAu: 9.5,
		voyagerDistanceRangeLabel: '0.0000015 – 9.5 AU',
		voyagerLightTime: '0.0007s – 1h 19m OWLT',
		logline:
			'Two Cold War rivals unlock a shared orbital airlock 222 kilometers above Earth, while twin Voyager probes ride columned fire into the outer dark carrying humanity’s voices etched in gold.',
		killerStat: {
			value: '172.4 AU',
			label: 'VOYAGER 1 INTERSTELLAR RANGE',
			context: '25.8 billion km from Earth · 115 images & 55 languages etched on the Golden Record'
		},
		visual: {
			kind: 'responsive-plate',
			basePath: '/assets/chapters/pale-blue-dot',
			fallbackSrc: '/assets/chapters/pale-blue-dot-1600.webp',
			alt: 'Earth suspended as a 0.12-pixel crescent inside a scattered ray of sunlight, captured by Voyager 1 from 40.5 AU on Valentine’s Day 1990',
			archiveId: 'PIA00452 / PIA23645',
			creditLine:
				'Image Credit: NASA/JPL-Caltech (Voyager 1 Imaging Science Subsystem, Feb 14, 1990 / Remastered PIA23645 & PIA00452)',
			filterStyle: 'filter: saturate(0.94) contrast(1.15) brightness(0.92); object-position: 58% 48%;'
		},
		ogImagePath: '/assets/chapters/pale-blue-dot-1600.webp',
		milestoneCount: 3
	},
	{
		slug: 'ch1-living-there',
		chapterId: 'ch1-living-there',
		indexNumber: '02',
		chapterNumber: 'CHAPTER I',
		title: 'Learning to Live There',
		subtitle: 'The Crucible of Reusable Wings, Mir Modular Outposts, and the Genesis of the ISS',
		yearRange: '1981–1998',
		startYear: 1981,
		endYear: 1998,
		voyagerDistanceAu: 72.0,
		voyagerDistanceRangeLabel: '9.5 – 72.0 AU',
		voyagerLightTime: '1h 19m – 10h 00m OWLT',
		logline:
			'Armored in thirty thousand silica tiles, winged orbiters and modular stations transform low Earth orbit from a fleeting proving ground into a permanently inhabited human outpost.',
		killerStat: {
			value: '437.7 Days',
			label: 'SINGLE-FLIGHT ORBITAL ENDURANCE RECORD',
			context: 'Set aboard Soviet station Mir · followed by the 419,725 kg, 15-nation ISS complex'
		},
		visual: {
			kind: 'poster-plate',
			basePath: '/assets/videos/sts1-columbia-launch-poster.webp',
			fallbackSrc: '/assets/videos/sts1-columbia-launch-poster.webp',
			alt: 'Space Shuttle Columbia main engine ignition and maiden liftoff on STS-1 from Launch Complex 39A on April 12, 1981',
			archiveId: 'KSC-20210325-MH-JRS01_0001',
			creditLine:
				'Archival Plate: NASA / Kennedy Space Center (STS-1 Launch Complex 39A Film, April 12, 1981)',
			filterStyle: 'filter: saturate(0.92) contrast(1.16) brightness(0.88); object-position: 54% 44%;'
		},
		ogImagePath: '/assets/chapters/iss-earth-limb-1600.webp',
		milestoneCount: 4
	},
	{
		slug: 'ch2-eyes-universe',
		chapterId: 'ch2-eyes-universe',
		indexNumber: '03',
		chapterNumber: 'CHAPTER II',
		title: 'Eyes on the Universe',
		subtitle: 'The Great Observatories, Robotic Armadas, and the Threshold of the Heliosphere',
		yearRange: '1990–2005',
		startYear: 1990,
		endYear: 2005,
		voyagerDistanceAu: 94.0,
		voyagerDistanceRangeLabel: '42.0 – 94.0 AU',
		voyagerLightTime: '5h 49m – 13h 02m OWLT',
		logline:
			'Five spacewalks repair a two-micrometer flaw in Hubble’s silvered mirror to unveil ten thousand primordial galaxies, while Huygens parachutes through Titan’s orange methane haze.',
		killerStat: {
			value: '10,000 Galaxies',
			label: 'HUBBLE ULTRA DEEP FIELD CENSUS',
			context: '13+ billion years of cosmic history resolved after correcting a 2.2 μm mirror aberration'
		},
		visual: {
			kind: 'responsive-plate',
			basePath: '/assets/chapters/hubble-udf',
			fallbackSrc: '/assets/chapters/hubble-udf-1600.webp',
			alt: 'Hubble Ultra Deep Field composite revealing nearly 10,000 galaxies in a patch of sky one-tenth the diameter of the full Moon in Fornax',
			archiveId: 'STScI-PRC04-07a',
			creditLine:
				'Image Credit: NASA, ESA, H. Teplitz and M. Rafelski (IPAC/Caltech), A. Koekemoer (STScI), R. Windhorst (ASU), and Z. Levay (STScI)',
			filterStyle: 'filter: saturate(0.94) contrast(1.14) brightness(0.88); object-position: center;'
		},
		ogImagePath: '/assets/chapters/hubble-udf-1600.webp',
		milestoneCount: 5
	},
	{
		slug: 'ch3-long-reach',
		chapterId: 'ch3-long-reach',
		indexNumber: '04',
		chapterNumber: 'CHAPTER III',
		title: 'The Long Reach',
		subtitle: 'Crossing the Heliopause, Cataloging Alien Worlds, and Hearing Spacetime Ring',
		yearRange: '2006–2015',
		startYear: 2006,
		endYear: 2015,
		voyagerDistanceAu: 133.3,
		voyagerDistanceRangeLabel: '98.0 – 133.3 AU',
		voyagerLightTime: '13h 35m – 18h 29m OWLT',
		logline:
			'Voyager 1 punches through the heliopause into interstellar plasma, New Horizons skims the nitrogen glaciers of Pluto, and twin laser interferometers hear two black holes ring spacetime.',
		killerStat: {
			value: '121.6 AU',
			label: 'HELIOPAUSE CROSSING INTO INTERSTELLAR SPACE',
			context: '18.2 billion km from Sol on Aug 25, 2012 · joined by LIGO’s 1.0 × 10⁻²¹ spacetime strain'
		},
		visual: {
			kind: 'responsive-plate',
			basePath: '/assets/chapters/pluto-heart',
			fallbackSrc: '/assets/chapters/pluto-heart-1600.webp',
			alt: 'Pluto and Tombaugh Regio in enhanced color acquired by New Horizons from 35,000 km during the July 14, 2015 flyby',
			archiveId: 'PIA19952',
			creditLine:
				'Image Credit: NASA / Johns Hopkins University Applied Physics Laboratory / Southwest Research Institute (PIA19952)',
			filterStyle: 'filter: saturate(0.96) contrast(1.15) brightness(0.90); object-position: 64% 46%;'
		},
		ogImagePath: '/assets/chapters/pluto-heart-1600.webp',
		milestoneCount: 5
	},
	{
		slug: 'ch4-reusable-revolution',
		chapterId: 'ch4-reusable-revolution',
		indexNumber: '05',
		chapterNumber: 'CHAPTER IV',
		title: 'The Reusable Revolution',
		subtitle: 'Orbital Booster Landings, Deep Regolith Returns, and the Edge of Spacetime',
		yearRange: '2015–2020',
		startYear: 2015,
		endYear: 2020,
		voyagerDistanceAu: 150.2,
		voyagerDistanceRangeLabel: '133.3 – 150.2 AU',
		voyagerLightTime: '18h 29m – 20h 50m OWLT',
		logline:
			'Orbital rocket boosters fall from the stratosphere to land on columns of fire, robotic arms snatch primordial carbon from asteroids, and an Earth-sized radio dish photographs a black hole’s shadow.',
		killerStat: {
			value: '6.5 Billion M☉',
			label: 'M87* EVENT HORIZON SHADOW RESOLVED',
			context: '42 microarcsecond photon ring at 55M light-years · 09m 44s Falcon 9 vertical landing'
		},
		visual: {
			kind: 'responsive-plate',
			basePath: '/assets/chapters/m87-black-hole',
			fallbackSrc: '/assets/chapters/m87-black-hole-1600.webp',
			alt: 'First horizon-scale VLBI image of the supermassive black hole M87* and its relativistic photon ring',
			archiveId: 'eso1907a / PIA23122',
			creditLine:
				'Image Credit: Event Horizon Telescope Collaboration et al. (CC BY 4.0, eso1907a) / NASA/JPL-Caltech/Spitzer (PIA23122)',
			filterStyle: 'filter: saturate(0.95) contrast(1.14) brightness(0.90); object-position: 62% 48%;'
		},
		ogImagePath: '/assets/chapters/m87-black-hole-1600.webp',
		milestoneCount: 5
	},
	{
		slug: 'ch5-new-golden-age',
		chapterId: 'ch5-new-golden-age',
		indexNumber: '06',
		chapterNumber: 'CHAPTER V',
		title: 'The New Golden Age',
		subtitle: 'Planetary Defense, Deep Cosmic Vistas, and the Dawn of Multi-World Existence',
		yearRange: '2021–2026',
		startYear: 2021,
		endYear: 2026,
		voyagerDistanceAu: 169.8,
		voyagerDistanceRangeLabel: '152.0 – 169.8 AU',
		voyagerLightTime: '21h 04m – 23h 34m OWLT',
		logline:
			'A coaxial rotorcraft flies seventy-two times across Martian skies, a kinetic impactor deflects an asteroid moonlet by thirty-three minutes, and eighteen gold hexagons unfold at L2 to peer toward Cosmic Dawn.',
		killerStat: {
			value: '6,445 Worlds',
			label: 'CONFIRMED EXOPLANETS CATALOGED',
			context: 'Joined by JWST redshift z = 14.32 galaxies & DART’s −33.0 minute asteroid orbit deflection'
		},
		visual: {
			kind: 'responsive-plate',
			basePath: '/assets/chapters/jwst-carina',
			fallbackSrc: '/assets/chapters/jwst-carina-1600.webp',
			alt: 'James Webb Space Telescope NIRCam image of the Cosmic Cliffs in the Carina Nebula (NGC 3324)',
			archiveId: 'carina_nebula',
			creditLine:
				'Image Credit: NASA, ESA, CSA, and STScI (James Webb Space Telescope NIRCam, July 12, 2022)',
			filterStyle: 'filter: saturate(0.94) contrast(1.14) brightness(0.88); object-position: center;'
		},
		ogImagePath: '/assets/chapters/jwst-carina-1600.webp',
		milestoneCount: 5
	},
	{
		slug: 'epilogue',
		chapterId: 'epilogue',
		indexNumber: '07',
		chapterNumber: 'EPILOGUE',
		title: 'The Next Fifty Years',
		subtitle: 'Ocean Worlds, Silent Drifts, and the Centennial Horizon',
		yearRange: '2026–2075',
		startYear: 2026,
		endYear: 2075,
		voyagerDistanceAu: 340.0,
		voyagerDistanceRangeLabel: '169.8 – 340.0 AU',
		voyagerLightTime: '23h 34m – 47h 08m OWLT',
		logline:
			'As Voyager 1 crosses one full light-day from home toward a forty-thousand-year rendezvous with Gliese 445, a new robotic armada sets sail for the subsurface oceans of Europa and the methane dunes of Titan.',
		killerStat: {
			value: '~340 AU',
			label: '2075 CENTENNIAL INTERSTELLAR HORIZON',
			context: '47.1 light-hours one-way radio transit · 49 Europa Clipper close flybys down to 25 km'
		},
		visual: {
			kind: 'responsive-plate',
			basePath: '/assets/chapters/cassini-saturn-eclipse',
			fallbackSrc: '/assets/chapters/cassini-saturn-eclipse-1600.webp',
			alt: 'The Day the Earth Smiled — Saturn and its backlit rings in solar eclipse with Earth visible as a pale blue pinpoint 1.44 billion km away',
			archiveId: 'PIA17172',
			creditLine:
				'Image Credit: NASA / JPL-Caltech / Space Science Institute (Cassini Imaging Team, July 19, 2013, PIA17172)',
			filterStyle: 'filter: saturate(1.06) contrast(1.24) brightness(1.08); object-position: 56% 48%;'
		},
		ogImagePath: '/assets/chapters/cassini-saturn-eclipse-1600.webp',
		milestoneCount: 2
	}
];

export const SLUG_ALIASES: Record<string, string> = {
	prologue: 'prologue',
	'the-handshake': 'prologue',
	'0': 'prologue',
	'ch1-living-there': 'ch1-living-there',
	ch1: 'ch1-living-there',
	'chapter-1': 'ch1-living-there',
	'1': 'ch1-living-there',
	'learning-to-live-there': 'ch1-living-there',
	'ch2-eyes-universe': 'ch2-eyes-universe',
	ch2: 'ch2-eyes-universe',
	'chapter-2': 'ch2-eyes-universe',
	'2': 'ch2-eyes-universe',
	'eyes-on-the-universe': 'ch2-eyes-universe',
	'ch3-long-reach': 'ch3-long-reach',
	ch3: 'ch3-long-reach',
	'chapter-3': 'ch3-long-reach',
	'3': 'ch3-long-reach',
	'the-long-reach': 'ch3-long-reach',
	'ch4-reusable-revolution': 'ch4-reusable-revolution',
	ch4: 'ch4-reusable-revolution',
	'chapter-4': 'ch4-reusable-revolution',
	'4': 'ch4-reusable-revolution',
	'the-reusable-revolution': 'ch4-reusable-revolution',
	'ch5-new-golden-age': 'ch5-new-golden-age',
	ch5: 'ch5-new-golden-age',
	'chapter-5': 'ch5-new-golden-age',
	'5': 'ch5-new-golden-age',
	'the-new-golden-age': 'ch5-new-golden-age',
	epilogue: 'epilogue',
	'the-next-fifty-years': 'epilogue',
	'6': 'epilogue',
	'7': 'epilogue'
};

export function resolveChapterSlug(rawSlug: string): string | null {
	const normalized = rawSlug.trim().toLowerCase();
	return SLUG_ALIASES[normalized] ?? null;
}

export function getHighlightBySlug(rawSlug: string): ChapterLandingHighlight | null {
	const canonicalId = resolveChapterSlug(rawSlug);
	if (!canonicalId) return null;
	return CHAPTER_HIGHLIGHTS.find((c) => c.chapterId === canonicalId) ?? null;
}

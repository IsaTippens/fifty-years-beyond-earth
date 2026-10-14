export interface AssetManifestEntry {
	id: string;
	category: 'chapter-art' | 'planet-texture' | 'finale-panorama';
	title: string;
	chapterId?: string;
	bodyName?: string;
	localBasePath: string; // e.g. '/assets/chapters/pale-blue-dot' or '/assets/textures/earth-day.webp'
	hasResponsiveSet: boolean; // true for 800/1600/2400 .avif + .webp sets
	archiveName: string;
	archiveId: string;
	sourceUrl: string;
	directAssetUrl: string;
	license: string;
	creditLine: string;
	year: number;
	caption: string;
}

export const ASSET_MANIFEST: AssetManifestEntry[] = [
	{
		id: 'hero-iss-earth-limb',
		category: 'chapter-art',
		title: 'Earth Limb, Atmospheric Airglow & City Lights from Low Earth Orbit',
		chapterId: 'hero',
		localBasePath: '/assets/chapters/iss-earth-limb',
		hasResponsiveSet: true,
		archiveName: 'NASA Johnson Space Center / NASA Image and Video Library',
		archiveId: 'iss035e017619',
		sourceUrl: 'https://images.nasa.gov/details/iss035e017619',
		directAssetUrl: 'https://images-assets.nasa.gov/image/iss035e017619/iss035e017619~orig.jpg',
		license: 'Public Domain — NASA/JSC',
		creditLine: 'Image Credit: NASA / Johnson Space Center / Expedition 35 Crew (ISS035-E-017619)',
		year: 2013,
		caption:
			'Earth’s thin atmospheric limb and sodium airglow layer curving above nocturnal city lights, photographed from the International Space Station at 408 km altitude.'
	},
	{
		id: 'pale-blue-dot',
		category: 'chapter-art',
		title: 'Pale Blue Dot — Voyager 1 Solar System Family Portrait (6.05 Billion km)',
		chapterId: 'prologue',
		localBasePath: '/assets/chapters/pale-blue-dot',
		hasResponsiveSet: true,
		archiveName: 'NASA / JPL-Caltech Planetary Photojournal',
		archiveId: 'PIA00452 / PIA23645',
		sourceUrl: 'https://photojournal.jpl.nasa.gov/catalog/PIA23645',
		directAssetUrl: 'https://images-assets.nasa.gov/image/PIA23645/PIA23645~orig.jpg',
		license: 'Public Domain — NASA/JPL-Caltech',
		creditLine:
			'Image Credit: NASA/JPL-Caltech (Voyager 1 Imaging Science Subsystem, Feb 14, 1990 / Remastered PIA23645 & PIA00452)',
		year: 1990,
		caption:
			'Earth suspended as a 0.12-pixel crescent inside a scattered ray of sunlight, captured by Voyager 1 from 40.5 AU (6.05 billion km) above the ecliptic plane on Valentine’s Day 1990.'
	},
	{
		id: 'iss-earth-limb',
		category: 'chapter-art',
		title: 'Orbital Sunrise & Atmospheric Airglow Over Earth from the International Space Station',
		chapterId: 'ch1-living-there',
		localBasePath: '/assets/chapters/iss-earth-limb',
		hasResponsiveSet: true,
		archiveName: 'NASA Johnson Space Center / NASA Image and Video Library',
		archiveId: 'iss035e017619',
		sourceUrl: 'https://images.nasa.gov/details/iss035e017619',
		directAssetUrl: 'https://images-assets.nasa.gov/image/iss035e017619/iss035e017619~orig.jpg',
		license: 'Public Domain — NASA/JSC',
		creditLine: 'Image Credit: NASA / Johnson Space Center / Expedition 35 Crew (ISS035-E-017619)',
		year: 2013,
		caption:
			'From 400 kilometers up, Expedition 35 crewmembers witness the golden band of mesospheric airglow and human settlements illuminating the night hemisphere below.'
	},
	{
		id: 'hubble-udf',
		category: 'chapter-art',
		title: 'Hubble Ultra Deep Field (UV–Optical–Near-Infrared Composite)',
		chapterId: 'ch2-eyes-universe',
		localBasePath: '/assets/chapters/hubble-udf',
		hasResponsiveSet: true,
		archiveName: 'NASA / ESA / Space Telescope Science Institute (STScI)',
		archiveId: 'GSFC_20171208_Archive_e001061 / STScI-PRC04-07a',
		sourceUrl: 'https://images.nasa.gov/details/GSFC_20171208_Archive_e001061',
		directAssetUrl:
			'https://images-assets.nasa.gov/image/GSFC_20171208_Archive_e001061/GSFC_20171208_Archive_e001061~orig.jpg',
		license: 'Public Domain — NASA/ESA/STScI',
		creditLine:
			'Image Credit: NASA, ESA, H. Teplitz and M. Rafelski (IPAC/Caltech), A. Koekemoer (STScI), R. Windhorst (ASU), and Z. Levay (STScI)',
		year: 2014,
		caption:
			'Nearly 10,000 galaxies in a patch of sky one-tenth the diameter of the full Moon in Fornax, reaching back more than 13 billion years toward Cosmic Dawn.'
	},
	{
		id: 'pluto-heart',
		category: 'chapter-art',
		title: 'Pluto & Tombaugh Regio ("The Heart") in Enhanced Color',
		chapterId: 'ch3-long-reach',
		localBasePath: '/assets/chapters/pluto-heart',
		hasResponsiveSet: true,
		archiveName: 'NASA / JPL-Caltech Planetary Photojournal / JHUAPL / SwRI',
		archiveId: 'PIA19952',
		sourceUrl: 'https://photojournal.jpl.nasa.gov/catalog/PIA19952',
		directAssetUrl: 'https://images-assets.nasa.gov/image/PIA19952/PIA19952~orig.jpg',
		license: 'Public Domain — NASA/JHUAPL/SwRI',
		creditLine:
			'Image Credit: NASA / Johns Hopkins University Applied Physics Laboratory / Southwest Research Institute (PIA19952)',
		year: 2015,
		caption:
			'New Horizons Ralph/MVIC and LORRI composite acquired during the July 14, 2015 flyby from 35,000 km, revealing nitrogen-ice convection cells across Sputnik Planitia.'
	},
	{
		id: 'm87-black-hole',
		category: 'chapter-art',
		title: 'First Horizon-Scale Image of the Supermassive Black Hole M87*',
		chapterId: 'ch4-reusable-revolution',
		localBasePath: '/assets/chapters/m87-black-hole',
		hasResponsiveSet: true,
		archiveName: 'Event Horizon Telescope Collaboration / ESO / NASA JPL',
		archiveId: 'eso1907a / PIA23122',
		sourceUrl: 'https://www.eso.org/public/images/eso1907a/',
		directAssetUrl: 'https://cdn.eso.org/images/large/eso1907a.jpg',
		license: 'CC BY 4.0 — Event Horizon Telescope Collaboration / Public Domain — NASA/JPL-Caltech',
		creditLine:
			'Image Credit: Event Horizon Telescope Collaboration et al. (CC BY 4.0, eso1907a) / NASA/JPL-Caltech/Spitzer (PIA23122)',
		year: 2019,
		caption:
			'Earth-sized 1.3 mm very-long-baseline interferometry (VLBI) synthesis resolving the relativistic photon ring and shadow of the 6.5-billion-solar-mass black hole at the core of Messier 87.'
	},
	{
		id: 'jwst-carina',
		category: 'chapter-art',
		title: 'JWST NIRCam "Cosmic Cliffs" in the Carina Nebula (NGC 3324)',
		chapterId: 'ch5-new-golden-age',
		localBasePath: '/assets/chapters/jwst-carina',
		hasResponsiveSet: true,
		archiveName: 'NASA / ESA / CSA / Space Telescope Science Institute (STScI)',
		archiveId: 'carina_nebula',
		sourceUrl: 'https://images.nasa.gov/details/carina_nebula',
		directAssetUrl: 'https://images-assets.nasa.gov/image/carina_nebula/carina_nebula~orig.png',
		license: 'Public Domain — NASA/ESA/CSA/STScI',
		creditLine:
			'Image Credit: NASA, ESA, CSA, and STScI (James Webb Space Telescope NIRCam, July 12, 2022)',
		year: 2022,
		caption:
			'Infrared light from the James Webb Space Telescope pierces cavernous seven-light-year walls of ionized gas and dust in NGC 3324, unveiling previously hidden protostellar jets.'
	},
	{
		id: 'cassini-saturn-eclipse',
		category: 'chapter-art',
		title: 'The Day the Earth Smiled — Saturn in High-Phase Solar Eclipse',
		chapterId: 'epilogue',
		localBasePath: '/assets/chapters/cassini-saturn-eclipse',
		hasResponsiveSet: true,
		archiveName: 'NASA / JPL-Caltech Planetary Photojournal',
		archiveId: 'PIA17172',
		sourceUrl: 'https://photojournal.jpl.nasa.gov/catalog/PIA17172',
		directAssetUrl: 'https://images-assets.nasa.gov/image/PIA17172/PIA17172~orig.jpg',
		license: 'Public Domain — NASA/JPL-Caltech/SSI',
		creditLine:
			'Image Credit: NASA / JPL-Caltech / Space Science Institute (Cassini Imaging Team, July 19, 2013, PIA17172)',
		year: 2013,
		caption:
			'A 141-frame wide-angle mosaic captured from Saturn’s shadow on July 19, 2013; backlit icy rings frame the Earth and Moon as a pale blue pinpoint 1.44 billion kilometers away.'
	},
	{
		id: 'milky-way-gaia',
		category: 'finale-panorama',
		title: 'All-Sky Milky Way Galactic Plane Panorama (Gaia DR2 / NASA SVS 4851 & ESO)',
		chapterId: 'finale',
		localBasePath: '/assets/finale/milky-way-gaia',
		hasResponsiveSet: true,
		archiveName: 'NASA GSFC Scientific Visualization Studio & European Southern Observatory',
		archiveId: 'SVS-4851 / eso0932a',
		sourceUrl: 'https://svs.gsfc.nasa.gov/4851',
		directAssetUrl:
			'https://svs.gsfc.nasa.gov/vis/a000000/a004800/a004851/milkyway_2020_4k_gal_print.jpg',
		license: 'Public Domain — NASA/GSFC SVS & CC BY 4.0 — ESO/S. Brunier',
		creditLine:
			'Image Credit: NASA/Goddard Space Flight Center Scientific Visualization Studio (Ernie Wright, SVS 4851, Gaia DR2) & ESO/S. Brunier (CC BY 4.0, eso0932a)',
		year: 2020,
		caption:
			'360-degree galactic-coordinate star map synthesized from 1.7 billion stars cataloged by ESA’s Gaia space astrometry mission and ESO all-sky galactic plane observations.'
	},
	{
		id: 'earth-day',
		category: 'planet-texture',
		title: 'Blue Marble: Next Generation Global Day Map',
		bodyName: 'Earth (Day Albedo)',
		localBasePath: '/assets/textures/earth-day.webp',
		hasResponsiveSet: false,
		archiveName: 'NASA Visible Earth / Earth Observatory',
		archiveId: 'VE-73909',
		sourceUrl:
			'https://visibleearth.nasa.gov/images/73909/december-blue-marble-next-generation-w-topography-and-bathymetry',
		directAssetUrl:
			'https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73909/world.topo.bathy.200412.3x5400x2700.jpg',
		license: 'Public Domain — NASA Earth Observatory',
		creditLine:
			'Texture Credit: Reto Stöckli, NASA Earth Observatory / Goddard Space Flight Center',
		year: 2004,
		caption:
			'Cloud-free equirectangular global true-color composite from Terra/Aqua MODIS observations with ocean bathymetry and continental relief.'
	},
	{
		id: 'earth-night',
		category: 'planet-texture',
		title: 'Earth at Night (Black Marble Global Anthropogenic Light Map)',
		bodyName: 'Earth (Night Emissive)',
		localBasePath: '/assets/textures/earth-night.webp',
		hasResponsiveSet: false,
		archiveName: 'NASA Visible Earth / Earth Observatory',
		archiveId: 'VE-144898',
		sourceUrl:
			'https://visibleearth.nasa.gov/images/144898/earth-at-night-black-marble-2016-color-maps',
		directAssetUrl:
			'https://eoimages.gsfc.nasa.gov/images/imagerecords/144000/144898/BlackMarble_2016_3km.jpg',
		license: 'Public Domain — NASA Earth Observatory',
		creditLine:
			'Texture Credit: NASA Earth Observatory / Joshua Stevens & Suomi NPP VIIRS Science Team',
		year: 2016,
		caption:
			'Suomi NPP VIIRS Day/Night Band global composite mapping nocturnal city lights and human infrastructure on Earth’s night hemisphere.'
	},
	{
		id: 'earth-clouds',
		category: 'planet-texture',
		title: 'Global MODIS Cloud Fraction Map',
		bodyName: 'Earth (Cloud Layer)',
		localBasePath: '/assets/textures/earth-clouds.webp',
		hasResponsiveSet: false,
		archiveName: 'NASA Visible Earth / Goddard Space Flight Center',
		archiveId: 'VE-57747',
		sourceUrl: 'https://visibleearth.nasa.gov/images/57747/blue-marble-clouds',
		directAssetUrl:
			'https://eoimages.gsfc.nasa.gov/images/imagerecords/57000/57747/cloud_combined_2048.jpg',
		license: 'Public Domain — NASA Earth Observatory',
		creditLine:
			'Texture Credit: Reto Stöckli, NASA Goddard Space Flight Center (MODIS Global Cloud Composite)',
		year: 2002,
		caption:
			'Global cloud cover layer derived from Terra MODIS observations, rendered as an independent rotating atmospheric shell above the Blue Marble surface.'
	},
	{
		id: 'saturn-map',
		category: 'planet-texture',
		title: 'Cassini Natural-Color Atmospheric Band Cylindrical Map of Saturn',
		bodyName: 'Saturn',
		localBasePath: '/assets/textures/saturn-map.webp',
		hasResponsiveSet: false,
		archiveName: 'NASA / JPL-Caltech Planetary Photojournal',
		archiveId: 'PIA21888 / PIA17175',
		sourceUrl: 'https://photojournal.jpl.nasa.gov/catalog/PIA21888',
		directAssetUrl: 'https://images-assets.nasa.gov/image/PIA21888/PIA21888~orig.jpg',
		license: 'Public Domain — NASA/JPL-Caltech/SSI',
		creditLine:
			'Texture Credit: NASA / JPL-Caltech / Space Science Institute (Cassini ISS Atmospheric Band Mosaic, PIA21888 & PIA17175)',
		year: 2017,
		caption:
			'Cylindrical atmospheric band texture synthesized from Cassini Imaging Science Subsystem natural-color observations of Saturn’s zonal jet streams.'
	},
	{
		id: 'saturn-rings',
		category: 'planet-texture',
		title: 'Cassini Radial Ring Structure & Alpha Transparency Profile',
		bodyName: 'Saturn Rings (C, B, Cassini Division, A, Encke Gap, F)',
		localBasePath: '/assets/textures/saturn-rings.webp',
		hasResponsiveSet: false,
		archiveName: 'NASA / JPL-Caltech Planetary Photojournal',
		archiveId: 'PIA08361',
		sourceUrl: 'https://photojournal.jpl.nasa.gov/catalog/PIA08361',
		directAssetUrl: 'https://images-assets.nasa.gov/image/PIA08361/PIA08361~orig.jpg',
		license: 'Public Domain — NASA/JPL-Caltech/SSI',
		creditLine:
			'Texture Credit: NASA / JPL-Caltech / Space Science Institute (Cassini Ring Mosaic PIA08361)',
		year: 2007,
		caption:
			'1024×64 RGBA radial ring map preserving the optical depth and color variations of the C Ring, B Ring, Cassini Division, A Ring, Encke Gap, and F Ring.'
	},
	{
		id: 'titan-map',
		category: 'planet-texture',
		title: 'Cassini Global Cylindrical Surface Map of Titan',
		bodyName: 'Titan',
		localBasePath: '/assets/textures/titan-map.webp',
		hasResponsiveSet: false,
		archiveName: 'NASA / JPL-Caltech Planetary Photojournal',
		archiveId: 'PIA20016 / PIA14908',
		sourceUrl: 'https://photojournal.jpl.nasa.gov/catalog/PIA20016',
		directAssetUrl: 'https://images-assets.nasa.gov/image/PIA20016/PIA20016~orig.jpg',
		license: 'Public Domain — NASA/JPL-Caltech/SSI/Univ. of Arizona/Univ. of Nantes',
		creditLine:
			'Texture Credit: NASA / JPL-Caltech / Space Science Institute / University of Nantes / University of Arizona (PIA20016 & PIA14908)',
		year: 2015,
		caption:
			'Near-infrared global surface map of Saturn’s largest moon Titan from Cassini VIMS and ISS observations, penetrating the golden stratospheric haze to reveal Shangri-La and Xanadu.'
	},
	{
		id: 'enceladus-map',
		category: 'planet-texture',
		title: 'Cassini Global Color Mosaic of Enceladus',
		bodyName: 'Enceladus',
		localBasePath: '/assets/textures/enceladus-map.webp',
		hasResponsiveSet: false,
		archiveName: 'NASA / JPL-Caltech Planetary Photojournal',
		archiveId: 'PIA18435',
		sourceUrl: 'https://photojournal.jpl.nasa.gov/catalog/PIA18435',
		directAssetUrl: 'https://images-assets.nasa.gov/image/PIA18435/PIA18435~large.jpg',
		license: 'Public Domain — NASA/JPL-Caltech/SSI/LPI',
		creditLine:
			'Texture Credit: NASA / JPL-Caltech / Space Science Institute / Lunar and Planetary Institute (Paul Schenk, PIA18435)',
		year: 2014,
		caption:
			'Equirectangular enhanced-color global map of Enceladus highlighting its high-albedo water-ice crust and the fractured south polar "tiger stripes" (Damascus, Baghdad, Alexandria, and Cairo Sulci).'
	},
	{
		id: 'mars-map',
		category: 'planet-texture',
		title: 'Global Color Mosaic of Mars (Viking Orbiter & MRO MARCI)',
		bodyName: 'Mars',
		localBasePath: '/assets/textures/mars-map.webp',
		hasResponsiveSet: false,
		archiveName: 'NASA / JPL-Caltech Planetary Photojournal',
		archiveId: 'PIA00407 / PIA15963',
		sourceUrl: 'https://photojournal.jpl.nasa.gov/catalog/PIA00407',
		directAssetUrl: 'https://images-assets.nasa.gov/image/PIA00407/PIA00407~large.jpg',
		license: 'Public Domain — NASA/JPL/USGS/MSSS',
		creditLine:
			'Texture Credit: NASA / JPL / USGS / Malin Space Science Systems (PIA00407 & PIA15963)',
		year: 1998,
		caption:
			'Global color mosaic of Mars combining Viking Orbiter and Mars Reconnaissance Orbiter MARCI observations across Valles Marineris, Tharsis, and Syrtis Major.'
	},
	{
		id: 'pluto-map',
		category: 'planet-texture',
		title: 'New Horizons Global Cylindrical Color Map of Pluto',
		bodyName: 'Pluto',
		localBasePath: '/assets/textures/pluto-map.webp',
		hasResponsiveSet: false,
		archiveName: 'NASA / JPL-Caltech Planetary Photojournal / JHUAPL / SwRI',
		archiveId: 'PIA19956 / PIA11707',
		sourceUrl: 'https://photojournal.jpl.nasa.gov/catalog/PIA19956',
		directAssetUrl: 'https://images-assets.nasa.gov/image/PIA19956/PIA19956~orig.jpg',
		license: 'Public Domain — NASA/JHUAPL/SwRI',
		creditLine:
			'Texture Credit: NASA / Johns Hopkins University Applied Physics Laboratory / Southwest Research Institute (PIA19956)',
		year: 2015,
		caption:
			'Global cylindrical map of Pluto from New Horizons LORRI and Ralph/MVIC flyby observations, mapping the bright nitrogen plains of Sputnik Planitia and dark tholin-rich Cthulhu Macula.'
	}
];

export const CHAPTER_ART_BY_ID: Record<string, AssetManifestEntry> = {
	hero: ASSET_MANIFEST[0],
	prologue: ASSET_MANIFEST[1],
	'ch1-living-there': ASSET_MANIFEST[2],
	'ch2-eyes-universe': ASSET_MANIFEST[3],
	'ch3-long-reach': ASSET_MANIFEST[4],
	'ch4-reusable-revolution': ASSET_MANIFEST[5],
	'ch5-new-golden-age': ASSET_MANIFEST[6],
	epilogue: ASSET_MANIFEST[7],
	finale: ASSET_MANIFEST[8],
	'pale-blue-dot': ASSET_MANIFEST[1],
	'iss-earth-limb': ASSET_MANIFEST[2],
	'hubble-udf': ASSET_MANIFEST[3],
	'pluto-heart': ASSET_MANIFEST[4],
	'm87-black-hole': ASSET_MANIFEST[5],
	'jwst-carina': ASSET_MANIFEST[6],
	'cassini-saturn-eclipse': ASSET_MANIFEST[7],
	'milky-way-gaia': ASSET_MANIFEST[8]
};

export const ASSETS_MARKDOWN = `# Archival Imagery & 3D Planetary Texture Provenance (\`ASSETS.md\`)

Every photograph, panoramic star map, and 3D planetary surface texture rendered in **Fifty Years Beyond Earth (1976–2026)** is stored locally under \`./fifty-years-beyond-earth/static/assets/\` and served directly from \`/assets/...\` at runtime without external hotlinking.

All mission photographs and planetary maps originate from official public-domain or open-access scientific archives (**NASA Image and Video Library**, **NASA/JPL-Caltech Planetary Photojournal**, **NASA Earth Observatory / Visible Earth**, **NASA Scientific Visualization Studio**, **Space Telescope Science Institute**, and **ESO / Event Horizon Telescope Collaboration**).

---

## 1. Chapter & Editorial Archival Photographs (\`static/assets/chapters/\`)

Each editorial photograph is pre-encoded in six responsive variants (\`-800.avif\`, \`-1600.avif\`, \`-2400.avif\`, \`-800.webp\`, \`-1600.webp\`, \`-2400.webp\`) for \`<picture>\` art direction.

| Asset ID | Chapter Binding | Title | Archive & ID | Source Page URL | Direct Asset URL | License | Mandatory Credit Line | Local Files |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| \`pale-blue-dot\` | \`prologue\` | **Pale Blue Dot (Voyager 1 Family Portrait, 6.05 Billion km)** | NASA / JPL Photojournal (\`PIA00452\` / \`PIA23645\`) | <https://photojournal.jpl.nasa.gov/catalog/PIA23645> | <https://images-assets.nasa.gov/image/PIA23645/PIA23645~orig.jpg> | Public Domain — NASA/JPL-Caltech | \`Image Credit: NASA/JPL-Caltech (Voyager 1 Imaging Science Subsystem, Feb 14, 1990 / Remastered PIA23645 & PIA00452)\` | \`/assets/chapters/pale-blue-dot-{800,1600,2400}.{avif,webp}\` |
| \`iss-earth-limb\` | \`hero\`, \`ch1-living-there\` | **Earth Limb, Atmospheric Airglow & City Lights from Low Earth Orbit** | NASA Johnson Space Center / Image Library (\`iss035e017619\`) | <https://images.nasa.gov/details/iss035e017619> | <https://images-assets.nasa.gov/image/iss035e017619/iss035e017619~orig.jpg> | Public Domain — NASA/JSC | \`Image Credit: NASA / Johnson Space Center / Expedition 35 Crew (ISS035-E-017619)\` | \`/assets/chapters/iss-earth-limb-{800,1600,2400}.{avif,webp}\` |
| \`hubble-udf\` | \`ch2-eyes-universe\` | **Hubble Ultra Deep Field (10,000 Galaxies Across Cosmic Time)** | NASA / ESA / STScI (\`GSFC_20171208_Archive_e001061\` / \`STScI-PRC04-07a\`) | <https://images.nasa.gov/details/GSFC_20171208_Archive_e001061> | <https://images-assets.nasa.gov/image/GSFC_20171208_Archive_e001061/GSFC_20171208_Archive_e001061~orig.jpg> | Public Domain — NASA/ESA/STScI | \`Image Credit: NASA, ESA, H. Teplitz and M. Rafelski (IPAC/Caltech), A. Koekemoer (STScI), R. Windhorst (ASU), and Z. Levay (STScI)\` | \`/assets/chapters/hubble-udf-{800,1600,2400}.{avif,webp}\` |
| \`pluto-heart\` | \`ch3-long-reach\` | **Pluto & Tombaugh Regio ("The Heart") in Enhanced Color** | NASA / JPL Photojournal (\`PIA19952\`) | <https://photojournal.jpl.nasa.gov/catalog/PIA19952> | <https://images-assets.nasa.gov/image/PIA19952/PIA19952~orig.jpg> | Public Domain — NASA/JHUAPL/SwRI | \`Image Credit: NASA / Johns Hopkins University Applied Physics Laboratory / Southwest Research Institute (PIA19952)\` | \`/assets/chapters/pluto-heart-{800,1600,2400}.{avif,webp}\` |
| \`m87-black-hole\` | \`ch4-reusable-revolution\` | **First Horizon-Scale Image of the Supermassive Black Hole M87*** | EHT Collaboration / ESO / NASA (\`eso1907a\` / \`PIA23122\`) | <https://www.eso.org/public/images/eso1907a/> | <https://cdn.eso.org/images/large/eso1907a.jpg> | CC BY 4.0 — Event Horizon Telescope Collaboration / Public Domain — NASA/JPL-Caltech | \`Image Credit: Event Horizon Telescope Collaboration et al. (CC BY 4.0, eso1907a) / NASA/JPL-Caltech/Spitzer (PIA23122)\` | \`/assets/chapters/m87-black-hole-{800,1600,2400}.{avif,webp}\` |
| \`jwst-carina\` | \`ch5-new-golden-age\` | **JWST NIRCam "Cosmic Cliffs" in the Carina Nebula (NGC 3324)** | NASA / ESA / CSA / STScI (\`carina_nebula\`) | <https://images.nasa.gov/details/carina_nebula> | <https://images-assets.nasa.gov/image/carina_nebula/carina_nebula~orig.png> | Public Domain — NASA/ESA/CSA/STScI | \`Image Credit: NASA, ESA, CSA, and STScI (James Webb Space Telescope NIRCam, July 12, 2022)\` | \`/assets/chapters/jwst-carina-{800,1600,2400}.{avif,webp}\` |
| \`cassini-saturn-eclipse\` | \`epilogue\` | **The Day the Earth Smiled — Saturn in High-Phase Solar Eclipse** | NASA / JPL Photojournal (\`PIA17172\`) | <https://photojournal.jpl.nasa.gov/catalog/PIA17172> | <https://images-assets.nasa.gov/image/PIA17172/PIA17172~orig.jpg> | Public Domain — NASA/JPL-Caltech/SSI | \`Image Credit: NASA / JPL-Caltech / Space Science Institute (Cassini Imaging Team, July 19, 2013, PIA17172)\` | \`/assets/chapters/cassini-saturn-eclipse-{800,1600,2400}.{avif,webp}\` |

---

## 2. Finale All-Sky Milky Way Panorama (\`static/assets/finale/\`)

| Asset ID | Section | Title | Archive & ID | Source Page URL | Direct Asset URL | License | Mandatory Credit Line | Local Files |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| \`milky-way-gaia\` | \`finale\` | **All-Sky Milky Way Galactic Plane Panorama (Gaia DR2 / SVS 4851 & ESO)** | NASA SVS (\`SVS-4851\`) & ESO (\`eso0932a\`) | <https://svs.gsfc.nasa.gov/4851> | <https://svs.gsfc.nasa.gov/vis/a000000/a004800/a004851/milkyway_2020_4k_gal_print.jpg> | Public Domain — NASA/GSFC SVS & CC BY 4.0 — ESO/S. Brunier | \`Image Credit: NASA/Goddard Space Flight Center Scientific Visualization Studio (Ernie Wright, SVS 4851, Gaia DR2) & ESO/S. Brunier (CC BY 4.0, eso0932a)\` | \`/assets/finale/milky-way-gaia-{800,1600,2400}.{avif,webp}\` |

---

## 3. 3D Planetary Surface & Ring Textures (\`static/assets/textures/\`)

| Asset ID | Target 3D Body | Title | Resolution | Archive & ID | Source Page URL | Direct Asset URL | License | Mandatory Credit Line | Local File |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| \`earth-day\` | Earth (\`EarthLeoScene\`, \`EarthGlobe\`) | **Blue Marble: Next Generation Global Day Map** | \`2048×1024\` | NASA Visible Earth (\`73909\`) | <https://visibleearth.nasa.gov/images/73909/december-blue-marble-next-generation-w-topography-and-bathymetry> | <https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73909/world.topo.bathy.200412.3x5400x2700.jpg> | Public Domain — NASA Earth Observatory | \`Texture Credit: Reto Stöckli, NASA Earth Observatory / Goddard Space Flight Center\` | \`/assets/textures/earth-day.webp\` |
| \`earth-night\` | Earth (\`EarthLeoScene\`, \`EarthGlobe\`) | **Earth at Night (Black Marble Global Anthropogenic Light Map)** | \`2048×1024\` | NASA Visible Earth (\`144898\`) | <https://visibleearth.nasa.gov/images/144898/earth-at-night-black-marble-2016-color-maps> | <https://eoimages.gsfc.nasa.gov/images/imagerecords/144000/144898/BlackMarble_2016_3km.jpg> | Public Domain — NASA Earth Observatory | \`Texture Credit: NASA Earth Observatory / Joshua Stevens & Suomi NPP VIIRS Science Team\` | \`/assets/textures/earth-night.webp\` |
| \`earth-clouds\` | Earth (\`EarthLeoScene\`, \`EarthGlobe\`) | **Global MODIS Cloud Fraction Map** | \`2048×1024\` | NASA Visible Earth (\`57747\`) | <https://visibleearth.nasa.gov/images/57747/blue-marble-clouds> | <https://eoimages.gsfc.nasa.gov/images/imagerecords/57000/57747/cloud_combined_2048.jpg> | Public Domain — NASA Earth Observatory | \`Texture Credit: Reto Stöckli, NASA Goddard Space Flight Center (MODIS Global Cloud Composite)\` | \`/assets/textures/earth-clouds.webp\` |
| \`saturn-map\` | Saturn (\`CassiniScene\`) | **Cassini Natural-Color Atmospheric Band Cylindrical Map of Saturn** | \`2048×1024\` | NASA / JPL Photojournal (\`PIA21888\` & \`PIA17175\`) | <https://photojournal.jpl.nasa.gov/catalog/PIA21888> | <https://images-assets.nasa.gov/image/PIA21888/PIA21888~orig.jpg> | Public Domain — NASA/JPL-Caltech/SSI | \`Texture Credit: NASA / JPL-Caltech / Space Science Institute (Cassini ISS Atmospheric Band Mosaic, PIA21888 & PIA17175)\` | \`/assets/textures/saturn-map.webp\` |
| \`saturn-rings\` | Saturn Rings (\`CassiniScene\`) | **Cassini Radial Ring Structure & Alpha Transparency Profile (C, B, Cassini Division, A, Encke Gap, F)** | \`1024×64\` (RGBA) | NASA / JPL Photojournal (\`PIA08361\`) | <https://photojournal.jpl.nasa.gov/catalog/PIA08361> | <https://images-assets.nasa.gov/image/PIA08361/PIA08361~orig.jpg> | Public Domain — NASA/JPL-Caltech/SSI | \`Texture Credit: NASA / JPL-Caltech / Space Science Institute (Cassini Ring Mosaic PIA08361)\` | \`/assets/textures/saturn-rings.webp\` |
| \`titan-map\` | Titan (\`CassiniScene\`) | **Cassini Global Cylindrical Surface Map of Titan** | \`1024×512\` | NASA / JPL Photojournal (\`PIA20016\` & \`PIA14908\`) | <https://photojournal.jpl.nasa.gov/catalog/PIA20016> | <https://images-assets.nasa.gov/image/PIA20016/PIA20016~orig.jpg> | Public Domain — NASA/JPL-Caltech/SSI/Univ. of Arizona/Univ. of Nantes | \`Texture Credit: NASA / JPL-Caltech / Space Science Institute / University of Nantes / University of Arizona (PIA20016 & PIA14908)\` | \`/assets/textures/titan-map.webp\` |
| \`enceladus-map\` | Enceladus (\`CassiniScene\`) | **Cassini Global Color Mosaic of Enceladus** | \`1024×512\` | NASA / JPL Photojournal (\`PIA18435\`) | <https://photojournal.jpl.nasa.gov/catalog/PIA18435> | <https://images-assets.nasa.gov/image/PIA18435/PIA18435~large.jpg> | Public Domain — NASA/JPL-Caltech/SSI/LPI | \`Texture Credit: NASA / JPL-Caltech / Space Science Institute / Lunar and Planetary Institute (Paul Schenk, PIA18435)\` | \`/assets/textures/enceladus-map.webp\` |
| \`mars-map\` | Mars (\`VoyagerScene\`) | **Global Color Mosaic of Mars (Viking Orbiter & MRO MARCI)** | \`1024×512\` | NASA / JPL Photojournal (\`PIA00407\` & \`PIA15963\`) | <https://photojournal.jpl.nasa.gov/catalog/PIA00407> | <https://images-assets.nasa.gov/image/PIA00407/PIA00407~large.jpg> | Public Domain — NASA/JPL/USGS/MSSS | \`Texture Credit: NASA / JPL / USGS / Malin Space Science Systems (PIA00407 & PIA15963)\` | \`/assets/textures/mars-map.webp\` |
| \`pluto-map\` | Pluto (\`VoyagerScene\`) | **New Horizons Global Cylindrical Color Map of Pluto** | \`1024×512\` | NASA / JPL Photojournal (\`PIA19956\` & \`PIA11707\`) | <https://photojournal.jpl.nasa.gov/catalog/PIA19956> | <https://images-assets.nasa.gov/image/PIA19956/PIA19956~orig.jpg> | Public Domain — NASA/JHUAPL/SwRI | \`Texture Credit: NASA / Johns Hopkins University Applied Physics Laboratory / Southwest Research Institute (PIA19956)\` | \`/assets/textures/pluto-map.webp\` |
`;

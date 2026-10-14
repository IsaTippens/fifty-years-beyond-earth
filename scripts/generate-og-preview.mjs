import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const staticDir = path.resolve('static');

// 1. Generate 1200x630 og-image.jpg and og-image.png
async function generateOgImages() {
	const baseImagePath = path.join(staticDir, 'assets/chapters/iss-earth-limb-1600.webp');
	
	// Darkened background image with vignette
	const bgResized = await sharp(baseImagePath)
		.resize(1200, 630, { fit: 'cover', position: 'center' })
		.modulate({ brightness: 0.72, saturation: 0.85 })
		.toBuffer();

	// SVG text and brand overlay matching the "Quiet Space Documentary" design language
	const svgOverlay = `
	<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
		<defs>
			<radialGradient id="vignette" cx="50%" cy="50%" r="55%">
				<stop offset="35%" stop-color="#050607" stop-opacity="0.3" />
				<stop offset="75%" stop-color="#050607" stop-opacity="0.75" />
				<stop offset="100%" stop-color="#050607" stop-opacity="0.95" />
			</radialGradient>
			<linearGradient id="scrim" x1="0%" y1="0%" x2="0%" y2="100%">
				<stop offset="0%" stop-color="#050607" stop-opacity="0.7" />
				<stop offset="50%" stop-color="#050607" stop-opacity="0.3" />
				<stop offset="100%" stop-color="#050607" stop-opacity="0.9" />
			</linearGradient>
		</defs>

		<!-- Dark scrims for high-contrast legibility -->
		<rect width="1200" height="630" fill="url(#scrim)" />
		<rect width="1200" height="630" fill="url(#vignette)" />

		<!-- Border hairline -->
		<rect x="24" y="24" width="1152" height="582" fill="none" stroke="#E8E6E1" stroke-opacity="0.12" stroke-width="1" rx="4" />

		<!-- Eyebrow Telemetry -->
		<g transform="translate(80, 110)">
			<circle cx="6" cy="6" r="4" fill="#C89B57" />
			<text x="24" y="10" font-family="monospace, monospace" font-size="13" font-weight="600" letter-spacing="3" fill="#C89B57" text-transform="uppercase">
				1975 — 2026+ · INTERACTIVE SPACE EXPLORATION CHRONICLE
			</text>
		</g>

		<!-- Main Display Heading (Fraunces serif look) -->
		<text x="80" y="230" font-family="Georgia, 'Times New Roman', serif" font-size="82" font-weight="normal" fill="#E8E6E1" letter-spacing="-1.5">
			Fifty Years
		</text>
		<text x="80" y="325" font-family="Georgia, 'Times New Roman', serif" font-size="82" font-weight="normal" fill="#E8E6E1" letter-spacing="-1.5">
			Beyond Earth
		</text>

		<!-- Subtitle in warm amber italic -->
		<text x="82" y="385" font-family="Georgia, 'Times New Roman', serif" font-style="italic" font-size="28" fill="#C89B57" letter-spacing="0">
			From Apollo–Soyuz to Interstellar Frontiers
		</text>

		<!-- Narrative Lead -->
		<text x="82" y="445" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" fill="#E8E6E1" fill-opacity="0.75">
			Humanity's greatest achievements in orbit, across the solar system, and into the dark.
		</text>

		<!-- Bottom Key Metrics Bar -->
		<line x1="80" y1="495" x2="1120" y2="495" stroke="#E8E6E1" stroke-opacity="0.15" stroke-width="1" />

		<g transform="translate(80, 545)">
			<!-- Stat 1 -->
			<text x="0" y="0" font-family="Georgia, serif" font-size="28" fill="#C89B57">29</text>
			<text x="45" y="-3" font-family="monospace" font-size="12" letter-spacing="1.5" fill="#E8E6E1" fill-opacity="0.7">VERIFIED MILESTONES</text>

			<!-- Stat 2 -->
			<text x="320" y="0" font-family="Georgia, serif" font-size="28" fill="#C89B57">340 AU</text>
			<text x="430" y="-3" font-family="monospace" font-size="12" letter-spacing="1.5" fill="#E8E6E1" fill-opacity="0.7">SCROLL SPAN</text>

			<!-- Stat 3 -->
			<text x="640" y="0" font-family="Georgia, serif" font-size="28" fill="#C89B57">6,400+</text>
			<text x="745" y="-3" font-family="monospace" font-size="12" letter-spacing="1.5" fill="#E8E6E1" fill-opacity="0.7">EXOPLANETS</text>
		</g>
	</svg>`;

	const composited = await sharp(bgResized)
		.composite([{ input: Buffer.from(svgOverlay), top: 0, left: 0 }])
		.toBuffer();

	// Save og-image.jpg
	await sharp(composited)
		.jpeg({ quality: 90, chromaSubsampling: '4:4:4' })
		.toFile(path.join(staticDir, 'og-image.jpg'));

	// Save og-image.png
	await sharp(composited)
		.png({ compressionLevel: 8 })
		.toFile(path.join(staticDir, 'og-image.png'));

	console.log('Generated og-image.jpg and og-image.png');
}

// 2. Generate apple-touch-icon.png and favicon-32x32.png from favicon.svg
async function generateFavicons() {
	const svgBuffer = fs.readFileSync(path.join(staticDir, 'favicon.svg'));

	await sharp(svgBuffer)
		.resize(180, 180)
		.png()
		.toFile(path.join(staticDir, 'apple-touch-icon.png'));

	await sharp(svgBuffer)
		.resize(32, 32)
		.png()
		.toFile(path.join(staticDir, 'favicon-32x32.png'));

	console.log('Generated apple-touch-icon.png and favicon-32x32.png');
}

await generateOgImages();
await generateFavicons();

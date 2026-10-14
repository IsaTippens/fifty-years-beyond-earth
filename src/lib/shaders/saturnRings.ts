/**
 * Bespoke GLSL Shaders for Set Piece #1: Saturn's Rings as Cassini–Huygens Arrives
 *
 * Includes:
 * 1. SATURN_BODY_VERTEX_SHADER & SATURN_BODY_FRAGMENT_SHADER
 *    - Oblate gas giant atmospheric zonal jet bands (ammonia/phosphine gold, ochre, cream, slate)
 *    - North polar hexagonal Rossby standing wave (6-sided jet stream at ~78°N) & polar cyclone
 *    - Rayleigh/Mie golden limb haze & ring-shine illumination on the nightside hemisphere
 *    - Analytical ring shadow bands cast across Saturn's sunlit clouds
 *
 * 2. SATURN_RINGS_VERTEX_SHADER & SATURN_RINGS_FRAGMENT_SHADER
 *    - High-frequency procedural radial optical depth profile (D, C, B, Cassini Division, A, Encke Gap, Keeler Gap, F)
 *    - Double Henyey-Greenstein ice-particle Mie forward/back scattering phase function
 *    - Real-time analytical cylindrical shadow casting of Saturn's oblate spheroid across the ring plane
 *
 * 3. TITAN_HAZE_VERTEX_SHADER & TITAN_HAZE_FRAGMENT_SHADER
 *    - Thick nitrogen-methane orange photochemical tholin haze
 *    - Detached high-altitude blue/violet aerosol layer at the grazing limb
 */

export const SATURN_EQUATORIAL_RADIUS_KM = 60268;
export const SATURN_POLAR_RADIUS_KM = 54364;
export const SATURN_OBLATENESS_RATIO = SATURN_POLAR_RADIUS_KM / SATURN_EQUATORIAL_RADIUS_KM; // ~0.902037

export const RING_INNER_RADIUS_KM = 66900; // Inner D ring edge
export const RING_OUTER_RADIUS_KM = 140600; // Outer F ring envelope

export interface RingSampleTelemetry {
	radiusKm: number;
	saturnRadii: number;
	regionName: string;
	opticalDepthTau: number;
	orbitalVelocityKmS: number;
	description: string;
}

/**
 * Deterministic CPU-side optical depth & ring region evaluator matching the GLSL radial profile
 * Used by the live interactive telemetry overlay in SaturnCassiniScene.svelte.
 */
export function sampleRingProfileAtRadiusKm(radiusKm: number): RingSampleTelemetry {
	const clampedKm = Math.max(RING_INNER_RADIUS_KM, Math.min(RING_OUTER_RADIUS_KM, radiusKm));
	const saturnRadii = clampedKm / SATURN_EQUATORIAL_RADIUS_KM;
	// GM_Saturn = 3.7931187e7 km^3/s^2
	const orbitalVelocityKmS = Math.sqrt(3.7931187e7 / clampedKm);

	let regionName = 'B Ring (Main Dense Core)';
	let opticalDepthTau = 1.45;
	let description = 'High-albedo water-ice aggregate ringlets sculpted by spiral density waves.';

	if (clampedKm < 74510) {
		regionName = 'D Ring (Innermost Whisper)';
		opticalDepthTau = 0.02 + 0.015 * Math.sin((clampedKm - 66900) * 0.012);
		description = 'Ultra-tenuous dusty inward drift sheet between the C ring and upper cloud tops.';
	} else if (clampedKm < 92000) {
		if (Math.abs(clampedKm - 77870) < 180) {
			regionName = 'Colombo Gap & Titan Ringlet';
			opticalDepthTau = 0.015;
			description = 'Apsidal resonance gap in the inner C ring governed by Titan orbital forcing.';
		} else if (Math.abs(clampedKm - 87490) < 270) {
			regionName = 'Maxwell Gap & Eccentric Ringlet';
			opticalDepthTau = 0.02;
			description = '270 km C-ring clearance containing a sharp, non-circular dense ringlet.';
		} else {
			regionName = 'C Ring (Crepe Ring)';
			opticalDepthTau = 0.11 + 0.04 * Math.sin((clampedKm - 74510) * 0.004);
			description = 'Semi-transparent plateau of water ice darkened by carbonaceous silicate dust.';
		}
	} else if (clampedKm < 117580) {
		const normB = (clampedKm - 92000) / (117580 - 92000);
		regionName = normB > 0.65 ? 'Outer B Ring & Electrostatic Spokes' : 'B Ring (High-Density Core)';
		opticalDepthTau = 1.15 + 1.1 * Math.sin(normB * Math.PI) + 0.22 * Math.cos(clampedKm * 0.018);
		description =
			'Optically thick cream-gold water-ice sheet exhibiting self-gravity wakes and radial spokes.';
	} else if (clampedKm < 122170) {
		regionName = 'Cassini Division (4,800 km Gap)';
		opticalDepthTau = clampedKm < 118000 ? 0.008 : 0.055;
		description = 'Scoured by the 2:1 orbital Lindblad resonance with Saturnian moon Mimas.';
	} else if (clampedKm < 136775) {
		if (Math.abs(clampedKm - 133589) < 220) {
			regionName = 'Encke Gap (325 km — Shepherd Moon Pan)';
			opticalDepthTau = 0.005;
			description = 'Cleared by the 28-km walnut-shaped shepherd moon Pan; hosts kinked dusty ringlets.';
		} else if (Math.abs(clampedKm - 136505) < 60) {
			regionName = 'Keeler Gap (42 km — Shepherd Moon Daphnis)';
			opticalDepthTau = 0.004;
			description = 'Narrow outer A-ring channel where Daphnis excites vertical 1-km edge waves.';
		} else {
			regionName = 'A Ring (Spiral Density Wave Zone)';
			opticalDepthTau = 0.48 + 0.12 * Math.sin((clampedKm - 122170) * 0.007);
			description = 'Crystalline water-ice disk threaded with Janus/Epimetheus spiral density waves.';
		}
	} else if (clampedKm < 139800) {
		regionName = 'Roche Division (Tenuous Dust Sheet)';
		opticalDepthTau = 0.012;
		description = 'Diffused micron-sized ice dust separating the outer A ring edge from the F ring.';
	} else {
		regionName = 'F Ring (Braided Shepherd Ribbon)';
		opticalDepthTau = 0.28;
		description = 'Dynamic narrow ribbon confined and braided by shepherd moons Prometheus & Pandora.';
	}

	return {
		radiusKm: Math.round(clampedKm),
		saturnRadii: Number(saturnRadii.toFixed(3)),
		regionName,
		opticalDepthTau: Number(Math.max(0.002, opticalDepthTau).toFixed(3)),
		orbitalVelocityKmS: Number(orbitalVelocityKmS.toFixed(2)),
		description
	};
}

export const SATURN_BODY_VERTEX_SHADER = /* glsl */ `
varying vec3 vLocalPos;
varying vec3 vWorldPos;
varying vec3 vWorldNormal;
varying vec3 vViewPosition;
varying vec2 vUv;

void main() {
	vUv = uv;
	vLocalPos = position;

	vec4 worldPosition = modelMatrix * vec4(position, 1.0);
	vWorldPos = worldPosition.xyz;
	vWorldNormal = normalize(mat3(modelMatrix) * normal);

	vec4 mvPosition = viewMatrix * worldPosition;
	vViewPosition = -mvPosition.xyz;

	gl_Position = projectionMatrix * mvPosition;
}
`;

export const SATURN_BODY_FRAGMENT_SHADER = /* glsl */ `
precision highp float;

uniform vec3 uSunDirection;
uniform float uTime;
uniform float uRingTiltRadians;
uniform vec3 uRingNormal;
uniform float uPlanetRadius;
uniform float uRingInnerRadius;
uniform float uRingOuterRadius;
uniform sampler2D uSaturnMap;
uniform float uHasSaturnMap;
varying vec3 vLocalPos;
varying vec3 vWorldPos;
varying vec3 vWorldNormal;
varying vec3 vViewPosition;
varying vec2 vUv;

// Fast procedural hash & 3D value noise for atmospheric eddies
float hash31(vec3 p) {
	p = fract(p * vec3(443.897, 441.423, 437.195));
	p += dot(p, p.yzx + 19.19);
	return fract((p.x + p.y) * p.z);
}

float noise3D(vec3 p) {
	vec3 i = floor(p);
	vec3 f = fract(p);
	f = f * f * (3.0 - 2.0 * f);

	return mix(
		mix(
			mix(hash31(i + vec3(0.0, 0.0, 0.0)), hash31(i + vec3(1.0, 0.0, 0.0)), f.x),
			mix(hash31(i + vec3(0.0, 1.0, 0.0)), hash31(i + vec3(1.0, 1.0, 0.0)), f.x),
			f.y
		),
		mix(
			mix(hash31(i + vec3(0.0, 0.0, 1.0)), hash31(i + vec3(1.0, 0.0, 1.0)), f.x),
			mix(hash31(i + vec3(0.0, 1.0, 1.0)), hash31(i + vec3(1.0, 1.0, 1.0)), f.x),
			f.y
		),
		f.z
	);
}

float fbm3D(vec3 p) {
	float v = 0.0;
	float amp = 0.5;
	for (int i = 0; i < 4; i++) {
		v += amp * noise3D(p);
		p = p * 2.07 + vec3(13.7, -7.3, 5.1);
		amp *= 0.5;
	}
	return v;
}

// Simplified ring optical depth lookup for casting ring shadows onto Saturn's cloud tops
float sampleRingShadowTau(float rNorm) {
	if (rNorm < 0.0 || rNorm > 1.0) return 0.0;
	// Map 0..1 across 66,900..140,600 km
	float rKm = mix(66900.0, 140600.0, rNorm);
	if (rKm < 74510.0) return 0.03;
	if (rKm < 92000.0) return 0.14 + 0.05 * sin(rKm * 0.004);
	if (rKm < 117580.0) return 0.72 + 0.18 * sin(rKm * 0.008);
	if (rKm < 122170.0) return 0.04; // Cassini Division lets sunlight through!
	if (rKm < 136775.0) {
		float encke = smoothstep(160.0, 320.0, abs(rKm - 133589.0));
		return 0.42 * encke;
	}
	return 0.02;
}

void main() {
	vec3 N = normalize(vWorldNormal);
	vec3 V = normalize(cameraPosition - vWorldPos);
	vec3 L = normalize(uSunDirection);

	// Normalized planet-centric coordinates (accounting for oblateness)
	vec3 normLocal = normalize(vLocalPos * vec3(1.0, 1.1086, 1.0));
	float lat = asin(clamp(normLocal.y, -1.0, 1.0)); // -PI/2 to +PI/2
	float lon = atan(normLocal.z, normLocal.x);

	// Differential zonal wind rotation speed (equatorial super-rotation up to 500 m/s)
	float equatorialBoost = exp(-lat * lat * 4.5);
	float rotLon = lon - uTime * (0.04 + 0.05 * equatorialBoost);

	// Atmospheric turbulence & ribbon wave perturbation
	vec3 noiseCoord = vec3(rotLon * 2.2, lat * 14.0, uTime * 0.02);
	float turb = fbm3D(noiseCoord) - 0.5;
	float fineTurb = fbm3D(noiseCoord * 3.1 + vec3(4.2, -1.9, 2.7)) - 0.5;

	// North Polar Hexagon wave modulation around ~78°N (lat ~ 1.36 rad)
	float hexWave = cos(6.0 * (lon - uTime * 0.035)) * 0.026 + cos(12.0 * (lon - uTime * 0.035)) * 0.005;
	float hexLat = lat + hexWave * smoothstep(1.05, 1.38, lat);

	// Perturbed latitude for zonal jet bands
	float yBand = sin(hexLat) + turb * 0.032 + fineTurb * 0.012;

	// Saturn atmospheric palette (ammonia ice cream, phosphine gold, warm ochre, deep amber, polar slate-teal)
	vec3 colEquatorialCream = vec3(0.95, 0.89, 0.74);
	vec3 colWarmGold        = vec3(0.86, 0.73, 0.51);
	vec3 colOchreBand       = vec3(0.76, 0.60, 0.40);
	vec3 colSoftTaupe       = vec3(0.69, 0.58, 0.45);
	vec3 colTemperateAmber  = vec3(0.81, 0.68, 0.48);
	vec3 colSubpolarOlive   = vec3(0.56, 0.53, 0.45);
	vec3 colNorthHexSlate   = vec3(0.32, 0.41, 0.48);
	vec3 colPolarVortex     = vec3(0.18, 0.26, 0.34);

	// Multi-frequency zonal jet stream profile
	float b1 = sin(yBand * 24.0) * 0.5 + 0.5;
	float b2 = cos(yBand * 52.0 + 0.7 + turb * 2.5) * 0.5 + 0.5;
	float b3 = sin(yBand * 110.0 - fineTurb * 4.0) * 0.5 + 0.5;

	vec3 bandColor = mix(colWarmGold, colOchreBand, smoothstep(0.2, 0.8, b1));
	bandColor = mix(bandColor, colSoftTaupe, b2 * 0.38);
	bandColor = mix(bandColor, colTemperateAmber, b3 * 0.18);

	// Bright Equatorial Zone (EZ) ammonia cloud deck
	float ezMask = exp(-yBand * yBand * 22.0);
	bandColor = mix(bandColor, colEquatorialCream, ezMask * 0.78);

	// Subtle Great White Spot / mid-northern convective storm plume at ~35°N
	float stormLat = lat - 0.61;
	float stormLon = mod(rotLon + 3.14159, 6.28318) - 3.14159;
	float stormCore = exp(-(stormLat * stormLat * 180.0 + stormLon * stormLon * 12.0));
	float stormTail = exp(-stormLat * stormLat * 240.0) * smoothstep(-1.8, 0.2, stormLon) * smoothstep(0.5, -0.1, stormLon);
	bandColor = mix(bandColor, vec3(0.98, 0.95, 0.86), clamp(stormCore * 0.55 + stormTail * 0.25 * (0.5 + fineTurb), 0.0, 0.65));

	// Subpolar transition
	float highLatMask = smoothstep(0.68, 0.88, abs(yBand));
	bandColor = mix(bandColor, colSubpolarOlive, highLatMask * 0.65);

	// North Polar Hexagon boundary (~78°N) & central dark hurricane eye
	float hexJetMask = smoothstep(1.24, 1.31, hexLat);
	float hexEdgeRibbon = exp(-pow((hexLat - 1.295) * 42.0, 2.0));
	bandColor = mix(bandColor, colNorthHexSlate, hexJetMask * 0.88);
	bandColor = mix(bandColor, vec3(0.84, 0.78, 0.62), hexEdgeRibbon * 0.55);

	float polarEyeMask = smoothstep(1.42, 1.54, hexLat);
	bandColor = mix(bandColor, colPolarVortex, polarEyeMask);

	if (uHasSaturnMap > 0.5) {
		vec3 saturnTex = texture2D(uSaturnMap, vec2(fract(rotLon / 6.2831853 + 0.5), lat / 3.14159265 + 0.5)).rgb;
		vec3 saturnLinear = pow(max(saturnTex, vec3(0.0)), vec3(1.12)) * vec3(1.04, 0.99, 0.92);
		// Preserve polar hexagon & micro-turbulence while anchoring to Cassini cylindrical mosaic
		float polarHexPreserve = smoothstep(1.18, 1.38, hexLat) * 0.55;
		bandColor = mix(bandColor, saturnLinear, 0.68 * (1.0 - polarHexPreserve));
	}
	// Analytical Ring Shadow cast onto Saturn's sunlit atmosphere!
	// Intersect ray p + t * L with ring plane (normal = uRingNormal, passing through origin)
	float ringShadowAtten = 1.0;
	float denom = dot(L, uRingNormal);
	if (abs(denom) > 0.0001) {
		float tRing = -dot(vWorldPos, uRingNormal) / denom;
		if (tRing > 0.0) {
			vec3 hitRing = vWorldPos + tRing * L;
			float hitRadius = length(hitRing);
			float rNorm = (hitRadius - uRingInnerRadius) / (uRingOuterRadius - uRingInnerRadius);
			float tau = sampleRingShadowTau(rNorm);
			ringShadowAtten = mix(1.0, exp(-tau * 1.45), smoothstep(0.0, 0.02, rNorm) * smoothstep(1.0, 0.98, rNorm));
		}
	}

	// Diffuse + Minnaert limb darkening for thick gas giant atmosphere
	float NdotL = dot(N, L);
	float NdotV = max(dot(N, V), 0.001);
	float terminator = smoothstep(-0.14, 0.18, NdotL);
	float minnaert = pow(max(NdotL, 0.0), 0.72) * pow(NdotV, 0.18);
	float diffuse = max(minnaert, 0.0) * terminator * ringShadowAtten;

	// Twilight atmospheric scattering along the terminator
	float twilight = exp(-pow((NdotL + 0.02) * 6.5, 2.0)) * 0.14;
	vec3 twilightColor = vec3(0.82, 0.48, 0.24) * twilight * ringShadowAtten;

	// Ring-shine illumination on Saturn's nightside hemisphere!
	// Sunlit rings reflect warm golden-amber light back onto the dark side of Saturn
	float nightsideMask = smoothstep(0.25, -0.25, NdotL);
	float midLatRingView = exp(-pow(abs(lat) - 0.48, 2.0) * 4.5);
	vec3 ringShine = vec3(0.16, 0.14, 0.10) * nightsideMask * midLatRingView * 0.55;
	vec3 ambientNight = vec3(0.014, 0.015, 0.018) * bandColor;

	// Natural, filmic warm ochre/ivory Rayleigh atmospheric haze (soft, zero hard Fresnel ring)
	float softLimb = smoothstep(0.0, 0.85, 1.0 - NdotV) * (1.0 - pow(NdotV, 0.55));
	float sunForward = pow(max(dot(V, -L), 0.0), 2.0);
	vec3 limbHazeColor = mix(vec3(0.90, 0.79, 0.58), vec3(0.95, 0.91, 0.83), 0.35 + 0.35 * sunForward);
	float limbSunFactor = smoothstep(-0.25, 0.45, NdotL) * 0.55 + sunForward * 0.25;
	vec3 limbGlow = limbHazeColor * softLimb * limbSunFactor * 0.24;

	vec3 finalColor = bandColor * diffuse + twilightColor + ringShine + ambientNight + limbGlow;
	gl_FragColor = vec4(finalColor, 1.0);
}
`;

export const SATURN_RINGS_VERTEX_SHADER = /* glsl */ `
varying vec3 vLocalPos;
varying vec3 vWorldPos;
varying vec3 vWorldNormal;
varying vec2 vUv;

void main() {
	vUv = uv;
	vLocalPos = position;

	vec4 worldPosition = modelMatrix * vec4(position, 1.0);
	vWorldPos = worldPosition.xyz;
	vWorldNormal = normalize(mat3(modelMatrix) * normal);

	gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
`;

export const SATURN_RINGS_FRAGMENT_SHADER = /* glsl */ `
precision highp float;

uniform vec3 uSunDirection;
uniform float uTime;
uniform float uInnerRadius;
uniform float uOuterRadius;
uniform float uPlanetEquatorialRadius;
uniform float uPlanetOblatenessRatio; // R_polar / R_equatorial (~0.902)
uniform vec3 uRingNormal;             // Unit normal of Saturn's ring / polar axis in world space
uniform float uHighlightRadiusKm;     // Optional radial cursor highlight (0 = disabled)
uniform sampler2D uRingTex;
uniform float uHasRingTex;
varying vec3 vLocalPos;
varying vec3 vWorldPos;
varying vec3 vWorldNormal;
varying vec2 vUv;

// Henyey-Greenstein phase function for ice crystal scattering
float henyeyGreenstein(float cosTheta, float g) {
	float g2 = g * g;
	float denom = pow(max(1.0 + g2 - 2.0 * g * cosTheta, 0.0001), 1.5);
	return (1.0 - g2) / (4.0 * 3.14159265 * denom);
}

void main() {
	float rScene = length(vLocalPos.xz);
	float rNorm = (rScene - uInnerRadius) / max(uOuterRadius - uInnerRadius, 0.0001);

	if (rNorm < 0.0 || rNorm > 1.0) {
		discard;
	}

	// Physical radial distance from Saturn center in kilometers (66,900 km to 140,600 km)
	float rKm = mix(66900.0, 140600.0, rNorm);
	float theta = atan(vLocalPos.z, vLocalPos.x);

	// High-frequency radial ringlet waves (combinations of non-repeating sines)
	float waveFine   = sin(rKm * 0.085) * 0.5 + 0.5;
	float waveMed    = sin(rKm * 0.023 + 1.4) * 0.5 + 0.5;
	float waveCoarse = cos(rKm * 0.0062 - 0.8) * 0.5 + 0.5;
	float waveUltra  = sin(rKm * 0.24 + cos(rKm * 0.031) * 2.0) * 0.5 + 0.5;

	// Region masks in km
	// 1. D Ring: 66,900 - 74,510 km
	float maskD = smoothstep(66900.0, 67800.0, rKm) * (1.0 - smoothstep(74200.0, 74658.0, rKm));

	// 2. C Ring (Crepe Ring): 74,658 - 92,000 km
	float maskC = smoothstep(74450.0, 74850.0, rKm) * (1.0 - smoothstep(91750.0, 92150.0, rKm));
	// Colombo Gap (77,870 km) & Maxwell Gap (87,490 km)
	float colomboGap = smoothstep(90.0, 260.0, abs(rKm - 77870.0));
	float maxwellGap = smoothstep(120.0, 340.0, abs(rKm - 87490.0));
	// Eccentric Maxwell Ringlet inside Maxwell Gap
	float maxwellRinglet = exp(-pow((rKm - (87490.0 + 35.0 * cos(theta - uTime * 0.2))) / 42.0, 2.0)) * 0.45;

	// 3. B Ring (Main Bright Dense Ring): 92,000 - 117,580 km
	float maskB = smoothstep(91850.0, 92250.0, rKm) * (1.0 - smoothstep(117350.0, 117680.0, rKm));
	float bSubProfile = 0.65
		+ 0.25 * sin((rKm - 92000.0) / 25580.0 * 3.14159)
		+ 0.18 * waveCoarse
		+ 0.14 * waveMed
		+ 0.11 * waveFine
		+ 0.07 * waveUltra;

	// Electrostatic radial "spokes" across the outer B ring (~102,000 - 115,000 km)
	float spokeRadial = exp(-pow((rKm - 108500.0) / 5200.0, 2.0));
	float spokeAzimuth = pow(max(sin(theta * 9.0 - uTime * 0.12 + sin(theta * 4.0) * 1.3), 0.0), 6.0);
	float spokes = spokeRadial * spokeAzimuth * 0.18;

	// 4. Cassini Division (4,800 km gap): 117,580 - 122,170 km
	float maskCassiniDiv = smoothstep(117500.0, 117750.0, rKm) * (1.0 - smoothstep(121950.0, 122250.0, rKm));
	// Sharp Huygens Gap on inner edge (117,580 - 118,000 km), faint plateau ringlets in outer half
	float cassiniInternal = smoothstep(118100.0, 118600.0, rKm) * (0.045 + 0.035 * waveMed * waveFine);

	// 5. A Ring: 122,170 - 136,775 km
	float maskA = smoothstep(122050.0, 122320.0, rKm) * (1.0 - smoothstep(136650.0, 136850.0, rKm));
	// Spiral density waves in A ring (Mimas 5:3 and Janus/Epimetheus resonances)
	float spiralWave = sin(rKm * 0.11 - 5.0 * theta + uTime * 0.15) * 0.08;
	float aSubProfile = 0.48 + 0.12 * waveMed + 0.08 * waveFine + spiralWave;

	// Encke Gap: 133,589 km (325 km wide) + central Pan kinky ringlet
	float enckeDist = abs(rKm - 133589.0);
	float enckeGapClear = smoothstep(110.0, 260.0, enckeDist);
	float panRinglet = exp(-pow((rKm - (133589.0 + 18.0 * sin(theta * 14.0 - uTime * 0.4))) / 28.0, 2.0)) * 0.28;

	// Keeler Gap: 136,505 km (42 km wide near outer A ring edge)
	float keelerDist = abs(rKm - 136505.0);
	float keelerGapClear = smoothstep(25.0, 85.0, keelerDist);

	// 6. F Ring: ~140,180 km (braided narrow core + dusty envelope)
	float fBraidedCenter = 140180.0 + 45.0 * sin(theta * 11.0 - uTime * 0.35) + 25.0 * cos(theta * 23.0 + uTime * 0.5);
	float fRingCore = exp(-pow((rKm - fBraidedCenter) / 110.0, 2.0));
	float fRingHalo = exp(-pow((rKm - 140180.0) / 380.0, 2.0)) * 0.18;

	// Composite optical depth tau(r)
	float tauD = maskD * (0.022 + 0.018 * waveFine * waveMed);
	float tauC = maskC * ((0.11 + 0.06 * waveCoarse * waveMed + 0.04 * waveFine) * colomboGap * maxwellGap + maxwellRinglet);
	float tauB = maskB * (bSubProfile + spokes);
	float tauCassini = maskCassiniDiv * cassiniInternal;
	float tauA = maskA * (aSubProfile * enckeGapClear * keelerGapClear + panRinglet);
	float tauF = fRingCore * 0.38 + fRingHalo;

	float tau = tauD + tauC + tauB + tauCassini + tauA + tauF;

	// Fine micron-dust fraction (drives extreme high-phase forward scattering in F, D, Encke, and outer A/B)
	float dustFraction = clamp(
		maskD * 0.85
		+ maskC * 0.35
		+ spokes * 2.2
		+ panRinglet * 2.5
		+ (fRingCore + fRingHalo) * 1.4
		+ maskA * 0.22
		+ maskB * 0.15,
		0.0,
		1.0
	);

	// Ring particle intrinsic color palette across zones
	vec3 colDRing = vec3(0.62, 0.68, 0.78); // Dusty slate-silver
	vec3 colCRing = vec3(0.56, 0.59, 0.65); // Translucent bluish-slate crepe ring
	vec3 colBRingInner = vec3(0.88, 0.78, 0.60); // Warm golden-ochre ice
	vec3 colBRingOuter = vec3(0.96, 0.91, 0.79); // Bright cream-ivory water ice
	vec3 colCassini    = vec3(0.52, 0.56, 0.62);
	vec3 colARing      = vec3(0.87, 0.86, 0.83); // Cooler crystalline ivory-silver
	vec3 colFRing      = vec3(0.90, 0.88, 0.84); // Warm ivory-silver micron dust

	vec3 colB = mix(colBRingInner, colBRingOuter, clamp((rKm - 92000.0) / 25580.0, 0.0, 1.0));
	colB = mix(colB, vec3(0.99, 0.96, 0.88), waveFine * 0.25);

	vec3 baseAlbedo = colCRing * 0.5;
	baseAlbedo = mix(baseAlbedo, colDRing, maskD);
	baseAlbedo = mix(baseAlbedo, colCRing, maskC);
	baseAlbedo = mix(baseAlbedo, colB, maskB);
	baseAlbedo = mix(baseAlbedo, colCassini, maskCassiniDiv);
	baseAlbedo = mix(baseAlbedo, colARing, maskA);
	baseAlbedo = mix(baseAlbedo, colFRing, clamp(fRingCore + fRingHalo * 2.0, 0.0, 1.0));

	if (uHasRingTex > 0.5) {
		vec4 ringSample = texture2D(uRingTex, vec2(rNorm, 0.5));
		float ringTexLuma = dot(ringSample.rgb, vec3(0.299, 0.587, 0.114));
		float ringTexAlpha = ringSample.a * smoothstep(0.015, 0.16, ringTexLuma);
		tau = mix(tau, tau * (0.42 + 0.88 * ringTexLuma) * (0.22 + 0.78 * ringTexAlpha), 0.65);
		baseAlbedo = mix(baseAlbedo, max(ringSample.rgb, vec3(0.08)) * vec3(1.03, 1.0, 0.94), 0.62);
	}
	// Lighting & Mie Phase Scattering
	vec3 V = normalize(cameraPosition - vWorldPos);
	vec3 L = normalize(uSunDirection);
	vec3 N = normalize(vWorldNormal);

	// Cosine of scattering angle between sunlight travel (-L) and view ray (V)
	// When viewer looks toward the Sun through the rings (high solar phase angle), dot(V, -L) -> +1.0
	// When Sun is behind the viewer (low solar phase angle / opposition), dot(V, -L) -> -1.0
	float cosScatter = dot(V, -L);

	// Double Henyey-Greenstein phase function:
	// Strong forward-scattering peak (g = 0.78) for micron ice dust + back-scattering peak (g = -0.38) for macroscopic snowballs
	float forwardScatter = henyeyGreenstein(cosScatter, 0.78) * 1.65;
	float backScatter    = henyeyGreenstein(cosScatter, -0.38) * 2.6;
	float oppositionSurge = pow(max(-cosScatter, 0.0), 8.0) * 0.45;

	// Radiative transfer through ring sheet:
	// Back-scattered reflection scales with (1 - exp(-tau)), whereas transmitted forward-scattered light
	// peaks in optically thin / dusty regions and is attenuated by exp(-tau * 0.65) in the dense B ring core!
	float backWeight = 1.0 - exp(-tau * 1.8);
	float transWeight = (1.0 - exp(-tau * 2.4)) * exp(-max(tau - 0.55, 0.0) * 1.15);

	vec3 backLitColor = baseAlbedo * (0.55 + backScatter + oppositionSurge) * backWeight;
	vec3 forwardHaloColor = mix(baseAlbedo, vec3(0.95, 0.92, 0.86), 0.55 + 0.35 * dustFraction)
		* forwardScatter * (transWeight + dustFraction * 0.42);

	vec3 ringRadiance = backLitColor + forwardHaloColor;

	// ============================================================================
	// REAL-TIME ANALYTICAL CYLINDRICAL SHADOW OF SATURN'S OBLATE SPHEROID
	// ============================================================================
	// Scale world coordinates along Saturn's polar axis (uRingNormal) so the oblate spheroid becomes a sphere of radius R_eq
	vec3 polarAxis = normalize(uRingNormal);
	float oblateStretch = (1.0 / max(uPlanetOblatenessRatio, 0.1)) - 1.0;
	vec3 pScaled = vWorldPos + polarAxis * dot(vWorldPos, polarAxis) * oblateStretch;
	vec3 lScaled = normalize(L + polarAxis * dot(L, polarAxis) * oblateStretch);

	float projAlongSun = dot(pScaled, lScaled);
	float shadowFactor = 1.0;
	vec3 umbraRefractionTint = vec3(0.0);

	if (projAlongSun < 0.0) {
		// Point is anti-sunward of Saturn's center; compute perpendicular distance from shadow cylinder axis
		float perpDistSq = max(dot(pScaled, pScaled) - projAlongSun * projAlongSun, 0.0);
		float perpDist = sqrt(perpDistSq);

		// Crisp cylindrical shadow boundary with subtle penumbra widening behind Saturn
		float penumbraWidth = uPlanetEquatorialRadius * (0.011 + 0.005 * abs(projAlongSun) / uPlanetEquatorialRadius);
		shadowFactor = smoothstep(
			uPlanetEquatorialRadius - penumbraWidth,
			uPlanetEquatorialRadius + penumbraWidth,
			perpDist
		);

		// Subtle warm copper atmospheric refraction band right at the shadow boundary
		float refractionBand = exp(-pow((perpDist - uPlanetEquatorialRadius) / (penumbraWidth * 0.85), 2.0));
		umbraRefractionTint = vec3(0.42, 0.18, 0.06) * refractionBand * (1.0 - shadowFactor) * 0.35;
	}

	// Saturnshine: warm golden reflection from Saturn's sunlit hemisphere onto the inner rings
	float saturnShineMask = max(dot(normalize(vWorldPos), L), 0.0) * exp(-(rNorm * 2.5));
	vec3 saturnShine = vec3(0.92, 0.78, 0.52) * saturnShineMask * 0.08 * backWeight;

	vec3 shadedColor = ringRadiance * mix(0.018, 1.0, shadowFactor) + umbraRefractionTint + saturnShine;

	// Interactive telemetry radial cursor highlight ring in muted warm amber (#C89B57)
	if (uHighlightRadiusKm > 66000.0) {
		float cursorDist = abs(rKm - uHighlightRadiusKm);
		float cursorGlow = exp(-pow(cursorDist / 260.0, 2.0));
		shadedColor += vec3(0.784, 0.608, 0.341) * cursorGlow * 0.55;
	}

	// Opacity combines optical depth extinction and high-phase forward dust visibility
	float highPhaseBoost = smoothstep(0.1, 0.92, cosScatter) * dustFraction * 0.42;
	float alpha = clamp((1.0 - exp(-tau * 2.15)) + highPhaseBoost, 0.0, 0.97);

	// Smooth feathering at extreme inner & outer radial bounds
	float edgeFeather = smoothstep(0.0, 0.008, rNorm) * smoothstep(1.0, 0.992, rNorm);
	alpha *= edgeFeather;

	if (alpha < 0.003) {
		discard;
	}

	gl_FragColor = vec4(shadedColor, alpha);
}
`;

export const TITAN_HAZE_VERTEX_SHADER = /* glsl */ `
varying vec3 vLocalPos;
varying vec3 vWorldPos;
varying vec3 vWorldNormal;
varying vec2 vUv;

void main() {
	vUv = uv;
	vLocalPos = position;

	vec4 worldPosition = modelMatrix * vec4(position, 1.0);
	vWorldPos = worldPosition.xyz;
	vWorldNormal = normalize(mat3(modelMatrix) * normal);

	gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
`;

export const TITAN_HAZE_FRAGMENT_SHADER = /* glsl */ `
precision highp float;

uniform vec3 uSunDirection;
uniform float uTime;
uniform sampler2D uTitanMap;
uniform float uHasTitanMap;
varying vec3 vLocalPos;
varying vec3 vWorldPos;
varying vec3 vWorldNormal;
varying vec2 vUv;

float hash31(vec3 p) {
	p = fract(p * vec3(443.897, 441.423, 437.195));
	p += dot(p, p.yzx + 19.19);
	return fract((p.x + p.y) * p.z);
}

float noise3D(vec3 p) {
	vec3 i = floor(p);
	vec3 f = fract(p);
	f = f * f * (3.0 - 2.0 * f);
	return mix(
		mix(
			mix(hash31(i + vec3(0.0, 0.0, 0.0)), hash31(i + vec3(1.0, 0.0, 0.0)), f.x),
			mix(hash31(i + vec3(0.0, 1.0, 0.0)), hash31(i + vec3(1.0, 1.0, 0.0)), f.x),
			f.y
		),
		mix(
			mix(hash31(i + vec3(0.0, 0.0, 1.0)), hash31(i + vec3(1.0, 0.0, 1.0)), f.x),
			mix(hash31(i + vec3(0.0, 1.0, 1.0)), hash31(i + vec3(1.0, 1.0, 1.0)), f.x),
			f.y
		),
		f.z
	);
}

void main() {
	vec3 N = normalize(vWorldNormal);
	vec3 V = normalize(cameraPosition - vWorldPos);
	vec3 L = normalize(uSunDirection);

	vec3 pNorm = normalize(vLocalPos);
	float lat = asin(clamp(pNorm.y, -1.0, 1.0));

	// Subtle low-contrast hydrocarbon surface albedo (Xanadu bright highland vs Shangri-La dark dune basin)
	// Strongly attenuated by Titan's opaque nitrogen-methane photochemical haze
	float surfaceAlbedo = noise3D(pNorm * 2.6 + vec3(0.4, -0.2, 0.8));
	float surfaceDetail = noise3D(pNorm * 6.5);
	float xanaduContinent = smoothstep(0.42, 0.68, surfaceAlbedo * 0.75 + surfaceDetail * 0.25);

	if (uHasTitanMap > 0.5) {
		float lon = atan(pNorm.z, pNorm.x) - uTime * 0.012;
		vec2 titanUv = vec2(fract(lon / 6.2831853 + 0.5), lat / 3.14159265 + 0.5);
		vec3 titanTex = texture2D(uTitanMap, titanUv).rgb;
		float titanLuma = dot(titanTex, vec3(0.299, 0.587, 0.114));
		xanaduContinent = mix(xanaduContinent, smoothstep(0.26, 0.74, titanLuma), 0.78);
	}

	// Photochemical tholin haze colors (golden-orange main deck, darker northern hood)
	vec3 colDeepTholin   = vec3(0.76, 0.45, 0.16);
	vec3 colWarmAmber    = vec3(0.92, 0.62, 0.25);
	vec3 colXanaduHint   = vec3(0.97, 0.72, 0.36);
	vec3 colShangriLa    = vec3(0.62, 0.36, 0.13);
	vec3 colNorthHood    = vec3(0.58, 0.34, 0.14);

	vec3 bodyHaze = mix(colDeepTholin, colWarmAmber, 0.5 + 0.5 * sin(lat * 3.0));
	bodyHaze = mix(bodyHaze, mix(colShangriLa, colXanaduHint, xanaduContinent), 0.26);
	float northHoodMask = smoothstep(0.45, 1.05, lat);
	bodyHaze = mix(bodyHaze, colNorthHood, northHoodMask * 0.55);

	// Soft extended atmospheric terminator (methane haze scatters light well past 90 degrees)
	float NdotL = dot(N, L);
	float NdotV = max(dot(N, V), 0.001);
	float softDiffuse = smoothstep(-0.28, 0.75, NdotL);
	float limbDarkening = pow(NdotV, 0.28);

	// Detached high-altitude haze layer (~350-500 km altitude at grazing limb, softened for filmic look)
	float grazingRim = pow(1.0 - NdotV, 2.4) * 0.42;
	float highAltDetachedBand = exp(-pow((1.0 - NdotV - 0.80) / 0.14, 2.0));
	float forwardScatterBoost = 0.45 + 0.65 * pow(max(dot(V, -L), 0.0), 2.0);
	float sunlitLimbMask = smoothstep(-0.40, 0.40, NdotL);

	vec3 colUpperHaze = vec3(0.78, 0.68, 0.54);
	vec3 colDetachedAerosol = vec3(0.68, 0.72, 0.78);

	vec3 limbAerosol = (colUpperHaze * grazingRim * 0.48 + colDetachedAerosol * highAltDetachedBand * 0.36)
		* sunlitLimbMask * forwardScatterBoost;
	// Warm orange-red terminator scatter
	float terminatorGlow = exp(-pow((NdotL + 0.06) * 4.5, 2.0)) * 0.22;
	vec3 twilightScatter = vec3(0.92, 0.42, 0.12) * terminatorGlow;

	vec3 finalColor = bodyHaze * softDiffuse * limbDarkening
		+ vec3(0.03, 0.02, 0.015)
		+ twilightScatter
		+ limbAerosol;

	gl_FragColor = vec4(finalColor, 1.0);
}
`;

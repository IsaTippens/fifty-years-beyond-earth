/**
 * Photorealistic Earth & Thin Rayleigh Atmosphere Shaders ("Quiet Space Documentary")
 * Optimized for locked 60fps iGPU execution with zero per-pixel 3D Simplex FBM loops.
 *
 * Includes:
 * 1. PLANET_ATMOSPHERE_VERTEX_SHADER & PLANET_ATMOSPHERE_FRAGMENT_SHADER:
 *    - True thin, soft exponential Rayleigh optical depth falloff at the limb (zero hard Fresnel rings)
 *    - Subtle Rayleigh sky-blue/indigo horizon scattering transitioning through warm golden-amber
 *      twilight at the day/night terminator
 *    - ACES Filmic tone mapping
 * 2. EARTH_PROCEDURAL_SURFACE_VERTEX_SHADER & EARTH_PROCEDURAL_SURFACE_FRAGMENT_SHADER:
 *    - Supports 3 real NASA archival textures:
 *      uDayMap    = /assets/textures/earth-day.webp (NASA Blue Marble)
 *      uNightMap  = /assets/textures/earth-night.webp (NASA Black Marble VIIRS city lights)
 *      uCloudsMap = /assets/textures/earth-clouds.webp (NASA MODIS global cloud layer)
 *    - Gracefully falls back to pre-baked 1024x512 offscreen CanvasTexture (uSurfaceMap)
 *      while uUseRealTextures transitions from 0.0 to 1.0
 *    - Physically grounded ocean specular glint, relief normal shading, and warm amber (#dca358 / #f5c878)
 *      night-side urban clusters softly illuminating beneath thin night clouds
 */

export const PLANET_ATMOSPHERE_VERTEX_SHADER = /* glsl */ `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vObjectNormal;
varying vec3 vWorldPosition;
varying vec3 vViewDir;

void main() {
  vUv = uv;
  vObjectNormal = normalize(position);
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPosition.xyz;
  vNormal = normalize(mat3(modelMatrix) * normal);
  vViewDir = normalize(cameraPosition - worldPosition.xyz);
  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
`;

export const EARTH_PROCEDURAL_SURFACE_VERTEX_SHADER = PLANET_ATMOSPHERE_VERTEX_SHADER;

export const PLANET_ATMOSPHERE_FRAGMENT_SHADER = /* glsl */ `
precision highp float;

uniform float uTime;
uniform vec3 uSunDirection;
uniform vec3 uAtmosphereColor;
uniform vec3 uSunsetColor;
uniform float uAtmosphereIntensity;
uniform float uOpacity;
uniform float uPaleBlueDotMix;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vObjectNormal;
varying vec3 vWorldPosition;
varying vec3 vViewDir;

vec3 acesFilmic(vec3 x) {
  const float a = 2.51;
  const float b = 0.03;
  const float c = 2.43;
  const float d = 0.59;
  const float e = 0.14;
  return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}

void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(vViewDir);
  vec3 sunDir = normalize(uSunDirection);

  // Grazing view cosine: 0.0 at outer silhouette of 4.92 shell, ~0.22 at 4.80 Earth horizon
  float viewDot = clamp(dot(normal, viewDir), 0.0, 1.0);

  // Soft exponential optical depth falloff:
  // Feathers smoothly to 0.0 at outer edge (viewDot -> 0.0) so there is NEVER a hard Fresnel ring,
  // peaks gently along the grazing planetary limb, and decays exponentially inward across the disk.
  float outerEdgeFeather = smoothstep(0.0, 0.22, viewDot) * smoothstep(0.0, 0.12, viewDot);
  float scaleHeightDecay = exp(-max(viewDot - 0.16, 0.0) * 6.2);
  float opticalDepth = outerEdgeFeather * scaleHeightDecay;

  // Solar incidence angle across sphere
  float sunDot = dot(normal, sunDir);
  float dayMask = smoothstep(-0.16, 0.42, sunDot);
  float terminatorBand = exp(-pow((sunDot + 0.02) * 4.6, 2.0));
  float twilightWedge = smoothstep(-0.28, 0.04, sunDot) * (1.0 - smoothstep(0.04, 0.36, sunDot));

  // Rayleigh phase function (wavelength^-4 sky-blue / deep indigo scattering)
  float cosTheta = dot(viewDir, -sunDir);
  float rayleighPhase = 0.75 * (1.0 + cosTheta * cosTheta);

  // Subtle Rayleigh sky-blue/indigo horizon + warm golden-amber twilight at terminator
  vec3 upperIndigo = vec3(0.10, 0.19, 0.42);
  vec3 horizonRayleigh = mix(upperIndigo, uAtmosphereColor, smoothstep(0.06, 0.28, viewDot));
  vec3 dayScatter = horizonRayleigh * (0.72 + 0.28 * rayleighPhase);

  // Warm golden-amber (#c89b57) to deep copper twilight extinction along terminator
  vec3 goldenTwilight = mix(vec3(0.68, 0.34, 0.16), uSunsetColor, 0.65);
  vec3 twilightScatter = goldenTwilight * (terminatorBand * 0.92 + twilightWedge * 0.45);

  // Nightside faint airglow whisper (warm-indigo, barely perceptible)
  float nightMask = 1.0 - smoothstep(-0.22, 0.08, sunDot);
  vec3 nightLimbWhisper = vec3(0.05, 0.07, 0.13) * nightMask * 0.22;

  vec3 linearAtmo = (
    dayScatter * dayMask +
    twilightScatter * (0.45 + 0.55 * opticalDepth) +
    nightLimbWhisper
  ) * opticalDepth * uAtmosphereIntensity;

  vec3 tonemappedAtmo = acesFilmic(linearAtmo);

  // Distant "Pale Blue Dot" pinpoint glow when Earth is viewed from deep space
  vec3 paleBlueDotGlow = vec3(0.56, 0.72, 0.94) * exp(-viewDot * 2.2) * 0.85;
  vec3 finalColor = mix(tonemappedAtmo, paleBlueDotGlow, clamp(uPaleBlueDotMix, 0.0, 1.0));

  float alpha = clamp(
    (opticalDepth * (0.12 + 0.76 * dayMask + 0.48 * terminatorBand) + uPaleBlueDotMix * 0.45) * uOpacity,
    0.0,
    0.88
  );

  gl_FragColor = vec4(finalColor, alpha);
}
`;

export const EARTH_PROCEDURAL_SURFACE_FRAGMENT_SHADER = /* glsl */ `
precision highp float;

uniform sampler2D uSurfaceMap;
uniform sampler2D uDayMap;
uniform sampler2D uNightMap;
uniform sampler2D uCloudsMap;
uniform float uUseRealTextures;
uniform float uTime;
uniform vec3 uSunDirection;
uniform float uCloudDensity;
uniform float uCityLightIntensity;
uniform float uOpacity;
uniform float uPaleBlueDotMix;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vObjectNormal;
varying vec3 vWorldPosition;
varying vec3 vViewDir;

vec3 acesFilmic(vec3 x) {
  const float a = 2.51;
  const float b = 0.03;
  const float c = 2.43;
  const float d = 0.59;
  const float e = 0.14;
  return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}

void main() {
  vec3 geomNormal = normalize(vNormal);
  vec3 viewDir = normalize(vViewDir);
  vec3 sunDir = normalize(uSunDirection);

  // Slow planetary axial rotation in UV space (zero per-pixel 3D noise!)
  float rotOffset = uTime * 0.0024;
  vec2 surfaceUv = vec2(fract(vUv.x + rotOffset), vUv.y);

  // Super-rotating cloud layer with subtle zonal latitude shear
  float lat = (vUv.y - 0.5) * 2.0;
  float absLat = abs(lat);
  float zonalDrift = uTime * (0.0034 + 0.0008 * cos(lat * 3.14159265));
  vec2 cloudUv = vec2(fract(vUv.x + zonalDrift), vUv.y);

  // Sample pre-baked 1024x512 surface texture:
  // R = elevation & bathymetry, G = humidity/biome, B = clouds, A = night-side city lights
  vec4 surfSample = texture2D(uSurfaceMap, surfaceUv);
  vec4 cloudSample = texture2D(uSurfaceMap, cloudUv);

  // Finite-difference relief & cloud-top micro-normal for low-angle terminator shadows
  const vec2 texel = vec2(1.0 / 1024.0, 1.0 / 512.0);
  vec4 surfRight = texture2D(uSurfaceMap, vec2(fract(surfaceUv.x + texel.x), surfaceUv.y));
  vec4 surfUp    = texture2D(uSurfaceMap, vec2(surfaceUv.x, clamp(surfaceUv.y + texel.y, 0.0, 1.0)));

  float elevation = surfSample.r;
  float humidity  = surfSample.g;
  float cloudRaw  = cloudSample.b;
  float cityRaw   = surfSample.a;

  // Soften cloud diffusion over urban centers using neighbor samples
  float cityDiffused = (cityRaw * 0.5 + surfRight.a * 0.25 + surfUp.a * 0.25);

  // 1. Continental Landmask & Bathymetry (sea level at 0.50)
  float seaLevel = 0.50;
  float landMask = smoothstep(seaLevel - 0.012, seaLevel + 0.015, elevation);
  float coastalShelf = smoothstep(seaLevel - 0.085, seaLevel + 0.004, elevation) * (1.0 - landMask);

  // Construct subtle tangent-space relief perturbation for mountains & clouds
  float dElevX = (surfRight.r - elevation) * landMask * 2.6;
  float dElevY = (surfUp.r - elevation) * landMask * 2.6;
  vec3 eastVec = normalize(cross(vec3(0.0, 1.0, 0.0), geomNormal));
  vec3 northVec = normalize(cross(geomNormal, eastVec));
  vec3 reliefNormal = normalize(geomNormal - eastVec * dElevX - northVec * dElevY);

  // 2. Documentary-Grade Ocean Bathymetry (Deep Abyssal Indigo-Navy -> Shelf Slate-Blue)
  vec3 abyssalOcean = vec3(0.016, 0.038, 0.082);
  vec3 midOcean     = vec3(0.032, 0.088, 0.175);
  vec3 shelfWater   = vec3(0.058, 0.172, 0.265);
  float oceanDepth  = clamp((elevation - 0.18) / max(seaLevel - 0.18, 0.01), 0.0, 1.0);
  vec3 oceanColor   = mix(abyssalOcean, midOcean, smoothstep(0.0, 0.85, oceanDepth));
  oceanColor        = mix(oceanColor, shelfWater, coastalShelf * 0.78);

  // 3. Terrestrial Biomes (Forests, Steppe, Subtropical Deserts, Alpine Peaks, Polar Caps)
  float desertFactor = smoothstep(0.45, 0.82, 1.0 - humidity) * exp(-pow((absLat - 0.32) * 3.8, 2.0));
  float highAltitude = smoothstep(seaLevel + 0.08, seaLevel + 0.34, elevation);

  vec3 forestBiome  = vec3(0.075, 0.145, 0.092);
  vec3 steppeBiome  = vec3(0.165, 0.190, 0.115);
  vec3 desertBiome  = vec3(0.440, 0.345, 0.235);
  vec3 mountainRock = vec3(0.210, 0.195, 0.182);
  vec3 polarIce     = vec3(0.820, 0.845, 0.875);

  vec3 landColor = mix(forestBiome, steppeBiome, smoothstep(0.30, 0.72, humidity));
  landColor = mix(landColor, desertBiome, desertFactor * 0.88);
  landColor = mix(landColor, mountainRock, highAltitude * 0.82);
  landColor = mix(landColor, polarIce, smoothstep(0.62, 0.90, highAltitude));

  float iceCapMask = smoothstep(0.76, 0.88, absLat + (elevation - 0.5) * 0.16);
  vec3 surfaceAlbedo = mix(oceanColor, landColor, landMask);
  surfaceAlbedo = mix(surfaceAlbedo, polarIce, iceCapMask);

  // 4. Swirling Cloud Layer & Cast Cloud Shadows (Procedural Fallback)
  float cloudMask = smoothstep(0.36, 0.78, cloudRaw) * uCloudDensity;
  vec2 shadowUv = vec2(fract(cloudUv.x - 0.0018), clamp(cloudUv.y - 0.0012, 0.0, 1.0));
  float cloudShadow = smoothstep(0.40, 0.78, texture2D(uSurfaceMap, shadowUv).b) * uCloudDensity;
  surfaceAlbedo *= (1.0 - cloudShadow * 0.34);

  float waterMask = (1.0 - landMask) * (1.0 - iceCapMask) * (1.0 - cloudMask * 0.88);
  float cityLandGate = landMask * (1.0 - iceCapMask);

  // Real 3-Layer Archival NASA Textures (Blue Marble Day, MODIS Clouds, VIIRS Black Marble Night)
  float realMix = clamp(uUseRealTextures, 0.0, 1.0);
  if (realMix > 0.001) {
    vec3 dayTex   = texture2D(uDayMap, surfaceUv).rgb;
    vec3 dayRight = texture2D(uDayMap, vec2(fract(surfaceUv.x + texel.x), surfaceUv.y)).rgb;
    vec3 dayUp    = texture2D(uDayMap, vec2(surfaceUv.x, clamp(surfaceUv.y + texel.y, 0.0, 1.0))).rgb;

    float dayLuma  = dot(dayTex, vec3(0.299, 0.587, 0.114));
    float dayLumaR = dot(dayRight, vec3(0.299, 0.587, 0.114));
    float dayLumaU = dot(dayUp, vec3(0.299, 0.587, 0.114));

    // Identify liquid ocean pixels via low-red / high-blue ratio and moderate luminance
    float blueExcess = dayTex.b - max(dayTex.r, dayTex.g * 0.88);
    float realWater = smoothstep(0.012, 0.085, blueExcess) * (1.0 - smoothstep(0.46, 0.74, dayLuma));
    float realLand  = 1.0 - realWater;

    // Subtle relief bump on continents derived from Blue Marble luminance gradients
    float dRealX = (dayLumaR - dayLuma) * realLand * 2.4;
    float dRealY = (dayLumaU - dayLuma) * realLand * 2.4;
    vec3 realReliefNormal = normalize(geomNormal - eastVec * dRealX - northVec * dRealY);

    // Desaturate slightly and grade for the Quiet Space Documentary palette
    vec3 dayLinear = pow(max(dayTex, vec3(0.0)), vec3(1.28));
    float dayLinearLuma = dot(dayLinear, vec3(0.299, 0.587, 0.114));
    vec3 dayDesat = mix(dayLinear, vec3(dayLinearLuma), 0.22);
    vec3 gradedOcean = mix(dayDesat * vec3(0.72, 0.86, 1.06), abyssalOcean, 0.28);
    vec3 gradedLand  = dayDesat * vec3(1.04, 0.98, 0.90);
    vec3 realAlbedo  = mix(gradedLand, gradedOcean, realWater);

    // Super-rotating MODIS cloud layer & subtle cast cloud shadows on day surface
    float cloudLuma = dot(texture2D(uCloudsMap, cloudUv).rgb, vec3(0.299, 0.587, 0.114));
    float realCloudMask = smoothstep(0.16, 0.78, cloudLuma) * uCloudDensity;
    float shadowCloudLuma = dot(texture2D(uCloudsMap, shadowUv).rgb, vec3(0.299, 0.587, 0.114));
    float realCloudShadow = smoothstep(0.20, 0.78, shadowCloudLuma) * uCloudDensity;
    realAlbedo *= (1.0 - realCloudShadow * 0.36);

    // VIIRS Black Marble night-side city light luminance & neighbor diffusion beneath thin clouds
    vec3 nightTex   = texture2D(uNightMap, surfaceUv).rgb;
    vec3 nightRight = texture2D(uNightMap, vec2(fract(surfaceUv.x + texel.x), surfaceUv.y)).rgb;
    vec3 nightUp    = texture2D(uNightMap, vec2(surfaceUv.x, clamp(surfaceUv.y + texel.y, 0.0, 1.0))).rgb;
    float nightLuma  = dot(nightTex, vec3(0.299, 0.587, 0.114));
    float nightLumaR = dot(nightRight, vec3(0.299, 0.587, 0.114));
    float nightLumaU = dot(nightUp, vec3(0.299, 0.587, 0.114));
    float realCityRaw = smoothstep(0.05, 0.86, nightLuma);
    float realCityDiffused =
      realCityRaw * 0.5 +
      smoothstep(0.05, 0.86, nightLumaR) * 0.25 +
      smoothstep(0.05, 0.86, nightLumaU) * 0.25;

    surfaceAlbedo = mix(surfaceAlbedo, realAlbedo, realMix);
    reliefNormal  = normalize(mix(reliefNormal, realReliefNormal, realMix));
    cloudMask     = mix(cloudMask, realCloudMask, realMix);
    waterMask     = mix(waterMask, realWater * (1.0 - realCloudMask * 0.88), realMix);
    cityRaw       = mix(cityRaw, realCityRaw, realMix);
    cityDiffused  = mix(cityDiffused, realCityDiffused, realMix);
    cityLandGate  = mix(cityLandGate, realLand, realMix);
  }

  // 5. Solar Illumination, Ocean Specular Glint & Golden-Amber Terminator
  float ndotl = dot(reliefNormal, sunDir);
  float geomNdotl = dot(geomNormal, sunDir);
  float diffuse = smoothstep(-0.06, 0.82, ndotl);
  float terminator = exp(-pow((geomNdotl + 0.02) * 5.2, 2.0));

  // Physically grounded Blinn-Phong solar specular reflection on liquid ocean
  vec3 halfVec = normalize(sunDir + viewDir);
  float ndoth = max(dot(geomNormal, halfVec), 0.0);
  float specCore = pow(ndoth, 72.0) * 0.68;
  float specSheen = pow(ndoth, 16.0) * 0.22;
  vec3 sunGlint = vec3(0.95, 0.82, 0.62) * (specCore + specSheen) * waterMask * smoothstep(-0.02, 0.35, geomNdotl);

  // Warm golden-amber twilight cloud-top lighting along day/night terminator
  vec3 cloudDayColor = vec3(0.88, 0.90, 0.93);
  vec3 cloudTwilightColor = vec3(0.82, 0.52, 0.28); // warm golden-amber twilight
  vec3 cloudTint = mix(cloudTwilightColor, cloudDayColor, smoothstep(-0.04, 0.34, geomNdotl));
  float cloudIllum = 0.03 + 0.97 * smoothstep(-0.14, 0.76, geomNdotl);

  vec3 dayLitSurface = surfaceAlbedo * (0.015 + 0.985 * diffuse) + sunGlint;
  dayLitSurface += vec3(0.76, 0.44, 0.20) * terminator * 0.14 * (1.0 - cloudMask * 0.5);
  dayLitSurface = mix(dayLitSurface, cloudTint * cloudIllum, cloudMask);

  // 6. Night-Side City Lights: Warm Amber (#dca358 / #f5c878) Urban Clusters Beneath Thin Clouds
  float nightVisibility = 1.0 - smoothstep(-0.14, 0.06, geomNdotl);
  const vec3 amberCityBase = vec3(0.863, 0.639, 0.345); // #dca358
  const vec3 amberCityCore = vec3(0.961, 0.784, 0.471); // #f5c878

  float sharpCity = pow(cityRaw, 1.35);
  vec3 directCityLights = mix(amberCityBase, amberCityCore, sharpCity) *
    sharpCity * (1.0 - cloudMask * 0.68);

  // Soft warm amber scattering through thin overlying night clouds
  vec3 cloudDiffusedLights = amberCityBase * cityDiffused * cloudMask * 0.45;
  vec3 nightLights = (directCityLights + cloudDiffusedLights) *
    nightVisibility * cityLandGate * uCityLightIntensity * 1.45;
  // 7. Inner Rayleigh Horizon Aerial Perspective on Surface
  float viewDot = clamp(dot(geomNormal, viewDir), 0.0, 1.0);
  float surfaceLimb = pow(1.0 - viewDot, 3.2);
  vec3 limbRayleigh = mix(
    vec3(0.78, 0.50, 0.24) * terminator,
    vec3(0.20, 0.38, 0.72) * smoothstep(-0.12, 0.48, geomNdotl),
    0.72
  ) * surfaceLimb * 0.52;

  vec3 linearEarth = dayLitSurface + nightLights + limbRayleigh;
  vec3 tonemappedEarth = acesFilmic(linearEarth);

  // Distant Pale Blue Dot transition
  vec3 paleBlueColor = vec3(0.62, 0.76, 0.95);
  vec3 finalColor = mix(tonemappedEarth, paleBlueColor, clamp(uPaleBlueDotMix, 0.0, 1.0));

  gl_FragColor = vec4(finalColor, uOpacity);
}
`;

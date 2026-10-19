<script lang="ts">
  import { onMount } from 'svelte';
  import * as THREE from 'three';
  import { telemetryStore, type TelemetryState } from '$lib/stores/scrollTelemetry';
  import { introEarthArrival, introPhaseStore, introTimeStore } from '$lib/stores/introSequence';
  import { fastTravelStore, SCRUB_CATCH_UP_RATE } from '$lib/stores/landingScroll';
  import {
    journeyStore,
    JOURNEY_WAYPOINTS,
    type JourneyState,
    type JourneyWaypointId
  } from '$lib/stores/landingJourney';
  import {
    NEBULA_VERTEX_SHADER,
    NEBULA_FRAGMENT_SHADER
  } from '$lib/shaders/nebula';
  import {
    PLANET_ATMOSPHERE_VERTEX_SHADER,
    PLANET_ATMOSPHERE_FRAGMENT_SHADER,
    EARTH_PROCEDURAL_SURFACE_VERTEX_SHADER,
    EARTH_PROCEDURAL_SURFACE_FRAGMENT_SHADER
  } from '$lib/shaders/atmosphere';

  // ============================================================================
  // Custom GLSL Shaders for 6,000 Multi-Layer Parallax Stars (Near/Mid/Far Shells)
  // ============================================================================
  const STARFIELD_VERTEX_SHADER = /* glsl */ `
    attribute vec3 aColor;
    attribute float aSize;
    attribute float aPhase;
    attribute float aSpeed;
    attribute float aBrightRank;

    uniform float uTime;
    uniform float uTravelZ;
    uniform float uWarpVelocity;
    uniform float uPixelRatio;
    uniform float uReducedMotion;

    varying vec3 vColor;
    varying float vTwinkle;
    varying float vBokeh;
    varying float vBloomFactor;
    varying vec2 vScreenRadial;
    varying float vWarpAmount;
    varying float vDepthFade;

    void main() {
      vColor = aColor;
      vBloomFactor = aBrightRank;

      vec3 pos = position;
      float depthSpan = 280.0;
      float wrappedZ = mod(pos.z + uTravelZ * aSpeed, depthSpan) - depthSpan;
      pos.z = wrappedZ;

      float warpMag = clamp(abs(uWarpVelocity) * (1.0 - uReducedMotion * 0.85), 0.0, 1.0);
      vWarpAmount = warpMag;

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      float dist = max(-mvPosition.z, 1.5);

      float nearFade = smoothstep(2.2, 12.0, dist);
      float farFade = 1.0 - smoothstep(depthSpan * 0.78, depthSpan * 0.99, dist);
      // Dissolve stars just before they wrap back to the far shell so forward drift never pops
      float wrapFade = smoothstep(0.0, 8.0, -wrappedZ);
      vDepthFade = nearFade * farFade * wrapFade;

      vBokeh = smoothstep(34.0, 7.5, dist) * step(1.05, aSpeed);

      float twinkleFreq = 1.1 + mod(aPhase, 1.8);
      float twinkleAmp = mix(0.16, 0.03, uReducedMotion);
      vTwinkle = (1.0 - twinkleAmp) + twinkleAmp * sin(uTime * twinkleFreq + aPhase * 6.2831853);

      vec4 clipPos = projectionMatrix * mvPosition;
      gl_Position = clipPos;

      vec2 ndc = clipPos.xy / max(clipPos.w, 0.0001);
      float ndcLen = length(ndc);
      vScreenRadial = ndcLen > 0.001 ? (ndc / ndcLen) : vec2(0.0, 1.0);

      float basePointSize = aSize * (150.0 / dist) * uPixelRatio;
      float dofExpansion = 1.0 + vBokeh * 1.45 + aBrightRank * 0.75;
      float warpScale = 1.0 + warpMag * 2.1 * clamp(ndcLen * 1.25, 0.25, 1.0);
      gl_PointSize = clamp(basePointSize * dofExpansion * warpScale, 1.1, 44.0 * uPixelRatio);
    }
  `;

  const STARFIELD_FRAGMENT_SHADER = /* glsl */ `
    precision highp float;

    varying vec3 vColor;
    varying float vTwinkle;
    varying float vBokeh;
    varying float vBloomFactor;
    varying vec2 vScreenRadial;
    varying float vWarpAmount;
    varying float vDepthFade;

    vec3 acesFilmic(vec3 x) {
      const float a = 2.51;
      const float b = 0.03;
      const float c = 2.43;
      const float d = 0.59;
      const float e = 0.14;
      return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
    }

    void main() {
      if (vDepthFade <= 0.005) {
        discard;
      }

      vec2 uv = (gl_PointCoord - 0.5) * 2.0;
      uv.y = -uv.y;

      vec2 radialDir = normalize(vScreenRadial);
      vec2 perpDir = vec2(-radialDir.y, radialDir.x);

      float along = dot(uv, radialDir);
      float across = dot(uv, perpDir);

      float streakCompression = mix(1.0, 0.34, vWarpAmount);
      float tailCompression = mix(1.0, 2.0, vWarpAmount);
      vec2 warpedUv = vec2(along * streakCompression, across * tailCompression);

      float r2 = dot(warpedUv, warpedUv);
      if (r2 > 1.0) {
        discard;
      }
      float r = sqrt(r2);

      float pinpointCore = exp(-r2 * 20.0);
      float bokehDisc = smoothstep(0.92, 0.38, r) * (0.72 + 0.28 * smoothstep(0.18, 0.68, r)) * 0.34;
      float starProfile = mix(pinpointCore, bokehDisc, vBokeh);
      float airyBloom = exp(-r2 * 4.4) * 0.46 * vBloomFactor * (1.0 - vBokeh * 0.65);

      vec3 finalRgb = mix(vColor, vec3(0.96, 0.95, 0.93), pinpointCore * (1.0 - vBokeh) * 0.65);
      float brightness = (starProfile * 1.15 + airyBloom) * vTwinkle * vDepthFade;

      vec3 tonemapped = acesFilmic(finalRgb * brightness * 1.25);
      gl_FragColor = vec4(tonemapped, clamp(brightness, 0.0, 0.95));
    }
  `;

  // ============================================================================
  // Photorealistic Planetary Body & Ring Shaders for Mars, Jupiter, Saturn, Pluto
  // ============================================================================
  const PLANET_BODY_VERTEX_SHADER = /* glsl */ `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPos;
    varying vec3 vViewDir;

    void main() {
      vUv = uv;
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPos = worldPosition.xyz;
      vNormal = normalize(mat3(modelMatrix) * normal);
      vViewDir = normalize(cameraPosition - worldPosition.xyz);
      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
  `;

  const PLANET_BODY_FRAGMENT_SHADER = /* glsl */ `
    precision highp float;

    uniform sampler2D uAlbedoMap;
    uniform vec3 uSunDirection;
    uniform vec3 uLimbColor;
    uniform vec3 uTint;
    uniform float uLimbPower;
    uniform float uLimbIntensity;
    uniform float uRoughness;
    uniform float uOpacity;
    uniform float uAmbientFloor;
    uniform float uCastRingShadow;
    uniform vec3 uPlanetCenter;
    uniform vec3 uRingNormal;
    uniform float uRingInnerRadius;
    uniform float uRingOuterRadius;

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPos;
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
      if (uOpacity <= 0.002) discard;

      vec3 N = normalize(vNormal);
      vec3 V = normalize(vViewDir);
      vec3 L = normalize(uSunDirection);

      // Finite-difference micro-relief normal from texture luminance
      const vec2 texel = vec2(1.0 / 1024.0, 1.0 / 512.0);
      vec3 cCenter = texture2D(uAlbedoMap, vUv).rgb;
      vec3 cRight  = texture2D(uAlbedoMap, vec2(fract(vUv.x + texel.x), vUv.y)).rgb;
      vec3 cUp     = texture2D(uAlbedoMap, vec2(vUv.x, clamp(vUv.y + texel.y, 0.0, 1.0))).rgb;

      float lC = dot(cCenter, vec3(0.299, 0.587, 0.114));
      float lR = dot(cRight,  vec3(0.299, 0.587, 0.114));
      float lU = dot(cUp,     vec3(0.299, 0.587, 0.114));

      vec3 east = normalize(cross(vec3(0.0, 1.0, 0.0), N));
      vec3 north = normalize(cross(N, east));
      float bumpScale = uRoughness * 2.2;
      vec3 bumpedN = normalize(N - east * (lR - lC) * bumpScale - north * (lU - lC) * bumpScale);

      float ndotl = dot(bumpedN, L);
      float diffuse = smoothstep(-0.18, 0.88, ndotl);
      // Limb darkening for gas giants vs rocky Oren-Nayar backscatter
      float ndotv = clamp(dot(N, V), 0.0, 1.0);
      float limbDarkening = mix(pow(ndotv, 0.28), 1.0, uRoughness * 0.65);

      // Optional ring shadow across Saturn's cloud tops
      float ringShadow = 1.0;
      if (uCastRingShadow > 0.5) {
        vec3 relPos = vWorldPos - uPlanetCenter;
        float denom = dot(L, uRingNormal);
        if (abs(denom) > 0.001) {
          float tHit = -dot(relPos, uRingNormal) / denom;
          if (tHit > 0.0) {
            vec3 hitPt = relPos + L * tHit;
            float rHit = length(hitPt);
            if (rHit > uRingInnerRadius && rHit < uRingOuterRadius) {
              float rNorm = (rHit - uRingInnerRadius) / max(0.001, uRingOuterRadius - uRingInnerRadius);
              // Cassini Division gap around rNorm ~ 0.68
              float cassiniGap = smoothstep(0.015, 0.045, abs(rNorm - 0.68));
              float bandTau = (0.35 + 0.35 * sin(rNorm * 28.0)) * cassiniGap;
              ringShadow = 1.0 - clamp(bandTau, 0.0, 0.68);
            }
          }
        }
      }

      vec3 baseAlbedo = pow(max(cCenter, vec3(0.0)), vec3(1.12)) * uTint;
      vec3 litSurface = baseAlbedo * (uAmbientFloor + diffuse * 1.32 * ringShadow) * limbDarkening;

      // Grazing atmospheric limb scatter (Rayleigh / Mie haze)
      float grazing = pow(1.0 - ndotv, uLimbPower);
      float sunForward = smoothstep(-0.35, 0.55, dot(N, L));
      vec3 limbGlow = uLimbColor * grazing * uLimbIntensity * (0.28 + 0.72 * sunForward);

      vec3 finalRgb = acesFilmic(litSurface + limbGlow);
      gl_FragColor = vec4(finalRgb, uOpacity);
    }
  `;

  const SATURN_WAYPOINT_RING_VERTEX_SHADER = /* glsl */ `
    varying vec3 vLocalPos;
    varying vec3 vWorldPos;
    varying vec2 vUv;

    void main() {
      vUv = uv;
      vLocalPos = position;
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPos = worldPosition.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
  `;

  const SATURN_WAYPOINT_RING_FRAGMENT_SHADER = /* glsl */ `
    precision highp float;

    uniform sampler2D uRingMap;
    uniform float uHasRingMap;
    uniform vec3 uSunDirection;
    uniform vec3 uPlanetCenter;
    uniform float uPlanetRadius;
    uniform float uInnerRadius;
    uniform float uOuterRadius;
    uniform float uOpacity;

    varying vec3 vLocalPos;
    varying vec3 vWorldPos;
    varying vec2 vUv;

    void main() {
      if (uOpacity <= 0.002) discard;

      float r = length(vLocalPos.xy);
      float rNorm = (r - uInnerRadius) / max(0.0001, uOuterRadius - uInnerRadius);
      if (rNorm < 0.0 || rNorm > 1.0) discard;

      // Procedural radial optical depth + Cassini Division (0.65 - 0.71) & Encke Gap (0.88)
      float cRing = smoothstep(0.02, 0.18, rNorm) * (1.0 - smoothstep(0.24, 0.28, rNorm)) * 0.28;
      float bRing = smoothstep(0.25, 0.30, rNorm) * (1.0 - smoothstep(0.62, 0.66, rNorm)) * (0.88 + 0.12 * sin(rNorm * 95.0));
      float aRing = smoothstep(0.71, 0.74, rNorm) * (1.0 - smoothstep(0.93, 0.96, rNorm)) * (0.62 + 0.08 * cos(rNorm * 120.0));
      float enckeGap = 1.0 - 0.85 * exp(-pow((rNorm - 0.875) * 95.0, 2.0));
      float fRing = exp(-pow((rNorm - 0.982) * 110.0, 2.0)) * 0.45;

      float procAlpha = clamp((cRing + bRing + aRing * enckeGap + fRing), 0.0, 0.94);
      vec3 procColor = mix(
        vec3(0.58, 0.52, 0.43),
        vec3(0.88, 0.80, 0.64),
        smoothstep(0.22, 0.55, rNorm)
      );
      procColor = mix(procColor, vec3(0.78, 0.73, 0.65), smoothstep(0.68, 0.80, rNorm));

      if (uHasRingMap > 0.5) {
        vec4 texRing = texture2D(uRingMap, vec2(rNorm, 0.5));
        procColor = mix(procColor, texRing.rgb * vec3(1.04, 0.98, 0.88), 0.65);
        procAlpha = mix(procAlpha, texRing.a, 0.5);
      }

      // Analytical cylindrical shadow of Saturn across the backside of the rings
      vec3 relWorld = vWorldPos - uPlanetCenter;
      vec3 L = normalize(uSunDirection);
      float proj = dot(relWorld, L);
      float shadowMask = 1.0;
      if (proj < 0.0) {
        vec3 perp = relWorld - L * proj;
        // Account for Saturn oblateness
        perp.y /= 0.902;
        float distAxis = length(perp);
        shadowMask = smoothstep(uPlanetRadius * 0.94, uPlanetRadius * 1.04, distAxis);
      }

      vec3 finalRingRgb = procColor * (0.14 + 0.92 * shadowMask);
      gl_FragColor = vec4(finalRingRgb, procAlpha * uOpacity);
    }
  `;

  // ============================================================================
  // Heliopause Bow-Wave / Magnetic Plasma Boundary Shader (121.6 AU)
  // ============================================================================
  const HELIOPAUSE_SHELL_VERTEX_SHADER = /* glsl */ `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewDir;

    void main() {
      vUv = uv;
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vNormal = normalize(mat3(modelMatrix) * normal);
      vViewDir = normalize(cameraPosition - worldPos.xyz);
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `;

  const HELIOPAUSE_SHELL_FRAGMENT_SHADER = /* glsl */ `
    precision highp float;

    uniform float uTime;
    uniform float uIntensity;

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewDir;

    void main() {
      if (uIntensity <= 0.002) discard;

      float ndotv = abs(dot(normalize(vNormal), normalize(vViewDir)));
      // Ring-like shock sheath strongest around the grazing perimeter, open in center so camera flies through
      float rimMask = smoothstep(0.02, 0.35, 1.0 - ndotv) * (1.0 - smoothstep(0.72, 0.98, ndotv));

      float lon = vUv.x * 6.2831853;
      float lat = vUv.y * 3.1415926;
      float filament1 = sin(lon * 7.0 + uTime * 0.25 + sin(lat * 5.0) * 1.6);
      float filament2 = cos(lon * 13.0 - uTime * 0.18 + cos(lat * 8.0) * 1.4);
      float wave = smoothstep(0.15, 0.92, 0.5 + 0.28 * filament1 + 0.22 * filament2);

      vec3 solarAmber = vec3(0.784, 0.608, 0.341); // #C89B57
      vec3 interstellarBlue = vec3(0.46, 0.64, 0.88);
      vec3 sheathColor = mix(solarAmber, interstellarBlue, smoothstep(0.25, 0.78, vUv.y));

      float alpha = rimMask * (0.22 + 0.78 * wave) * uIntensity * 0.42;
      gl_FragColor = vec4(sheathColor, clamp(alpha, 0.0, 0.45));
    }
  `;

  // ============================================================================
  // Whisper-Subtle Warm-Amber Voyager 1 Trajectory Filament (opacity: 0.14)
  // ============================================================================
  const VOYAGER_TRAJECTORY_VERTEX_SHADER = /* glsl */ `
    attribute float aArcProgress;

    varying float vArcProgress;
    varying float vCameraDist;

    void main() {
      vArcProgress = aArcProgress;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vCameraDist = -mvPosition.z;
      gl_Position = projectionMatrix * mvPosition;
    }
  `;

  const VOYAGER_TRAJECTORY_FRAGMENT_SHADER = /* glsl */ `
    precision highp float;

    uniform float uTime;
    uniform float uScrollProgress;
    uniform float uOpacity;

    varying float vArcProgress;
    varying float vCameraDist;

    void main() {
      float distFade = smoothstep(2.0, 10.0, vCameraDist) * (1.0 - smoothstep(125.0, 210.0, vCameraDist));
      float headProgress = clamp(uScrollProgress * 0.92 + 0.06, 0.05, 1.0);
      float activeEnvelope = 1.0 - smoothstep(headProgress - 0.08, headProgress + 0.22, vArcProgress);

      vec3 warmAmber = vec3(0.784, 0.608, 0.341);
      float alpha = 0.14 * (0.45 + 0.55 * activeEnvelope) * distFade * uOpacity;

      gl_FragColor = vec4(warmAmber, clamp(alpha, 0.0, 0.14));
    }
  `;

  // ============================================================================
  // Carl Sagan's "Pale Blue Dot" / Distant Sol Scattered Sunbeam & Pinpoint
  // ============================================================================
  const PALE_BLUE_DOT_HALO_VERTEX_SHADER = /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const PALE_BLUE_DOT_HALO_FRAGMENT_SHADER = /* glsl */ `
    precision highp float;

    uniform float uTime;
    uniform float uIntensity;

    varying vec2 vUv;

    void main() {
      if (uIntensity <= 0.001) {
        discard;
      }

      vec2 p = (vUv - 0.5) * 2.0;
      float r = length(p);

      float core = exp(-r * r * 68.0);
      float innerHalo = exp(-r * r * 11.0) * 0.42;

      float beamCoord = p.x * 0.82 + p.y * 0.57;
      float beamLength = p.x * 0.57 - p.y * 0.82;
      float sunbeam = exp(-beamCoord * beamCoord * 42.0) * exp(-beamLength * beamLength * 1.9) * 0.24;

      vec3 dotColor = vec3(0.56, 0.72, 0.94) * innerHalo +
                      vec3(0.95, 0.92, 0.86) * core * 1.25 +
                      vec3(0.784, 0.608, 0.341) * sunbeam;

      float alpha = clamp((core + innerHalo + sunbeam) * uIntensity, 0.0, 0.88);
      gl_FragColor = vec4(dotColor * uIntensity, alpha);
    }
  `;

  // ============================================================================
  // Procedural Texture Generators (Earth Fallback, Jupiter Bands+GRS, Mars/Pluto Fallback)
  // ============================================================================
  function createEarthSurfaceTexture(): THREE.Texture {
    const width = 1024;
    const height = 512;

    const lut = new Float32Array(4096);
    let rng = 19770820;
    for (let i = 0; i < 4096; i++) {
      rng = (rng * 1664525 + 1013904223) >>> 0;
      lut[i] = rng / 4294967296;
    }

    const sampleNoise3D = (x: number, y: number, z: number): number => {
      const xi = Math.floor(x);
      const yi = Math.floor(y);
      const zi = Math.floor(z);
      let fx = x - xi;
      let fy = y - yi;
      let fz = z - zi;
      fx = fx * fx * (3.0 - 2.0 * fx);
      fy = fy * fy * (3.0 - 2.0 * fy);
      fz = fz * fz * (3.0 - 2.0 * fz);

      const hx0 = Math.imul(xi, 73856093);
      const hx1 = Math.imul(xi + 1, 73856093);
      const hy0 = Math.imul(yi, 19349663);
      const hy1 = Math.imul(yi + 1, 19349663);
      const hz0 = Math.imul(zi, 83492791);
      const hz1 = Math.imul(zi + 1, 83492791);

      const c000 = lut[(hx0 ^ hy0 ^ hz0) & 4095];
      const c100 = lut[(hx1 ^ hy0 ^ hz0) & 4095];
      const c010 = lut[(hx0 ^ hy1 ^ hz0) & 4095];
      const c110 = lut[(hx1 ^ hy1 ^ hz0) & 4095];
      const c001 = lut[(hx0 ^ hy0 ^ hz1) & 4095];
      const c101 = lut[(hx1 ^ hy0 ^ hz1) & 4095];
      const c011 = lut[(hx0 ^ hy1 ^ hz1) & 4095];
      const c111 = lut[(hx1 ^ hy1 ^ hz1) & 4095];

      const x00 = c000 + (c100 - c000) * fx;
      const x10 = c010 + (c110 - c010) * fx;
      const x01 = c001 + (c101 - c001) * fx;
      const x11 = c011 + (c111 - c011) * fx;

      const y0 = x00 + (x10 - x00) * fy;
      const y1 = x01 + (x11 - x01) * fy;
      return y0 + (y1 - y0) * fz;
    };

    const fbm5 = (x: number, y: number, z: number): number => {
      let val = 0.0;
      let amp = 0.52;
      let px = x;
      let py = y;
      let pz = z;
      for (let o = 0; o < 5; o++) {
        val += amp * sampleNoise3D(px, py, pz);
        const nx = 0.8 * py + 0.6 * pz;
        const ny = -0.8 * px + 0.36 * py - 0.48 * pz;
        const nz = -0.6 * px - 0.48 * py + 0.64 * pz;
        px = nx * 2.06 + 7.1;
        py = ny * 2.06 - 3.9;
        pz = nz * 2.06 + 11.2;
        amp *= 0.49;
      }
      return val;
    };

    const cosLon = new Float32Array(width);
    const sinLon = new Float32Array(width);
    for (let x = 0; x < width; x++) {
      const lon = (x / width) * Math.PI * 2.0;
      cosLon[x] = Math.cos(lon);
      sinLon[x] = Math.sin(lon);
    }

    const cosLat = new Float32Array(height);
    const sinLat = new Float32Array(height);
    for (let y = 0; y < height; y++) {
      const lat = (0.5 - y / (height - 1)) * Math.PI;
      cosLat[y] = Math.cos(lat);
      sinLat[y] = Math.sin(lat);
    }

    const rgba = new Uint8ClampedArray(width * height * 4);

    for (let y = 0; y < height; y++) {
      const sy = sinLat[y];
      const cy = cosLat[y];
      const absLat = Math.abs(sy);
      const temperateWeight = Math.exp(-Math.pow((absLat - 0.36) * 3.2, 2.0));

      for (let x = 0; x < width; x++) {
        const sx = cy * cosLon[x];
        const sz = cy * sinLon[x];

        const wx = sampleNoise3D(sx * 1.9 + 1.2, sy * 1.9 + 3.4, sz * 1.9 + 5.6) - 0.5;
        const wy = sampleNoise3D(sx * 1.9 + 7.8, sy * 1.9 + 2.1, sz * 1.9 - 4.3) - 0.5;
        const wz = sampleNoise3D(sx * 1.9 - 3.5, sy * 1.9 + 6.7, sz * 1.9 + 1.9) - 0.5;

        const qx = sx * 2.25 + wx * 0.68;
        const qy = sy * 2.25 + wy * 0.68;
        const qz = sz * 2.25 + wz * 0.68;

        let elev = fbm5(qx, qy, qz);
        const ridge = 1.0 - Math.abs(sampleNoise3D(qx * 3.8, qy * 3.8, qz * 3.8) * 2.0 - 1.0);
        elev += ridge * ridge * 0.085;
        const elevationNorm = Math.max(0.0, Math.min(1.0, (elev - 0.05) * 1.04));

        const hum =
          0.62 * sampleNoise3D(sx * 3.4 + 12.4, sy * 3.4 - 8.1, sz * 3.4 + 3.3) +
          0.38 * sampleNoise3D(sx * 7.2 - 4.5, sy * 7.2 + 9.2, sz * 7.2 - 6.1);

        const swirlAngle = (sampleNoise3D(sx * 2.6 - 5.1, sy * 2.6 + 2.8, sz * 2.6 + 8.4) - 0.5) * 1.65;
        const cSwirl = Math.cos(swirlAngle);
        const sSwirl = Math.sin(swirlAngle);
        const cx = sx * cSwirl - sz * sSwirl;
        const cz = sx * sSwirl + sz * cSwirl;

        const cloudMacro = fbm5(cx * 3.1 + 4.2, sy * 4.4 - 1.8, cz * 3.1 + 6.7);
        const cloudStreaks = sampleNoise3D(cx * 6.5, sy * 13.5, cz * 6.5);
        const itczBand = Math.exp(-sy * sy * 18.0) * 0.14;
        const cloudNorm = Math.max(0.0, Math.min(1.0, cloudMacro * 0.76 + cloudStreaks * 0.24 + itczBand));

        let cityNorm = 0.0;
        if (elevationNorm > 0.495 && absLat < 0.76) {
          const coastalFactor = Math.max(0.0, 1.0 - (elevationNorm - 0.50) * 5.8);
          const metroEnvelope = sampleNoise3D(qx * 5.5 + 3.1, qy * 5.5 - 7.4, qz * 5.5 + 2.9);
          const urbanHub = sampleNoise3D(sx * 26.0 + wx * 4.0, sy * 26.0 + wy * 4.0, sz * 26.0 + wz * 4.0);
          const fineGrid = sampleNoise3D(sx * 54.0, sy * 54.0, sz * 54.0);
          const corridor = 1.0 - Math.abs(sampleNoise3D(sx * 32.0 + 2.0, sy * 32.0 - 3.0, sz * 32.0 + 1.0) * 2.0 - 1.0);

          const clusterGate = Math.max(0.0, (metroEnvelope + coastalFactor * 0.42 - 0.46) * 2.4);
          const nodeSpark = Math.pow(Math.max(0.0, urbanHub), 3.2) * 1.6 + Math.pow(Math.max(0.0, fineGrid), 4.0) * 1.2;
          const highwayWeb = Math.pow(Math.max(0.0, corridor), 7.0) * 0.55;

          cityNorm = Math.max(
            0.0,
            Math.min(1.0, temperateWeight * clusterGate * (nodeSpark + highwayWeb))
          );
        }

        const idx = (y * width + x) * 4;
        rgba[idx] = Math.round(elevationNorm * 255);
        rgba[idx + 1] = Math.round(Math.max(0.0, Math.min(1.0, hum)) * 255);
        rgba[idx + 2] = Math.round(cloudNorm * 255);
        rgba[idx + 3] = Math.round(cityNorm * 255);
      }
    }

    const texture = new THREE.DataTexture(new Uint8Array(rgba.buffer), width, height, THREE.RGBAFormat);
    texture.flipY = true;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;
    texture.needsUpdate = true;
    return texture;
  }

  /**
   * High-Resolution 1024x512 Jovian Zonal Ammonia Bands, Festoons & Great Red Spot Texture
   * Based on Voyager 1 / Cassini / Juno cylindrical color photometry.
   */
  function createJupiterSurfaceTexture(): THREE.Texture {
    const width = 1024;
    const height = 512;
    const rgba = new Uint8ClampedArray(width * height * 4);

    // Deterministic value noise table for Jovian turbulent eddies & Chevron festoons
    const lut = new Float32Array(2048);
    let seed = 19790305; // Voyager 1 Jupiter closest approach (March 5, 1979)
    for (let i = 0; i < 2048; i++) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      lut[i] = seed / 4294967296;
    }

    const noise2D = (x: number, y: number): number => {
      const xi = Math.floor(x);
      const yi = Math.floor(y);
      let fx = x - xi;
      let fy = y - yi;
      fx = fx * fx * (3.0 - 2.0 * fx);
      fy = fy * fy * (3.0 - 2.0 * fy);
      const h00 = lut[(Math.imul(xi, 73856093) ^ Math.imul(yi, 19349663)) & 2047];
      const h10 = lut[(Math.imul(xi + 1, 73856093) ^ Math.imul(yi, 19349663)) & 2047];
      const h01 = lut[(Math.imul(xi, 73856093) ^ Math.imul(yi + 1, 19349663)) & 2047];
      const h11 = lut[(Math.imul(xi + 1, 73856093) ^ Math.imul(yi + 1, 19349663)) & 2047];
      const x0 = h00 + (h10 - h00) * fx;
      const x1 = h01 + (h11 - h01) * fx;
      return x0 + (x1 - x0) * fy;
    };

    for (let y = 0; y < height; y++) {
      const v = y / (height - 1);
      const lat = (0.5 - v) * Math.PI; // +PI/2 (north) to -PI/2 (south)
      const deg = (lat * 180.0) / Math.PI;

      // Macro zonal belts & zones
      const eqZone = Math.exp(-Math.pow(deg / 8.5, 2.0));
      const nebBelt = Math.exp(-Math.pow((deg - 13.5) / 5.2, 2.0));
      const sebBelt = Math.exp(-Math.pow((deg + 14.5) / 6.0, 2.0));
      const ntbBelt = Math.exp(-Math.pow((deg - 27.0) / 4.2, 2.0));
      const stbBelt = Math.exp(-Math.pow((deg + 29.0) / 4.2, 2.0));
      const polarHaze = smoothstepScalar(48.0, 82.0, Math.abs(deg));

      for (let x = 0; x < width; x++) {
        const u = x / width;
        const lon = u * Math.PI * 2.0;

        // Periodic longitude coordinates for seamless horizontal wrap
        const cx = Math.cos(lon);
        const sx = Math.sin(lon);

        const eddy1 = noise2D(cx * 4.5 + 3.1, syLat(lat) * 14.0 + sx * 4.5);
        const eddy2 = noise2D(cx * 11.0 - 1.7 + eddy1 * 1.4, syLat(lat) * 32.0 + sx * 11.0);
        const eddy3 = noise2D(cx * 24.0 + eddy2 * 1.8, syLat(lat) * 64.0 + sx * 24.0);

        const latPerturbed = deg + (eddy1 - 0.5) * 3.4 + (eddy2 - 0.5) * 1.6;
        const fineBands = 0.5 + 0.5 * Math.sin((latPerturbed * Math.PI) / 4.8);

        // Base cream ammonia cloud deck
        let r = 0.87;
        let g = 0.81;
        let b = 0.70;

        // Warm ochre / amber intermediate bands
        const ochreMix = Math.max(0, Math.min(1, fineBands * 0.75 + eddy2 * 0.25));
        r = r * (1 - ochreMix * 0.45) + 0.76 * (ochreMix * 0.45);
        g = g * (1 - ochreMix * 0.45) + 0.58 * (ochreMix * 0.45);
        b = b * (1 - ochreMix * 0.45) + 0.38 * (ochreMix * 0.45);

        // North & South Equatorial Belts (deep rust-sienna / copper-brown)
        const beltWeight = Math.min(1.0, (nebBelt + sebBelt) * (0.78 + 0.35 * eddy2));
        r = r * (1 - beltWeight) + 0.58 * beltWeight;
        g = g * (1 - beltWeight) + 0.33 * beltWeight;
        b = b * (1 - beltWeight) + 0.21 * beltWeight;

        // Equatorial cream-ochre plume + bluish-slate festoons at NEB southern edge (~7°N)
        const festoon =
          Math.exp(-Math.pow((deg - 6.5) / 3.0, 2.0)) *
          Math.pow(0.5 + 0.5 * Math.sin(lon * 11.0 + eddy1 * 3.0), 3.0);
        r = r * (1 - eqZone * 0.35) + 0.92 * (eqZone * 0.35);
        g = g * (1 - eqZone * 0.35) + 0.86 * (eqZone * 0.35);
        b = b * (1 - eqZone * 0.35) + 0.76 * (eqZone * 0.35);

        r = r * (1 - festoon * 0.48) + 0.38 * (festoon * 0.48);
        g = g * (1 - festoon * 0.48) + 0.43 * (festoon * 0.48);
        b = b * (1 - festoon * 0.48) + 0.52 * (festoon * 0.48);

        // Temperate belts
        const tempWeight = Math.min(1.0, (ntbBelt + stbBelt) * 0.55);
        r = r * (1 - tempWeight) + 0.66 * tempWeight;
        g = g * (1 - tempWeight) + 0.48 * tempWeight;
        b = b * (1 - tempWeight) + 0.34 * tempWeight;

        // Great Red Spot at 22°S (deg = -21.5) and u = 0.58 (facing camera on approach)
        let du = u - 0.58;
        if (du > 0.5) du -= 1.0;
        if (du < -0.5) du += 1.0;
        const grsX = du / 0.068;
        const grsY = (deg + 21.5) / 6.2;
        const grsR = Math.sqrt(grsX * grsX + grsY * grsY);
        if (grsR < 1.35) {
          const swirlTheta = Math.atan2(grsY, grsX) + (1.35 - grsR) * 3.2;
          const spiral = 0.5 + 0.5 * Math.sin(swirlTheta * 4.0 + grsR * 8.0);
          const coreMask = 1.0 - smoothstepScalar(0.0, 1.0, grsR);
          const collarMask = smoothstepScalar(0.78, 1.02, grsR) * (1.0 - smoothstepScalar(1.02, 1.32, grsR));

          // Cream-white peripheral hollow
          r = r * (1 - collarMask * 0.65) + 0.92 * (collarMask * 0.65);
          g = g * (1 - collarMask * 0.65) + 0.87 * (collarMask * 0.65);
          b = b * (1 - collarMask * 0.65) + 0.78 * (collarMask * 0.65);

          // Terracotta-brick anticyclonic vortex
          const grsRedR = 0.76 + 0.08 * spiral;
          const grsRedG = 0.32 + 0.07 * spiral;
          const grsRedB = 0.20 + 0.04 * spiral;
          r = r * (1 - coreMask * 0.88) + grsRedR * (coreMask * 0.88);
          g = g * (1 - coreMask * 0.88) + grsRedG * (coreMask * 0.88);
          b = b * (1 - coreMask * 0.88) + grsRedB * (coreMask * 0.88);
        }

        // Polar slate-taupe stratospheric haze
        r = r * (1 - polarHaze * 0.52) + 0.46 * (polarHaze * 0.52);
        g = g * (1 - polarHaze * 0.52) + 0.44 * (polarHaze * 0.52);
        b = b * (1 - polarHaze * 0.52) + 0.42 * (polarHaze * 0.52);

        // Micro-turbulence grain
        const micro = (eddy3 - 0.5) * 0.055;
        const idx = (y * width + x) * 4;
        rgba[idx] = Math.round(Math.max(0, Math.min(1, r + micro)) * 255);
        rgba[idx + 1] = Math.round(Math.max(0, Math.min(1, g + micro)) * 255);
        rgba[idx + 2] = Math.round(Math.max(0, Math.min(1, b + micro)) * 255);
        rgba[idx + 3] = 255;
      }
    }

    const texture = new THREE.DataTexture(new Uint8Array(rgba.buffer), width, height, THREE.RGBAFormat);
    texture.flipY = true;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;
    texture.needsUpdate = true;
    return texture;
  }

  function syLat(lat: number): number {
    return Math.sin(lat);
  }

  function smoothstepScalar(edge0: number, edge1: number, x: number): number {
    const t = Math.max(0, Math.min(1, (x - edge0) / Math.max(1e-6, edge1 - edge0)));
    return t * t * (3 - 2 * t);
  }

  /**
   * Fills the unimaged gaps of an archival planetary mosaic (texels of one flat no-data colour)
   * with a smooth push-pull interpolation of the surrounding imaged terrain, so the globe shows
   * soft low-resolution coverage instead of hard-edged cutouts.
   */
  function fillMosaicGaps(
    image: CanvasImageSource & { width: number; height: number },
    gap: readonly [number, number, number],
    tolerance: number
  ): HTMLCanvasElement {
    const width = image.width;
    const height = image.height;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return canvas;
    ctx.drawImage(image, 0, 0);
    const pixels = ctx.getImageData(0, 0, width, height);
    const px = pixels.data;

    interface Level { w: number; h: number; rgb: Float32Array; a: Float32Array }
    const base: Level = { w: width, h: height, rgb: new Float32Array(width * height * 3), a: new Float32Array(width * height) };
    const isGap = new Uint8Array(width * height);
    for (let i = 0; i < width * height; i++) {
      const r = px[i * 4];
      const g = px[i * 4 + 1];
      const b = px[i * 4 + 2];
      if (Math.abs(r - gap[0]) <= tolerance && Math.abs(g - gap[1]) <= tolerance && Math.abs(b - gap[2]) <= tolerance) {
        isGap[i] = 1;
        continue;
      }
      base.rgb[i * 3] = r;
      base.rgb[i * 3 + 1] = g;
      base.rgb[i * 3 + 2] = b;
      base.a[i] = 1;
    }

    // Push: average imaged texels down a 2× pyramid; coverage saturates at 1
    const levels: Level[] = [base];
    while (levels[levels.length - 1].w > 1 || levels[levels.length - 1].h > 1) {
      const fine = levels[levels.length - 1];
      const w = Math.ceil(fine.w / 2);
      const h = Math.ceil(fine.h / 2);
      const coarse: Level = { w, h, rgb: new Float32Array(w * h * 3), a: new Float32Array(w * h) };
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          let sr = 0;
          let sg = 0;
          let sb = 0;
          let sa = 0;
          for (let dy = 0; dy < 2; dy++) {
            const fy = y * 2 + dy;
            if (fy >= fine.h) continue;
            for (let dx = 0; dx < 2; dx++) {
              const fx = x * 2 + dx;
              if (fx >= fine.w) continue;
              const fi = fy * fine.w + fx;
              const fa = fine.a[fi];
              sr += fine.rgb[fi * 3] * fa;
              sg += fine.rgb[fi * 3 + 1] * fa;
              sb += fine.rgb[fi * 3 + 2] * fa;
              sa += fa;
            }
          }
          const ci = y * w + x;
          if (sa > 0) {
            coarse.rgb[ci * 3] = sr / sa;
            coarse.rgb[ci * 3 + 1] = sg / sa;
            coarse.rgb[ci * 3 + 2] = sb / sa;
            coarse.a[ci] = Math.min(1, sa);
          }
        }
      }
      levels.push(coarse);
    }

    // Pull: top up partially covered texels from the bilinearly sampled coarser level
    for (let l = levels.length - 2; l >= 0; l--) {
      const fine = levels[l];
      const coarse = levels[l + 1];
      for (let y = 0; y < fine.h; y++) {
        const cy = Math.min(coarse.h - 1, Math.max(0, (y + 0.5) / 2 - 0.5));
        const y0 = Math.floor(cy);
        const y1 = Math.min(coarse.h - 1, y0 + 1);
        const ty = cy - y0;
        for (let x = 0; x < fine.w; x++) {
          const fi = y * fine.w + x;
          const fa = fine.a[fi];
          if (fa >= 1) continue;
          const cx = Math.min(coarse.w - 1, Math.max(0, (x + 0.5) / 2 - 0.5));
          const x0 = Math.floor(cx);
          const x1 = Math.min(coarse.w - 1, x0 + 1);
          const tx = cx - x0;
          for (let c = 0; c < 3; c++) {
            const top = coarse.rgb[(y0 * coarse.w + x0) * 3 + c] * (1 - tx) + coarse.rgb[(y0 * coarse.w + x1) * 3 + c] * tx;
            const bottom = coarse.rgb[(y1 * coarse.w + x0) * 3 + c] * (1 - tx) + coarse.rgb[(y1 * coarse.w + x1) * 3 + c] * tx;
            fine.rgb[fi * 3 + c] = fine.rgb[fi * 3 + c] * fa + (top * (1 - ty) + bottom * ty) * (1 - fa);
          }
          fine.a[fi] = 1;
        }
      }
    }

    for (let i = 0; i < width * height; i++) {
      if (!isGap[i]) continue;
      px[i * 4] = base.rgb[i * 3];
      px[i * 4 + 1] = base.rgb[i * 3 + 1];
      px[i * 4 + 2] = base.rgb[i * 3 + 2];
    }
    ctx.putImageData(pixels, 0, 0);
    return canvas;
  }

  function createSolidFallbackTexture(rHex: number, gHex: number, bHex: number): THREE.DataTexture {
    const data = new Uint8Array([rHex, gHex, bHex, 255]);
    const tex = new THREE.DataTexture(data, 1, 1, THREE.RGBAFormat);
    tex.needsUpdate = true;
    return tex;
  }

  // ============================================================================
  // Component State & the Single Solo-Beat Waypoint Label
  // ============================================================================
  interface WaypointLabelState {
    id: JourneyWaypointId;
    name: string;
    distanceLabel: string;
    left: number;
    top: number;
    opacity: number;
  }

  let canvasEl: HTMLCanvasElement | undefined = $state();
  let webglFailed = $state(false);
  let fallbackStars: Array<{
    x: number;
    y: number;
    size: number;
    color: string;
    opacity: number;
  }> = $state([]);

  let currentScrollProgress = $state(0);
  let currentChapterIndex = $state(0);
  let waypointLabel = $state<WaypointLabelState | null>(null);
  // Canvas fades up out of the void once the first frame exists, instead of popping in
  let sceneRevealed = $state(false);

  // Intro choreography: idle outward drift keeps the void traveled-through before any scroll
  const STAR_IDLE_DRIFT_PER_SECOND = 1.6;
  // Earth rises into frame as the camera eases back, scrubbed by the intro gate's timeline
  const EARTH_ARRIVAL_DROP = 9.5;
  const CAMERA_ARRIVAL_PUSH_IN = 1.8;
  const EARTH_ARRIVAL_SPIN = 0.35;

  function initFallbackStarData(count: number) {
    const palette = ['#e8e6e1', '#dcd8cf', '#c89b57', '#ddb474', '#b8c4d8'];
    fallbackStars = Array.from({ length: count }, (_, idx) => ({
      x: (idx * 73.13) % 100,
      y: (idx * 41.79) % 100,
      size: 1 + (idx % 3) * 0.8,
      color: palette[idx % palette.length],
      opacity: 0.3 + ((idx * 19) % 55) / 100
    }));
  }

  onMount(() => {
    const mediaReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let prefersReducedMotion = mediaReducedMotion.matches;
    const isMobileInit = window.innerWidth < 768;

    let targetScrollProgress = 0;
    let targetChapterIndex = 0;

    const unsubscribeTelemetry = telemetryStore.subscribe((state: TelemetryState) => {
      targetScrollProgress = Number.isFinite(state.scrollProgress) ? state.scrollProgress : 0;
      targetChapterIndex = Number.isFinite(state.activeChapterIndex) ? state.activeChapterIndex : 0;
      currentScrollProgress = targetScrollProgress;
      currentChapterIndex = targetChapterIndex;
    });

    // Earth's arrival follows the intro timeline (already on station once the intro is complete)
    let earthArrivalLinear = 0;
    const unsubscribeIntro = introTimeStore.subscribe((seconds) => {
      earthArrivalLinear = introEarthArrival(seconds);
    });
    // Fast travel (in-page navigation) lifts the camera's speed cap so it lands with the page
    let fastTravel = false;
    const unsubscribeFastTravel = fastTravelStore.subscribe((active) => {
      fastTravel = active;
    });

    let targetJourney = 0;
    let targetLabelOpacity = 0;
    const unsubscribeJourney = journeyStore.subscribe((state: JourneyState) => {
      targetJourney = Number.isFinite(state.position) ? state.position : 0;
      targetLabelOpacity = Number.isFinite(state.labelOpacity) ? state.labelOpacity : 0;
    });

    if (!canvasEl) {
      return () => {
        unsubscribeTelemetry();
        unsubscribeIntro();
        unsubscribeFastTravel();
        unsubscribeJourney();
      };
    }

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: canvasEl,
        antialias: !isMobileInit,
        alpha: false,
        powerPreference: 'high-performance'
      });
    } catch {
      webglFailed = true;
      initFallbackStarData(180);
      return () => {
        unsubscribeTelemetry();
        unsubscribeIntro();
        unsubscribeFastTravel();
        unsubscribeJourney();
      };
    }

    const initialPixelRatio = Math.min(window.devicePixelRatio || 1, isMobileInit ? 1.0 : 1.25);
    renderer.setPixelRatio(initialPixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.setClearColor(0x050607, 1);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      56,
      window.innerWidth / Math.max(window.innerHeight, 1),
      0.1,
      900
    );

    // ==========================================================================
    // 1. Single Skybox Pass (NEBULA_VERTEX_SHADER / NEBULA_FRAGMENT_SHADER)
    // ==========================================================================
    const nebulaGeometry = new THREE.SphereGeometry(460, 40, 28);
    const nebulaUniforms = {
      uTime: { value: 0 },
      uScrollProgress: { value: 0 },
      uChapterIndex: { value: 0 },
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uWarpSpeed: { value: 0 }
    };
    const nebulaMaterial = new THREE.ShaderMaterial({
      vertexShader: NEBULA_VERTEX_SHADER,
      fragmentShader: NEBULA_FRAGMENT_SHADER,
      uniforms: nebulaUniforms,
      side: THREE.BackSide,
      depthWrite: false,
      depthTest: false
    });
    const nebulaMesh = new THREE.Mesh(nebulaGeometry, nebulaMaterial);
    nebulaMesh.renderOrder = -20;
    scene.add(nebulaMesh);

    // ==========================================================================
    // 2. 6,000 Multi-Layer Parallax Stars (Near, Mid, Far Depth Shells)
    // ==========================================================================
    const starCount = isMobileInit ? 3600 : 6000;
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    const starSizes = new Float32Array(starCount);
    const starPhases = new Float32Array(starCount);
    const starSpeeds = new Float32Array(starCount);
    const starBrightRanks = new Float32Array(starCount);

    const galacticNormal = new THREE.Vector3(0.38, 0.82, -0.42).normalize();
    const tempVec = new THREE.Vector3();

    let seed = 19770905;
    const nextRand = (): number => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };

    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      const shellRoll = i / starCount;

      let shellSpeed = 0.35;
      let spreadXY = 320;
      if (shellRoll < 0.15) {
        shellSpeed = 1.15 + nextRand() * 0.65;
        spreadXY = 190;
      } else if (shellRoll < 0.50) {
        shellSpeed = 0.62 + nextRand() * 0.42;
        spreadXY = 260;
      } else {
        shellSpeed = 0.22 + nextRand() * 0.34;
        spreadXY = 340;
      }

      let x = (nextRand() - 0.5) * spreadXY;
      let y = (nextRand() - 0.5) * (spreadXY * 0.72);
      const z = -nextRand() * 280;

      if (shellRoll >= 0.35 && nextRand() < 0.48) {
        tempVec.set(x, y, (nextRand() - 0.5) * 160);
        const distFromPlane = tempVec.dot(galacticNormal);
        tempVec.addScaledVector(galacticNormal, -distFromPlane * 0.72);
        x = tempVec.x;
        y = tempVec.y;
      }

      starPositions[i3] = x;
      starPositions[i3 + 1] = y;
      starPositions[i3 + 2] = z;
      const specRoll = nextRand();
      const isBrightest3Percent = specRoll < 0.03;
      let r = 0.91;
      let g = 0.90;
      let b = 0.88;
      let baseSize = 1.2;
      if (isBrightest3Percent) {
        const warmOrCool = nextRand();
        if (warmOrCool < 0.45) {
          r = 0.88;
          g = 0.74;
          b = 0.52;
        } else {
          r = 0.84;
          g = 0.89;
          b = 0.97;
        }
        baseSize = 2.25 + nextRand() * 1.15;
      } else if (specRoll < 0.26) {
        r = 0.91 + nextRand() * 0.06;
        g = 0.89 + nextRand() * 0.06;
        b = 0.85 + nextRand() * 0.08;
        baseSize = 1.3 + nextRand() * 0.95;
      } else if (specRoll < 0.62) {
        const t = nextRand();
        r = 0.92;
        g = 0.76 + t * 0.12;
        b = 0.54 + t * 0.18;
        baseSize = 1.0 + nextRand() * 0.9;
      } else {
        const t = nextRand();
        r = 0.82 + t * 0.10;
        g = 0.78 + t * 0.10;
        b = 0.74 + t * 0.14;
        baseSize = 0.72 + nextRand() * 0.75;
      }

      starColors[i3] = r;
      starColors[i3 + 1] = g;
      starColors[i3 + 2] = b;
      starSizes[i] = baseSize;
      starPhases[i] = nextRand();
      starSpeeds[i] = shellSpeed;
      starBrightRanks[i] = isBrightest3Percent ? 1.0 : 0.0;
    }

    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('aColor', new THREE.BufferAttribute(starColors, 3));
    starGeometry.setAttribute('aSize', new THREE.BufferAttribute(starSizes, 1));
    starGeometry.setAttribute('aPhase', new THREE.BufferAttribute(starPhases, 1));
    starGeometry.setAttribute('aSpeed', new THREE.BufferAttribute(starSpeeds, 1));
    starGeometry.setAttribute('aBrightRank', new THREE.BufferAttribute(starBrightRanks, 1));

    const starUniforms = {
      uTime: { value: 0 },
      uTravelZ: { value: 0 },
      uWarpVelocity: { value: 0 },
      uPixelRatio: { value: initialPixelRatio },
      uReducedMotion: { value: prefersReducedMotion ? 1.0 : 0.0 }
    };

    const starMaterial = new THREE.ShaderMaterial({
      vertexShader: STARFIELD_VERTEX_SHADER,
      fragmentShader: STARFIELD_FRAGMENT_SHADER,
      uniforms: starUniforms,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const starPoints = new THREE.Points(starGeometry, starMaterial);
    starPoints.frustumCulled = false;
    starPoints.renderOrder = -5;
    scene.add(starPoints);
    // ==========================================================================
    // 3. WAYPOINT 1: EARTH (1.00 AU / 222 km LEO) — Largest Presence at Start
    // ==========================================================================
    const earthGroup = new THREE.Group();
    scene.add(earthGroup);

    const earthSunDirection = new THREE.Vector3(-0.62, 0.38, 0.68).normalize();
    const earthSurfaceTexture = createEarthSurfaceTexture();
    const earthSurfaceGeometry = new THREE.SphereGeometry(5.2, 96, 72);
    const earthSurfaceUniforms: {
      uSurfaceMap: { value: THREE.Texture };
      uDayMap: { value: THREE.Texture };
      uNightMap: { value: THREE.Texture };
      uCloudsMap: { value: THREE.Texture };
      uUseRealTextures: { value: number };
      uTime: { value: number };
      uSunDirection: { value: THREE.Vector3 };
      uCloudDensity: { value: number };
      uCityLightIntensity: { value: number };
      uOpacity: { value: number };
      uPaleBlueDotMix: { value: number };
    } = {
      uSurfaceMap: { value: earthSurfaceTexture },
      uDayMap: { value: earthSurfaceTexture },
      uNightMap: { value: earthSurfaceTexture },
      uCloudsMap: { value: earthSurfaceTexture },
      uUseRealTextures: { value: 0.0 },
      uTime: { value: 0 },
      uSunDirection: { value: earthSunDirection.clone() },
      uCloudDensity: { value: 0.82 },
      uCityLightIntensity: { value: 1.35 },
      uOpacity: { value: 1.0 },
      uPaleBlueDotMix: { value: 0.0 }
    };

    let isDisposed = false;
    const disposableTextures: THREE.Texture[] = [earthSurfaceTexture];
    const textureLoader = new THREE.TextureLoader();
    const maxAnisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 4);
    let loadedEarthTexCount = 0;

    const configurePlanetTexture = (tex: THREE.Texture) => {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.anisotropy = maxAnisotropy;
      tex.needsUpdate = true;
    };

    const markEarthTextureReady = () => {
      loadedEarthTexCount += 1;
      if (loadedEarthTexCount >= 3 && !isDisposed) {
        earthSurfaceUniforms.uUseRealTextures.value = 1.0;
      }
    };

    textureLoader.load('/assets/textures/earth-day.webp', (tex) => {
      if (isDisposed) {
        tex.dispose();
        return;
      }
      configurePlanetTexture(tex);
      disposableTextures.push(tex);
      earthSurfaceUniforms.uDayMap.value = tex;
      markEarthTextureReady();
    });

    textureLoader.load('/assets/textures/earth-night.webp', (tex) => {
      if (isDisposed) {
        tex.dispose();
        return;
      }
      configurePlanetTexture(tex);
      disposableTextures.push(tex);
      earthSurfaceUniforms.uNightMap.value = tex;
      markEarthTextureReady();
    });
    textureLoader.load('/assets/textures/earth-clouds.webp', (tex) => {
      if (isDisposed) {
        tex.dispose();
        return;
      }
      configurePlanetTexture(tex);
      disposableTextures.push(tex);
      earthSurfaceUniforms.uCloudsMap.value = tex;
      markEarthTextureReady();
    });
    const earthSurfaceMaterial = new THREE.ShaderMaterial({
      vertexShader: EARTH_PROCEDURAL_SURFACE_VERTEX_SHADER,
      fragmentShader: EARTH_PROCEDURAL_SURFACE_FRAGMENT_SHADER,
      uniforms: earthSurfaceUniforms,
      transparent: true
    });
    const earthSurfaceMesh = new THREE.Mesh(earthSurfaceGeometry, earthSurfaceMaterial);
    earthSurfaceMesh.rotation.z = THREE.MathUtils.degToRad(23.44);
    earthSurfaceMesh.rotation.y = -1.15;
    earthGroup.add(earthSurfaceMesh);

    const atmosphereGeometry = new THREE.SphereGeometry(5.35, 96, 72);
    const atmosphereUniforms = {
      uTime: { value: 0 },
      uSunDirection: { value: earthSunDirection.clone() },
      uAtmosphereColor: { value: new THREE.Vector3(0.26, 0.50, 0.88) },
      uSunsetColor: { value: new THREE.Vector3(0.86, 0.56, 0.28) },
      uAtmosphereIntensity: { value: 1.28 },
      uOpacity: { value: 1.0 },
      uPaleBlueDotMix: { value: 0.0 }
    };
    const atmosphereMaterial = new THREE.ShaderMaterial({
      vertexShader: PLANET_ATMOSPHERE_VERTEX_SHADER,
      fragmentShader: PLANET_ATMOSPHERE_FRAGMENT_SHADER,
      uniforms: atmosphereUniforms,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.FrontSide
    });
    const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    earthGroup.add(atmosphereMesh);

    // ==========================================================================
    // 4. WAYPOINT 2: MARS (1.52 AU — Viking 1 & 2 / Pathfinder / Perseverance)
    // ==========================================================================
    const marsGroup = new THREE.Group();
    scene.add(marsGroup);

    const marsFallbackTex = createSolidFallbackTexture(184, 96, 58);
    disposableTextures.push(marsFallbackTex);
    const marsGeometry = new THREE.SphereGeometry(2.15, 72, 54);
    const marsUniforms = {
      uAlbedoMap: { value: marsFallbackTex as THREE.Texture },
      uSunDirection: { value: new THREE.Vector3(0.75, 0.28, 0.60).normalize() },
      uLimbColor: { value: new THREE.Vector3(0.86, 0.46, 0.24) },
      uTint: { value: new THREE.Vector3(1.06, 0.96, 0.90) },
      uLimbPower: { value: 3.2 },
      uLimbIntensity: { value: 0.68 },
      uRoughness: { value: 1.0 },
      uOpacity: { value: 0.0 },
      uAmbientFloor: { value: 0.05 },
      uCastRingShadow: { value: 0.0 },
      uPlanetCenter: { value: new THREE.Vector3() },
      uRingNormal: { value: new THREE.Vector3(0, 1, 0) },
      uRingInnerRadius: { value: 1.0 },
      uRingOuterRadius: { value: 2.0 }
    };
    const marsMaterial = new THREE.ShaderMaterial({
      vertexShader: PLANET_BODY_VERTEX_SHADER,
      fragmentShader: PLANET_BODY_FRAGMENT_SHADER,
      uniforms: marsUniforms,
      transparent: true
    });
    const marsMesh = new THREE.Mesh(marsGeometry, marsMaterial);
    marsMesh.rotation.z = THREE.MathUtils.degToRad(25.19);
    // North tipped toward the viewer: keeps the mosaic's ragged south-polar gaps behind the limb
    marsMesh.rotation.x = 0.32;
    marsGroup.add(marsMesh);

    textureLoader.load('/assets/textures/mars-map.webp', (tex) => {
      if (isDisposed) {
        tex.dispose();
        return;
      }
      configurePlanetTexture(tex);
      disposableTextures.push(tex);
      marsUniforms.uAlbedoMap.value = tex;
    });

    // ==========================================================================
    // 5. WAYPOINT 3: JUPITER (5.20 AU — Voyager 1 & 2 Gravity Assist / Galileo)
    // ==========================================================================
    const jupiterGroup = new THREE.Group();
    scene.add(jupiterGroup);

    const jupiterTex = createJupiterSurfaceTexture();
    disposableTextures.push(jupiterTex);
    const jupiterGeometry = new THREE.SphereGeometry(3.45, 84, 64);
    const jupiterUniforms = {
      uAlbedoMap: { value: jupiterTex as THREE.Texture },
      uSunDirection: { value: new THREE.Vector3(-0.74, 0.22, 0.63).normalize() },
      uLimbColor: { value: new THREE.Vector3(0.84, 0.71, 0.48) },
      uTint: { value: new THREE.Vector3(1.02, 1.0, 0.96) },
      uLimbPower: { value: 3.6 },
      uLimbIntensity: { value: 0.55 },
      uRoughness: { value: 0.22 },
      uOpacity: { value: 0.0 },
      uAmbientFloor: { value: 0.06 },
      uCastRingShadow: { value: 0.0 },
      uPlanetCenter: { value: new THREE.Vector3() },
      uRingNormal: { value: new THREE.Vector3(0, 1, 0) },
      uRingInnerRadius: { value: 1.0 },
      uRingOuterRadius: { value: 2.0 }
    };
    const jupiterMaterial = new THREE.ShaderMaterial({
      vertexShader: PLANET_BODY_VERTEX_SHADER,
      fragmentShader: PLANET_BODY_FRAGMENT_SHADER,
      uniforms: jupiterUniforms,
      transparent: true
    });
    const jupiterMesh = new THREE.Mesh(jupiterGeometry, jupiterMaterial);
    jupiterMesh.scale.set(1.0, 0.935, 1.0); // True Jovian oblateness
    jupiterMesh.rotation.z = THREE.MathUtils.degToRad(3.13);
    jupiterGroup.add(jupiterMesh);

    // Europa & Io Galilean Moon companions
    const galileanMoonGeo = new THREE.SphereGeometry(0.16, 24, 18);
    const europaMat = new THREE.MeshBasicMaterial({
      color: 0xe6e2d8,
      transparent: true,
      opacity: 0.0
    });
    const europaMesh = new THREE.Mesh(galileanMoonGeo, europaMat);
    // On the far side from the approach path, clear of the next waypoint in frame
    europaMesh.position.set(4.6, 0.3, 1.6);
    jupiterGroup.add(europaMesh);

    // ==========================================================================
    // 6. WAYPOINT 4: SATURN & RINGS (9.54 AU — Voyager 1 / Cassini–Huygens)
    // ==========================================================================
    const saturnGroup = new THREE.Group();
    scene.add(saturnGroup);

    const saturnTiltGroup = new THREE.Group();
    saturnTiltGroup.rotation.z = THREE.MathUtils.degToRad(26.73);
    saturnTiltGroup.rotation.x = THREE.MathUtils.degToRad(16.0);
    saturnGroup.add(saturnTiltGroup);

    const saturnFallbackTex = createSolidFallbackTexture(212, 186, 138);
    disposableTextures.push(saturnFallbackTex);
    const saturnRadius = 2.6;
    const saturnRingInner = 2.98;
    const saturnRingOuter = 6.15;

    const saturnBodyGeo = new THREE.SphereGeometry(saturnRadius, 84, 64);
    const saturnBodyUniforms = {
      uAlbedoMap: { value: saturnFallbackTex as THREE.Texture },
      uSunDirection: { value: new THREE.Vector3(0.72, 0.34, 0.60).normalize() },
      uLimbColor: { value: new THREE.Vector3(0.88, 0.76, 0.50) },
      uTint: { value: new THREE.Vector3(1.04, 1.0, 0.94) },
      uLimbPower: { value: 3.5 },
      uLimbIntensity: { value: 0.58 },
      uRoughness: { value: 0.18 },
      uOpacity: { value: 0.0 },
      uAmbientFloor: { value: 0.06 },
      uCastRingShadow: { value: 1.0 },
      uPlanetCenter: { value: new THREE.Vector3() },
      uRingNormal: { value: new THREE.Vector3(0, 1, 0) },
      uRingInnerRadius: { value: saturnRingInner },
      uRingOuterRadius: { value: saturnRingOuter }
    };
    const saturnBodyMat = new THREE.ShaderMaterial({
      vertexShader: PLANET_BODY_VERTEX_SHADER,
      fragmentShader: PLANET_BODY_FRAGMENT_SHADER,
      uniforms: saturnBodyUniforms,
      transparent: true
    });
    const saturnBodyMesh = new THREE.Mesh(saturnBodyGeo, saturnBodyMat);
    saturnBodyMesh.scale.set(1.0, 0.902, 1.0); // True Saturn oblateness
    saturnTiltGroup.add(saturnBodyMesh);

    const saturnRingGeo = new THREE.RingGeometry(saturnRingInner, saturnRingOuter, 128, 4);
    const saturnRingUniforms = {
      uRingMap: { value: saturnFallbackTex as THREE.Texture },
      uHasRingMap: { value: 0.0 },
      uSunDirection: { value: saturnBodyUniforms.uSunDirection.value },
      uPlanetCenter: { value: new THREE.Vector3() },
      uPlanetRadius: { value: saturnRadius },
      uInnerRadius: { value: saturnRingInner },
      uOuterRadius: { value: saturnRingOuter },
      uOpacity: { value: 0.0 }
    };
    const saturnRingMat = new THREE.ShaderMaterial({
      vertexShader: SATURN_WAYPOINT_RING_VERTEX_SHADER,
      fragmentShader: SATURN_WAYPOINT_RING_FRAGMENT_SHADER,
      uniforms: saturnRingUniforms,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const saturnRingMesh = new THREE.Mesh(saturnRingGeo, saturnRingMat);
    saturnRingMesh.rotation.x = -Math.PI * 0.5;
    saturnTiltGroup.add(saturnRingMesh);

    textureLoader.load('/assets/textures/saturn-map.webp', (tex) => {
      if (isDisposed) {
        tex.dispose();
        return;
      }
      configurePlanetTexture(tex);
      disposableTextures.push(tex);
      saturnBodyUniforms.uAlbedoMap.value = tex;
    });

    textureLoader.load('/assets/textures/saturn-rings.webp', (tex) => {
      if (isDisposed) {
        tex.dispose();
        return;
      }
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.needsUpdate = true;
      disposableTextures.push(tex);
      saturnRingUniforms.uRingMap.value = tex;
      saturnRingUniforms.uHasRingMap.value = 1.0;
    });

    // ==========================================================================
    // 7. WAYPOINT 5: PLUTO & CHARON (39.5 AU — New Horizons 2015 Flyby)
    // ==========================================================================
    const plutoGroup = new THREE.Group();
    scene.add(plutoGroup);

    const plutoFallbackTex = createSolidFallbackTexture(196, 168, 144);
    disposableTextures.push(plutoFallbackTex);
    const plutoGeo = new THREE.SphereGeometry(1.58, 64, 48);
    const plutoUniforms = {
      uAlbedoMap: { value: plutoFallbackTex as THREE.Texture },
      uSunDirection: { value: new THREE.Vector3(-0.70, 0.26, 0.66).normalize() },
      uLimbColor: { value: new THREE.Vector3(0.46, 0.68, 0.94) }, // Thin blue nitrogen-methane haze
      uTint: { value: new THREE.Vector3(1.05, 1.0, 0.96) },
      uLimbPower: { value: 3.8 },
      uLimbIntensity: { value: 0.62 },
      uRoughness: { value: 0.92 },
      uOpacity: { value: 0.0 },
      uAmbientFloor: { value: 0.05 },
      uCastRingShadow: { value: 0.0 },
      uPlanetCenter: { value: new THREE.Vector3() },
      uRingNormal: { value: new THREE.Vector3(0, 1, 0) },
      uRingInnerRadius: { value: 1.0 },
      uRingOuterRadius: { value: 2.0 }
    };
    const plutoMat = new THREE.ShaderMaterial({
      vertexShader: PLANET_BODY_VERTEX_SHADER,
      fragmentShader: PLANET_BODY_FRAGMENT_SHADER,
      uniforms: plutoUniforms,
      transparent: true
    });
    const plutoMesh = new THREE.Mesh(plutoGeo, plutoMat);
    plutoMesh.rotation.z = THREE.MathUtils.degToRad(12.0);
    // North tipped toward the viewer: centres Tombaugh Regio and pushes the smeared low-resolution
    // southern coverage down to the limb
    plutoMesh.rotation.x = 0.62;
    plutoGroup.add(plutoMesh);

    // Tidally locked companion Charon
    const charonGeo = new THREE.SphereGeometry(0.72, 40, 32);
    const charonUniforms = {
      uAlbedoMap: { value: plutoFallbackTex as THREE.Texture },
      uSunDirection: { value: plutoUniforms.uSunDirection.value },
      uLimbColor: { value: new THREE.Vector3(0.55, 0.56, 0.60) },
      uTint: { value: new THREE.Vector3(0.76, 0.75, 0.74) },
      uLimbPower: { value: 4.0 },
      uLimbIntensity: { value: 0.22 },
      uRoughness: { value: 1.0 },
      uOpacity: { value: 0.0 },
      uAmbientFloor: { value: 0.04 },
      uCastRingShadow: { value: 0.0 },
      uPlanetCenter: { value: new THREE.Vector3() },
      uRingNormal: { value: new THREE.Vector3(0, 1, 0) },
      uRingInnerRadius: { value: 1.0 },
      uRingOuterRadius: { value: 2.0 }
    };
    const charonMat = new THREE.ShaderMaterial({
      vertexShader: PLANET_BODY_VERTEX_SHADER,
      fragmentShader: PLANET_BODY_FRAGMENT_SHADER,
      uniforms: charonUniforms,
      transparent: true
    });
    const charonMesh = new THREE.Mesh(charonGeo, charonMat);
    charonMesh.position.set(-2.9, 0.65, -2.1);
    plutoGroup.add(charonMesh);

    textureLoader.load('/assets/textures/pluto-map.webp', (loaded) => {
      if (isDisposed) {
        loaded.dispose();
        return;
      }
      // The New Horizons mosaic leaves ~30% unimaged as flat (42, 36, 31); without filling, those
      // regions read as a hard-edged cutout on the globe
      const tex = new THREE.CanvasTexture(fillMosaicGaps(loaded.image, [42, 36, 31], 6));
      loaded.dispose();
      configurePlanetTexture(tex);
      disposableTextures.push(tex);
      plutoUniforms.uAlbedoMap.value = tex;
      charonUniforms.uAlbedoMap.value = tex;
    });

    // ==========================================================================
    // 8. WAYPOINT 6: HELIOPAUSE BOW-WAVE SHELL (121.6 AU) & INTERSTELLAR SOL
    // ==========================================================================
    const heliopauseGeo = new THREE.SphereGeometry(
      24.0,
      64,
      48,
      0,
      Math.PI * 2,
      0,
      Math.PI * 0.48
    );
    const heliopauseUniforms = {
      uTime: { value: 0 },
      uIntensity: { value: 0 }
    };
    const heliopauseMat = new THREE.ShaderMaterial({
      vertexShader: HELIOPAUSE_SHELL_VERTEX_SHADER,
      fragmentShader: HELIOPAUSE_SHELL_FRAGMENT_SHADER,
      uniforms: heliopauseUniforms,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    const heliopauseMesh = new THREE.Mesh(heliopauseGeo, heliopauseMat);
    heliopauseMesh.rotation.x = Math.PI * 0.5;
    scene.add(heliopauseMesh);

    // Distant Sol / "Pale Blue Dot" Sunbeam Billboard in Outer Heliosphere & Interstellar Space
    const paleBlueDotGeometry = new THREE.PlaneGeometry(5.5, 5.5);
    const paleBlueDotUniforms = {
      uTime: { value: 0 },
      uIntensity: { value: 0.0 }
    };
    const paleBlueDotMaterial = new THREE.ShaderMaterial({
      vertexShader: PALE_BLUE_DOT_HALO_VERTEX_SHADER,
      fragmentShader: PALE_BLUE_DOT_HALO_FRAGMENT_SHADER,
      uniforms: paleBlueDotUniforms,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      // Occluded by bodies in front of it: nothing may cover the waypoint being observed
      depthTest: true
    });
    const paleBlueDotMesh = new THREE.Mesh(paleBlueDotGeometry, paleBlueDotMaterial);
    paleBlueDotMesh.renderOrder = 2;
    scene.add(paleBlueDotMesh);

    // ==========================================================================
    // 9. Whisper-Subtle Warm-Amber Voyager 1 Trajectory Filament (opacity: 0.14)
    // ==========================================================================
    const trajectoryGroup = new THREE.Group();
    scene.add(trajectoryGroup);

    const trajectoryControlPoints = [
      new THREE.Vector3(3.4, -4.0, 1.0),
      new THREE.Vector3(-1.4, -2.4, -14.0),
      new THREE.Vector3(-6.8, -0.6, -32.0),
      new THREE.Vector3(2.5, 2.2, -52.0),
      new THREE.Vector3(7.4, 5.8, -76.0),
      new THREE.Vector3(1.8, 9.2, -104.0),
      new THREE.Vector3(-5.2, 12.6, -132.0),
      new THREE.Vector3(-9.5, 16.4, -162.0)
    ];

    const voyagerCurve = new THREE.CatmullRomCurve3(trajectoryControlPoints, false, 'catmullrom', 0.5);
    const curveSegments = 240;
    const curvePoints = voyagerCurve.getPoints(curveSegments);
    const curvePositions = new Float32Array((curveSegments + 1) * 3);
    const curveArcProgress = new Float32Array(curveSegments + 1);

    for (let i = 0; i <= curveSegments; i++) {
      const pt = curvePoints[i];
      curvePositions[i * 3] = pt.x;
      curvePositions[i * 3 + 1] = pt.y;
      curvePositions[i * 3 + 2] = pt.z;
      curveArcProgress[i] = i / curveSegments;
    }

    const trajectoryGeometry = new THREE.BufferGeometry();
    trajectoryGeometry.setAttribute('position', new THREE.BufferAttribute(curvePositions, 3));
    trajectoryGeometry.setAttribute('aArcProgress', new THREE.BufferAttribute(curveArcProgress, 1));

    const trajectoryUniforms = {
      uTime: { value: 0 },
      uScrollProgress: { value: 0 },
      // Filament departs from Earth, so it arrives (and retires) with the planet
      uOpacity: { value: 0 }
    };
    const trajectoryMaterial = new THREE.ShaderMaterial({
      vertexShader: VOYAGER_TRAJECTORY_VERTEX_SHADER,
      fragmentShader: VOYAGER_TRAJECTORY_FRAGMENT_SHADER,
      uniforms: trajectoryUniforms,
      transparent: true,
      blending: THREE.NormalBlending,
      depthWrite: false
    });
    const trajectoryLine = new THREE.Line(trajectoryGeometry, trajectoryMaterial);
    trajectoryGroup.add(trajectoryLine);

    // ==========================================================================
    // 10. Journey Rig — One World, One Camera: Waypoint Bodies & Their Framings
    // ==========================================================================
    const TAN_HALF_FOV = Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5));
    /** Bodies thin out with distance instead of popping at the far plane. */
    const BODY_FADE_NEAR = 230;
    const BODY_FADE_FAR = 340;
    /** Earth settles into a pale blue dot as the camera leaves it behind. */
    const PALE_BLUE_DOT_NEAR = 60;
    const PALE_BLUE_DOT_FAR = 150;
    /** Earth's globe shrinks to this fraction as it becomes the pale blue dot behind Mars. */
    const PALE_BLUE_DOT_SCALE = 0.4;
    /** Star shells sit this far ahead of the camera, as in the original fixed rig. */
    const STAR_SHELL_LEAD = 12.0;
    /** Star shells recede slower than the camera backs away so they read as distant. */
    const STAR_TRAVEL_RATIO = 0.5;
    /** Camera speed (world units / s) to warp-streak factor. */
    const WARP_SPEED_SCALE = 0.0024;
    /** How far the camera turns into its flight heading, and how much it banks with the turn. */
    const FLIGHT_HEADING_FOLLOW = 0.32;
    const FLIGHT_BANK = 0.6;
    /**
     * Hard ceiling on camera speed through the journey, in coordinate units per second (one unit is
     * one waypoint hold or one flight leg): no flick can carry the camera faster than this.
     */
    const MAX_JOURNEY_SPEED = 2.0;
    /** Fly-through catch-up: tracks the eased fast travel closely, uncapped, so it lands on time. */
    const FAST_TRAVEL_CATCH_UP = 12.0;
    /** Mesh yaw that turns texture column `u` toward +Z (the camera) for SphereGeometry UVs. */
    const faceTextureColumn = (u: number): number => Math.PI * 0.5 - Math.PI * 2.0 * u;
    // Each body shows its best-imaged hemisphere: the archival mosaics have unimaged gaps elsewhere
    const MARS_FACE_YAW = faceTextureColumn(0.56); // Tharsis & Valles Marineris
    const JUPITER_FACE_YAW = faceTextureColumn(0.58); // Great Red Spot
    const SATURN_FACE_YAW = faceTextureColumn(0.25);
    const PLUTO_FACE_YAW = faceTextureColumn(0.49); // Tombaugh Regio
    // Charon borrows Pluto's map: face it away from the heart so it doesn't echo Pluto's face
    const CHARON_FACE_YAW = faceTextureColumn(0.92);
    /** Scroll-scrubbed spin (rad per journey unit) while a waypoint is observed. */
    const OBSERVE_SPIN_RATE = 0.12;

    /**
     * A camera framing: either the framing centre's ndc position plus its apparent radius as a
     * fraction of the viewport half-height (the camera looks straight down −Z), or a fixed world
     * offset from the centre (the hero shot, which must not depend on aspect ratio).
     */
    type CameraFrame =
      | { x: number; y: number; r: number }
      | { offset: readonly [number, number, number] };

    interface StationRig {
      id: JourneyWaypointId;
      center: THREE.Vector3;
      frameRadius: number;
      /** Arrive straight through the framing centre (an open shell) instead of passing beside it. */
      flyThrough?: boolean;
      /** [hold start, hold end]: the slow drift across the panel and solo beats. */
      desktop: readonly [CameraFrame, CameraFrame];
      mobile: readonly [CameraFrame, CameraFrame];
      /** Solo label beside the body, or in the lower-left corner for diffuse subjects. */
      label: 'beside' | 'corner';
    }

    // The camera faces sunward (−Z) and backs outward (+Z): each body sits behind the camera until
    // it is passed, then slides into view and recedes. Bodies stay put; only the camera travels.
    // Mars sits far enough off Earth's line that the receding pale blue dot never touches its limb
    marsGroup.position.set(-30, 6, 130);
    jupiterGroup.position.set(18, -3, 260);
    saturnGroup.position.set(-18, 3, 390);
    plutoGroup.position.set(18, -2, 520);
    heliopauseMesh.position.set(0, 0, 660);
    paleBlueDotMesh.position.set(14, 5, 790);
    // The filament departs Earth: anchored where it sat relative to the hero camera
    const TRAJECTORY_ANCHOR = new THREE.Vector3(-3.2, 1.3, -4.6);

    saturnGroup.updateMatrixWorld(true);
    saturnBodyUniforms.uPlanetCenter.value.copy(saturnGroup.position);
    saturnRingUniforms.uPlanetCenter.value.copy(saturnGroup.position);
    const ringNormalWorld = new THREE.Vector3(0, 1, 0)
      .applyQuaternion(saturnTiltGroup.getWorldQuaternion(new THREE.Quaternion()))
      .normalize();
    saturnBodyUniforms.uRingNormal.value.copy(ringNormalWorld);

    // Fixed sunlit-gibbous phase per body, lit from over the camera's shoulder (no Sun is drawn)
    marsUniforms.uSunDirection.value.set(0.75, 0.24, 0.68).normalize();
    jupiterUniforms.uSunDirection.value.set(-0.75, 0.22, 0.68).normalize();
    saturnBodyUniforms.uSunDirection.value.set(0.72, 0.36, 0.68).normalize();
    plutoUniforms.uSunDirection.value.set(-0.68, 0.25, 0.68).normalize();

    const RIG_DEFS: Record<JourneyWaypointId, Omit<StationRig, 'id'>> = {
      earth: {
        center: new THREE.Vector3(0, 0, 0),
        frameRadius: 5.35,
        desktop: [{ offset: [-3.2, 1.3, 7.4] }, { x: 0.24, y: -0.04, r: 0.58 }],
        mobile: [{ offset: [-1.2, 1.8, 8.8] }, { x: 0, y: 0.06, r: 0.36 }],
        label: 'beside'
      },
      mars: {
        center: marsGroup.position.clone(),
        frameRadius: 2.15,
        desktop: [{ x: -0.22, y: 0.02, r: 0.42 }, { x: -0.18, y: 0, r: 0.48 }],
        mobile: [{ x: -0.06, y: 0.08, r: 0.3 }, { x: -0.06, y: 0.06, r: 0.34 }],
        label: 'beside'
      },
      jupiter: {
        center: jupiterGroup.position.clone(),
        frameRadius: 3.45,
        desktop: [{ x: 0.2, y: 0, r: 0.44 }, { x: 0.16, y: 0.02, r: 0.5 }],
        mobile: [{ x: 0, y: 0.08, r: 0.3 }, { x: 0, y: 0.06, r: 0.34 }],
        label: 'beside'
      },
      saturn: {
        center: saturnGroup.position.clone(),
        frameRadius: saturnRingOuter,
        desktop: [{ x: -0.18, y: 0.02, r: 0.5 }, { x: -0.14, y: 0, r: 0.56 }],
        mobile: [{ x: 0, y: 0.06, r: 0.38 }, { x: 0, y: 0.05, r: 0.42 }],
        label: 'beside'
      },
      pluto: {
        // Framed between Pluto and Charon, weighted toward Pluto
        center: plutoGroup.position.clone().add(new THREE.Vector3(-1.0, 0.25, -0.7)),
        frameRadius: 2.6,
        desktop: [{ x: 0.2, y: 0, r: 0.36 }, { x: 0.17, y: 0.02, r: 0.42 }],
        mobile: [{ x: 0.04, y: 0.08, r: 0.26 }, { x: 0.04, y: 0.06, r: 0.29 }],
        label: 'beside'
      },
      heliopause: {
        center: heliopauseMesh.position.clone(),
        frameRadius: 24.0,
        flyThrough: true,
        desktop: [{ x: 0, y: 0, r: 0.72 }, { x: 0, y: 0.02, r: 0.82 }],
        mobile: [{ x: 0, y: 0.04, r: 0.4 }, { x: 0, y: 0.04, r: 0.45 }],
        label: 'corner'
      },
      interstellar: {
        center: paleBlueDotMesh.position.clone(),
        frameRadius: 2.75,
        desktop: [{ x: 0.22, y: 0.12, r: 0.2 }, { x: 0.2, y: 0.1, r: 0.24 }],
        mobile: [{ x: 0, y: 0.12, r: 0.16 }, { x: 0, y: 0.1, r: 0.19 }],
        label: 'beside'
      },
      'deep-void': {
        center: new THREE.Vector3(-6, 2, 900),
        frameRadius: 1.0,
        desktop: [{ offset: [0, 0, 40] }, { offset: [0, -0.5, 30] }],
        mobile: [{ offset: [0, 0, 40] }, { offset: [0, -0.5, 30] }],
        label: 'corner'
      }
    };
    const STATION_RIGS: StationRig[] = JOURNEY_WAYPOINTS.map((w) => ({ id: w.id, ...RIG_DEFS[w.id] }));
    const MAX_JOURNEY = 2 * (STATION_RIGS.length - 1) + 1;

    const smootherstep01 = (t: number): number => {
      const x = THREE.MathUtils.clamp(t, 0, 1);
      return x * x * x * (x * (x * 6.0 - 15.0) + 10.0);
    };
    const bodyFade = (dist: number): number =>
      1.0 - THREE.MathUtils.smoothstep(dist, BODY_FADE_NEAR, BODY_FADE_FAR);

    const framePose = (rig: StationRig, frame: CameraFrame, aspect: number, out: THREE.Vector3) => {
      if ('offset' in frame) {
        return out.set(
          rig.center.x + frame.offset[0],
          rig.center.y + frame.offset[1],
          rig.center.z + frame.offset[2]
        );
      }
      const d = rig.frameRadius / (frame.r * TAN_HALF_FOV);
      return out.set(
        rig.center.x - frame.x * TAN_HALF_FOV * aspect * d,
        rig.center.y - frame.y * TAN_HALF_FOV * d,
        rig.center.z + d
      );
    };

    const holdStartPose = new THREE.Vector3();
    const holdEndPose = new THREE.Vector3();
    const holdPose = (k: number, h: number, aspect: number, mobile: boolean, out: THREE.Vector3) => {
      const rig = STATION_RIGS[k];
      const frames = mobile ? rig.mobile : rig.desktop;
      framePose(rig, frames[0], aspect, holdStartPose);
      framePose(rig, frames[1], aspect, holdEndPose);
      return out.copy(holdStartPose).lerp(holdEndPose, smootherstep01(h));
    };

    // Flight k → k+1: cubic Bézier that first backs straight away from body k (it recedes in
    // place), then crosses body k+1's plane off to one side so it slides into view from the frame
    // edge, and backs onto its framing.
    const flightP0 = new THREE.Vector3();
    const flightP1 = new THREE.Vector3();
    const flightP2 = new THREE.Vector3();
    const flightP3 = new THREE.Vector3();
    /** Lateral clearance (in body frame radii) when the camera passes the arriving body. */
    const ARRIVAL_CLEARANCE = 2.2;
    const setFlightControls = (k: number, aspect: number, mobile: boolean) => {
      const arrival = STATION_RIGS[k + 1];
      holdPose(k, 1, aspect, mobile, flightP0);
      holdPose(k + 1, 0, aspect, mobile, flightP3);
      const lead = Math.max(1, flightP3.z - flightP0.z) * 0.3;
      flightP1.set(
        flightP0.x + (flightP3.x - flightP0.x) * 0.15,
        flightP0.y + (flightP3.y - flightP0.y) * 0.2,
        flightP0.z + lead
      );
      let push = 0;
      if (!arrival.flyThrough) {
        // Near its end the curve runs along P2 → P3, crossing the body's plane at standoff/lead of
        // the way out; push sideways (toward where the camera came from) so that crossing clears it
        const side = Math.sign(flightP0.x - flightP3.x) || 1;
        const standoff = Math.max(1, flightP3.z - arrival.center.z);
        const offset = (flightP3.x - arrival.center.x) * side;
        const needed = Math.max(0, arrival.frameRadius * ARRIVAL_CLEARANCE - offset);
        push = side * needed * (lead / standoff);
      }
      flightP2.set(flightP3.x + push, flightP3.y, flightP3.z - lead);
    };
    const bezierPoint = (u: number, out: THREE.Vector3) => {
      const v = 1 - u;
      const b0 = v * v * v;
      const b1 = 3 * v * v * u;
      const b2 = 3 * v * u * u;
      const b3 = u * u * u;
      return out.set(
        flightP0.x * b0 + flightP1.x * b1 + flightP2.x * b2 + flightP3.x * b3,
        flightP0.y * b0 + flightP1.y * b1 + flightP2.y * b2 + flightP3.y * b3,
        flightP0.z * b0 + flightP1.z * b1 + flightP2.z * b2 + flightP3.z * b3
      );
    };

    // Camera speed scales with distance to the nearer of the two bodies, so apparent motion stays
    // even: the departed planet drifts off over a real stretch of scroll instead of whipping past,
    // and the next one grows steadily (a logarithmic approach). Tables map that "visual distance"
    // back to the curve parameter; cached per flight and viewport shape.
    const FLIGHT_SAMPLES = 96;
    const flightTables = new Map<string, Float32Array>();
    const flightSampleA = new THREE.Vector3();
    const flightSampleB = new THREE.Vector3();
    const flightTable = (k: number, aspect: number, mobile: boolean): Float32Array => {
      const key = `${k}|${aspect.toFixed(3)}|${mobile ? 1 : 0}`;
      const cached = flightTables.get(key);
      if (cached) return cached;
      const from = STATION_RIGS[k];
      const to = STATION_RIGS[k + 1];
      const table = new Float32Array(FLIGHT_SAMPLES + 1);
      bezierPoint(0, flightSampleA);
      let total = 0;
      for (let i = 1; i <= FLIGHT_SAMPLES; i++) {
        bezierPoint(i / FLIGHT_SAMPLES, flightSampleB);
        const step = flightSampleA.distanceTo(flightSampleB);
        flightSampleA.add(flightSampleB).multiplyScalar(0.5);
        const proximity = Math.min(
          Math.max(from.frameRadius * 0.5, flightSampleA.distanceTo(from.center)),
          Math.max(to.frameRadius * 0.5, flightSampleA.distanceTo(to.center))
        );
        total += step / proximity;
        table[i] = total;
        flightSampleA.copy(flightSampleB);
      }
      for (let i = 1; i <= FLIGHT_SAMPLES; i++) table[i] /= total;
      flightTables.set(key, table);
      return table;
    };
    const curveParamAt = (table: Float32Array, tau: number): number => {
      let lo = 0;
      let hi = FLIGHT_SAMPLES;
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (table[mid] < tau) lo = mid;
        else hi = mid;
      }
      const span = table[hi] - table[lo];
      return (lo + (span > 1e-6 ? (tau - table[lo]) / span : 0)) / FLIGHT_SAMPLES;
    };

    /** Camera position along flight k at scroll fraction t; returns the heading-follow weight. */
    const flightPose = (
      k: number,
      t: number,
      aspect: number,
      mobile: boolean,
      out: THREE.Vector3,
      tangent: THREE.Vector3
    ): number => {
      setFlightControls(k, aspect, mobile);
      const u = curveParamAt(flightTable(k, aspect, mobile), THREE.MathUtils.smoothstep(t, 0, 1));
      bezierPoint(u, out);
      const v = 1 - u;
      const d0 = 3 * v * v;
      const d1 = 6 * v * u;
      const d2 = 3 * u * u;
      tangent.set(
        (flightP1.x - flightP0.x) * d0 + (flightP2.x - flightP1.x) * d1 + (flightP3.x - flightP2.x) * d2,
        (flightP1.y - flightP0.y) * d0 + (flightP2.y - flightP1.y) * d1 + (flightP3.y - flightP2.y) * d2,
        (flightP1.z - flightP0.z) * d0 + (flightP2.z - flightP1.z) * d1 + (flightP3.z - flightP2.z) * d2
      );
      // Heading follow peaks mid-flight and vanishes at both settles
      return 4 * t * (1 - t);
    };

    // Solo label: beside (below, else above) the projected body, never across it
    const LABEL_WIDTH = 250;
    const LABEL_HEIGHT = 36;
    const LABEL_GAP = 18;
    const LABEL_TOP_SAFE = 80;
    const placeLabel = (
      placement: StationRig['label'],
      cx: number,
      cy: number,
      radiusPx: number,
      w: number,
      h: number,
      mobile: boolean
    ): { left: number; top: number } => {
      const edge = mobile ? 20 : 40;
      const corner = { left: edge, top: h - (mobile ? 32 : 48) - LABEL_HEIGHT };
      if (placement === 'corner') return corner;
      const left = THREE.MathUtils.clamp(cx - radiusPx * 0.5, edge, Math.max(edge, w - LABEL_WIDTH - edge));
      const below = cy + radiusPx + LABEL_GAP;
      if (below + LABEL_HEIGHT <= h - (mobile ? 24 : 36)) return { left, top: below };
      const above = cy - radiusPx - LABEL_GAP - LABEL_HEIGHT;
      if (above >= LABEL_TOP_SAFE) return { left, top: above };
      return corner;
    };

    // ==========================================================================
    // 11. Interaction & 60fps Damped Animation Loop
    // ==========================================================================
    let targetMouseX = 0;
    let targetMouseY = 0;
    let smoothMouseX = 0;
    let smoothMouseY = 0;

    const handlePointerMove = (event: MouseEvent) => {
      if (prefersReducedMotion) return;
      targetMouseX = (event.clientX / Math.max(window.innerWidth, 1)) * 2 - 1;
      targetMouseY = -((event.clientY / Math.max(window.innerHeight, 1)) * 2 - 1);
    };

    const handleResize = () => {
      const w = window.innerWidth;
      const h = Math.max(window.innerHeight, 1);
      const mobileNow = w < 768;
      const pr = Math.min(window.devicePixelRatio || 1, mobileNow ? 1.0 : 1.25);

      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      // Framings depend on aspect: rebuild flight speed tables for the new viewport shape
      flightTables.clear();

      renderer.setPixelRatio(pr);
      renderer.setSize(w, h, false);

      nebulaUniforms.uResolution.value.set(w, h);
      starUniforms.uPixelRatio.value = pr;
    };

    const handleReducedMotionChange = (event: MediaQueryListEvent) => {
      prefersReducedMotion = event.matches;
      starUniforms.uReducedMotion.value = prefersReducedMotion ? 1.0 : 0.0;
    };

    let smoothScroll = targetScrollProgress;
    let smoothChapter = targetChapterIndex;
    let smoothJourney = THREE.MathUtils.clamp(targetJourney, 0, MAX_JOURNEY);
    let smoothLabelOpacity = targetLabelOpacity;
    let smoothWarpVelocity = 0;
    let animationFrameId = 0;
    let isIntersecting = true;
    const startTime = performance.now();
    let prevTime = startTime;
    const projVec = new THREE.Vector3();
    const cameraRight = new THREE.Vector3();
    const rigPose = new THREE.Vector3();
    const flightTangent = new THREE.Vector3();
    const prevRigPose = new THREE.Vector3();
    let hasPrevRigPose = false;
    const journeyStartZ = framePose(STATION_RIGS[0], RIG_DEFS.earth.desktop[0], 1, new THREE.Vector3()).z;
    /** Slow spin of waypoint k, scrubbed by the journey and centred on its hold. */
    const observeSpin = (k: number): number =>
      THREE.MathUtils.clamp(smoothJourney - 2 * k - 0.5, -3, 3) * OBSERVE_SPIN_RATE;

    const renderLoop = (now: number) => {
      if (document.hidden || !isIntersecting) {
        animationFrameId = 0;
        return;
      }

      animationFrameId = window.requestAnimationFrame(renderLoop);

      const frameSeconds = (now - prevTime) * 0.001;
      const dt = Math.min(frameSeconds, 0.1);
      prevTime = now;
      const elapsed = (now - startTime) * 0.001;

      // Intro choreography: Earth's arrival is scrubbed by the intro gate (see introTimeStore)
      // Quintic smootherstep: the finale's smoothstep easing with a softer launch and settle
      const earthArrival = smootherstep01(earthArrivalLinear);
      const earthArrivalRise = prefersReducedMotion ? 0 : 1.0 - earthArrival;

      const scrollJump = Math.abs(targetScrollProgress - smoothScroll);
      const lerpFactor = scrollJump > 0.12 ? 0.35 : 0.085;
      smoothScroll += (targetScrollProgress - smoothScroll) * lerpFactor;
      smoothChapter += (targetChapterIndex - smoothChapter) * 0.085;

      // Mass, not lag: the camera trails the Lenis-smoothed scroll (~0.9 s to settle end to end)
      // and never moves faster than MAX_JOURNEY_SPEED, so a flick becomes a glide, not a jump
      const journeyTarget = THREE.MathUtils.clamp(targetJourney, 0, MAX_JOURNEY);
      if (prefersReducedMotion) {
        smoothJourney = journeyTarget;
        smoothLabelOpacity = targetLabelOpacity;
      } else {
        const catchUp = 1.0 - Math.exp(-dt * (fastTravel ? FAST_TRAVEL_CATCH_UP : SCRUB_CATCH_UP_RATE));
        const maxStep = fastTravel ? Infinity : MAX_JOURNEY_SPEED * dt;
        smoothJourney += THREE.MathUtils.clamp((journeyTarget - smoothJourney) * catchUp, -maxStep, maxStep);
        // The solo label names the waypoint under the camera: a capped camera still in flight hides it
        const cameraArrived = 1.0 - THREE.MathUtils.smoothstep(Math.abs(journeyTarget - smoothJourney), 0.05, 0.25);
        smoothLabelOpacity += (targetLabelOpacity * cameraArrived - smoothLabelOpacity) * catchUp;
      }

      smoothMouseX += (targetMouseX - smoothMouseX) * 0.05;
      smoothMouseY += (targetMouseY - smoothMouseY) * 0.05;

      const isMobileNow = window.innerWidth < 768;
      const aspect = camera.aspect;

      // ----------------------------------------------------------------------
      // Camera: hold drift on waypoint k over [2k, 2k+1], flight k → k+1 over [2k+1, 2k+2]
      // ----------------------------------------------------------------------
      const station = Math.min(Math.floor(smoothJourney / 2), STATION_RIGS.length - 1);
      const local = smoothJourney - station * 2;
      let headingWeight = 0;
      if (local <= 1 || station >= STATION_RIGS.length - 1) {
        holdPose(station, Math.min(local, 1), aspect, isMobileNow, rigPose);
      } else {
        headingWeight = flightPose(station, local - 1, aspect, isMobileNow, rigPose, flightTangent);
      }

      const rigSpeed = hasPrevRigPose && dt > 0.0001 ? rigPose.distanceTo(prevRigPose) / dt : 0;
      prevRigPose.copy(rigPose);
      hasPrevRigPose = true;
      const targetWarp = THREE.MathUtils.clamp(rigSpeed * WARP_SPEED_SCALE, 0, 1.0);
      smoothWarpVelocity += (targetWarp - smoothWarpVelocity) * 0.08;

      let flightYaw = 0;
      let flightPitch = 0;
      if (headingWeight > 0.0001 && flightTangent.lengthSq() > 1e-6 && !prefersReducedMotion) {
        const horizontal = Math.hypot(flightTangent.x, flightTangent.z);
        const follow = FLIGHT_HEADING_FOLLOW * headingWeight * (isMobileNow ? 0.6 : 1.0);
        // The camera backs along its path: turn toward the side the next body slides in from
        flightYaw = -Math.atan2(flightTangent.x, flightTangent.z) * follow;
        flightPitch = -Math.atan2(flightTangent.y, horizontal) * follow * 0.8;
      }

      camera.position.set(
        rigPose.x + smoothMouseX * 0.42,
        rigPose.y + smoothMouseY * 0.28,
        rigPose.z - earthArrivalRise * CAMERA_ARRIVAL_PUSH_IN
      );
      camera.rotation.set(
        smoothMouseY * 0.022 + flightPitch,
        -smoothMouseX * 0.03 + flightYaw,
        flightYaw * FLIGHT_BANK
      );
      camera.updateMatrixWorld();

      nebulaMesh.position.copy(camera.position);

      nebulaUniforms.uTime.value = elapsed;
      nebulaUniforms.uScrollProgress.value = smoothScroll;
      nebulaUniforms.uChapterIndex.value = smoothChapter;
      nebulaUniforms.uMouse.value.set(smoothMouseX, smoothMouseY);
      nebulaUniforms.uWarpSpeed.value = Math.abs(smoothWarpVelocity);

      // Star shells ride with the camera; backing outward makes them recede at parallax rates
      starPoints.position.set(
        camera.position.x * 0.92,
        camera.position.y * 0.92,
        camera.position.z - STAR_SHELL_LEAD
      );
      starUniforms.uTime.value = elapsed;
      starUniforms.uTravelZ.value =
        (journeyStartZ - rigPose.z) * STAR_TRAVEL_RATIO +
        (prefersReducedMotion ? 0 : -elapsed * STAR_IDLE_DRIFT_PER_SECOND);
      starUniforms.uWarpVelocity.value = smoothWarpVelocity;

      // ----------------------------------------------------------------------
      // Bodies: fixed in world space; only distance dims them
      // ----------------------------------------------------------------------
      const earthDistance = camera.position.distanceTo(RIG_DEFS.earth.center);
      const earthOpacity = THREE.MathUtils.smoothstep(earthArrival, 0.0, 0.55) * bodyFade(earthDistance);
      earthGroup.visible = earthOpacity > 0.004;
      if (earthGroup.visible) {
        earthGroup.position.set(0, -earthArrivalRise * EARTH_ARRIVAL_DROP, 0);
        earthSurfaceMesh.rotation.y = -1.15 + earthArrivalRise * EARTH_ARRIVAL_SPIN;
        const paleBlueDotMix = THREE.MathUtils.smoothstep(earthDistance, PALE_BLUE_DOT_NEAR, PALE_BLUE_DOT_FAR);
        const earthScale = THREE.MathUtils.lerp(1.0, PALE_BLUE_DOT_SCALE, paleBlueDotMix);
        earthSurfaceMesh.scale.setScalar(earthScale);
        atmosphereMesh.scale.setScalar(earthScale);
        earthSurfaceUniforms.uTime.value = elapsed;
        earthSurfaceUniforms.uOpacity.value = earthOpacity;
        earthSurfaceUniforms.uPaleBlueDotMix.value = paleBlueDotMix;
        atmosphereUniforms.uTime.value = elapsed;
        atmosphereUniforms.uOpacity.value = earthOpacity;
        atmosphereUniforms.uPaleBlueDotMix.value = paleBlueDotMix;
      }

      const marsOpacity = bodyFade(camera.position.distanceTo(marsGroup.position));
      marsGroup.visible = marsOpacity > 0.004;
      if (marsGroup.visible) {
        marsMesh.rotation.y = MARS_FACE_YAW + observeSpin(1);
        marsUniforms.uOpacity.value = marsOpacity;
      }

      const jupiterOpacity = bodyFade(camera.position.distanceTo(jupiterGroup.position));
      jupiterGroup.visible = jupiterOpacity > 0.004;
      if (jupiterGroup.visible) {
        jupiterMesh.rotation.y = JUPITER_FACE_YAW + observeSpin(2);
        jupiterUniforms.uOpacity.value = jupiterOpacity;
        europaMat.opacity = jupiterOpacity * 0.85;
      }

      const saturnOpacity = bodyFade(camera.position.distanceTo(saturnGroup.position));
      saturnGroup.visible = saturnOpacity > 0.004;
      if (saturnGroup.visible) {
        saturnBodyMesh.rotation.y = SATURN_FACE_YAW + observeSpin(3);
        saturnBodyUniforms.uOpacity.value = saturnOpacity;
        saturnRingUniforms.uOpacity.value = saturnOpacity;
      }

      const plutoOpacity = bodyFade(camera.position.distanceTo(plutoGroup.position));
      plutoGroup.visible = plutoOpacity > 0.004;
      if (plutoGroup.visible) {
        plutoMesh.rotation.y = PLUTO_FACE_YAW + observeSpin(4);
        charonMesh.rotation.y = CHARON_FACE_YAW + observeSpin(4);
        plutoUniforms.uOpacity.value = plutoOpacity;
        charonUniforms.uOpacity.value = plutoOpacity * 0.92;
      }

      // Heliopause sheath: a diffuse plasma boundary, only visible once the camera is close; its
      // open centre lets the camera fly through
      const helioIntensity =
        1.0 - THREE.MathUtils.smoothstep(camera.position.distanceTo(heliopauseMesh.position), 75.0, 125.0);
      heliopauseMesh.visible = helioIntensity > 0.004;
      if (heliopauseMesh.visible) {
        heliopauseUniforms.uTime.value = elapsed;
        heliopauseUniforms.uIntensity.value = helioIntensity;
      }

      // Distant Sol pinpoint beyond the heliopause
      const solIntensity =
        0.85 *
        (1.0 - THREE.MathUtils.smoothstep(camera.position.distanceTo(paleBlueDotMesh.position), 120.0, 260.0));
      paleBlueDotMesh.visible = solIntensity > 0.004;
      if (paleBlueDotMesh.visible) {
        paleBlueDotMesh.quaternion.copy(camera.quaternion);
        paleBlueDotUniforms.uTime.value = elapsed;
        paleBlueDotUniforms.uIntensity.value = solIntensity;
      }

      // Voyager 1 trajectory filament: departs Earth and retires once Earth falls behind
      trajectoryGroup.position.set(
        TRAJECTORY_ANCHOR.x - smoothMouseX * 0.28,
        TRAJECTORY_ANCHOR.y - smoothMouseY * 0.2,
        TRAJECTORY_ANCHOR.z
      );
      trajectoryUniforms.uTime.value = elapsed;
      trajectoryUniforms.uScrollProgress.value = smoothScroll;
      trajectoryUniforms.uOpacity.value =
        earthArrival * (1.0 - THREE.MathUtils.smoothstep(smoothJourney, 1.0, 1.6));

      // ----------------------------------------------------------------------
      // The single solo-beat label, placed clear of the body it names
      // ----------------------------------------------------------------------
      let nextLabel: WaypointLabelState | null = null;
      if (smoothLabelOpacity > 0.02) {
        const rig = STATION_RIGS[station];
        const w = window.innerWidth;
        const h = window.innerHeight;
        projVec.copy(rig.center).project(camera);
        if (projVec.z < 1.0) {
          const cx = (projVec.x * 0.5 + 0.5) * w;
          const cy = (-projVec.y * 0.5 + 0.5) * h;
          cameraRight.setFromMatrixColumn(camera.matrixWorld, 0);
          projVec.copy(rig.center).addScaledVector(cameraRight, rig.frameRadius).project(camera);
          const radiusPx = Math.abs((projVec.x * 0.5 + 0.5) * w - cx);
          const spot = placeLabel(rig.label, cx, cy, radiusPx, w, h, isMobileNow);
          const waypoint = JOURNEY_WAYPOINTS[station];
          nextLabel = {
            id: waypoint.id,
            name: waypoint.name,
            distanceLabel: waypoint.distanceLabel,
            left: Math.round(spot.left),
            top: Math.round(spot.top),
            opacity: Math.round(smoothLabelOpacity * 100) / 100
          };
        }
      }
      if (
        nextLabel?.id !== waypointLabel?.id ||
        nextLabel?.left !== waypointLabel?.left ||
        nextLabel?.top !== waypointLabel?.top ||
        nextLabel?.opacity !== waypointLabel?.opacity
      ) {
        waypointLabel = nextLabel;
      }

      renderer.render(scene, camera);
      if (!sceneRevealed) sceneRevealed = true;
    };

    const ensureRunning = () => {
      if (!document.hidden && isIntersecting && animationFrameId === 0) {
        prevTime = performance.now();
        animationFrameId = window.requestAnimationFrame(renderLoop);
      } else if ((document.hidden || !isIntersecting) && animationFrameId !== 0) {
        window.cancelAnimationFrame(animationFrameId);
        animationFrameId = 0;
      }
    };

    const handleVisibilityChange = () => {
      ensureRunning();
    };

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          isIntersecting = entry.isIntersecting;
        }
        ensureRunning();
      },
      { threshold: 0 }
    );
    intersectionObserver.observe(canvasEl);

    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);
    mediaReducedMotion.addEventListener('change', handleReducedMotionChange);

    ensureRunning();

    return () => {
      isDisposed = true;
      if (animationFrameId !== 0) {
        window.cancelAnimationFrame(animationFrameId);
      }
      intersectionObserver.disconnect();
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      mediaReducedMotion.removeEventListener('change', handleReducedMotionChange);
      unsubscribeTelemetry();
      unsubscribeIntro();
      unsubscribeFastTravel();
      unsubscribeJourney();

      nebulaGeometry.dispose();
      nebulaMaterial.dispose();
      starGeometry.dispose();
      starMaterial.dispose();
      for (const tex of disposableTextures) {
        tex.dispose();
      }
      earthSurfaceGeometry.dispose();
      earthSurfaceMaterial.dispose();
      atmosphereGeometry.dispose();
      atmosphereMaterial.dispose();
      marsGeometry.dispose();
      marsMaterial.dispose();
      jupiterGeometry.dispose();
      jupiterMaterial.dispose();
      galileanMoonGeo.dispose();
      europaMat.dispose();
      saturnBodyGeo.dispose();
      saturnBodyMat.dispose();
      saturnRingGeo.dispose();
      saturnRingMat.dispose();
      plutoGeo.dispose();
      plutoMat.dispose();
      charonGeo.dispose();
      charonMat.dispose();
      heliopauseGeo.dispose();
      heliopauseMat.dispose();
      paleBlueDotGeometry.dispose();
      paleBlueDotMaterial.dispose();
      trajectoryGeometry.dispose();
      trajectoryMaterial.dispose();
      renderer.dispose();
    };
  });
</script>

<div
  class="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
  aria-hidden="true"
  data-chapter-index={currentChapterIndex}
  data-active-waypoint={waypointLabel?.id ?? 'starfield'}
>
  {#if !webglFailed}
    <canvas
      bind:this={canvasEl}
      class="block h-full w-full transition-opacity duration-[1800ms] ease-out"
      style:opacity={sceneRevealed ? 1 : 0}
    ></canvas>

    <!-- Waypoint callouts are HUD readouts: held back until mission control comes online -->
    <div class="intro-stage intro-slot-readout" data-intro-hidden={$introPhaseStore !== 'journey'}>
      {#if waypointLabel}
        <!-- The one solo-beat label: waypoint name + distance, placed clear of the body -->
        <div
          class="pointer-events-none fixed z-10 whitespace-nowrap font-mono-tech uppercase"
          data-testid={`solar-waypoint-${waypointLabel.id}`}
          style={`left: ${waypointLabel.left}px; top: ${waypointLabel.top}px; opacity: ${waypointLabel.opacity};`}
        >
          <div class="flex items-center gap-2 text-[11px] md:text-[10px] tracking-[0.16em] text-[#C89B57] font-medium drop-shadow-[0_1px_8px_rgba(5,6,7,0.95)]">
            <span class="inline-block h-1.5 w-1.5 rounded-full bg-[#C89B57] shadow-[0_0_8px_#C89B57]"></span>
            <span>{waypointLabel.name}</span>
          </div>
          <div class="mt-0.5 pl-3.5 text-[11px] md:text-[9.5px] tracking-[0.12em] text-[#E8E6E1]/75 drop-shadow-[0_1px_8px_rgba(5,6,7,0.95)]">
            {waypointLabel.distanceLabel}
          </div>
        </div>
      {/if}
    </div>
  {:else}
    <!-- Graceful CSS / SVG Fallback if WebGL context creation fails -->
    <div
      class="relative h-full w-full bg-[#050607]"
      style="background: radial-gradient(ellipse at 65% {Math.max(15, 85 - currentScrollProgress * 65)}%, rgba(200, 155, 87, 0.08) 0%, rgba(11, 13, 18, 0.45) 42%, #050607 78%);"
    >
      <svg class="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {#each fallbackStars as star}
          <circle
            cx={star.x}
            cy={(star.y + currentScrollProgress * 35) % 100}
            r={star.size * 0.12}
            fill={star.color}
            fill-opacity={star.opacity}
          />
        {/each}
      </svg>
    </div>
  {/if}
</div>

<script lang="ts">
  import { onMount } from 'svelte';
  import * as THREE from 'three';
  import { get } from 'svelte/store';
  import { telemetryStore, type TelemetryState } from '$lib/stores/scrollTelemetry';
  import { introPhaseStore } from '$lib/stores/introSequence';
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

  function createSolidFallbackTexture(rHex: number, gHex: number, bHex: number): THREE.DataTexture {
    const data = new Uint8Array([rHex, gHex, bHex, 255]);
    const tex = new THREE.DataTexture(data, 1, 1, THREE.RGBAFormat);
    tex.needsUpdate = true;
    return tex;
  }

  // ============================================================================
  // Component State & Diegetic Waypoint Telemetry Callout
  // ============================================================================
  interface WaypointHudState {
    id: string;
    name: string;
    distanceLabel: string;
    missionNote: string;
    screenX: number;
    screenY: number;
    opacity: number;
    alignRight: boolean;
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
  let activeWaypointHud = $state<WaypointHudState | null>(null);
  // Canvas fades up out of the void once the first frame exists, instead of popping in
  let sceneRevealed = $state(false);

  // Intro choreography: idle forward drift keeps the void traveled-through before any scroll
  const STAR_IDLE_DRIFT_PER_SECOND = 1.6;
  // Earth arrives on departure (rising from below frame as the camera eases back) and recedes on return to the void
  const EARTH_ARRIVAL_SECONDS = 2.8;
  const EARTH_RECEDE_SECONDS = 2.0;
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

    let earthArrivalTarget = 0;
    const unsubscribeIntro = introPhaseStore.subscribe((phase) => {
      earthArrivalTarget = phase === 'void' ? 0 : 1;
    });
    // Mounted mid-journey (late load or restored scroll): Earth is already on station
    let earthArrivalLinear = get(introPhaseStore) === 'journey' ? 1 : 0;

    if (!canvasEl) {
      return () => {
        unsubscribeTelemetry();
        unsubscribeIntro();
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
    camera.position.set(0, 0, 12);

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
    europaMesh.position.set(-4.8, 0.18, 1.6);
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

    textureLoader.load('/assets/textures/pluto-map.webp', (tex) => {
      if (isDisposed) {
        tex.dispose();
        return;
      }
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
      depthTest: false
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
    // 10. Interaction, Flyby Choreography & 60fps Damped Animation Loop
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
    let smoothWarpVelocity = 0;
    let animationFrameId = 0;
    let isIntersecting = true;
    const startTime = performance.now();
    let prevTime = startTime;
    const projVec = new THREE.Vector3();
    const ringNormalWorld = new THREE.Vector3();

    // Helper for planetary flyby kinematics:
    // t in [0, 1] across [pStart, pEnd], peaking near camera at t ~ 0.62
    function evaluateFlyby(
      p: number,
      pStart: number,
      pPeak: number,
      pEnd: number
    ): { active: boolean; u: number; z: number; opacity: number; phaseShift: number } {
      if (p < pStart || p > pEnd) {
        return { active: false, u: 0, z: -120, opacity: 0, phaseShift: 0 };
      }
      const fadeIn = THREE.MathUtils.smoothstep(p, pStart, pStart + (pPeak - pStart) * 0.32);
      const fadeOut = 1.0 - THREE.MathUtils.smoothstep(p, pPeak + (pEnd - pPeak) * 0.45, pEnd);
      const opacity = fadeIn * fadeOut;

      let z: number;
      let u: number;
      if (p <= pPeak) {
        const tApproach = (p - pStart) / Math.max(1e-5, pPeak - pStart);
        // Nonlinear approach: starts far in deep space (-82), accelerates as camera closes in to z = +4.2
        const curved = Math.pow(tApproach, 1.35);
        z = THREE.MathUtils.lerp(-82.0, 4.2, curved);
        u = tApproach * 0.62;
      } else {
        const tPass = (p - pPeak) / Math.max(1e-5, pEnd - pPeak);
        // Sweeps past the camera lens from +4.2 to +16.5
        z = THREE.MathUtils.lerp(4.2, 16.5, Math.pow(tPass, 0.92));
        u = 0.62 + tPass * 0.38;
      }
      // Solar phase shifts from sunlit gibbous on approach (+0.65) to dramatic crescent as we pass (-0.45)
      const phaseShift = THREE.MathUtils.lerp(0.68, -0.48, u);
      return { active: opacity > 0.004, u, z, opacity, phaseShift };
    }

    function projectToScreen(worldPos: THREE.Vector3): { x: number; y: number; inFront: boolean } {
      projVec.copy(worldPos).project(camera);
      const w = window.innerWidth;
      const h = window.innerHeight;
      return {
        x: (projVec.x * 0.5 + 0.5) * w,
        y: (-projVec.y * 0.5 + 0.5) * h,
        inFront: projVec.z < 1.0 && projVec.z > -1.0
      };
    }

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

      // Intro choreography: time-based Earth arrival (departure) / recession (back to the void)
      if (earthArrivalLinear !== earthArrivalTarget) {
        const arriving = earthArrivalTarget > earthArrivalLinear;
        const step = Math.min(frameSeconds, 0.25) / (arriving ? EARTH_ARRIVAL_SECONDS : EARTH_RECEDE_SECONDS);
        earthArrivalLinear = arriving
          ? Math.min(earthArrivalTarget, earthArrivalLinear + step)
          : Math.max(earthArrivalTarget, earthArrivalLinear - step);
      }
      // Quintic smootherstep: the finale's smoothstep easing with a softer launch and settle
      const earthArrival =
        earthArrivalLinear * earthArrivalLinear * earthArrivalLinear *
        (earthArrivalLinear * (earthArrivalLinear * 6.0 - 15.0) + 10.0);
      const earthArrivalRise = prefersReducedMotion ? 0 : 1.0 - earthArrival;

      const prevSmoothScroll = smoothScroll;
      const scrollJump = Math.abs(targetScrollProgress - smoothScroll);
      const lerpFactor = scrollJump > 0.12 ? 0.35 : 0.085;
      smoothScroll += (targetScrollProgress - smoothScroll) * lerpFactor;
      smoothChapter += (targetChapterIndex - smoothChapter) * 0.085;
      const rawVelocity = dt > 0.0001 ? (smoothScroll - prevSmoothScroll) / dt : 0;
      const targetWarp = THREE.MathUtils.clamp(rawVelocity * 4.5, -1.0, 1.0);
      smoothWarpVelocity += (targetWarp - smoothWarpVelocity) * 0.08;

      smoothMouseX += (targetMouseX - smoothMouseX) * 0.05;
      smoothMouseY += (targetMouseY - smoothMouseY) * 0.05;

      const isMobileNow = window.innerWidth < 768;
      const xSpreadScale = isMobileNow ? 0.52 : 1.0;

      // Camera flight kinematics
      const cameraRigOffsetX = smoothMouseX * 0.42;
      const cameraRigOffsetY = smoothMouseY * 0.28;
      camera.position.set(cameraRigOffsetX, cameraRigOffsetY, 12.0 - earthArrivalRise * CAMERA_ARRIVAL_PUSH_IN);
      camera.rotation.set(
        smoothMouseY * 0.022 - smoothScroll * 0.025,
        -smoothMouseX * 0.03 + Math.sin(smoothScroll * Math.PI * 1.5) * 0.028,
        Math.sin(smoothScroll * Math.PI * 2.0) * 0.014
      );
      camera.updateMatrixWorld();

      nebulaMesh.position.copy(camera.position);

      nebulaUniforms.uTime.value = elapsed;
      nebulaUniforms.uScrollProgress.value = smoothScroll;
      nebulaUniforms.uChapterIndex.value = smoothChapter;
      nebulaUniforms.uMouse.value.set(smoothMouseX, smoothMouseY);
      nebulaUniforms.uWarpSpeed.value = Math.abs(smoothWarpVelocity);

      starUniforms.uTime.value = elapsed;
      starUniforms.uTravelZ.value =
        smoothScroll * 460.0 + (prefersReducedMotion ? 0 : elapsed * STAR_IDLE_DRIFT_PER_SECOND);
      starUniforms.uWarpVelocity.value = smoothWarpVelocity;

      let candidateHud: WaypointHudState | null = null;

      // ----------------------------------------------------------------------
      // WAYPOINT 1: EARTH (0.00 -> 0.095) — Commanding LEO Presence at Start
      // ----------------------------------------------------------------------
      const earthT = THREE.MathUtils.clamp(smoothScroll / 0.095, 0, 1);
      const earthOpacity =
        (1.0 - THREE.MathUtils.smoothstep(smoothScroll, 0.06, 0.095)) *
        THREE.MathUtils.smoothstep(earthArrival, 0.0, 0.55);
      if (earthOpacity > 0.004) {
        const earthX = THREE.MathUtils.lerp(isMobileNow ? 1.2 : 3.2, isMobileNow ? 2.4 : 6.4, Math.pow(earthT, 0.85));
        const earthY =
          THREE.MathUtils.lerp(isMobileNow ? -1.8 : -1.3, -6.5, Math.pow(earthT, 0.9)) -
          earthArrivalRise * EARTH_ARRIVAL_DROP;
        const earthZ = THREE.MathUtils.lerp(isMobileNow ? 3.2 : 4.6, -54.0, Math.pow(earthT, 1.15));
        earthGroup.position.set(earthX, earthY, earthZ);

        const earthScale = THREE.MathUtils.lerp(1.0, 0.22, Math.pow(earthT, 0.8));
        earthSurfaceMesh.scale.setScalar(earthScale);
        atmosphereMesh.scale.setScalar(earthScale);
        earthSurfaceMesh.rotation.y = -1.15 + earthArrivalRise * EARTH_ARRIVAL_SPIN;

        earthSurfaceUniforms.uTime.value = elapsed;
        earthSurfaceUniforms.uOpacity.value = earthOpacity;
        earthSurfaceUniforms.uPaleBlueDotMix.value = THREE.MathUtils.smoothstep(smoothScroll, 0.06, 0.095);

        atmosphereUniforms.uTime.value = elapsed;
        atmosphereUniforms.uOpacity.value = earthOpacity;
        atmosphereUniforms.uPaleBlueDotMix.value = earthSurfaceUniforms.uPaleBlueDotMix.value;

        earthGroup.visible = true;

        if (earthOpacity > 0.25) {
          const anchor = projectToScreen(
            new THREE.Vector3(earthX - 2.6 * earthScale, earthY + 2.8 * earthScale, earthZ)
          );
          if (anchor.inFront) {
            candidateHud = {
              id: 'earth',
              name: 'TERRA · 1.00 AU',
              distanceLabel: smoothScroll < 0.04 ? '222 KM LOW EARTH ORBIT' : 'CISLUNAR DEPARTURE',
              missionNote: 'APOLLO–SOYUZ // ISS OUTPOST',
              screenX: Math.min(window.innerWidth - 180, Math.max(24, anchor.x)),
              screenY: Math.min(window.innerHeight - 80, Math.max(76, anchor.y)),
              opacity: earthOpacity * 0.82,
              alignRight: false
            };
          }
        }
      } else {
        earthGroup.visible = false;
      }

      // ----------------------------------------------------------------------
      // WAYPOINT 2: MARS (0.045 -> 0.175, Peak @ 0.103 — Prologue / Viking)
      // Positioned on UPPER-LEFT to pair with Prologue's Right-Side Plate
      // ----------------------------------------------------------------------
      const marsFly = evaluateFlyby(smoothScroll, 0.045, 0.103, 0.175);
      if (marsFly.active) {
        const mx = THREE.MathUtils.lerp(-2.6, -4.6, marsFly.u) * xSpreadScale;
        const my = THREE.MathUtils.lerp(2.4, 2.0, marsFly.u);
        marsGroup.position.set(mx, my, marsFly.z);
        marsMesh.rotation.y = elapsed * 0.08 + smoothScroll * 6.0;
        marsUniforms.uOpacity.value = marsFly.opacity;
        marsUniforms.uSunDirection.value.set(0.75, 0.24, marsFly.phaseShift).normalize();
        marsGroup.visible = true;

        if (marsFly.opacity > (candidateHud?.opacity ?? 0.15)) {
          const anchor = projectToScreen(new THREE.Vector3(mx + 1.9, my + 0.8, marsFly.z));
          if (anchor.inFront) {
            candidateHud = {
              id: 'mars',
              name: 'MARS · 1.52 AU',
              distanceLabel: '227.9M KM · 12M 40S OWLT',
              missionNote: 'VIKING 1 & 2 // PERSEVERANCE',
              screenX: Math.min(window.innerWidth - 190, Math.max(24, anchor.x)),
              screenY: Math.min(window.innerHeight - 80, Math.max(72, anchor.y)),
              opacity: marsFly.opacity * 0.88,
              alignRight: false
            };
          }
        }
      } else {
        marsGroup.visible = false;
      }

      // ----------------------------------------------------------------------
      // WAYPOINT 3: JUPITER (0.135 -> 0.270, Peak @ 0.199 — Ch. I / Voyager)
      // Positioned on UPPER-RIGHT to pair with Chapter I's Left-Side Plate
      // ----------------------------------------------------------------------
      const jupiterFly = evaluateFlyby(smoothScroll, 0.135, 0.199, 0.270);
      if (jupiterFly.active) {
        const jx = THREE.MathUtils.lerp(2.8, 5.2, jupiterFly.u) * xSpreadScale;
        const jy = THREE.MathUtils.lerp(2.4, 1.9, jupiterFly.u);
        jupiterGroup.position.set(jx, jy, jupiterFly.z);
        jupiterMesh.rotation.y = 0.65 + elapsed * 0.11 + (jupiterFly.u - 0.5) * 1.1;
        jupiterUniforms.uOpacity.value = jupiterFly.opacity;
        jupiterUniforms.uSunDirection.value.set(-0.75, 0.22, jupiterFly.phaseShift).normalize();
        europaMat.opacity = jupiterFly.opacity * 0.85;
        jupiterGroup.visible = true;

        if (jupiterFly.opacity > (candidateHud?.opacity ?? 0.15)) {
          const anchor = projectToScreen(new THREE.Vector3(jx - 3.2, jy + 0.6, jupiterFly.z));
          if (anchor.inFront) {
            candidateHud = {
              id: 'jupiter',
              name: 'JUPITER · 5.20 AU',
              distanceLabel: '778.5M KM · 43M 16S OWLT',
              missionNote: 'VOYAGER GRAVITY ASSIST (+10.5 KM/S)',
              screenX: Math.min(window.innerWidth - 240, Math.max(24, anchor.x)),
              screenY: Math.min(window.innerHeight - 80, Math.max(72, anchor.y)),
              opacity: jupiterFly.opacity * 0.88,
              alignRight: true
            };
          }
        }
      } else {
        jupiterGroup.visible = false;
      }

      // ----------------------------------------------------------------------
      // WAYPOINT 4: SATURN & RINGS (0.235 -> 0.365, Peak @ 0.296 — Ch. II / Cassini)
      // Positioned on UPPER-LEFT to pair with Chapter II's Right-Side Plate
      // ----------------------------------------------------------------------
      const saturnFly = evaluateFlyby(smoothScroll, 0.235, 0.296, 0.365);
      if (saturnFly.active) {
        const sx = THREE.MathUtils.lerp(-2.8, -5.0, saturnFly.u) * xSpreadScale;
        const sy = THREE.MathUtils.lerp(2.4, 2.0, saturnFly.u);
        const sz = saturnFly.z - 0.8;
        saturnGroup.position.set(sx, sy, sz);
        saturnBodyMesh.rotation.y = elapsed * 0.1 + saturnFly.u * 1.4;

        saturnBodyUniforms.uOpacity.value = saturnFly.opacity;
        saturnRingUniforms.uOpacity.value = saturnFly.opacity;
        saturnBodyUniforms.uSunDirection.value.set(0.72, 0.36, saturnFly.phaseShift).normalize();
        saturnBodyUniforms.uPlanetCenter.value.set(sx, sy, sz);
        saturnRingUniforms.uPlanetCenter.value.set(sx, sy, sz);

        ringNormalWorld.set(0, 1, 0).applyQuaternion(saturnTiltGroup.quaternion).normalize();
        saturnBodyUniforms.uRingNormal.value.copy(ringNormalWorld);
        saturnGroup.visible = true;

        if (saturnFly.opacity > (candidateHud?.opacity ?? 0.15)) {
          const anchor = projectToScreen(new THREE.Vector3(sx + 3.0, sy + 0.6, sz));
          if (anchor.inFront) {
            candidateHud = {
              id: 'saturn',
              name: 'SATURN · 9.54 AU',
              distanceLabel: '1.43B KM · 1H 19M OWLT',
              missionNote: 'CASSINI–HUYGENS // RING SYSTEM',
              screenX: Math.min(window.innerWidth - 220, Math.max(24, anchor.x)),
              screenY: Math.min(window.innerHeight - 80, Math.max(72, anchor.y)),
              opacity: saturnFly.opacity * 0.88,
              alignRight: false
            };
          }
        }
      } else {
        saturnGroup.visible = false;
      }

      // ----------------------------------------------------------------------
      // WAYPOINT 5: PLUTO & CHARON (0.330 -> 0.465, Peak @ 0.392 — Ch. III / New Horizons)
      // Positioned on UPPER-RIGHT to pair with Chapter III's Left-Side Plate
      // ----------------------------------------------------------------------
      const plutoFly = evaluateFlyby(smoothScroll, 0.330, 0.392, 0.465);
      if (plutoFly.active) {
        const px = THREE.MathUtils.lerp(2.6, 4.6, plutoFly.u) * xSpreadScale;
        const py = THREE.MathUtils.lerp(2.3, 1.85, plutoFly.u);
        plutoGroup.position.set(px, py, plutoFly.z + 1.0);
        plutoMesh.rotation.y = -0.8 + elapsed * 0.05 + (plutoFly.u - 0.5) * 0.8;
        charonMesh.rotation.y = plutoMesh.rotation.y;

        plutoUniforms.uOpacity.value = plutoFly.opacity;
        charonUniforms.uOpacity.value = plutoFly.opacity * 0.92;
        plutoUniforms.uSunDirection.value.set(-0.68, 0.25, plutoFly.phaseShift).normalize();
        plutoGroup.visible = true;

        if (plutoFly.opacity > (candidateHud?.opacity ?? 0.15)) {
          const anchor = projectToScreen(new THREE.Vector3(px - 2.2, py + 0.6, plutoFly.z + 1.0));
          if (anchor.inFront) {
            candidateHud = {
              id: 'pluto',
              name: 'PLUTO & CHARON · 39.5 AU',
              distanceLabel: '5.91B KM · 5H 28M OWLT',
              missionNote: 'NEW HORIZONS // KUIPER BELT',
              screenX: Math.min(window.innerWidth - 230, Math.max(24, anchor.x)),
              screenY: Math.min(window.innerHeight - 80, Math.max(72, anchor.y)),
              opacity: plutoFly.opacity * 0.88,
              alignRight: true
            };
          }
        }
      } else {
        plutoGroup.visible = false;
      }

      // ----------------------------------------------------------------------
      // WAYPOINT 6: HELIOPAUSE BOW-WAVE CROSSING (0.43 -> 0.565, Peak @ 0.489 — Ch. IV)
      // ----------------------------------------------------------------------
      const helioEnv =
        THREE.MathUtils.smoothstep(smoothScroll, 0.43, 0.475) *
        (1.0 - THREE.MathUtils.smoothstep(smoothScroll, 0.52, 0.565));
      if (helioEnv > 0.004) {
        const helioT = (smoothScroll - 0.43) / 0.135;
        heliopauseMesh.position.set(0, 0, THREE.MathUtils.lerp(-42.0, 22.0, helioT));
        heliopauseUniforms.uTime.value = elapsed;
        heliopauseUniforms.uIntensity.value = helioEnv;
        heliopauseMesh.visible = true;

        if (helioEnv > (candidateHud?.opacity ?? 0.15)) {
          candidateHud = {
            id: 'heliopause',
            name: 'HELIOPAUSE · 121.6 AU',
            distanceLabel: '18.19B KM · 16H 51M OWLT',
            missionNote: 'SOLAR WIND TERMINUS // INTERSTELLAR MEDIUM',
            screenX: isMobileNow ? 24 : window.innerWidth * 0.14,
            screenY: window.innerHeight * 0.14,
            opacity: helioEnv * 0.85,
            alignRight: false
          };
        }
      } else {
        heliopauseMesh.visible = false;
      }

      // ----------------------------------------------------------------------
      // WAYPOINT 7: INTERSTELLAR SPACE & DISTANT SOL PINPOINT (0.54 -> 0.77)
      // Fades out cleanly as FinalePullBack takes over at scrollProgress >= 0.77
      // ----------------------------------------------------------------------
      const solPinpointEnv =
        THREE.MathUtils.smoothstep(smoothScroll, 0.54, 0.58) *
        (1.0 - THREE.MathUtils.smoothstep(smoothScroll, 0.73, 0.775));
      if (solPinpointEnv > 0.004) {
        const solT = THREE.MathUtils.clamp((smoothScroll - 0.54) / 0.22, 0, 1);
        const sx = THREE.MathUtils.lerp(2.8, -2.6, solT) * xSpreadScale;
        const sy = THREE.MathUtils.lerp(1.8, 1.6, solT);
        paleBlueDotMesh.position.set(sx, sy, -16.0);
        paleBlueDotMesh.quaternion.copy(camera.quaternion);
        paleBlueDotUniforms.uTime.value = elapsed;
        paleBlueDotUniforms.uIntensity.value = solPinpointEnv * 0.85;
        paleBlueDotMesh.visible = true;

        if (solPinpointEnv > (candidateHud?.opacity ?? 0.15) && smoothScroll < 0.75) {
          const anchor = projectToScreen(new THREE.Vector3(sx + 0.8, sy + 0.8, -16.0));
          if (anchor.inFront) {
            candidateHud = {
              id: 'interstellar-sol',
              name: smoothScroll < 0.67 ? 'INTERSTELLAR MEDIUM · 169.8 AU' : 'CENTENNIAL HORIZON · 340.0 AU',
              distanceLabel: smoothScroll < 0.67 ? '25.4B KM · 23H 34M OWLT' : '50.9B KM · 47H 08M OWLT',
              missionNote: 'LOOKING BACK AT SOL & EARTH',
              screenX: Math.min(window.innerWidth - 210, Math.max(24, anchor.x)),
              screenY: Math.min(window.innerHeight - 80, Math.max(76, anchor.y)),
              opacity: solPinpointEnv * 0.82,
              alignRight: false
            };
          }
        }
      } else {
        paleBlueDotMesh.visible = false;
      }

      activeWaypointHud = candidateHud;

      // Voyager 1 Trajectory Filament
      const trajectoryScrollOffsetZ = smoothScroll * 135.0;
      trajectoryGroup.position.set(
        -smoothMouseX * 0.28,
        -smoothMouseY * 0.20 - smoothScroll * 11.5,
        trajectoryScrollOffsetZ
      );
      trajectoryUniforms.uTime.value = elapsed;
      trajectoryUniforms.uScrollProgress.value = smoothScroll;
      trajectoryUniforms.uOpacity.value = earthArrival;

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
  data-active-waypoint={activeWaypointHud?.id ?? 'starfield'}
>
  {#if !webglFailed}
    <canvas
      bind:this={canvasEl}
      class="block h-full w-full transition-opacity duration-[1800ms] ease-out"
      style:opacity={sceneRevealed ? 1 : 0}
    ></canvas>

    <!-- Waypoint callouts are HUD readouts: held back until mission control comes online -->
    <div class="intro-stage intro-slot-readout" data-intro-hidden={$introPhaseStore !== 'journey'}>
      {#if activeWaypointHud && activeWaypointHud.opacity > 0.05}
        <div
          class="pointer-events-none fixed z-10 font-mono-tech uppercase transition-opacity duration-200"
          data-testid={`solar-waypoint-${activeWaypointHud.id}`}
          style={`left: ${activeWaypointHud.screenX.toFixed(0)}px; top: ${activeWaypointHud.screenY.toFixed(0)}px; opacity: ${activeWaypointHud.opacity.toFixed(3)};`}
        >
          <div class="flex items-center gap-2 text-[11px] md:text-[10px] tracking-[0.16em] text-[#C89B57] font-medium drop-shadow-[0_1px_8px_rgba(5,6,7,0.95)]">
            <span class="inline-block h-1.5 w-1.5 rounded-full bg-[#C89B57] shadow-[0_0_8px_#C89B57]"></span>
            <span>{activeWaypointHud.name}</span>
          </div>
          <div class="mt-0.5 pl-3.5 text-[11px] md:text-[9.5px] tracking-[0.12em] text-[#E8E6E1]/75 drop-shadow-[0_1px_8px_rgba(5,6,7,0.95)]">
            {activeWaypointHud.distanceLabel}
          </div>
          <div class="pl-3.5 text-[11px] md:text-[9px] tracking-[0.10em] text-[#E8E6E1]/50 drop-shadow-[0_1px_8px_rgba(5,6,7,0.95)]">
            {activeWaypointHud.missionNote}
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

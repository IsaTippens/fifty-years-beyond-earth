<script lang="ts">
  import { onMount } from 'svelte';
  import * as THREE from 'three';
  import { telemetryStore, type TelemetryState } from '$lib/stores/scrollTelemetry';
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
  // with Near-Camera Depth-of-Field Bokeh & Top-3% Gentle Airy Bloom
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

      // Seamless deep-space Z-volume wrapping (-280.0 to 0.0) across near/mid/far parallax shells
      vec3 pos = position;
      float depthSpan = 280.0;
      float wrappedZ = mod(pos.z + uTravelZ * aSpeed, depthSpan) - depthSpan;
      pos.z = wrappedZ;

      float warpMag = clamp(abs(uWarpVelocity) * (1.0 - uReducedMotion * 0.85), 0.0, 1.0);
      vWarpAmount = warpMag;

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      float dist = max(-mvPosition.z, 1.5);

      // Smooth fade at near and far clip boundaries
      float nearFade = smoothstep(2.2, 12.0, dist);
      float farFade = 1.0 - smoothstep(depthSpan * 0.78, depthSpan * 0.99, dist);
      vDepthFade = nearFade * farFade;

      // Subtle depth-of-field bokeh disc softening for near-camera stars
      vBokeh = smoothstep(34.0, 7.5, dist) * step(1.05, aSpeed);

      // Gentle atmospheric/stellar scintillation
      float twinkleFreq = 1.1 + mod(aPhase, 1.8);
      float twinkleAmp = mix(0.16, 0.03, uReducedMotion);
      vTwinkle = (1.0 - twinkleAmp) + twinkleAmp * sin(uTime * twinkleFreq + aPhase * 6.2831853);

      vec4 clipPos = projectionMatrix * mvPosition;
      gl_Position = clipPos;

      vec2 ndc = clipPos.xy / max(clipPos.w, 0.0001);
      float ndcLen = length(ndc);
      vScreenRadial = ndcLen > 0.001 ? (ndc / ndcLen) : vec2(0.0, 1.0);

      // Perspective point size with near-camera bokeh expansion & brightest 3% airy corona room
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

      // Focused pinpoint core
      float pinpointCore = exp(-r2 * 20.0);

      // Subtle depth-of-field bokeh disc softening for near-camera stars
      float bokehDisc = smoothstep(0.92, 0.38, r) * (0.72 + 0.28 * smoothstep(0.18, 0.68, r)) * 0.34;
      float starProfile = mix(pinpointCore, bokehDisc, vBokeh);

      // Gentle Airy bloom ONLY on the brightest 3% of stars (vBloomFactor > 0.0)
      float airyBloom = exp(-r2 * 4.4) * 0.46 * vBloomFactor * (1.0 - vBokeh * 0.65);

      // Warm off-white core blend
      vec3 finalRgb = mix(vColor, vec3(0.96, 0.95, 0.93), pinpointCore * (1.0 - vBokeh) * 0.65);
      float brightness = (starProfile * 1.15 + airyBloom) * vTwinkle * vDepthFade;

      vec3 tonemapped = acesFilmic(finalRgb * brightness * 1.25);
      gl_FragColor = vec4(tonemapped, clamp(brightness, 0.0, 0.95));
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

    varying float vArcProgress;
    varying float vCameraDist;

    void main() {
      float distFade = smoothstep(2.0, 10.0, vCameraDist) * (1.0 - smoothstep(125.0, 210.0, vCameraDist));
      float headProgress = clamp(uScrollProgress * 0.92 + 0.06, 0.05, 1.0);
      float activeEnvelope = 1.0 - smoothstep(headProgress - 0.08, headProgress + 0.22, vArcProgress);

      // Muted warm amber (#C89B57 / #DDB474), whisper-subtle 0.14 max opacity
      vec3 warmAmber = vec3(0.784, 0.608, 0.341);
      float alpha = 0.14 * (0.45 + 0.55 * activeEnvelope) * distFade;

      gl_FragColor = vec4(warmAmber, clamp(alpha, 0.0, 0.14));
    }
  `;

  // ============================================================================
  // Carl Sagan's "Pale Blue Dot" Scattered Sunbeam & Pinpoint
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

      float core = exp(-r * r * 72.0);
      float innerHalo = exp(-r * r * 12.0) * 0.38;

      // Diagonal Voyager camera-optics scattered sunbeam band (1990 narrow-angle frame)
      float beamCoord = p.x * 0.82 + p.y * 0.57;
      float beamLength = p.x * 0.57 - p.y * 0.82;
      float sunbeam = exp(-beamCoord * beamCoord * 46.0) * exp(-beamLength * beamLength * 2.1) * 0.18;

      vec3 dotColor = vec3(0.56, 0.72, 0.94) * innerHalo +
                      vec3(0.91, 0.90, 0.88) * core * 1.15 +
                      vec3(0.784, 0.608, 0.341) * sunbeam;

      float alpha = clamp((core + innerHalo + sunbeam) * uIntensity, 0.0, 0.82);
      gl_FragColor = vec4(dotColor * uIntensity, alpha);
    }
  `;

  // ============================================================================
  // One-Time Startup 1024x512 Offscreen Procedural Earth CanvasTexture Generator
  // ============================================================================
  function createEarthSurfaceTexture(): THREE.Texture {
    const width = 1024;
    const height = 512;

    // Fast deterministic 3D lattice value noise using a 4096-entry lookup table
    const lut = new Float32Array(4096);
    let rng = 19770820; // Voyager 2 / 1 launch window seed
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
        const nx = 0.0 * px + 0.8 * py + 0.6 * pz;
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

        // 1. Domain-warped Continental Elevation & Bathymetry (Channel R)
        const wx = sampleNoise3D(sx * 1.9 + 1.2, sy * 1.9 + 3.4, sz * 1.9 + 5.6) - 0.5;
        const wy = sampleNoise3D(sx * 1.9 + 7.8, sy * 1.9 + 2.1, sz * 1.9 - 4.3) - 0.5;
        const wz = sampleNoise3D(sx * 1.9 - 3.5, sy * 1.9 + 6.7, sz * 1.9 + 1.9) - 0.5;

        const qx = sx * 2.25 + wx * 0.68;
        const qy = sy * 2.25 + wy * 0.68;
        const qz = sz * 2.25 + wz * 0.68;

        let elev = fbm5(qx, qy, qz);
        const ridge = 1.0 - Math.abs(sampleNoise3D(qx * 3.8, qy * 3.8, qz * 3.8) * 2.0 - 1.0);
        elev += ridge * ridge * 0.085;

        // Shape continental distribution so sea level sits cleanly at 0.50
        const elevationNorm = Math.max(0.0, Math.min(1.0, (elev - 0.05) * 1.04));

        // 2. Biome Humidity & Aridity (Channel G)
        const hum =
          0.62 * sampleNoise3D(sx * 3.4 + 12.4, sy * 3.4 - 8.1, sz * 3.4 + 3.3) +
          0.38 * sampleNoise3D(sx * 7.2 - 4.5, sy * 7.2 + 9.2, sz * 7.2 - 6.1);

        // 3. Swirling Coriolis Cyclonic Cloud Bands (Channel B)
        const swirlAngle = (sampleNoise3D(sx * 2.6 - 5.1, sy * 2.6 + 2.8, sz * 2.6 + 8.4) - 0.5) * 1.65;
        const cSwirl = Math.cos(swirlAngle);
        const sSwirl = Math.sin(swirlAngle);
        const cx = sx * cSwirl - sz * sSwirl;
        const cz = sx * sSwirl + sz * cSwirl;

        const cloudMacro = fbm5(cx * 3.1 + 4.2, sy * 4.4 - 1.8, cz * 3.1 + 6.7);
        const cloudStreaks = sampleNoise3D(cx * 6.5, sy * 13.5, cz * 6.5);
        const itczBand = Math.exp(-sy * sy * 18.0) * 0.14;
        const cloudNorm = Math.max(0.0, Math.min(1.0, cloudMacro * 0.76 + cloudStreaks * 0.24 + itczBand));

        // 4. Clustered Night-Side Coastal/Urban City Lights (Channel A)
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

  // ============================================================================
  // Component State
  // ============================================================================
  let canvasEl: HTMLCanvasElement | undefined = $state();
  let webglFailed = $state(false);
  let useMobilePhotoFallback = $state(false);
  let fallbackStars: Array<{
    x: number;
    y: number;
    size: number;
    color: string;
    opacity: number;
  }> = $state([]);

  let currentScrollProgress = $state(0);
  let currentChapterIndex = $state(0);

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
    const isMobile = window.innerWidth < 768;

    let targetScrollProgress = 0;
    let targetChapterIndex = 0;

    const unsubscribeTelemetry = telemetryStore.subscribe((state: TelemetryState) => {
      targetScrollProgress = Number.isFinite(state.scrollProgress) ? state.scrollProgress : 0;
      targetChapterIndex = Number.isFinite(state.activeChapterIndex) ? state.activeChapterIndex : 0;
      currentScrollProgress = targetScrollProgress;
      currentChapterIndex = targetChapterIndex;
    });

    if (isMobile) {
      useMobilePhotoFallback = true;
      initFallbackStarData(90);
      return () => {
        unsubscribeTelemetry();
      };
    }

    if (!canvasEl) {
      return () => {
        unsubscribeTelemetry();
      };
    }

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: canvasEl,
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance'
      });
    } catch {
      webglFailed = true;
      initFallbackStarData(180);
      return () => {
        unsubscribeTelemetry();
      };
    }

    // Cap renderer pixel ratio to Math.min(window.devicePixelRatio || 1, isMobile ? 1.0 : 1.25)
    const initialPixelRatio = Math.min(window.devicePixelRatio || 1, isMobile ? 1.0 : 1.25);
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
    const starCount = 6000;
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

      // 3 distinct parallax depth shells: Near (15%), Mid (35%), Far (50%)
      let shellSpeed = 0.35;
      let spreadXY = 320;
      if (shellRoll < 0.15) {
        // Near shell: rich foreground parallax & subtle depth-of-field bokeh
        shellSpeed = 1.15 + nextRand() * 0.65;
        spreadXY = 190;
      } else if (shellRoll < 0.50) {
        // Mid shell: crisp middle-distance stellar field
        shellSpeed = 0.62 + nextRand() * 0.42;
        spreadXY = 260;
      } else {
        // Far shell: deep background galactic field
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

      // Documentary stellar blackbody palette (warm off-white, ivory, muted amber, soft slate-blue)
      const specRoll = nextRand();
      const isBrightest3Percent = specRoll < 0.03;
      let r = 0.91;
      let g = 0.90;
      let b = 0.88;
      let baseSize = 1.2;

      if (isBrightest3Percent) {
        // Top 3% brightest stars: receive gentle Airy bloom
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
        // Warm A/F/G ivory-white stars (#E8E6E1)
        r = 0.91 + nextRand() * 0.06;
        g = 0.89 + nextRand() * 0.06;
        b = 0.85 + nextRand() * 0.08;
        baseSize = 1.3 + nextRand() * 0.95;
      } else if (specRoll < 0.62) {
        // Solar cream to muted warm amber stars (#DDB474 / #C89B57)
        const t = nextRand();
        r = 0.92;
        g = 0.76 + t * 0.12;
        b = 0.54 + t * 0.18;
        baseSize = 1.0 + nextRand() * 0.9;
      } else {
        // Faint deep-field background stars
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
    // 3. Photorealistic Earth (4.8, 128, 96) + Thin Rayleigh Atmosphere (4.92, 128, 96)
    // ==========================================================================
    const earthGroup = new THREE.Group();
    scene.add(earthGroup);

    const sunDirection = new THREE.Vector3(-0.72, 0.44, -0.22).normalize();
    const earthSurfaceTexture = createEarthSurfaceTexture();

    const earthSurfaceGeometry = new THREE.SphereGeometry(4.8, 128, 96);
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
      uSunDirection: { value: sunDirection.clone() },
      uCloudDensity: { value: 0.84 },
      uCityLightIntensity: { value: 1.25 },
      uOpacity: { value: 1.0 },
      uPaleBlueDotMix: { value: 0.0 }
    };

    let isDisposed = false;
    const loadedEarthTextures: THREE.Texture[] = [];
    const textureLoader = new THREE.TextureLoader();
    const maxAnisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 4);
    let loadedEarthTexCount = 0;

    const configureEarthTexture = (tex: THREE.Texture) => {
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
      configureEarthTexture(tex);
      loadedEarthTextures.push(tex);
      earthSurfaceUniforms.uDayMap.value = tex;
      markEarthTextureReady();
    });

    textureLoader.load('/assets/textures/earth-night.webp', (tex) => {
      if (isDisposed) {
        tex.dispose();
        return;
      }
      configureEarthTexture(tex);
      loadedEarthTextures.push(tex);
      earthSurfaceUniforms.uNightMap.value = tex;
      markEarthTextureReady();
    });

    textureLoader.load('/assets/textures/earth-clouds.webp', (tex) => {
      if (isDisposed) {
        tex.dispose();
        return;
      }
      configureEarthTexture(tex);
      loadedEarthTextures.push(tex);
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
    earthSurfaceMesh.rotation.y = -1.25;
    earthGroup.add(earthSurfaceMesh);

    const atmosphereGeometry = new THREE.SphereGeometry(4.92, 128, 96);
    const atmosphereUniforms = {
      uTime: { value: 0 },
      uSunDirection: { value: sunDirection.clone() },
      uAtmosphereColor: { value: new THREE.Vector3(0.24, 0.44, 0.80) },
      uSunsetColor: { value: new THREE.Vector3(0.82, 0.54, 0.26) },
      uAtmosphereIntensity: { value: 1.15 },
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

    // Carl Sagan's "Pale Blue Dot" diffraction & scattered sunbeam billboard
    const paleBlueDotGeometry = new THREE.PlaneGeometry(1.6, 1.6);
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
    earthGroup.add(paleBlueDotMesh);

    // ==========================================================================
    // 4. Whisper-Subtle Warm-Amber Voyager 1 Trajectory Filament (opacity: 0.14)
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
      uScrollProgress: { value: 0 }
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
    // 5. Interaction, Visibility Pause & 60fps Damped Animation Loop
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

    const renderLoop = (now: number) => {
      if (document.hidden || !isIntersecting) {
        animationFrameId = 0;
        return;
      }

      animationFrameId = window.requestAnimationFrame(renderLoop);

      const dt = Math.min((now - prevTime) * 0.001, 0.1);
      prevTime = now;
      const elapsed = (now - startTime) * 0.001;

      // Slow, heavy-damped camera scrub (lerpFactor = 0.045) driven by $telemetryStore.scrollProgress
      const prevSmoothScroll = smoothScroll;
      const lerpFactor = 0.045;
      smoothScroll += (targetScrollProgress - smoothScroll) * lerpFactor;
      smoothChapter += (targetChapterIndex - smoothChapter) * 0.045;

      const rawVelocity = dt > 0.0001 ? (smoothScroll - prevSmoothScroll) / dt : 0;
      const targetWarp = THREE.MathUtils.clamp(rawVelocity * 4.5, -1.0, 1.0);
      smoothWarpVelocity += (targetWarp - smoothWarpVelocity) * 0.08;

      smoothMouseX += (targetMouseX - smoothMouseX) * 0.05;
      smoothMouseY += (targetMouseY - smoothMouseY) * 0.05;

      // Camera flight kinematics along the 50-year trajectory
      const cameraRigOffsetX = smoothMouseX * 0.42;
      const cameraRigOffsetY = smoothMouseY * 0.28;
      camera.position.set(cameraRigOffsetX, cameraRigOffsetY, 12.0);
      camera.rotation.set(
        smoothMouseY * 0.025 - smoothScroll * 0.035,
        -smoothMouseX * 0.035 + Math.sin(smoothScroll * Math.PI * 1.5) * 0.04,
        Math.sin(smoothScroll * Math.PI * 2.0) * 0.018
      );

      nebulaMesh.position.copy(camera.position);

      nebulaUniforms.uTime.value = elapsed;
      nebulaUniforms.uScrollProgress.value = smoothScroll;
      nebulaUniforms.uChapterIndex.value = smoothChapter;
      nebulaUniforms.uMouse.value.set(smoothMouseX, smoothMouseY);
      nebulaUniforms.uWarpSpeed.value = Math.abs(smoothWarpVelocity);

      starUniforms.uTime.value = elapsed;
      starUniforms.uTravelZ.value = smoothScroll * 420.0 + (prefersReducedMotion ? 0 : elapsed * 0.65);
      starUniforms.uWarpVelocity.value = smoothWarpVelocity;

      // Earth in Low Earth Orbit -> Receding quietly below the horizon as we enter deep space
      const leoToDeepT = THREE.MathUtils.clamp(smoothScroll / 0.22, 0, 1);
      const deepSpaceT = THREE.MathUtils.clamp((smoothScroll - 0.16) / 0.84, 0, 1);

      const earthX = THREE.MathUtils.lerp(4.4, 5.8, Math.pow(leoToDeepT, 0.75));
      const earthY = THREE.MathUtils.lerp(-4.8, -10.5, Math.pow(leoToDeepT, 0.85));
      const earthZ = THREE.MathUtils.lerp(3.2, -32.0, Math.pow(leoToDeepT, 0.85)) - deepSpaceT * 60.0;
      earthGroup.position.set(earthX, earthY, earthZ);

      const earthScale = THREE.MathUtils.lerp(1.05, 0.14, Math.pow(leoToDeepT, 0.7));
      earthSurfaceMesh.scale.setScalar(earthScale);
      atmosphereMesh.scale.setScalar(earthScale);

      const earthFadeOpacity = 1.0 - THREE.MathUtils.smoothstep(smoothScroll, 0.14, 0.24);
      const paleBlueDotMix = THREE.MathUtils.smoothstep(smoothScroll, 0.16, 0.28);
      earthSurfaceUniforms.uTime.value = elapsed;
      earthSurfaceUniforms.uOpacity.value = earthFadeOpacity;
      earthSurfaceUniforms.uPaleBlueDotMix.value = paleBlueDotMix;

      atmosphereUniforms.uTime.value = elapsed;
      atmosphereUniforms.uOpacity.value = earthFadeOpacity;
      atmosphereUniforms.uPaleBlueDotMix.value = paleBlueDotMix;
      earthSurfaceMesh.visible = earthFadeOpacity > 0.005;
      atmosphereMesh.visible = earthFadeOpacity > 0.005;

      const haloEnvelope =
        THREE.MathUtils.smoothstep(smoothScroll, 0.18, 0.30) *
        (1.0 - THREE.MathUtils.smoothstep(smoothScroll, 0.45, 0.65)) * 0.28;
      paleBlueDotUniforms.uTime.value = elapsed;
      paleBlueDotUniforms.uIntensity.value = haloEnvelope;
      paleBlueDotMesh.quaternion.copy(camera.quaternion);
      paleBlueDotMesh.scale.setScalar(0.55);
      // Voyager 1 Trajectory Filament
      const trajectoryScrollOffsetZ = smoothScroll * 135.0;
      trajectoryGroup.position.set(
        -smoothMouseX * 0.28,
        -smoothMouseY * 0.20 - smoothScroll * 11.5,
        trajectoryScrollOffsetZ
      );
      trajectoryUniforms.uTime.value = elapsed;
      trajectoryUniforms.uScrollProgress.value = smoothScroll;

      renderer.render(scene, camera);
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

      nebulaGeometry.dispose();
      nebulaMaterial.dispose();
      starGeometry.dispose();
      starMaterial.dispose();
      earthSurfaceTexture.dispose();
      for (const tex of loadedEarthTextures) {
        tex.dispose();
      }
      earthSurfaceGeometry.dispose();
      earthSurfaceMaterial.dispose();
      atmosphereGeometry.dispose();
      atmosphereMaterial.dispose();
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
>
  {#if useMobilePhotoFallback}
    <!-- Lightweight Mobile Archival Backdrop with Slow CSS Ken Burns Drift -->
    <div
      class="relative h-full w-full bg-[#050607]"
      data-testid="mobile-starfield-fallback"
      style="background: radial-gradient(ellipse at 65% {Math.max(15, 85 - currentScrollProgress * 65)}%, rgba(200, 155, 87, 0.08) 0%, rgba(11, 13, 18, 0.52) 42%, #050607 80%);"
    >
      <img
        src="/assets/chapters/iss-earth-limb-800.webp"
        alt=""
        decoding="async"
        class="mobile-backdrop-drift absolute inset-0 h-full w-full object-cover object-center mix-blend-screen transition-opacity duration-700"
        style="opacity: {Math.max(0.05, 0.34 * (1 - Math.min(1, currentScrollProgress * 2.2))).toFixed(3)}; filter: grayscale(25%) contrast(1.08);"
      />
      <svg class="relative z-10 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {#each fallbackStars as star}
          <circle
            cx={star.x}
            cy={(star.y + currentScrollProgress * 18) % 100}
            r={star.size * 0.12}
            fill={star.color}
            fill-opacity={star.opacity * (0.45 + Math.min(0.55, currentScrollProgress * 1.1))}
          />
        {/each}
      </svg>
    </div>
  {:else if !webglFailed}
    <canvas
      bind:this={canvasEl}
      class="block h-full w-full"
    ></canvas>
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

<style>
  @keyframes mobileBackdropDrift {
    0% {
      transform: scale(1) translate3d(0, 0, 0);
    }
    100% {
      transform: scale(1.07) translate3d(-1.4%, -0.9%, 0);
    }
  }

  .mobile-backdrop-drift {
    will-change: transform;
    animation: mobileBackdropDrift 32s cubic-bezier(0.22, 1, 0.36, 1) infinite alternate;
  }

  @media (prefers-reduced-motion: reduce) {
    .mobile-backdrop-drift {
      animation: none;
      transform: none;
    }
  }
</style>

/**
 * Quiet Space Documentary GLSL Skybox Shader
 * Optimized for locked 60fps iGPU performance with a single skybox pass.
 *
 * Features:
 * - Fast 2-octave trilinear smooth noise (replaces heavy multi-pass 3D Simplex FBM)
 * - True near-black void (#050607) with ultra-subtle deep charcoal-slate (#0b0d12)
 *   and warm cosmic dust (#19140e) whispers along the galactic plane
 * - Built-in subtle optical vignette and ACES filmic tone curve
 */

export const NEBULA_VERTEX_SHADER = /* glsl */ `
varying vec2 vUv;
varying vec3 vWorldPosition;
varying vec3 vLocalPosition;
varying vec3 vViewDir;

void main() {
  vUv = uv;
  vLocalPosition = position;
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPosition.xyz;
  vViewDir = normalize(worldPosition.xyz - cameraPosition);
  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
`;

export const NEBULA_FRAGMENT_SHADER = /* glsl */ `
precision highp float;

uniform float uTime;
uniform float uScrollProgress;
uniform float uChapterIndex;
uniform vec2 uResolution;
uniform vec2 uMouse;
uniform float uWarpSpeed;

varying vec2 vUv;
varying vec3 vWorldPosition;
varying vec3 vLocalPosition;
varying vec3 vViewDir;

// ============================================================================
// Fast 2-Octave Smooth Value Noise (iGPU-Optimized)
// ============================================================================
float hash31(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
}

float smoothNoise3D(vec3 p) {
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

const mat3 OCTAVE_ROT = mat3(
   0.00,  0.80,  0.60,
  -0.80,  0.36, -0.48,
  -0.60, -0.48,  0.64
);

float fbm2(vec3 p) {
  float n1 = smoothNoise3D(p);
  float n2 = smoothNoise3D(OCTAVE_ROT * p * 2.04 + vec3(7.3, -4.1, 3.8));
  return n1 * 0.64 + n2 * 0.36;
}

// Narkowicz ACES Filmic Tone Mapping Curve
vec3 acesFilmic(vec3 x) {
  const float a = 2.51;
  const float b = 0.03;
  const float c = 2.43;
  const float d = 0.59;
  const float e = 0.14;
  return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}

void main() {
  vec3 dir = normalize(vLocalPosition);

  // Whisper-slow cosmic drift and subtle parallax
  float slowTime = uTime * 0.008;
  vec2 parallax = uMouse * 0.025 + vec2(0.0, uScrollProgress * 0.22);
  vec3 samplePos = dir * 1.85 + vec3(parallax.x, parallax.y, uScrollProgress * 0.85 + slowTime);

  // Two fast 2-octave smooth noise evaluations for slate volume & warm dust lanes
  float slateNoise = fbm2(samplePos);
  float dustNoise  = fbm2(samplePos * 1.75 + vec3(slateNoise * 0.55, -2.4, slowTime * 0.5));

  // Tilted galactic plane band (28 deg celestial inclination)
  float galacticLat = dot(dir, normalize(vec3(0.38, 0.82, -0.42)));
  float galacticBand = exp(-galacticLat * galacticLat * 3.4);

  // Quiet Space Documentary palette:
  // Void: #050607 | Deep charcoal-slate: #0b0d12 | Warm cosmic dust: #19140e
  const vec3 voidBlack     = vec3(0.0196, 0.0235, 0.0275); // #050607
  const vec3 charcoalSlate = vec3(0.0431, 0.0510, 0.0706); // #0b0d12
  const vec3 cosmicDust    = vec3(0.0980, 0.0784, 0.0549); // #19140e

  float slateVeil = smoothstep(0.34, 0.78, slateNoise) * (0.35 + 0.65 * galacticBand);
  float dustWhisper = smoothstep(0.44, 0.82, dustNoise) * galacticBand;
  float darkRift = smoothstep(0.52, 0.76, 1.0 - dustNoise) * galacticBand;

  // Compose linear radiance before ACES filmic roll-off
  vec3 linearNebula = mix(vec3(0.0), charcoalSlate, slateVeil * 0.95);
  linearNebula = mix(linearNebula, cosmicDust, dustWhisper * 0.72);
  linearNebula *= (1.0 - darkRift * 0.45);

  // Apply ACES filmic curve to nebula contrast and anchor to #050607 void floor
  vec3 tonemappedWhispers = acesFilmic(linearNebula * 1.35);
  vec3 finalColor = voidBlack + tonemappedWhispers * 0.78;

  // Built-in subtle optical vignette toward zenith/nadir and screen edges
  float radialVignette = 1.0 - 0.18 * pow(abs(dir.y), 1.5) - 0.08 * (1.0 - max( -dir.z, 0.0 ));
  finalColor = mix(voidBlack * 0.88, finalColor, clamp(radialVignette, 0.72, 1.0));

  gl_FragColor = vec4(finalColor, 1.0);
}
`;

export interface NebulaShaderUniforms {
  [uniform: string]: { value: unknown };
  uTime: { value: number };
  uScrollProgress: { value: number };
  uChapterIndex: { value: number };
  uResolution: { value: [number, number] };
  uMouse: { value: [number, number] };
  uWarpSpeed: { value: number };
}

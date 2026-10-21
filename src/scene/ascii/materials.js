import * as THREE from 'three';
import { SET } from './palette.js';

// Scene materials don't output colors. They write data for the ASCII pass:
//   r = lit brightness, g = accent (0.5 white flower, 1 ember), b = glow, a = glyph set id
// Stars and streaks reuse b for the on-screen direction of the streak.

const FILL = new THREE.Vector3(-0.6, -0.3, 0.4).normalize();

export const sceneUniforms = {
  uTime: { value: 0 },
  uSunPos: { value: new THREE.Vector3() }, // view space
  uFillDir: { value: FILL.clone() }, // view space
};

export function updateSceneUniforms(camera, time, sunPosition) {
  camera.updateMatrixWorld();
  sceneUniforms.uTime.value = time;
  sceneUniforms.uSunPos.value.copy(sunPosition).applyMatrix4(camera.matrixWorldInverse);
  sceneUniforms.uFillDir.value.copy(FILL).transformDirection(camera.matrixWorldInverse);
}

export const encodeSet = (set) => set / 31;

export const noiseChunk = /* glsl */ `
  float hash13(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.zyx + 31.32);
    return fract((p.x + p.y) * p.z);
  }

  float vnoise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash13(i), hash13(i + vec3(1, 0, 0)), f.x),
          mix(hash13(i + vec3(0, 1, 0)), hash13(i + vec3(1, 1, 0)), f.x), f.y),
      mix(mix(hash13(i + vec3(0, 0, 1)), hash13(i + vec3(1, 0, 1)), f.x),
          mix(hash13(i + vec3(0, 1, 1)), hash13(i + vec3(1, 1, 1)), f.x), f.y),
      f.z);
  }

  float fbm(vec3 p) {
    float sum = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 4; i++) {
      sum += amp * vnoise(p);
      p = p * 2.03 + 17.1;
      amp *= 0.5;
    }
    return sum / 0.9375;
  }
`;

const vertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewPos;
  varying vec3 vObjPos;

  void main() {
    vObjPos = position;
    vec4 local = vec4(position, 1.0);
    vec3 n = normal;
    #ifdef USE_INSTANCING
      local = instanceMatrix * local;
      n = mat3(instanceMatrix) * n;
    #endif
    vec4 mv = modelViewMatrix * local;
    vViewPos = mv.xyz;
    vNormal = normalize(normalMatrix * n);
    gl_Position = projectionMatrix * mv;
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uSunPos;
  uniform vec3 uFillDir;
  uniform float uSet;
  uniform float uAlbedo;
  uniform float uAmbient;
  uniform float uRim;
  uniform float uSpec;
  uniform float uNoise;
  uniform float uNoiseScale;
  uniform float uCraters;
  uniform float uStripes;
  uniform float uStripeFreq;
  uniform vec2 uRing;
  uniform float uEmbers;
  uniform float uFlowers;
  uniform float uSpeckleScale;
  uniform float uGlow;
  uniform float uFlicker;

  varying vec3 vNormal;
  varying vec3 vViewPos;
  varying vec3 vObjPos;

  ${noiseChunk}

  void main() {
    vec3 n = normalize(vNormal);
    if (!gl_FrontFacing) n = -n;
    vec3 v = normalize(-vViewPos);
    vec3 l = normalize(uSunPos - vViewPos);

    // sun + a soft light from the camera, so every face we look at has some shape
    float key = smoothstep(-0.15, 1.0, dot(n, l));
    float facing = max(dot(n, v), 0.0);
    float diff = key * 0.6 + facing * 0.55 + max(dot(n, uFillDir), 0.0) * 0.15;
    float rim = pow(1.0 - clamp(dot(n, v), 0.0, 1.0), 3.0) * uRim;
    float spec = pow(max(dot(n, normalize(l + v)), 0.0), 32.0) * uSpec;

    vec3 p = vObjPos * uNoiseScale;
    float albedo = uAlbedo * mix(1.0, 0.25 + 0.95 * smoothstep(0.25, 0.75, fbm(p)), uNoise);
    float crater = smoothstep(0.58, 0.68, fbm(p * 1.9 + 11.0));
    albedo *= 1.0 - uCraters * crater * 0.65;

    // gas giant bands follow latitude
    float lat = normalize(vObjPos).y;
    albedo *= mix(1.0, 0.5 + 0.5 * sin(lat * uStripeFreq + fbm(p * 0.6) * 3.0), uStripes);

    // flat rings: concentric bands with gaps
    if (uRing.y > 0.0) {
      float r = (length(vObjPos.xy) - uRing.x) / (uRing.y - uRing.x);
      float band = 0.5 + 0.5 * sin(r * 55.0 + sin(r * 13.0) * 2.5);
      band *= smoothstep(0.0, 0.08, r) * smoothstep(1.0, 0.85, r);
      if (band < 0.4) discard;
      albedo *= band;
    }

    float glow = uGlow * (1.0 - uFlicker * 0.45 * vnoise(vec3(vObjPos.xy * 3.0, uTime * 18.0)));
    float lum = albedo * (uAmbient + (1.0 - uAmbient) * diff) + rim + spec + glow;
    // far objects only get a few cells, so lift their midtones to keep them readable
    float far = smoothstep(50.0, 300.0, length(vViewPos));
    lum = mix(lum, sqrt(max(lum, 0.0)), far * 0.6);

    // sparse speckles that the ASCII pass draws as orange '@' or white 'o' glyphs
    float accent = 0.0;
    float r = hash13(floor(vObjPos * uSpeckleScale) + 7.7);
    if (diff > 0.35) {
      if (r > 1.0 - uEmbers) accent = 1.0;
      else if (r < uFlowers) accent = 0.5;
    }

    gl_FragColor = vec4(clamp(lum, 0.0, 1.0), accent, clamp(glow, 0.0, 1.0), uSet);
  }
`;

export function createAsciiMaterial({
  set = SET.MOON,
  albedo = 1,
  ambient = 0.08,
  rim = 0,
  spec = 0,
  noise = 0,
  noiseScale = 0.3,
  craters = 0,
  stripes = 0,
  stripeFreq = 18,
  ring = [0, 0],
  embers = 0,
  flowers = 0,
  speckleScale = 2,
  glow = 0,
  flicker = 0,
  side = THREE.FrontSide,
} = {}) {
  return new THREE.ShaderMaterial({
    uniforms: {
      ...sceneUniforms,
      uSet: { value: encodeSet(set) },
      uAlbedo: { value: albedo },
      uAmbient: { value: ambient },
      uRim: { value: rim },
      uSpec: { value: spec },
      uNoise: { value: noise },
      uNoiseScale: { value: noiseScale },
      uCraters: { value: craters },
      uStripes: { value: stripes },
      uStripeFreq: { value: stripeFreq },
      uRing: { value: new THREE.Vector2(...ring) },
      uEmbers: { value: embers },
      uFlowers: { value: flowers },
      uSpeckleScale: { value: speckleScale },
      uGlow: { value: glow },
      uFlicker: { value: flicker },
    },
    vertexShader,
    fragmentShader,
    side,
  });
}

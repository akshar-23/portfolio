import * as THREE from 'three';
import fontUrl from '../../../fonts/ChivoMono-VariableFont_wght.ttf';
import {
  BACKGROUND, BANDS, CELL, DUST, FIRST_SOLID, FONT, GLYPH_SETS, RAIN_HEAD, RAIN_STRENGTH, RAY_STRENGTH, SET, SLOTS,
} from './palette.js';

const toVec3 = (hex) => {
  const c = parseInt(hex.slice(1), 16);
  return new THREE.Vector3(((c >> 16) & 255) / 255, ((c >> 8) & 255) / 255, (c & 255) / 255);
};

const vertexShader = /* glsl */ `
  void main() {
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const helpers = /* glsl */ `
  #define PI 3.14159265
  #define NSETS ${GLYPH_SETS.length}
  #define BANDS ${BANDS}
  #define SLOTS ${SLOTS}
  #define FIRST_SOLID ${FIRST_SOLID}
  ${Object.entries(SET).map(([name, id]) => `#define SET_${name} ${id}`).join('\n')}

  float hash11(float p) {
    p = fract(p * 0.1031);
    p *= p + 33.33;
    p *= p + p;
    return fract(p);
  }

  float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  float noise12(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash12(i), hash12(i + vec2(1, 0)), f.x),
               mix(hash12(i + vec2(0, 1)), hash12(i + vec2(1, 1)), f.x), f.y);
  }

  float setAt(sampler2D scene, ivec2 texel) {
    return floor(texelFetch(scene, texel, 0).a * 31.0 + 0.5);
  }
`;

// Sun rays, one value per cell: walk from the cell toward the sun and dim the light
// for every solid object on the way, so planets cast shadow lanes through the beams.
const raysShader = /* glsl */ `
  ${helpers}

  uniform sampler2D uScene;
  uniform vec2 uGrid;
  uniform vec2 uSunUV;
  uniform float uSunR;
  uniform float uSunOn;
  uniform float uAspect;
  uniform float uTime;

  float solidAt(vec2 uv) {
    float id = setAt(uScene, ivec2(uv * uGrid * 2.0));
    return step(float(FIRST_SOLID), id) * step(0.5, abs(id - float(SET_SUN)));
  }

  void main() {
    if (uSunOn < 0.01) {
      gl_FragColor = vec4(0.0);
      return;
    }
    vec2 cell = floor(gl_FragCoord.xy);
    vec2 uv = (cell + 0.5) / uGrid;
    vec2 toSun = uSunUV - uv;
    vec2 scale = vec2(uAspect, 1.0);
    float dist = length(toSun * scale);

    // only the part of the way that is on screen can hold anything
    vec2 safe = sign(toSun) * max(abs(toSun), vec2(1e-5));
    vec2 exit = max((step(0.0, toSun) - uv) / safe, 0.0);
    float tMax = min(1.0, min(exit.x, exit.y));

    float light = 1.0;
    float jitter = hash12(cell);
    for (int i = 1; i <= 36; i++) {
      float f = (float(i) - jitter) / 36.0 * tMax;
      light *= 1.0 - 0.3 * solidAt(uv + toSun * f);
    }

    // separate beams that slowly turn around the sun
    vec2 dir = -toSun * scale / max(dist, 1e-4);
    float beams = noise12(dir * 5.0 + vec2(uTime * 0.02, 0.0)) * 0.65 + noise12(dir * 13.0 - uTime * 0.03) * 0.35;
    beams = 0.12 + 0.88 * smoothstep(0.35, 0.75, beams);

    float edge = max(dist - uSunR, 0.0);
    float rays = exp(-edge * 1.3) * beams + exp(-edge * 9.0) * 0.8;
    gl_FragColor = vec4(clamp(rays * light * uSunOn, 0.0, 1.0), 0.0, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  ${helpers}

  uniform sampler2D uScene;
  uniform sampler2D uRays;
  uniform sampler2D uAtlas;
  uniform vec2 uCell;
  uniform vec2 uGrid;
  uniform vec2 uOffset;
  uniform vec2 uRes;
  uniform vec2 uMouse;
  uniform vec2 uSunUV;
  uniform float uTime;
  uniform float uRainTime;
  uniform float uReveal;
  uniform float uRain;
  uniform float uRayStrength;
  uniform vec3 uBg;
  uniform vec3 uHead;
  uniform vec3 uDust;
  uniform vec3 uDark[NSETS];
  uniform vec3 uBright[NSETS];
  uniform vec4 uParams[NSETS]; // jitter, scramble, gamma, grain

  float glyph(int set, int index, vec2 f) {
    vec2 uv = vec2(
      (float(index) + f.x) / float(BANDS * SLOTS),
      (float(NSETS - 1 - set) + f.y) / float(NSETS)
    );
    return texture2D(uAtlas, uv).r;
  }

  // - / | \\ for an angle given as a fraction of PI
  int orientation(float angle) {
    return int(floor(angle * 4.0 + 0.5)) % 4;
  }

  // x = trail brightness, y = 1 on the leading glyph of a drop
  vec2 rain(vec2 cell) {
    float row = uGrid.y - 1.0 - cell.y;
    vec2 r = vec2(0.0);
    for (int k = 0; k < 2; k++) {
      float s = cell.x * 1.618 + float(k) * 71.3;
      if (hash11(s) > 0.5) continue;
      float speed = mix(4.0, 13.0, hash11(s + 1.1));
      float len = mix(6.0, 26.0, hash11(s + 2.2));
      float period = uGrid.y + len + mix(10.0, 60.0, hash11(s + 3.3));
      float head = mod(uRainTime * speed + hash11(s + 4.4) * period, period);
      float d = head - row;
      if (d >= 0.0 && d < len) {
        float t = 1.0 - d / len;
        r.x = max(r.x, t * t);
        if (d < 1.0) r.y = 1.0;
      }
    }
    return r;
  }

  void main() {
    vec2 p = gl_FragCoord.xy + uOffset;
    vec2 cell = floor(p / uCell);
    vec2 f = fract(p / uCell);

    // 2x2 scene samples per cell
    ivec2 t = ivec2(cell) * 2;
    vec4 s0 = texelFetch(uScene, t, 0);
    vec4 s1 = texelFetch(uScene, t + ivec2(1, 0), 0);
    vec4 s2 = texelFetch(uScene, t + ivec2(0, 1), 0);
    vec4 s3 = texelFetch(uScene, t + ivec2(1, 1), 0);

    vec4 ids = floor(vec4(s0.a, s1.a, s2.a, s3.a) * 31.0 + 0.5);
    float id = max(max(ids.x, ids.y), max(ids.z, ids.w));
    vec4 m = step(abs(ids - id), vec4(0.5));
    float cov = dot(m, vec4(1.0));
    vec4 lums = vec4(s0.r, s1.r, s2.r, s3.r) * m;
    float lum = dot(lums, vec4(1.0)) / cov;
    float lumMax = max(max(lums.x, lums.y), max(lums.z, lums.w));
    float angle = lums.x >= lumMax ? s0.b : lums.y >= lumMax ? s1.b : lums.z >= lumMax ? s2.b : s3.b;
    // accents need at least two samples, so far-away planets don't turn into confetti
    vec4 g = vec4(s0.g, s1.g, s2.g, s3.g);
    float embers = dot(m, step(0.75, g));
    float flowers = dot(m, step(0.25, g) * step(g, vec4(0.75)));
    float accent = embers >= 2.0 ? 1.0 : flowers >= 2.0 ? 0.5 : 0.0;
    float glow = max(max(s0.b * m.x, s1.b * m.y), max(s2.b * m.z, s3.b * m.w));
    cov *= 0.25;

    float h = hash12(cell);
    float h2 = hash12(cell + 19.19);

    // the cursor works like a lantern
    vec2 center = (cell + 0.5) * uCell - uOffset;
    float md = length(center - uMouse) / (uCell.y * 9.0);
    float lantern = exp(-md * md);

    vec2 drop = rain(cell);
    float trail = drop.x * uRain;
    float head = drop.y * uRain;
    float ray = texelFetch(uRays, ivec2(cell), 0).r * uRayStrength * uReveal;

    vec3 color = vec3(0.0);
    float ink = 0.0;
    float bloom = 0.0;
    int set = int(id);

    if (set == SET_VOID) {
      // empty space: drifting dust, matrix rain and sun rays
      float rate = mix(0.5, 2.5, h) + head * 14.0 + lantern * 5.0;
      float epoch = floor(uRainTime * rate + h * 11.0);
      float hs = hash12(cell + epoch * 3.17);
      vec2 ff = f;
      if (fract(hs * 7.31) > 0.5) ff.x = 1.0 - ff.x; // mirrored glyphs, like the film

      float dust = noise12(cell * vec2(0.035, 0.06) + vec2(uTime * 0.015, 0.0)) * 0.7
                 + noise12(cell * 0.21 + 5.0) * 0.3;
      dust = smoothstep(0.6, 0.9, dust) * 0.55 + lantern * 0.3 * step(0.55, h2);

      // rays come in as lines of glyphs pointing away from the sun
      vec2 fromSun = center + uOffset - uSunUV * uGrid * uCell;
      float rayAngle = fract(atan(fromSun.y, fromSun.x) / PI + 1.0);
      float lane = hash11(floor(rayAngle * 420.0));
      bool rayHere = ray > 0.05 && lane * 0.6 + h2 * 0.4 < ray * 1.1;

      float level = clamp(trail * (1.0 + lantern * 1.2) * uReveal, 0.0, 1.0);
      if (level > 0.02 && level >= ray * 0.7) {
        ink = glyph(SET_VOID, int(hs * float(BANDS * SLOTS)), ff);
        color = mix(uDark[SET_VOID], uBright[SET_VOID], level) * smoothstep(0.0, 0.4, level);
        color = mix(color, uHead, head * uReveal * 0.85);
        color = mix(color, uBright[SET_RAY], ray * 0.3);
        bloom = level * level * 0.5 + head * 0.6;
      } else if (rayHere) {
        float r = clamp(ray, 0.0, 1.0);
        float rs = hash12(cell + floor(uTime * uParams[SET_RAY].y + h * 5.0));
        int band = r > 0.4 ? orientation(rayAngle) : 4 + int(h * 4.0);
        ink = glyph(SET_RAY, band * SLOTS + int(rs * float(SLOTS)), f);
        color = mix(uDark[SET_RAY], uBright[SET_RAY], r) * (1.0 + (h - 0.5) * uParams[SET_RAY].w);
        bloom = r * 0.5;
      } else if (dust > 0.05) {
        ink = glyph(SET_MOON, (1 + int(h2 * 2.0)) * SLOTS + int(hs * float(SLOTS)), f);
        color = mix(uDust * dust * 1.6, uBright[SET_RAY] * (0.4 + dust), clamp(ray * 2.0, 0.0, 1.0));
      }
    } else if (set == SET_STREAK) {
      // star streaks and sparkle arms follow their on-screen angle
      float L = clamp(lumMax * 1.15 + lantern * 0.15, 0.0, 1.0);
      int band = orientation(angle) + (L > 0.7 ? 4 : 0);
      ink = glyph(SET_STREAK, band * SLOTS + int(h * float(SLOTS)), f);
      color = mix(uDark[set], uBright[set], L);
      bloom = L * L * 0.5;
    } else {
      if (accent > 0.75) set = SET_EMBER;
      else if (accent > 0.25) set = SET_FLOWER;
      vec4 prm = uParams[set];

      // stars are smaller than a cell, so they take their brightest sample
      bool point = set == SET_STAR;
      float L = pow(clamp(point ? lumMax : lum, 0.0, 1.0), prm.z) * (point ? 1.0 : mix(0.6, 1.0, cov));
      if (accent > 0.25) L = max(L, 0.7);
      if (set < FIRST_SOLID) L += ray * 0.35; // clouds and galaxies catch the sunlight
      L = clamp(L + trail * 0.12 + head * 0.35 + lantern * 0.22, 0.0, 1.0);

      float epoch = floor(uTime * prm.y * (1.0 + lantern * 4.0) + h * 7.0 + head * 13.0);
      float hs = hash12(cell + epoch * 1.37);
      int band = clamp(int(L * float(BANDS) + (h2 - 0.5) * prm.x), 0, BANDS - 1);
      ink = glyph(set, band * SLOTS + int(hs * float(SLOTS)), f);
      color = mix(uDark[set], uBright[set], L) * (1.0 + (h - 0.5) * prm.w);
      color = mix(color, uHead, head * 0.35);
      bloom = L * L * 0.35 + glow * 0.5;

      // intro: objects decode out of scrambled glyphs
      if (h > uReveal) {
        float scramble = hash12(cell + floor(uTime * 20.0));
        ink = glyph(SET_VOID, int(scramble * float(BANDS * SLOTS)), f);
        color = uBright[SET_VOID] * 1.1;
        bloom = 0.3;
      }
    }

    // soft glow under bright glyphs, plus a warm haze where the sun shines
    float halo = bloom * 0.12 * (1.0 - smoothstep(0.0, 0.75, length(f - 0.5)));
    vec3 col = uBg + color * halo + uBright[SET_RAY] * ray * ray * 0.06;
    col = mix(col, color, ink);

    vec2 uv = gl_FragCoord.xy / uRes;
    float vignette = 1.0 - 0.35 * pow(length((uv - 0.5) * vec2(1.0, 0.85)) * 1.35, 2.4);
    gl_FragColor = vec4(col * clamp(vignette, 0.0, 1.0), 1.0);
  }
`;

function createPass(uniforms, shader) {
  const quad = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader: shader, depthTest: false, depthWrite: false })
  );
  quad.frustumCulled = false;
  const scene = new THREE.Scene();
  scene.add(quad);
  return scene;
}

const cellTarget = () => new THREE.WebGLRenderTarget(1, 1, {
  minFilter: THREE.NearestFilter,
  magFilter: THREE.NearestFilter,
});

export class AsciiRenderer {
  constructor(renderer) {
    this.renderer = renderer;
    this.size = new THREE.Vector2();
    this.dpr = 1;
    this.cell = { w: 0, h: 0 };
    this.fontFamily = 'monospace';
    this.aspect = 1;
    this.warp = 0;
    this.time = 0;
    this.rainTime = 0;
    this.revealStart = null;
    this.motion = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0.25 : 1;

    this.target = cellTarget(); // the scene, 2x2 texels per cell
    this.rays = cellTarget(); // sun rays, 1 texel per cell

    this.raysUniforms = {
      uScene: { value: this.target.texture },
      uGrid: { value: new THREE.Vector2(1, 1) },
      uSunUV: { value: new THREE.Vector2(0.5, 2) },
      uSunR: { value: 0.02 },
      uSunOn: { value: 0 },
      uAspect: { value: 1 },
      uTime: { value: 0 },
    };

    this.uniforms = {
      uScene: { value: this.target.texture },
      uRays: { value: this.rays.texture },
      uAtlas: { value: null },
      uCell: { value: new THREE.Vector2(1, 1) },
      uGrid: this.raysUniforms.uGrid,
      uOffset: { value: new THREE.Vector2() },
      uRes: { value: new THREE.Vector2(1, 1) },
      uMouse: { value: new THREE.Vector2(-1e5, -1e5) },
      uSunUV: this.raysUniforms.uSunUV,
      uTime: this.raysUniforms.uTime,
      uRainTime: { value: 0 },
      uReveal: { value: 0 },
      uRain: { value: RAIN_STRENGTH },
      uRayStrength: { value: RAY_STRENGTH },
      uBg: { value: toVec3(BACKGROUND) },
      uHead: { value: toVec3(RAIN_HEAD) },
      uDust: { value: toVec3(DUST) },
      uDark: { value: GLYPH_SETS.map((s) => toVec3(s.dark)) },
      uBright: { value: GLYPH_SETS.map((s) => toVec3(s.bright)) },
      uParams: { value: GLYPH_SETS.map((s) => new THREE.Vector4(s.jitter, s.scramble, s.gamma, s.grain)) },
    };

    this.raysScene = createPass(this.raysUniforms, raysShader);
    this.passScene = createPass(this.uniforms, fragmentShader);
    this.passCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // size of the cell grid in device pixels, for shaders that need on-screen angles
    this.gridSize = new THREE.Vector2(1, 1);
    this.sunView = new THREE.Vector3();
    this.sunScreen = new THREE.Vector3();
  }

  async loadFont() {
    try {
      const face = new FontFace('AsciiGlyphs', `url(${fontUrl})`, { weight: '100 900' });
      await face.load();
      document.fonts.add(face);
      this.fontFamily = '"AsciiGlyphs", monospace';
    } catch (error) {
      console.warn('ASCII font failed to load, falling back to monospace', error);
    }
    if (this.cell.w) this.buildAtlas();
  }

  // One row per glyph set, one tile per band slot, drawn at the exact device-pixel cell size.
  buildAtlas() {
    const { w, h } = this.cell;
    const tiles = BANDS * SLOTS;
    const canvas = document.createElement('canvas');
    canvas.width = w * tiles;
    canvas.height = h * GLYPH_SETS.length;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = `${FONT.weight} 100px ${this.fontFamily}`;
    const advance = ctx.measureText('M').width / 100;
    const size = Math.min(w / advance, h * 0.92) * FONT.scale;
    ctx.font = `${FONT.weight} ${size}px ${this.fontFamily}`;
    const capHeight = ctx.measureText('M').actualBoundingBoxAscent;
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';

    GLYPH_SETS.forEach((set, row) => {
      set.bands.forEach((band, b) => {
        const chars = [...band];
        for (let s = 0; s < SLOTS; s++) {
          const x = (b * SLOTS + s) * w;
          const y = row * h;
          ctx.save();
          ctx.beginPath();
          ctx.rect(x, y, w, h);
          ctx.clip();
          ctx.fillText(chars[s % chars.length], x + w / 2, y + (h + capHeight) / 2);
          ctx.restore();
        }
      });
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;

    this.uniforms.uAtlas.value?.dispose();
    this.uniforms.uAtlas.value = texture;
  }

  setSize(width, height) {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.renderer.setPixelRatio(this.dpr);
    this.renderer.setSize(width, height);
    this.renderer.getDrawingBufferSize(this.size);

    const css = width < 700 ? CELL.mobile : CELL.desktop;
    const w = Math.max(4, Math.round(css.w * this.dpr));
    const h = Math.max(6, Math.round(css.h * this.dpr));
    if (w !== this.cell.w || h !== this.cell.h) {
      this.cell = { w, h };
      this.buildAtlas();
    }

    const cols = Math.ceil(this.size.x / w);
    const rows = Math.ceil(this.size.y / h);
    this.target.setSize(cols * 2, rows * 2);
    this.rays.setSize(cols, rows);

    const u = this.uniforms;
    u.uCell.value.set(w, h);
    u.uGrid.value.set(cols, rows);
    u.uOffset.value.set(Math.floor((cols * w - this.size.x) / 2), Math.floor((rows * h - this.size.y) / 2));
    u.uRes.value.copy(this.size);
    this.gridSize.set(cols * w, rows * h);
    this.aspect = this.gridSize.x / this.gridSize.y;
    this.raysUniforms.uAspect.value = this.aspect;
  }

  setPointer(x, y) {
    this.uniforms.uMouse.value.set(x * this.dpr, this.size.y - y * this.dpr);
  }

  clearPointer() {
    this.uniforms.uMouse.value.set(-1e5, -1e5);
  }

  // where the sun is on screen, so the rays know where to come from
  setSun(position, radius, camera) {
    const u = this.raysUniforms;
    const view = this.sunView.copy(position).applyMatrix4(camera.matrixWorldInverse);
    const distance = view.length();
    u.uSunOn.value = THREE.MathUtils.smoothstep(-view.z / distance, 0.05, 0.35);
    if (view.z > -1) return;

    const screen = this.sunScreen.copy(position).project(camera);
    u.uSunUV.value.set(screen.x * 0.5 + 0.5, screen.y * 0.5 + 0.5);
    const halfFov = THREE.MathUtils.degToRad(camera.fov) / 2;
    u.uSunR.value = (radius / distance / Math.tan(halfFov)) * 0.5;
  }

  update(dt) {
    dt *= this.motion;
    this.time += dt;
    this.rainTime += dt * (1 + this.warp * 2.5);
    if (this.revealStart === null) this.revealStart = this.time;
    const t = Math.min((this.time - this.revealStart) / (1.8 * this.motion), 1);

    const u = this.uniforms;
    u.uTime.value = this.time;
    u.uRainTime.value = this.rainTime;
    u.uReveal.value = 1 - Math.pow(1 - t, 3);
  }

  render(scene, camera) {
    const r = this.renderer;
    r.setClearColor(0x000000, 0);
    r.setRenderTarget(this.target);
    r.render(scene, camera);
    r.setRenderTarget(this.rays);
    r.render(this.raysScene, this.passCamera);
    r.setRenderTarget(null);
    r.render(this.passScene, this.passCamera);
  }
}

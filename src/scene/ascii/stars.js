import * as THREE from 'three';
import { SET } from './palette.js';
import { encodeSet, sceneUniforms } from './materials.js';

// Stars live in a box that wraps around the camera, so flying anywhere along the
// path keeps them streaming past. Each star is a point; when we fly fast it also
// gets a streak, and the ASCII pass draws the streak with - / | \ along its angle.

const starChunk = /* glsl */ `
  attribute float aSeed;
  uniform float uTime;
  uniform vec3 uCamPos;
  uniform vec3 uDrift;
  uniform float uHalf;

  vec3 wrapStar(vec3 p) {
    return uCamPos + mod(p + uDrift - uCamPos + uHalf, 2.0 * uHalf) - uHalf;
  }

  float starBright(vec3 p, float seed) {
    vec3 rel = p - uCamPos;
    float near = clamp(1.0 - length(rel) / uHalf, 0.0, 1.0);
    float edge = max(max(abs(rel.x), abs(rel.y)), abs(rel.z));
    float twinkle = 0.75 + 0.25 * sin(uTime * (1.5 + seed * 4.0) + seed * 60.0);
    return (0.4 + 0.6 * near) * twinkle * (0.6 + 0.4 * seed) * (1.0 - smoothstep(0.8 * uHalf, uHalf, edge));
  }
`;

const outputChunk = /* glsl */ `
  uniform float uSet;
  varying float vBright;
  varying float vAngle;

  void main() {
    if (vBright < 0.02) discard;
    gl_FragColor = vec4(vBright, 0.0, vAngle, uSet);
  }
`;

const SKY_DISTANCE = 1500;

export function createStarfield({ count = 1000, half = 450, sparkles = 8 } = {}) {
  const uniforms = {
    uTime: sceneUniforms.uTime,
    uCamPos: { value: new THREE.Vector3() },
    uDrift: { value: new THREE.Vector3() },
    uHalf: { value: half },
    uStreakDir: { value: new THREE.Vector3(0, 0, -1) },
    uStreakLen: { value: 0 },
    uRes: { value: new THREE.Vector2(1, 1) },
  };
  const material = (set, vertexShader) => new THREE.ShaderMaterial({
    uniforms: { ...uniforms, uSet: { value: encodeSet(set) } },
    vertexShader,
    fragmentShader: outputChunk,
  });

  // field stars
  const base = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    base[i * 3] = THREE.MathUtils.randFloatSpread(half * 2);
    base[i * 3 + 1] = THREE.MathUtils.randFloatSpread(half * 2);
    base[i * 3 + 2] = THREE.MathUtils.randFloatSpread(half * 2);
    seeds[i] = Math.random();
  }

  const pointGeometry = new THREE.BufferGeometry();
  pointGeometry.setAttribute('position', new THREE.BufferAttribute(base, 3));
  pointGeometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));

  const points = new THREE.Points(pointGeometry, material(SET.STAR, /* glsl */ `
    ${starChunk}
    varying float vBright;
    varying float vAngle;

    void main() {
      vec3 p = wrapStar(position);
      vec4 mv = viewMatrix * vec4(p, 1.0);
      gl_Position = projectionMatrix * mv;
      float near = clamp(1.0 - length(mv.xyz) / uHalf, 0.0, 1.0);
      vBright = starBright(p, aSeed) * step(mv.z, -1.0);
      vAngle = 0.0;
      gl_PointSize = 1.0 + floor(near * near * 3.0);
    }
  `));

  // streaks: two vertices per star, the tail trails off ahead of us
  const streakBase = new Float32Array(count * 6);
  const streakSeeds = new Float32Array(count * 2);
  const streakEnds = new Float32Array(count * 2);
  for (let i = 0; i < count; i++) {
    for (let e = 0; e < 2; e++) {
      streakBase.set(base.subarray(i * 3, i * 3 + 3), (i * 2 + e) * 3);
      streakSeeds[i * 2 + e] = seeds[i];
      streakEnds[i * 2 + e] = e;
    }
  }

  const streakGeometry = new THREE.BufferGeometry();
  streakGeometry.setAttribute('position', new THREE.BufferAttribute(streakBase, 3));
  streakGeometry.setAttribute('aSeed', new THREE.BufferAttribute(streakSeeds, 1));
  streakGeometry.setAttribute('aEnd', new THREE.BufferAttribute(streakEnds, 1));

  const streaks = new THREE.LineSegments(streakGeometry, material(SET.STREAK, /* glsl */ `
    ${starChunk}
    attribute float aEnd;
    uniform vec3 uStreakDir;
    uniform float uStreakLen;
    uniform vec2 uRes;
    varying float vBright;
    varying float vAngle;

    void main() {
      vec3 head = wrapStar(position);
      vec3 tail = head + uStreakDir * uStreakLen * (0.5 + 0.5 * aSeed);
      vec4 hv = viewMatrix * vec4(head, 1.0);
      vec4 ch = projectionMatrix * hv;
      vec4 ct = projectionMatrix * viewMatrix * vec4(tail, 1.0);
      gl_Position = aEnd > 0.5 ? ct : ch;

      vec2 d = (ct.xy / ct.w - ch.xy / ch.w) * uRes;
      vAngle = fract(atan(d.y, d.x) / 3.14159265 + 1.0);
      vBright = starBright(head, aSeed) * (1.0 - 0.6 * aEnd) * step(hv.z, -2.0) * step(0.35, aSeed);
    }
  `));

  // sparkles: a few bright far-away stars with - | / \ arms
  const dirs = [];
  for (let i = 0; i < sparkles; i++) {
    dirs.push(new THREE.Vector3().randomDirection());
  }
  const ARMS = [
    [1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1],
    [0.71, 0.71, 0.4], [-0.71, -0.71, 0.4], [0.71, -0.71, 0.4], [-0.71, 0.71, 0.4],
  ];

  const sparkleCenters = new THREE.BufferGeometry();
  sparkleCenters.setAttribute('aDir', new THREE.BufferAttribute(new Float32Array(dirs.flatMap((d) => d.toArray())), 3));
  sparkleCenters.setAttribute('aSeed', new THREE.BufferAttribute(new Float32Array(dirs.map(() => Math.random())), 1));
  sparkleCenters.setAttribute('position', new THREE.BufferAttribute(new Float32Array(sparkles * 3), 3));

  const armData = { aDir: [], aArm: [], aLen: [], aEnd: [], aSeed: [] };
  dirs.forEach((dir) => {
    const seed = Math.random();
    const size = THREE.MathUtils.randFloat(30, 70);
    ARMS.forEach(([x, y, scale]) => {
      for (let e = 0; e < 2; e++) {
        armData.aDir.push(...dir.toArray());
        armData.aArm.push(x, y);
        armData.aLen.push(size * scale);
        armData.aEnd.push(e);
        armData.aSeed.push(seed);
      }
    });
  });
  const sparkleArms = new THREE.BufferGeometry();
  sparkleArms.setAttribute('position', new THREE.BufferAttribute(new Float32Array(armData.aEnd.length * 3), 3));
  sparkleArms.setAttribute('aDir', new THREE.BufferAttribute(new Float32Array(armData.aDir), 3));
  sparkleArms.setAttribute('aArm', new THREE.BufferAttribute(new Float32Array(armData.aArm), 2));
  sparkleArms.setAttribute('aLen', new THREE.BufferAttribute(new Float32Array(armData.aLen), 1));
  sparkleArms.setAttribute('aEnd', new THREE.BufferAttribute(new Float32Array(armData.aEnd), 1));
  sparkleArms.setAttribute('aSeed', new THREE.BufferAttribute(new Float32Array(armData.aSeed), 1));

  const sparkleChunk = /* glsl */ `
    attribute vec3 aDir;
    attribute float aSeed;
    uniform float uTime;
    uniform vec3 uCamPos;
    uniform vec2 uRes;
    varying float vBright;
    varying float vAngle;

    float pulse() {
      return 0.7 + 0.3 * sin(uTime * (0.8 + aSeed) + aSeed * 20.0);
    }

    vec4 skyPosition() {
      return projectionMatrix * viewMatrix * vec4(uCamPos + aDir * ${SKY_DISTANCE.toFixed(1)}, 1.0);
    }
  `;

  const centers = new THREE.Points(sparkleCenters, material(SET.STAR, /* glsl */ `
    ${sparkleChunk}
    void main() {
      gl_Position = skyPosition();
      gl_PointSize = 3.0;
      vBright = pulse();
      vAngle = 0.0;
    }
  `));

  const arms = new THREE.LineSegments(sparkleArms, material(SET.STREAK, /* glsl */ `
    ${sparkleChunk}
    attribute vec2 aArm;
    attribute float aLen;
    attribute float aEnd;

    void main() {
      vec4 c = skyPosition();
      c.xy += aArm * aLen * pulse() * aEnd / (uRes * 0.5) * c.w;
      gl_Position = c;
      vAngle = fract(atan(aArm.y, aArm.x) / 3.14159265 + 1.0);
      vBright = mix(1.0, 0.25, aEnd) * pulse();
    }
  `));

  const group = new THREE.Group();
  for (const object of [points, streaks, centers, arms]) {
    object.frustumCulled = false;
    group.add(object);
  }

  return {
    group,
    // drift: accumulated star motion in world space, streak: how long the streaks are
    update(camera, forward, drift, streak, res) {
      uniforms.uCamPos.value.copy(camera.position);
      uniforms.uDrift.value.copy(drift);
      uniforms.uStreakDir.value.copy(forward);
      uniforms.uStreakLen.value = streak;
      uniforms.uRes.value.copy(res);
      streaks.visible = streak > 0.5;
    },
  };
}

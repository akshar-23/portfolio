import * as THREE from 'three';
import { SET } from '../ascii/palette.js';
import { createAsciiMaterial, encodeSet, sceneUniforms } from '../ascii/materials.js';

// An icy head with a cone of streaks for a tail. Tails always point away from the sun.
export function createComet({ from, to, period = 70, offset = 0, length = 90, lines = 70 } = {}) {
  const group = new THREE.Group();

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(1.6, 24, 12),
    createAsciiMaterial({ set: SET.ICE, ambient: 0.5, glow: 0.45, flicker: 0.4 })
  );
  group.add(head);

  const t0 = [], t1 = [], spread = [], ends = [];
  for (let i = 0; i < lines; i++) {
    const a = Math.random() * 0.15;
    const b = THREE.MathUtils.lerp(0.35, 1, Math.random());
    const s = [THREE.MathUtils.randFloatSpread(0.22), THREE.MathUtils.randFloatSpread(0.22)];
    for (let e = 0; e < 2; e++) {
      t0.push(a);
      t1.push(b);
      spread.push(...s);
      ends.push(e);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ends.length * 3), 3));
  geometry.setAttribute('aT0', new THREE.BufferAttribute(new Float32Array(t0), 1));
  geometry.setAttribute('aT1', new THREE.BufferAttribute(new Float32Array(t1), 1));
  geometry.setAttribute('aSpread', new THREE.BufferAttribute(new Float32Array(spread), 2));
  geometry.setAttribute('aEnd', new THREE.BufferAttribute(new Float32Array(ends), 1));

  const uniforms = {
    uHead: { value: new THREE.Vector3() },
    uTailDir: { value: new THREE.Vector3(1, 0, 0) },
    uLength: { value: length },
    uFade: { value: 1 },
    uRes: { value: new THREE.Vector2(1, 1) },
    uSet: { value: encodeSet(SET.STREAK) },
    uTime: sceneUniforms.uTime,
  };

  const tail = new THREE.LineSegments(geometry, new THREE.ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */ `
      attribute float aT0;
      attribute float aT1;
      attribute vec2 aSpread;
      attribute float aEnd;
      uniform vec3 uHead;
      uniform vec3 uTailDir;
      uniform float uLength;
      uniform float uFade;
      uniform vec2 uRes;
      varying float vBright;
      varying float vAngle;

      vec3 along(float t) {
        vec3 side = normalize(cross(uTailDir, vec3(0.0, 1.0, 0.0)));
        vec3 up = cross(side, uTailDir);
        return uHead + (uTailDir + side * aSpread.x + up * aSpread.y) * uLength * t;
      }

      void main() {
        vec4 a = projectionMatrix * viewMatrix * vec4(along(aT0), 1.0);
        vec4 b = projectionMatrix * viewMatrix * vec4(along(aT1), 1.0);
        gl_Position = aEnd > 0.5 ? b : a;
        vec2 d = (b.xy / b.w - a.xy / a.w) * uRes;
        vAngle = fract(atan(d.y, d.x) / 3.14159265 + 1.0);
        vBright = mix(0.95, 0.15, aEnd) * uFade * step(0.0, a.w) * step(0.0, b.w);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uSet;
      varying float vBright;
      varying float vAngle;

      void main() {
        if (vBright < 0.02) discard;
        gl_FragColor = vec4(vBright, 0.0, vAngle, uSet);
      }
    `,
  }));
  tail.frustumCulled = false;
  group.add(tail);

  const start = from.clone();
  const end = to.clone();

  function update(time, sunPosition, res) {
    const phase = ((time + offset) / period) % 1;
    head.position.lerpVectors(start, end, phase);
    uniforms.uHead.value.copy(head.position);
    uniforms.uTailDir.value.subVectors(head.position, sunPosition).normalize();
    uniforms.uFade.value = Math.sin(Math.PI * phase);
    uniforms.uRes.value.copy(res);
    head.scale.setScalar(Math.max(uniforms.uFade.value, 0.01));
  }

  return { group, update };
}

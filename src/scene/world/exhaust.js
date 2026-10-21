import * as THREE from 'three';
import { SET } from '../ascii/palette.js';
import { encodeSet } from '../ascii/materials.js';

// Sparks from the thrusters: points born at the back of the ship that fly backwards
// and fade. They live in world space, so when the ship moves they trail behind it.
export function createExhaust({ count = 160 } = {}) {
  const positions = new Float32Array(count * 3);
  const ages = new Float32Array(count).fill(1);
  const velocities = new Float32Array(count * 3);
  const lifetimes = new Float32Array(count).fill(1);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aAge', new THREE.BufferAttribute(ages, 1));

  const points = new THREE.Points(geometry, new THREE.ShaderMaterial({
    uniforms: { uSet: { value: encodeSet(SET.EMBER) } },
    vertexShader: /* glsl */ `
      attribute float aAge;
      varying float vBright;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        vBright = (1.0 - aAge) * (1.0 - aAge);
        gl_PointSize = aAge < 0.25 ? 3.0 : 2.0;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uSet;
      varying float vBright;
      void main() {
        if (vBright < 0.03) discard;
        gl_FragColor = vec4(vBright, 0.0, vBright * 0.6, uSet);
      }
    `,
  }));
  points.frustumCulled = false;

  let next = 0;
  let carry = 0;
  const origin = new THREE.Vector3();
  const back = new THREE.Vector3();
  const side = new THREE.Vector3();
  const up = new THREE.Vector3();

  // rig: the ship's group; nozzles: points in the rig's local space; thrust: 0 idle, 1 full
  function update(dt, rig, nozzles, thrust) {
    back.set(0, 0, 1).applyQuaternion(rig.quaternion);
    side.set(1, 0, 0).applyQuaternion(rig.quaternion);
    up.set(0, 1, 0).applyQuaternion(rig.quaternion);

    carry += dt * (45 + thrust * 160);
    while (carry >= 1 && nozzles.length) {
      carry -= 1;
      const i = next;
      next = (next + 1) % count;
      origin.copy(nozzles[i % nozzles.length]).applyMatrix4(rig.matrixWorld);
      positions.set([origin.x, origin.y, origin.z], i * 3);
      const speed = 9 + Math.random() * 6 + thrust * 10;
      const spread = 1.6;
      velocities[i * 3] = back.x * speed + side.x * (Math.random() - 0.5) * spread + up.x * (Math.random() - 0.5) * spread;
      velocities[i * 3 + 1] = back.y * speed + side.y * (Math.random() - 0.5) * spread + up.y * (Math.random() - 0.5) * spread;
      velocities[i * 3 + 2] = back.z * speed + side.z * (Math.random() - 0.5) * spread + up.z * (Math.random() - 0.5) * spread;
      ages[i] = 0;
      lifetimes[i] = 0.35 + Math.random() * 0.35 + thrust * 0.3;
    }

    for (let i = 0; i < count; i++) {
      if (ages[i] >= 1) continue;
      ages[i] = Math.min(1, ages[i] + dt / lifetimes[i]);
      positions[i * 3] += velocities[i * 3] * dt;
      positions[i * 3 + 1] += velocities[i * 3 + 1] * dt;
      positions[i * 3 + 2] += velocities[i * 3 + 2] * dt;
    }
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.aAge.needsUpdate = true;
  }

  return { points, update };
}

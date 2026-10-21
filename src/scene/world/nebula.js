import * as THREE from 'three';
import { SET } from '../ascii/palette.js';
import { encodeSet, noiseChunk, sceneUniforms } from '../ascii/materials.js';

// A soft cloud that always faces the camera and thins out as we fly into it.
export function createNebula(size, seed = Math.random() * 100) {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.ShaderMaterial({
      uniforms: {
        uTime: sceneUniforms.uTime,
        uSize: { value: size },
        uSeed: { value: seed },
        uSet: { value: encodeSet(SET.NEBULA) },
      },
      vertexShader: /* glsl */ `
        uniform float uSize;
        varying vec2 vUv;
        varying float vDist;

        void main() {
          vec4 center = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
          vDist = length(center.xyz);
          vUv = position.xy;
          gl_Position = projectionMatrix * (center + vec4(position.xy * uSize, 0.0, 0.0));
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTime;
        uniform float uSize;
        uniform float uSeed;
        uniform float uSet;
        varying vec2 vUv;
        varying float vDist;

        ${noiseChunk}

        void main() {
          float r = length(vUv) * 2.0;
          float d = fbm(vec3(vUv * 3.2 + uSeed, uTime * 0.015)) * (1.0 - smoothstep(0.35, 1.0, r));
          d = smoothstep(0.22, 0.7, d);
          float lum = d * 0.65 * smoothstep(uSize * 0.2, uSize * 0.6, vDist);
          if (lum < 0.06) discard;
          gl_FragColor = vec4(lum, 0.0, 0.0, uSet);
        }
      `,
      depthWrite: false,
    })
  );
  mesh.frustumCulled = false;
  mesh.renderOrder = -1;
  return mesh;
}

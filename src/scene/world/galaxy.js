import * as THREE from 'three';
import { SET } from '../ascii/palette.js';
import { encodeSet, noiseChunk, sceneUniforms } from '../ascii/materials.js';

// A far-away spiral galaxy drawn on a flat disc. It sits behind everything else.
export function createGalaxy(size) {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.ShaderMaterial({
      uniforms: {
        uTime: sceneUniforms.uTime,
        uSet: { value: encodeSet(SET.GALAXY) },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv - 0.5;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTime;
        uniform float uSet;
        varying vec2 vUv;

        ${noiseChunk}

        void main() {
          float r = length(vUv) * 2.0;
          float theta = atan(vUv.y, vUv.x) + uTime * 0.01;
          float arms = pow(0.5 + 0.5 * cos(2.0 * theta - log(r + 0.02) * 5.5), 3.0);
          float dust = fbm(vec3(vUv * 9.0, 3.0));
          float b = exp(-r * 9.0) * 1.3 + arms * exp(-r * 2.6) * (0.35 + 0.9 * dust);
          b *= 1.0 - smoothstep(0.75, 1.0, r);
          if (b < 0.07) discard;
          gl_FragColor = vec4(clamp(b, 0.0, 1.0), 0.0, 0.0, uSet);
        }
      `,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  mesh.renderOrder = -2;
  return mesh;
}

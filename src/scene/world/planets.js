import * as THREE from 'three';
import { SET } from '../ascii/palette.js';
import { createAsciiMaterial } from '../ascii/materials.js';

export function createPlanet(radius, look) {
  return new THREE.Mesh(new THREE.SphereGeometry(radius, 64, 32), createAsciiMaterial(look));
}

export function createTorusRing(radius, tube, look) {
  return new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 12, 96), createAsciiMaterial(look));
}

export function createSun(radius) {
  return new THREE.Mesh(
    new THREE.SphereGeometry(radius, 48, 24),
    createAsciiMaterial({
      set: SET.SUN, albedo: 0.55, ambient: 0.45, glow: 0.5, flicker: 0.6, noise: 0.7, noiseScale: 4 / radius,
    })
  );
}

// A banded gas giant with flat rings. The group's local y axis is the ring axis.
export function createGasGiant(radius) {
  const group = new THREE.Group();

  const body = createPlanet(radius, {
    set: SET.LILAC, albedo: 1.25, ambient: 0.15, noise: 0.35, noiseScale: 2 / radius, stripes: 0.6, stripeFreq: 22, rim: 0.5,
  });
  group.add(body);

  const inner = radius * 1.45;
  const outer = radius * 2.1;
  const rings = new THREE.Mesh(
    new THREE.RingGeometry(inner, outer, 160, 4),
    createAsciiMaterial({ set: SET.ICE, albedo: 0.95, ambient: 0.3, ring: [inner, outer], side: THREE.DoubleSide })
  );
  rings.rotation.x = -Math.PI / 2;
  group.add(rings);

  return { group, body, rings };
}

import * as THREE from 'three';
import { SET } from '../ascii/palette.js';
import { createAsciiMaterial } from '../ascii/materials.js';

// A spinning ring station with solar wings and blinking beacons.
export function createStation(scale = 1) {
  const group = new THREE.Group();
  const spinner = new THREE.Group();
  group.add(spinner);

  const hull = createAsciiMaterial({ set: SET.SHIP, albedo: 0.85, rim: 0.25, spec: 0.4 });
  const dark = createAsciiMaterial({ set: SET.SHIP, albedo: 0.45 });
  const panels = createAsciiMaterial({ set: SET.GLASS, albedo: 0.9, spec: 0.8, side: THREE.DoubleSide });

  spinner.add(new THREE.Mesh(new THREE.TorusGeometry(9, 1.1, 12, 64), hull));

  const hub = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 9, 24), hull);
  hub.rotation.x = Math.PI / 2;
  spinner.add(hub);

  for (let i = 0; i < 4; i++) {
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.5, 8, 0.5), dark);
    spoke.rotation.z = (i * Math.PI) / 2;
    spoke.position.set(Math.sin((i * Math.PI) / 2) * -4.5, Math.cos((i * Math.PI) / 2) * 4.5, 0);
    spinner.add(spoke);
  }

  // the solar wings don't spin with the ring
  for (const side of [-1, 1]) {
    const mast = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 6), dark);
    mast.position.z = side * 7.5;
    group.add(mast);
    for (const wing of [-1, 1]) {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(9, 0.15, 3.2), panels);
      panel.position.set(wing * 6, 0, side * 9.5);
      group.add(panel);
    }
  }

  const beacons = [];
  for (let i = 0; i < 6; i++) {
    const beacon = new THREE.Mesh(
      new THREE.SphereGeometry(0.55, 10, 6),
      createAsciiMaterial({ set: SET.EMBER, glow: 0.9 })
    );
    const a = (i / 6) * Math.PI * 2;
    beacon.position.set(Math.cos(a) * 10.3, Math.sin(a) * 10.3, 0);
    spinner.add(beacon);
    beacons.push(beacon);
  }

  group.scale.setScalar(scale);

  function update(time) {
    spinner.rotation.z = time * 0.25;
    beacons.forEach((beacon, i) => {
      beacon.visible = Math.sin(time * 3 + i * 1.7) > 0.2;
    });
  }

  return { group, update };
}

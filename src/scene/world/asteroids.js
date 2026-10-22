import * as THREE from 'three';
import { SET } from '../ascii/palette.js';
import { createAsciiMaterial } from '../ascii/materials.js';

// Lumpy rock: an icosphere pushed in and out. The offset only depends on the vertex
// position, so shared corners move together and the mesh stays closed.
export function createRockGeometry() {
  const geometry = new THREE.IcosahedronGeometry(1, 2);
  const pos = geometry.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const n = Math.sin(v.x * 3.1 + v.y * 1.7) * Math.cos(v.z * 2.3 - v.x * 1.3) + Math.sin(v.y * 5.3 + v.z * 4.1) * 0.35;
    v.multiplyScalar(1 + n * 0.22);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geometry.computeVertexNormals();
  return geometry;
}

// Tumbling rocks in layers around a stretch of the flight path. None come inside the
// space the ship and the chase camera fly through (with their stunts); a few sit just
// outside it, the rest further out, bigger with distance so the far layers still read.
//   curve, from, to: the stretch of path (curve parameter t)
//   clear: that space around the path: half its width, and how far below and above
const LAYERS = [
  { share: 0.25, radius: [45, 75], scale: [0.8, 3] },
  { share: 0.45, radius: [75, 130], scale: [1.5, 4.5] },
  { share: 0.3, radius: [130, 210], scale: [3, 7] },
];

export function createAsteroidField({ curve, from, to, count = 130, clear = { x: 48, below: 20, above: 22 } }) {
  const material = createAsciiMaterial({ set: SET.MOON, albedo: 1.1, noise: 0.6, noiseScale: 1.4, craters: 0.6, rim: 0.2 });
  const mesh = new THREE.InstancedMesh(createRockGeometry(), material, count);
  mesh.frustumCulled = false;

  const up = new THREE.Vector3(0, 1, 0);
  const pick = (layer) => {
    // keep re-rolling the direction until the rock is outside the clear space
    for (;;) {
      const angle = Math.random() * Math.PI * 2;
      const radius = THREE.MathUtils.lerp(...layer.radius, Math.random());
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius * 0.7;
      if (Math.abs(x) >= clear.x || y <= -clear.below || y >= clear.above) return { x, y };
    }
  };
  const rocks = Array.from({ length: count }, (_, i) => {
    let at = i / count;
    const layer = LAYERS.find((l) => (at -= l.share) < 0) ?? LAYERS[LAYERS.length - 1];
    const t = THREE.MathUtils.lerp(from, to, Math.random());
    const forward = curve.getTangent(t);
    const side = new THREE.Vector3().crossVectors(forward, up).normalize();
    const lift = new THREE.Vector3().crossVectors(side, forward);
    const { x, y } = pick(layer);
    return {
      position: curve.getPoint(t).addScaledVector(side, x).addScaledVector(lift, y),
      scale: THREE.MathUtils.lerp(...layer.scale, Math.random() ** 2),
      axis: new THREE.Vector3().randomDirection(),
      spin: THREE.MathUtils.randFloat(0.15, 0.8),
      phase: Math.random() * Math.PI * 2,
    };
  });

  const matrix = new THREE.Matrix4();
  const rotation = new THREE.Quaternion();
  const scale = new THREE.Vector3();

  function update(time) {
    rocks.forEach((rock, i) => {
      rotation.setFromAxisAngle(rock.axis, rock.phase + time * rock.spin);
      scale.setScalar(rock.scale);
      mesh.setMatrixAt(i, matrix.compose(rock.position, rotation, scale));
    });
    mesh.instanceMatrix.needsUpdate = true;
  }

  update(0);
  // rocks: { position, scale } in world space, for things that collide with them
  return { mesh, update, rocks };
}

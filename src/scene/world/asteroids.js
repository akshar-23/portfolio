import * as THREE from 'three';
import { SET } from '../ascii/palette.js';
import { createAsciiMaterial } from '../ascii/materials.js';

// Lumpy rock: an icosphere pushed in and out. The offset only depends on the vertex
// position, so shared corners move together and the mesh stays closed.
function createRockGeometry() {
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

// Tumbling rocks scattered in a tube around a stretch of the flight path, with a
// clear corridor in the middle for the ship.
//   curve, from, to: the stretch of path (curve parameter t)
//   corridor, spread: inner and outer radius of the tube
export function createAsteroidField({ curve, from, to, count = 130, corridor = 14, spread = 70 }) {
  const material = createAsciiMaterial({ set: SET.MOON, albedo: 1.1, noise: 0.6, noiseScale: 1.4, craters: 0.6, rim: 0.2 });
  const mesh = new THREE.InstancedMesh(createRockGeometry(), material, count);
  mesh.frustumCulled = false;

  const up = new THREE.Vector3(0, 1, 0);
  const rocks = Array.from({ length: count }, () => {
    const t = THREE.MathUtils.lerp(from, to, Math.random());
    const forward = curve.getTangent(t);
    const side = new THREE.Vector3().crossVectors(forward, up).normalize();
    const lift = new THREE.Vector3().crossVectors(side, forward);
    const angle = Math.random() * Math.PI * 2;
    const radius = THREE.MathUtils.lerp(corridor, spread, Math.random() ** 1.5);
    return {
      position: curve.getPoint(t)
        .addScaledVector(side, Math.cos(angle) * radius)
        .addScaledVector(lift, Math.sin(angle) * radius * 0.7),
      scale: THREE.MathUtils.lerp(0.8, 4.5, Math.random() ** 2),
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
  return { mesh, update };
}

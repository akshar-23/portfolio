import * as THREE from 'three';

const WORLD_UP = new THREE.Vector3(0, 1, 0);

// The chase camera sits behind and above the ship and looks at a point ahead of it.
export const CHASE = { back: 10, up: 8, ahead: 40 };

// where the chase camera sits and looks for a ship frame
export function chaseCamera(frame, position, target) {
  position.copy(frame.position).addScaledVector(frame.forward, -CHASE.back).addScaledVector(frame.up, CHASE.up);
  target.copy(frame.position).addScaledVector(frame.forward, CHASE.ahead);
}

// The ship flies along a spline. Scroll progress (0 - 1) moves it from station to
// station; a station is where the ship rests when a section snaps into place.
//   points:   spline control points
//   stations: indices into points, one per section
//   rolls:    barrel rolls on the way from station i to i + 1 (+1 / -1 / 0)
export function createFlight({ points, stations, rolls = [] }) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), false, 'centripetal');
  const stationT = stations.map((i) => i / (points.length - 1));

  function frameAt(t, out = {}) {
    const position = curve.getPoint(t, out.position ?? new THREE.Vector3());
    const forward = curve.getTangent(t, out.forward ?? new THREE.Vector3()).normalize();
    const right = (out.right ?? new THREE.Vector3()).crossVectors(forward, WORLD_UP).normalize();
    const up = (out.up ?? new THREE.Vector3()).crossVectors(right, forward).normalize();
    return Object.assign(out, { position, forward, right, up });
  }

  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const side = {};

  // how hard the path turns right (+) or left (-) at t
  function turnAt(t) {
    const e = 0.004;
    curve.getTangent(Math.max(t - e, 0), a);
    curve.getTangent(Math.min(t + e, 1), b);
    frameAt(t, side);
    return b.sub(a).dot(side.right) / (2 * e);
  }

  function sample(progress) {
    const s = THREE.MathUtils.clamp(progress, 0, 1) * (stationT.length - 1);
    const k = Math.min(Math.floor(s), stationT.length - 2);
    const f = s - k;
    return {
      t: THREE.MathUtils.lerp(stationT[k], stationT[k + 1], f),
      roll: (rolls[k] ?? 0) * Math.PI * 2 * THREE.MathUtils.smootherstep(f, 0, 1),
    };
  }

  // the ship and camera frames at each station, for placing objects into a section's view
  const ships = stationT.map((t) => frameAt(t));
  const views = ships.map((ship) => {
    const position = new THREE.Vector3();
    const target = new THREE.Vector3();
    chaseCamera(ship, position, target);
    const forward = target.sub(position).normalize();
    const right = new THREE.Vector3().crossVectors(forward, WORLD_UP).normalize();
    const up = new THREE.Vector3().crossVectors(right, forward);
    return { position, forward, right, up };
  });

  // a point in a station's view: x right, y up, z ahead of the camera
  function place(station, x, y, z) {
    const view = views[station];
    return view.position.clone()
      .addScaledVector(view.right, x)
      .addScaledVector(view.up, y)
      .addScaledVector(view.forward, z);
  }

  return { curve, stations: stationT.length, stationT, frameAt, turnAt, sample, ships, views, place };
}

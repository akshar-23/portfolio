import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { SET } from './ascii/palette.js';
import { createAsciiMaterial, updateSceneUniforms } from './ascii/materials.js';
import { AsciiRenderer } from './ascii/AsciiRenderer.js';
import { createStarfield } from './ascii/stars.js';
import { chaseCamera, createFlight } from './flight.js';
import { createGasGiant, createPlanet, createSun, createTorusRing } from './world/planets.js';
import { createAsteroidField } from './world/asteroids.js';
import { createComet } from './world/comet.js';
import { createStation } from './world/station.js';
import { createGalaxy } from './world/galaxy.js';
import { createNebula } from './world/nebula.js';
import { createExhaust } from './world/exhaust.js';
import { journey } from '../journey.js';
import { telemetry } from './telemetry.js';
import { layout, measureLayout } from './layout.js';

// One station per page section (sections in content/site.js, in order): the ship flies
// to a section's station when that section comes up.
const ROUTE = {
  points: [
    [0, 0, 0], // hero
    [-6, 4, -60],
    [-30, 14, -150], // about
    [-12, 6, -230],
    [25, -4, -300], // experience
    [35, 4, -370],
    [10, 14, -450], // research
    [-15, 20, -520],
    [-28, 18, -600], // projects
    [-10, 8, -680],
    [18, 0, -760], // skills
    [22, -4, -840],
    [6, 0, -920], // contact
  ],
  stations: [0, 2, 4, 6, 8, 10, 12],
  rolls: [0, 1, 0, 0, -1, 0],
};

const SHIP_PARTS = {
  Metal_body: { set: SET.SHIP, albedo: 0.95, rim: 0.3, spec: 0.5 },
  Metal_accent: { set: SET.SHIP, albedo: 0.6, spec: 0.3 },
  Dull_metalrubber: { set: SET.SHIP, albedo: 0.28 },
  Weapons: { set: SET.RUST, albedo: 0.9, rim: 0.2 },
  Cockpit: { set: SET.GLASS, albedo: 0.75, spec: 1, rim: 0.3 },
  Thruster: { set: SET.EMBER, albedo: 0.3, glow: 0.55, flicker: 1 },
};

// Everything is placed in a station's view: x right, y up, z ahead of the camera.
function buildWorld(scene, flight) {
  const { place } = flight;
  const spinning = [];
  const updates = [];

  // big things the ship should stay clear of on screen
  const obstacles = [];

  function add(object, position, spin) {
    object.position.copy(position);
    scene.add(object);
    if (spin) spinning.push([object, spin]);
    if (object.isMesh || object.isGroup) {
      const sphere = new THREE.Box3().setFromObject(object).getBoundingSphere(new THREE.Sphere());
      if (Number.isFinite(sphere.radius) && sphere.radius < 400) obstacles.push(sphere);
    }
    return object;
  }

  // the sun sits upper right in the hero; further along the route it moves above the frame
  // and its rays stream down over the scene
  const sunRadius = 110;
  const sunDir = new THREE.Vector3(0.38, 0.4, 0.83).normalize().multiplyScalar(1700);
  const sun = add(createSun(sunRadius), place(0, sunDir.x, sunDir.y, sunDir.z), [0, 0.02, 0]);

  // hero: content on the left, so the big planet and the sun are on the right
  add(createPlanet(15, { set: SET.RUST, noise: 0.8, noiseScale: 0.18, rim: 0.15, embers: 0.025, speckleScale: 2.2 }),
    place(0, 23, 8, 10), [0.08, 0, 0.08]);
  add(createPlanet(6, { set: SET.TEAL, noise: 0.5, noiseScale: 0.5 }), place(0, -60, 25, 160), [0, 0.1, 0]);

  // about: content on the right
  add(createPlanet(10, { set: SET.TEAL, noise: 0.5, noiseScale: 0.3, embers: 0.04, flowers: 0.08, speckleScale: 6 }),
    place(1, -17, 9, 16), [0.08, 0, 0.08]);

  // experience: content on the left
  const moonlet = add(createPlanet(6, { set: SET.MOON, noise: 0.7, noiseScale: 0.45, craters: 1 }),
    place(2, 21, 2, 42), [0.1, 0, 0.1]);
  moonlet.add(createTorusRing(9.5, 0.8, { set: SET.EMBER, ambient: 0.15, noise: 0.6, noiseScale: 1.2 }));

  // research: papers on both sides, the gas giant in the middle
  const giant = createGasGiant(30);
  const view3 = flight.views[3];
  const ringAxis = view3.up.clone().addScaledVector(view3.forward, -0.42).addScaledVector(view3.right, 0.12).normalize();
  giant.group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), ringAxis);
  // high enough that the route to projects passes well under it and its rings
  add(giant.group, place(3, -20, 48, 210));
  spinning.push([giant.body, [0, 0.05, 0]]);

  const iceMoon = createPlanet(4, { set: SET.ICE, noise: 0.6, noiseScale: 0.6, craters: 0.6 });
  giant.group.add(iceMoon);
  updates.push((time) => iceMoon.position.set(Math.cos(time * 0.15) * 62, 6, Math.sin(time * 0.15) * 62));

  // asteroids tumbling along the route from experience to projects
  const asteroids = createAsteroidField({ curve: flight.curve, from: flight.stationT[2] + 0.02, to: flight.stationT[4] });
  scene.add(asteroids.mesh);
  updates.push((time) => asteroids.update(time));

  // projects: text on the left, the feed on the right, the station between them
  const station = createStation(0.7);
  add(station.group, place(4, 2, 14, 60));
  station.group.lookAt(flight.views[4].position);
  station.group.rotateY(1.0);
  station.group.rotateX(0.35);
  updates.push((time) => station.update(time));

  const ember = add(createPlanet(5, { set: SET.EMBER, noise: 0.7, noiseScale: 0.6, rim: 0.2 }),
    place(4, 30, 36, 110), [0, 0.15, 0]);
  const emberRing = createTorusRing(7, 0.75, { set: SET.TEAL, ambient: 0.2, noise: 0.4, noiseScale: 1 });
  emberRing.rotation.x = Math.PI * 0.4;
  add(emberRing, ember.position, [0, 0, -0.15]);

  // skills: columns at both edges, an ice world between them and a passing comet
  add(createPlanet(8, { set: SET.ICE, albedo: 1.1, noise: 0.6, noiseScale: 0.35, craters: 0.8, rim: 0.2 }),
    place(5, 0, 10, 48), [0.05, 0.08, 0]);
  const comet = createComet({ from: place(5, -40, 60, 200), to: place(5, 190, 10, 160), period: 45 });
  scene.add(comet.group);
  updates.push((time) => comet.update(time, sun.position, flight.res));

  // contact: content on the left, the big moon on the right
  add(createPlanet(16, { set: SET.MOON, albedo: 1.3, ambient: 0.1, noise: 0.55, noiseScale: 0.16, craters: 1, rim: 0.15 }),
    place(6, 24, 8, 40), [0.06, 0, 0.06]);
  add(createPlanet(6, { set: SET.RUST, noise: 0.8, noiseScale: 0.35, embers: 0.03, speckleScale: 3 }),
    place(6, 42, -20, 70), [0.1, 0, 0.1]);
  add(createPlanet(9, { set: SET.LILAC, noise: 0.3, noiseScale: 0.3, stripes: 0.7, stripeFreq: 16 }),
    place(6, -50, 30, 160), [0, 0.08, 0]);

  // far background
  const galaxy = add(createGalaxy(900), place(5, 650, 180, 1100));
  galaxy.lookAt(flight.views[5].position);
  galaxy.rotateX(1.0);

  for (const [view, x, y, z, size] of [
    [0, -140, 70, 320, 200],
    [2, 90, -30, 170, 140],
    [4, -60, 25, 130, 150],
    [4, 80, 50, 220, 180],
  ]) {
    add(createNebula(size), place(view, x, y, z));
  }

  return {
    sun,
    sunRadius,
    obstacles,
    update(time, dt) {
      for (const [object, [x, y, z]] of spinning) {
        object.rotation.x += x * dt;
        object.rotation.y += y * dt;
        object.rotation.z += z * dt;
      }
      for (const update of updates) update(time, dt);
    },
  };
}

export function startScene(canvas) {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 4000);
  scene.add(camera);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    powerPreference: 'high-performance',
  });

  // the scene is drawn into a small offscreen buffer, then turned into glyphs
  const ascii = new AsciiRenderer(renderer);

  // resize viewport
  function resize() {
    ascii.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = ascii.aspect;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  const flight = createFlight(ROUTE);
  flight.res = ascii.gridSize;
  const world = buildWorld(scene, flight);

  const stars = createStarfield();
  scene.add(stars.group);

  // ship
  const shipRig = new THREE.Group();
  scene.add(shipRig);
  const nozzles = [];
  let shipSize = 6;
  // the middle of the ship model, in the rig's space (it isn't at the rig's origin)
  const shipCenter = new THREE.Vector3();
  const shipMiddle = new THREE.Vector3();
  const exhaust = createExhaust();
  scene.add(exhaust.points);

  new GLTFLoader().load(
    `${import.meta.env.BASE_URL}models/scene.gltf`,
    function (gltf) {
      const ship = gltf.scene;
      ship.rotation.y = -0.5 * Math.PI;
      ship.children[0].position.x = 0;
      ship.children[0].position.z = 2.35;
      ship.traverse((child) => {
        if (!child.isMesh) return;
        const look = SHIP_PARTS[child.material.name] ?? SHIP_PARTS.Metal_accent;
        child.material = createAsciiMaterial({ ...look, side: THREE.DoubleSide });
      });
      shipRig.add(ship);
      // nozzles at the back of the ship, in the rig's space (+z is backwards)
      shipRig.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(ship).applyMatrix4(shipRig.matrixWorld.clone().invert());
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      nozzles.push(
        new THREE.Vector3(center.x - size.x * 0.12, center.y, box.max.z - size.z * 0.05),
        new THREE.Vector3(center.x + size.x * 0.12, center.y, box.max.z - size.z * 0.05)
      );
      shipSize = Math.max(size.x, size.z);
      shipCenter.copy(center);
    },
    undefined,
    function (error) {
      console.error('Failed to load the ship', error);
    }
  );

  // flights between waypoints: ease out of one station and into the next, taking a
  // little longer the further it is
  const journeyState = { progress: journey.progress() };
  const tween = { from: journeyState.progress, to: journeyState.progress, start: 0, duration: 1 };
  const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);
  let clock = 0;
  // each flight swerves out to one side and back (alternating), so it isn't a straight line
  let weaveSide = 1;
  journey.subscribe(() => {
    tween.from = journeyState.progress;
    tween.to = journey.progress();
    tween.start = clock;
    const sections = Math.abs(tween.to - tween.from) * (flight.stations - 1);
    tween.duration = 1.15 + Math.sqrt(sections) * 0.45;
    weaveSide = -weaveSide;
  });

  // where the content is: measured after React has drawn the new section, and again once
  // it has settled in
  // the planets as seen from a station's camera, as boxes in css px
  const viewCamera = new THREE.PerspectiveCamera(75, 1, 0.1, 4000);
  const probe = new THREE.Vector3();
  function obstaclesAt(station) {
    const view = flight.views[station];
    viewCamera.aspect = ascii.aspect;
    viewCamera.updateProjectionMatrix();
    viewCamera.position.copy(view.position);
    viewCamera.up.copy(view.up);
    viewCamera.lookAt(probe.copy(view.position).add(view.forward));
    viewCamera.updateMatrixWorld();
    const w = window.innerWidth;
    const h = window.innerHeight;
    const focal = h / 2 / Math.tan(THREE.MathUtils.degToRad(viewCamera.fov) / 2);
    const boxes = [];
    for (const sphere of world.obstacles) {
      probe.copy(sphere.center).applyMatrix4(viewCamera.matrixWorldInverse);
      if (probe.z > -1) continue;
      const r = (sphere.radius / -probe.z) * focal * 0.8;
      // far-off things are small enough to fly in front of
      if (r < 24) continue;
      probe.copy(sphere.center).project(viewCamera);
      const x = (probe.x * 0.5 + 0.5) * w;
      const y = (0.5 - probe.y * 0.5) * h;
      if (x + r < 0 || x - r > w || y + r < 0 || y - r > h) continue;
      boxes.push({ left: x - r, top: y - r, right: x + r, bottom: y + r });
    }
    return boxes;
  }

  const place = () => measureLayout(obstaclesAt(journey.get().index));
  function relayout() {
    place();
    ascii.setMask(layout.shapes);
  }
  // the ship re-aims right away; the holes swap once the old ones have faded and the new
  // content starts to arrive
  journey.subscribe(() => {
    ascii.clearMask();
    requestAnimationFrame(() => requestAnimationFrame(place));
    setTimeout(relayout, 450);
    setTimeout(relayout, 1100);
  });
  window.addEventListener('resize', () => requestAnimationFrame(relayout));
  document.fonts?.ready.then(relayout);
  setTimeout(relayout, 300);

  // lighting a letter of the name sends a ripple through the glyphs
  window.addEventListener('ascii:pulse', (event) => ascii.pulse(event.detail.x, event.detail.y));

  // parallax effect
  const cursor = { x: 0, y: 0 };

  window.addEventListener('pointermove', (event) => {
    cursor.x = event.clientX / window.innerWidth - 0.5;
    cursor.y = event.clientY / window.innerHeight - 0.5;
    ascii.setPointer(event.clientX, event.clientY);
  });
  document.documentElement.addEventListener('mouseleave', () => ascii.clearPointer());




  const timer = new THREE.Timer();
  timer.connect(document);

  const frame = {};
  const offset = new THREE.Vector2();
  const target = new THREE.Vector2();
  const onScreen = new THREE.Vector3();
  let lateral = 0;
  const basis = new THREE.Matrix4();
  const backward = new THREE.Vector3();
  const rollAxis = new THREE.Vector3(0, 0, 1);
  const rollQuat = new THREE.Quaternion();
  const yawQuat = new THREE.Quaternion();
  const idleTurn = new THREE.Euler();
  const shipScreen = new THREE.Vector3();
  const shipEdge = new THREE.Vector3();
  const chase = new THREE.Vector3();
  const aim = new THREE.Vector3();
  const look = new THREE.Vector3();
  const lookAt = new THREE.Vector3();
  const lastShip = new THREE.Vector3();
  const drift = new THREE.Vector3();
  let bank = 0;
  let warp = 0;
  let started = false;

  function animate(timestamp) {
    requestAnimationFrame(animate);

    timer.update(timestamp);
    const dt = Math.min(timer.getDelta(), 0.1);
    const time = timer.getElapsed();
    const ease = 1 - Math.exp(-dt * 3);

    world.update(time, dt);
    clock = time;
    const along = Math.min((time - tween.start) / tween.duration, 1);
    journeyState.progress = tween.from + (tween.to - tween.from) * easeInOut(along);

    // the ship follows the route, steers to the empty part of the screen, swerves
    // during flights and banks into turns
    const { t, roll } = flight.sample(journeyState.progress);
    flight.frameAt(t, frame);

    // where it should be on screen (ndc), nudged a little by the cursor
    target.set(
      (layout.free.x / window.innerWidth) * 2 - 1 + cursor.x * 0.12,
      1 - (layout.free.y / window.innerHeight) * 2 - cursor.y * 0.1
    );
    // where the ship's middle is on screen now: steer the offset until the two meet
    onScreen.copy(shipMiddle).project(camera);
    // (only once the camera is in place: before that the projection is meaningless)
    if (started && Number.isFinite(onScreen.x) && Number.isFinite(onScreen.y) && onScreen.z < 1) {
      const reach = 1 - Math.exp(-dt * 2.2);
      offset.x = THREE.MathUtils.clamp(offset.x + (target.x - onScreen.x) * 16 * reach, -26, 26);
      offset.y = THREE.MathUtils.clamp(offset.y + (target.y - onScreen.y) * 10 * reach, -6, 7);
    }

    const weave = Math.sin(Math.min(along, 1) * Math.PI) * 9 * weaveSide * Math.min(tween.duration - 1, 1);
    const swayFrom = lateral;
    lateral = offset.x + weave;
    const sway = (lateral - swayFrom) / Math.max(dt, 1e-3);
    // banking needs speed: in the turns while flying, level when parked at a station
    const turn = -flight.turnAt(t) * 0.35 * warp - sway * 0.03;
    bank += (THREE.MathUtils.clamp(turn, -0.7, 0.7) - bank) * ease;

    // when parked it doesn't sit still: it hovers, sways and noses around a little
    const idle = 1 - warp;
    const hover = Math.sin(time * 1.7) * 0.45 * idle;
    const sideDrift = Math.sin(time * 0.55) * 0.9 * idle;
    shipRig.position.copy(frame.position)
      .addScaledVector(frame.right, lateral + sideDrift)
      .addScaledVector(frame.up, offset.y + hover);
    basis.makeBasis(frame.right, frame.up, backward.copy(frame.forward).negate());
    shipRig.quaternion.setFromRotationMatrix(basis)
      .multiply(rollQuat.setFromAxisAngle(rollAxis, bank + roll + Math.sin(time * 0.9) * 0.1 * idle))
      .multiply(yawQuat.setFromEuler(idleTurn.set(Math.sin(time * 1.3) * 0.05 * idle, Math.sin(time * 0.7) * 0.08 * idle, 0)));
    shipRig.updateMatrixWorld();
    shipMiddle.copy(shipCenter).applyMatrix4(shipRig.matrixWorld);
    exhaust.update(dt, shipRig, nozzles, warp);

    // the chase camera lags a little, so it swings out in the turns, but it always
    // looks just ahead of the ship so the ship stays in frame
    chaseCamera(frame, chase, aim);
    chase.addScaledVector(frame.up, -cursor.y).addScaledVector(frame.right, lateral * 0.2 + cursor.x);
    if (!started) {
      camera.position.copy(chase);
      lookAt.copy(aim);
      lastShip.copy(shipRig.position);
      started = true;
    }
    const follow = 1 - Math.exp(-dt * 6);
    camera.position.lerp(chase, follow);
    lookAt.lerp(aim, follow);
    look.subVectors(lookAt, camera.position).normalize();
    camera.up.copy(frame.up).applyAxisAngle(look, bank * 0.25);
    camera.lookAt(lookAt);

    // flying fast speeds up the stars and the rain and stretches stars into streaks
    const speed = shipRig.position.distanceTo(lastShip) / Math.max(dt, 1e-3);
    lastShip.copy(shipRig.position);
    warp += (Math.min(speed / 60, 1) - warp) * (1 - Math.exp(-dt * 5));
    ascii.warp = warp;

    telemetry.speed = speed;
    telemetry.warp = warp;
    telemetry.heading = THREE.MathUtils.radToDeg(Math.atan2(look.x, -look.z));
    telemetry.x = shipRig.position.x;
    telemetry.y = shipRig.position.y;
    telemetry.z = shipRig.position.z;
    drift.addScaledVector(look, -dt * (25 + warp * 160));
    stars.update(camera, look, drift, warp * 70, ascii.gridSize);

    // a clear pocket around the ship keeps it from blending into what's behind it
    shipScreen.copy(shipMiddle).project(camera);
    shipEdge.copy(shipMiddle).addScaledVector(frame.right, shipSize * 0.6).project(camera);
    ascii.setShip(shipScreen, shipEdge, shipScreen.z < 1 && nozzles.length > 0);

    updateSceneUniforms(camera, time, world.sun.position);
    ascii.setSun(world.sun.position, world.sunRadius, camera);
    ascii.update(dt);
    ascii.render(scene, camera);
  }

  // start once the glyph font is in (or after a short wait, whichever comes first)
  Promise.race([ascii.loadFont(), new Promise((resolve) => setTimeout(resolve, 1500))]).then(() => {
    timer.reset();
    requestAnimationFrame(animate);
  });
}

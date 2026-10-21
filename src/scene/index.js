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

// One station per page section ([data-station] in the page, top to bottom): the ship
// reaches a station as its section scrolls into view.
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

  function add(object, position, spin) {
    object.position.copy(position);
    scene.add(object);
    if (spin) spinning.push([object, spin]);
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

  // research: content on the right, the gas giant on the left
  const giant = createGasGiant(36);
  const view3 = flight.views[3];
  const ringAxis = view3.up.clone().addScaledVector(view3.forward, -0.5).addScaledVector(view3.right, 0.25).normalize();
  giant.group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), ringAxis);
  add(giant.group, place(3, -58, 4, 150));
  spinning.push([giant.body, [0, 0.05, 0]]);

  const iceMoon = createPlanet(4, { set: SET.ICE, noise: 0.6, noiseScale: 0.6, craters: 0.6 });
  giant.group.add(iceMoon);
  updates.push((time) => iceMoon.position.set(Math.cos(time * 0.15) * 62, 6, Math.sin(time * 0.15) * 62));

  // asteroids tumbling along the route from experience to projects
  const asteroids = createAsteroidField({ curve: flight.curve, from: flight.stationT[2] + 0.02, to: flight.stationT[4] });
  scene.add(asteroids.mesh);
  updates.push((time) => asteroids.update(time));

  // projects: the grid covers the middle, so things sit around the edges
  const station = createStation(0.8);
  add(station.group, place(4, -32, 15, 60));
  station.group.lookAt(flight.views[4].position);
  station.group.rotateY(1.0);
  station.group.rotateX(0.35);
  updates.push((time) => station.update(time));

  const ember = add(createPlanet(5, { set: SET.EMBER, noise: 0.7, noiseScale: 0.6, rim: 0.2 }),
    place(4, 36, 14, 80), [0, 0.15, 0]);
  const emberRing = createTorusRing(7, 0.75, { set: SET.TEAL, ambient: 0.2, noise: 0.4, noiseScale: 1 });
  emberRing.rotation.x = Math.PI * 0.4;
  add(emberRing, ember.position, [0, 0, -0.15]);

  // skills: content on the left, an ice world and a passing comet on the right
  add(createPlanet(8, { set: SET.ICE, albedo: 1.1, noise: 0.6, noiseScale: 0.35, craters: 0.8, rim: 0.2 }),
    place(5, 24, 3, 45), [0.05, 0.08, 0]);
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
    },
    undefined,
    function (error) {
      console.error('Failed to load the ship', error);
    }
  );

  // scroll position -> progress along the route: station i is reached when section i
  // is centered on screen (or, for tall sections, when its top reaches the top)
  const stops = [];
  function measureStations() {
    const sections = document.querySelectorAll('[data-station]');
    const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    stops.length = 0;
    sections.forEach((section, i) => {
      const top = section.getBoundingClientRect().top + window.scrollY;
      const settle = top + Math.min(section.offsetHeight, window.innerHeight) / 2 - window.innerHeight / 2;
      const stop = i === 0 ? 0 : i === sections.length - 1 ? max : THREE.MathUtils.clamp(settle, 0, max);
      stops.push(Math.max(stop, (stops[i - 1] ?? -1) + 1));
    });
  }
  measureStations();
  new ResizeObserver(measureStations).observe(document.body);
  document.fonts?.ready.then(measureStations);

  function scrollProgress() {
    if (stops.length < 2) return 0;
    const y = window.scrollY;
    let k = 0;
    while (k < stops.length - 2 && y >= stops[k + 1]) k++;
    const f = THREE.MathUtils.clamp((y - stops[k]) / (stops[k + 1] - stops[k]), 0, 1);
    return (k + f) / (stops.length - 1);
  }
  const journey = { progress: scrollProgress() };

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
  const basis = new THREE.Matrix4();
  const backward = new THREE.Vector3();
  const rollAxis = new THREE.Vector3(0, 0, 1);
  const rollQuat = new THREE.Quaternion();
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
    journey.progress += (scrollProgress() - journey.progress) * (1 - Math.exp(-dt * 2.5));

    // the ship follows the route, drifts toward the cursor and banks into turns
    const { t, roll } = flight.sample(journey.progress);
    flight.frameAt(t, frame);

    const swayFrom = offset.x;
    offset.x += (cursor.x * 14 - offset.x) * ease;
    offset.y += (-cursor.y * 6 - offset.y) * ease;
    const sway = (offset.x - swayFrom) / Math.max(dt, 1e-3);
    // banking needs speed: in the turns while flying, level when parked at a station
    const turn = -flight.turnAt(t) * 0.35 * warp - sway * 0.03;
    bank += (THREE.MathUtils.clamp(turn, -0.7, 0.7) - bank) * ease;

    shipRig.position.copy(frame.position)
      .addScaledVector(frame.right, offset.x)
      .addScaledVector(frame.up, offset.y);
    basis.makeBasis(frame.right, frame.up, backward.copy(frame.forward).negate());
    shipRig.quaternion.setFromRotationMatrix(basis).multiply(rollQuat.setFromAxisAngle(rollAxis, bank + roll));

    // the chase camera lags a little, so it swings out in the turns, but it always
    // looks just ahead of the ship so the ship stays in frame
    chaseCamera(frame, chase, aim);
    chase.addScaledVector(frame.up, -cursor.y).addScaledVector(frame.right, offset.x * 0.3 + cursor.x);
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
    drift.addScaledVector(look, -dt * (25 + warp * 160));
    stars.update(camera, look, drift, warp * 70, ascii.gridSize);

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

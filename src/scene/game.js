import * as THREE from 'three';
import { SET } from './ascii/palette.js';
import { createAsciiMaterial } from './ascii/materials.js';
import { createRockGeometry } from './world/asteroids.js';
import { SHIELDS, game, live } from '../game/state.js';

// The mini-game: the ship loops the portfolio route on its own while the player steers
// it around the screen. Red rocks and cyan rings appear ahead along the route; the
// planets along the way are in play too. (The grey asteroid field is scenery: it's too
// easy to mistake for the background.)

const RANGE = { x: 13, y: 6.5 }; // how far the ship can stray from the route
const SPAWN = { x: 17, y: 9 }; // where new rocks can appear around the route
const AHEAD = 320; // how far ahead things appear (world units)
const SHIP_RADIUS = 1.1;
const POOL = 90;
const RING_POOL = 6;
const RING_RADIUS = 3;
const RING_EVERY = 4; // rings for one shield back
const START = 0.012;
const END = 0.988;

export function createGameMode({ scene, flight, camera, ascii }) {
  const curve = flight.curve;
  const length = curve.getLength();
  const toT = (units) => units / length;

  // rocks, drawn as one instanced mesh
  const rockMesh = new THREE.InstancedMesh(
    createRockGeometry(),
    createAsciiMaterial({ set: SET.RUST, albedo: 1.3, ambient: 0.2, noise: 0.5, noiseScale: 1.4, rim: 0.5 }),
    POOL
  );
  rockMesh.frustumCulled = false;
  rockMesh.visible = false;
  scene.add(rockMesh);
  const rocks = Array.from({ length: POOL }, () => ({
    alive: false,
    t: 0,
    position: new THREE.Vector3(),
    velocity: new THREE.Vector3(),
    axis: new THREE.Vector3(),
    spin: 0,
    phase: 0,
    scale: 1,
  }));

  // rings to fly through
  const ringGeometry = new THREE.TorusGeometry(RING_RADIUS, 0.34, 8, 48);
  const ringMaterial = createAsciiMaterial({ set: SET.GLASS, ambient: 0.7, glow: 0.8, flicker: 0.4 });
  const rings = Array.from({ length: RING_POOL }, () => {
    const mesh = new THREE.Mesh(ringGeometry, ringMaterial);
    mesh.visible = false;
    scene.add(mesh);
    return { mesh, alive: false, t: 0 };
  });

  // planets in play: every sphere bigger than a moonlet
  const planets = [];
  scene.traverse((object) => {
    if (object.isMesh && object.geometry.type === 'SphereGeometry' && object.geometry.parameters.radius > 2.5) planets.push(object);
  });

  const frame = {};
  const spot = {};
  const matrix = new THREE.Matrix4();
  const rotation = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  const temp = new THREE.Vector3();
  const screen = new THREE.Vector3();

  const run = {
    t: 0,
    elapsed: 0,
    clock: 0,
    nextRock: 0,
    nextRing: 0,
    invulnerable: 0,
    shake: 0,
    dead: 0,
    ringsSinceShield: 0,
  };
  const ship = { x: 0, y: 0, vx: 0, bank: 0 };

  // ---------- steering ----------
  // where the player wants the ship on screen (ndc); the ship chases it
  const aim = new THREE.Vector2(0, -0.35);
  const keys = new Set();
  let touch = null;

  const onPointerMove = (event) => {
    if (!game.active) return;
    if (event.pointerType === 'mouse') {
      aim.set((event.clientX / window.innerWidth) * 2 - 1, 1 - (event.clientY / window.innerHeight) * 2);
    } else if (touch) {
      // fingers drag the aim, so they don't cover the ship
      aim.x = THREE.MathUtils.clamp(aim.x + ((event.clientX - touch.x) / window.innerWidth) * 3, -1, 1);
      aim.y = THREE.MathUtils.clamp(aim.y - ((event.clientY - touch.y) / window.innerHeight) * 3, -1, 1);
      touch = { x: event.clientX, y: event.clientY };
    }
  };
  const onPointerDown = (event) => {
    if (game.active && event.pointerType !== 'mouse') touch = { x: event.clientX, y: event.clientY };
  };
  const onPointerUp = () => {
    touch = null;
  };
  const STEER_KEYS = { ArrowLeft: [-1, 0], a: [-1, 0], ArrowRight: [1, 0], d: [1, 0], ArrowUp: [0, 1], w: [0, 1], ArrowDown: [0, -1], s: [0, -1] };
  const onKeyDown = (event) => {
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if (!game.active || !STEER_KEYS[key]) return;
    event.preventDefault();
    keys.add(key);
  };
  const onKeyUp = (event) => {
    keys.delete(event.key.length === 1 ? event.key.toLowerCase() : event.key);
  };
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerUp);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', () => keys.clear());

  // ---------- helpers ----------
  function burst(position, strength, color) {
    screen.copy(position).project(camera);
    if (screen.z < 1) {
      ascii.pulse((screen.x * 0.5 + 0.5) * window.innerWidth, (0.5 - screen.y * 0.5) * window.innerHeight);
    }
    ascii.shock(strength, color);
  }

  function clearAll() {
    rocks.forEach((rock) => { rock.alive = false; });
    rings.forEach((ring) => { ring.alive = false; ring.mesh.visible = false; });
  }

  // a point beside the route at t: right, up in the route's frame
  function around(t, x, y, out) {
    flight.frameAt(t, spot);
    return out.copy(spot.position).addScaledVector(spot.right, x).addScaledVector(spot.up, y);
  }

  function spawnRock(t) {
    const rock = rocks.find((r) => !r.alive);
    if (!rock) return;
    rock.alive = true;
    rock.t = t;
    around(t, THREE.MathUtils.randFloatSpread(SPAWN.x * 2), THREE.MathUtils.randFloatSpread(SPAWN.y * 2), rock.position);
    // some drift across the route, so the gaps move
    rock.velocity.copy(spot.right).multiplyScalar(THREE.MathUtils.randFloatSpread(4))
      .addScaledVector(spot.up, THREE.MathUtils.randFloatSpread(2));
    rock.axis.randomDirection();
    rock.spin = THREE.MathUtils.randFloat(0.3, 1.6);
    rock.phase = Math.random() * Math.PI * 2;
    rock.scale = THREE.MathUtils.lerp(1, 3.8, Math.random() ** 1.6);
  }

  function spawnRing(t) {
    const ring = rings.find((r) => !r.alive);
    if (!ring) return;
    ring.alive = true;
    ring.t = t;
    around(t, THREE.MathUtils.randFloatSpread(RANGE.x * 1.4), THREE.MathUtils.randFloatSpread(RANGE.y * 1.3), ring.mesh.position);
    ring.mesh.lookAt(temp.copy(ring.mesh.position).add(spot.forward));
    ring.mesh.visible = true;
  }

  function hit(position) {
    if (run.invulnerable > 0 || game.get().status !== 'playing') return;
    const shields = game.get().shields - 1;
    run.shake = 1;
    if (shields <= 0) {
      game.update({ shields: 0 });
      run.dead = 1;
      burst(position, 0.9, '#ffa14a');
      game.finish();
    } else {
      run.invulnerable = 2;
      burst(position, 0.45, '#f06a45');
      game.update({ shields });
    }
  }

  // ---------- the run ----------
  function start(fromT) {
    clearAll();
    run.t = THREE.MathUtils.clamp(fromT, START, END - 0.05);
    run.elapsed = 0;
    run.clock = 0;
    run.nextRock = run.t + toT(200);
    run.nextRing = run.t + toT(220);
    run.invulnerable = 0;
    run.shake = 0;
    run.dead = 0;
    run.ringsSinceShield = 0;
    ship.x = 0;
    ship.y = 0;
    ship.vx = 0;
    ship.bank = 0;
    aim.set(0, -0.35);
    rockMesh.visible = true;
  }

  function stop() {
    clearAll();
    rockMesh.visible = false;
  }

  // onScreen: where the ship's middle was on screen last frame (ndc)
  function step(dt, onScreen) {
    const state = game.get();
    let jumped = false;

    // the countdown runs on its own clock
    if (state.status === 'countdown') {
      run.clock += dt;
      const left = Math.ceil(3 - run.clock);
      if (left <= 0) game.play();
      else if (left !== state.countdown) game.update({ countdown: left });
    } else if (state.status === 'playing') {
      run.elapsed += dt;
    }

    const playing = state.status === 'playing';
    const speed = state.status === 'over'
      ? Math.max(14, live.speed * Math.exp(-dt * 1.5))
      : state.status === 'countdown' ? 34 : 44 + Math.min(run.elapsed, 180) * 0.33;
    live.speed = speed;
    run.t += toT(speed * dt);
    if (playing) {
      live.distance += speed * dt;
      live.score += speed * dt * 0.5;
    }

    // the end of the route jumps back to the start
    if (run.t >= END) {
      run.t = START;
      run.nextRock = run.t + toT(90);
      run.nextRing = run.t + toT(160);
      clearAll();
      ascii.shock(0.75, '#dce8ff');
      if (playing) game.update({ loops: state.loops + 1 });
      jumped = true;
    }

    // keys move the aim
    for (const key of keys) {
      const [kx, ky] = STEER_KEYS[key];
      aim.x = THREE.MathUtils.clamp(aim.x + kx * dt * 1.8, -1, 1);
      aim.y = THREE.MathUtils.clamp(aim.y + ky * dt * 1.8, -1, 1);
    }

    // the ship chases the aim on screen
    const before = ship.x;
    if (Number.isFinite(onScreen.x) && onScreen.z < 1 && !jumped) {
      const reach = 1 - Math.exp(-dt * 6);
      ship.x = THREE.MathUtils.clamp(ship.x + (aim.x - onScreen.x) * 15 * reach, -RANGE.x, RANGE.x);
      ship.y = THREE.MathUtils.clamp(ship.y + (aim.y - onScreen.y) * 9 * reach, -RANGE.y, RANGE.y);
    }
    ship.vx = (ship.x - before) / Math.max(dt, 1e-3);
    ship.bank += (THREE.MathUtils.clamp(-ship.vx * 0.05, -0.9, 0.9) - ship.bank) * (1 - Math.exp(-dt * 6));

    // new things ahead
    const ahead = run.t + toT(AHEAD);
    if (playing || state.status === 'countdown') {
      const gap = toT(Math.max(11, 34 - run.elapsed * 0.13));
      while (run.nextRock < Math.min(ahead, END - 0.01)) {
        if (run.nextRock > run.t + toT(60)) {
          const cluster = 1 + (Math.random() < 0.35 ? 1 : 0) + (Math.random() < 0.12 ? 1 : 0);
          for (let i = 0; i < cluster; i++) spawnRock(run.nextRock + toT(Math.random() * 6));
        }
        run.nextRock += gap * THREE.MathUtils.randFloat(0.6, 1.4);
      }
      while (run.nextRing < Math.min(ahead, END - 0.01)) {
        spawnRing(run.nextRing);
        run.nextRing += toT(THREE.MathUtils.randFloat(150, 230));
      }
    }

    // move and draw the rocks; drop the ones behind us
    const behind = run.t - toT(30);
    rocks.forEach((rock, i) => {
      if (rock.alive && rock.t < behind) rock.alive = false;
      if (rock.alive) {
        rock.position.addScaledVector(rock.velocity, dt);
        rotation.setFromAxisAngle(rock.axis, rock.phase + run.elapsed * rock.spin);
        scale.setScalar(rock.scale);
      } else {
        scale.setScalar(0);
      }
      rockMesh.setMatrixAt(i, matrix.compose(rock.position, rotation, scale));
    });
    rockMesh.instanceMatrix.needsUpdate = true;
    rings.forEach((ring) => {
      if (ring.alive && ring.t < behind) {
        ring.alive = false;
        ring.mesh.visible = false;
      }
      if (ring.alive) ring.mesh.rotateZ(dt * 1.2);
    });

    run.invulnerable = Math.max(0, run.invulnerable - dt);
    run.shake = Math.max(0, run.shake - dt * 2.5);
    run.dead = state.status === 'over' ? run.dead + dt : 0;

    flight.frameAt(run.t, frame);
    return {
      t: run.t,
      x: ship.x,
      y: ship.y,
      bank: ship.bank,
      jumped,
      // blink while shields recharge, gone once it's over
      showShip: state.status !== 'over' && (run.invulnerable <= 0 || Math.floor(run.invulnerable * 12) % 2 === 0),
      shake: run.shake,
    };
  }

  // shipPosition: the ship's middle in world space this frame
  function collide(shipPosition) {
    if (game.get().status !== 'playing') return;

    for (const rock of rocks) {
      if (!rock.alive) continue;
      if (rock.position.distanceTo(shipPosition) < rock.scale * 0.75 + SHIP_RADIUS) {
        rock.alive = false;
        hit(rock.position);
        if (!game.active || game.get().status !== 'playing') return;
      }
    }
    for (const planet of planets) {
      planet.getWorldPosition(temp);
      planet.getWorldScale(scale);
      const radius = planet.geometry.parameters.radius * Math.max(scale.x, scale.y, scale.z);
      if (temp.distanceTo(shipPosition) < radius * 0.95 + SHIP_RADIUS) {
        hit(shipPosition);
        if (game.get().status !== 'playing') return;
      }
    }

    // a ring counts when the ship crosses its plane close enough to its middle
    for (const ring of rings) {
      if (!ring.alive || run.t < ring.t) continue;
      ring.alive = false;
      ring.mesh.visible = false;
      if (ring.mesh.position.distanceTo(shipPosition) < RING_RADIUS + 0.6) {
        live.score += 250;
        run.ringsSinceShield += 1;
        const patch = { rings: game.get().rings + 1 };
        if (run.ringsSinceShield >= RING_EVERY) {
          run.ringsSinceShield = 0;
          patch.shields = Math.min(SHIELDS, game.get().shields + 1);
        }
        game.update(patch);
        burst(ring.mesh.position, 0.12, '#8ff4ff');
      }
    }
  }

  return { start, stop, step, collide };
}

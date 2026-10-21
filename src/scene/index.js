import './style.css';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { AsciiEffect } from 'three/examples/jsm/effects/AsciiEffect.js';

// //load page at start
if (history.scrollRestoration) {
  history.scrollRestoration = 'manual';
} else {
  window.onbeforeunload = function () {
    window.scrollTo(0, 0);
  }
}

let ship;
let star;
let shipPointLight;
let shipPointLight2;
let shipPointLight3;
let shipPointLight4;

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg'),
});

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// resize viewport
window.addEventListener('resize', function () {
  let width = window.innerWidth;
  let height = window.innerHeight;
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
});

// ship loader
let loader = new GLTFLoader();
loader.load(
  'scene.gltf',
  function (gltf) {
    ship = gltf.scene;
    ship.rotation.y = -0.5 * Math.PI;
    ship.children[0].position.x = 0;
    ship.children[0].position.z = 2.35;
    ship.position.set(0, -8, 250);
    scene.add(ship);

    scene.add(camera);

    camera.position.z = ship.position.z + 10;

    shipPointLight = new THREE.PointLight(0xffffff, 1, 25);
    shipPointLight.castShadow = true;
    shipPointLight.position.y = ship.position.y + 6;
    shipPointLight.position.z = ship.position.z + 4;
    scene.add(shipPointLight);

    shipPointLight2 = new THREE.PointLight(0xffffff, 1.25, 5);
    shipPointLight2.castShadow = false;
    shipPointLight2.position.x = ship.position.x + 2;
    shipPointLight2.position.y = ship.position.y + 4;
    shipPointLight2.position.z = ship.position.z + 2;
    scene.add(shipPointLight2);

    shipPointLight3 = new THREE.PointLight(0xffffff, 1.25, 5);
    shipPointLight3.castShadow = false;
    shipPointLight3.position.x = ship.position.x - 2;
    shipPointLight3.position.y = ship.position.y + 4;
    shipPointLight3.position.z = ship.position.z + 2;
    scene.add(shipPointLight3);

    shipPointLight4 = new THREE.PointLight(0xffffff, 1.25, 5);
    shipPointLight4.castShadow = false;
    shipPointLight4.position.y = ship.position.y + 5;
    shipPointLight4.position.z = ship.position.z - 2;
    scene.add(shipPointLight4);



    //shadow properties
    shipPointLight.shadow.mapSize.width = 1024; // default
    shipPointLight.shadow.mapSize.height = 1024; // default
    shipPointLight.shadow.camera.near = 0.5; // default
    shipPointLight.shadow.camera.far = 50; // default


    // Scroll Animation
    // gsap scrolltrigger
    gsap.registerPlugin(ScrollTrigger);

    ScrollTrigger.defaults({
      scrub: 3,
      ease: 'none',
    })




    gsap.from(ship.position, {
      z: 250,
      // duration: 3,
    })

    gsap.to(ship.position, {
      z: 50,
      ease: "none",
      scrollTrigger: {
        // trigger: sections,
        scrub: true,
        snap: [0, 0.25, 0.5, 0.75, 1],
      },
    })

  },

  function (xhr) {
    console.log((xhr.loaded / xhr.total * 100) + '% loaded');
  },

  function (error) {
    console.log("An error happened");
  }
);










// planet1
const planet1 = new THREE.Mesh(new THREE.SphereGeometry(15, 32, 16), new THREE.MeshStandardMaterial({ color: 0x1B77F5, emissive: 0x1E2D1B, flatShading: true }));
planet1.position.z = 250;
planet1.position.x = 23;
planet1.position.y = 8;
planet1.castShadow = true;
planet1.receiveShadow = true;
scene.add(planet1);

// planet2
const planet2 = new THREE.Mesh(new THREE.SphereGeometry(8, 16, 8), new THREE.MeshStandardMaterial({ color: 0xFF8C2D, emissive: 0x080A17, flatShading: true }));
planet2.position.z = 200;
planet2.position.x = -15;
planet2.position.y = 10;
planet2.castShadow = true;
planet2.receiveShadow = true;
scene.add(planet2);

// planet3
const planet3 = new THREE.Mesh(new THREE.SphereGeometry(5, 16, 8), new THREE.MeshStandardMaterial({ color: 0x9204FF, emissive: 0x11050C, flatShading: true }));
planet3.position.z = 145;
planet3.position.x = 15;
planet3.position.y = -8;
planet3.castShadow = true;
planet3.receiveShadow = true;
const planet3ring = new THREE.Mesh(new THREE.TorusGeometry(8, 0.75, 5, 30), new THREE.MeshStandardMaterial({ color: 0xC2006E, emissive: 0x0D0016, flatShading: true }));
planet3ring.position.z = planet3.position.z;
planet3ring.position.x = planet3.position.x;
planet3ring.position.y = planet3.position.y;
planet3ring.castShadow = true;
planet3ring.receiveShadow = true;
scene.add(planet3, planet3ring);

// planet4
const planet4 = new THREE.Mesh(new THREE.SphereGeometry(5, 16, 8), new THREE.MeshStandardMaterial({ color: 0x02BDCE, emissive: 0x060E04, flatShading: true }));
planet4.position.z = 100;
planet4.position.x = -15;
planet4.position.y = 0;
planet4.castShadow = true;
planet4.receiveShadow = true;
const planet4ring = new THREE.Mesh(new THREE.TorusGeometry(7, 0.75, 5, 30), new THREE.MeshStandardMaterial({ color: 0x2EDB00, emissive: 0x001112, flatShading: true }));
planet4ring.position.z = planet4.position.z;
planet4ring.position.x = planet4.position.x;
planet4ring.position.y = planet4.position.y;
planet4ring.rotation.x += Math.PI * 0.5;
planet4ring.castShadow = true;
planet4ring.receiveShadow = true;
scene.add(planet4, planet4ring);

// planet5
const planet5 = new THREE.Mesh(new THREE.SphereGeometry(15, 32, 16), new THREE.MeshStandardMaterial({ color: 0xFF0700, emissive: 0x0E0F00, flatShading: true }));
planet5.position.z = 50;
planet5.position.x = 20;
planet5.position.y = 10;
planet5.castShadow = true;
planet5.receiveShadow = true;
scene.add(planet5);

// planet6
const planet6 = new THREE.Mesh(new THREE.SphereGeometry(8, 16, 8), new THREE.MeshStandardMaterial({ color: 0xEDFD00, emissive: 0x180200, flatShading: true }));
planet6.position.z = 50;
planet6.position.x = -20;
planet6.position.y = -10;
planet6.castShadow = true;
planet6.receiveShadow = true;
scene.add(planet6);



camera.position.x = 0;
camera.position.y = 0;







const stars = [];

function addStar() {
  const geometry = new THREE.SphereGeometry(0.5, 16, 8);
  const material = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true });
  star = new THREE.Mesh(geometry, material);

  const [x, y, z] = Array(3)
    .fill()
    .map(() => THREE.MathUtils.randFloatSpread(1000));

  star.position.set(x, y, z);
  scene.add(star);

  stars.push(star);
}

Array(2000).fill().forEach(addStar);

function warpEffect() {
  for (const star of stars) {
    star.position.z += 2;
    if (star.position.z > 1000) {
      star.position.z = -100;
    }
  }
}







// parallax effect
const cursor = {};
cursor.x = 0;
cursor.y = 0;

window.addEventListener('mousemove', (event) => {
  cursor.x = event.clientX / window.innerWidth - 0.5;
  cursor.y = event.clientY / window.innerHeight - 0.5;
})






function animate() {
  requestAnimationFrame(animate);

  planet1.rotation.x += 0.005;
  planet1.rotation.z += 0.005;

  planet2.rotation.x += 0.005;
  planet2.rotation.z += 0.005;

  planet3.rotation.x += 0.005;
  planet3.rotation.z += 0.005;
  planet3ring.rotation.z = planet3.rotation.z;
  planet3ring.rotation.x = planet3.rotation.x;

  planet4.rotation.y += 0.005;
  planet4ring.rotation.z -= 0.005;

  planet5.rotation.x += 0.005;
  planet5.rotation.z += 0.005;

  planet6.rotation.x += 0.005;
  planet6.rotation.z += 0.005;

  if (ship) {
    camera.position.z = ship.position.z + 10;

    shipPointLight.position.y = ship.position.y + 6;
    shipPointLight.position.z = ship.position.z + 4;

    shipPointLight2.position.x = ship.position.x + 2;
    shipPointLight2.position.y = ship.position.y + 4;
    shipPointLight2.position.z = ship.position.z + 2;


    shipPointLight3.position.x = ship.position.x - 2;
    shipPointLight3.position.y = ship.position.y + 4;
    shipPointLight3.position.z = ship.position.z + 2;

    shipPointLight4.position.y = ship.position.y + 5;
    shipPointLight4.position.z = ship.position.z - 2;

    //parallax effect
    const parallaxX = cursor.x;
    const parallaxY = -cursor.y;
    camera.position.x += (parallaxX - camera.position.x) * 0.5;
    camera.position.y += (parallaxY - camera.position.y) * 0.5;

    ship.position.x += (parallaxX - camera.position.x) * 10;
    ship.position.y += (parallaxY - camera.position.y) * 4;

  }

  warpEffect();

  renderer.render(scene, camera);
}

animate();



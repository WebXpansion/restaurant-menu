import * as THREE from "three";
import { OrbitControls } from "/vendor/three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "/vendor/three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "/vendor/three/examples/jsm/loaders/DRACOLoader.js";



const canvases = document.querySelectorAll(".card-3d canvas");

canvases.forEach((canvas) => {

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(0, 1, 3);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

  const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1.5);
  scene.add(light);

  const controls = new OrbitControls(camera, canvas);

  controls.enableDamping = true;
  controls.enablePan = false;
  
  controls.minDistance = 2;
  controls.maxDistance = 4;
  
// Légère inclinaison autorisée
const tilt = 0.3; // plus petit = plus subtil

controls.minPolarAngle = Math.PI / 2 - tilt;
controls.maxPolarAngle = Math.PI / 2 + tilt;
  
  // 🔁 Auto rotate doux
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.8;
  
  let autoRotateTimeout;
  
  controls.addEventListener("start", () => {
    controls.autoRotate = false;
    clearTimeout(autoRotateTimeout);
  });
  
  controls.addEventListener("end", () => {
    autoRotateTimeout = setTimeout(() => {
      controls.autoRotate = true;
    }, 2500);
  });

  const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath("/vendor/three/examples/jsm/libs/draco/");
  loader.setDRACOLoader(dracoLoader);

  loader.load(canvas.dataset.model, (gltf) => {

    const model = gltf.scene;
  
    const scale = parseFloat(canvas.dataset.scale || "1");
  
    model.scale.setScalar(scale);
  
    scene.add(model);
  
  });

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  resize();

  let isVisible = false;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      isVisible = entry.isIntersecting;
    });
  }, { threshold: 0.1 });
  
  observer.observe(canvas);
  
  function animate() {
    requestAnimationFrame(animate);
  
    if (!isVisible) return;
  
    controls.update();
    renderer.render(scene, camera);
  }
  
  animate();
});


/* =========================
   DESKTOP SLIDER
========================= */

const track = document.querySelector(".demo-track");
const btnLeft = document.querySelector(".arrow-left");
const btnRight = document.querySelector(".arrow-right");

if (track && btnLeft && btnRight) {

  btnRight.addEventListener("click", () => {
    const cardWidth = track.querySelector(".demo-card").offsetWidth;
    const gap = 30; // même valeur que ton CSS desktop
    track.scrollBy({
      left: cardWidth + gap,
      behavior: "smooth"
    });
  });

  btnLeft.addEventListener("click", () => {
    const cardWidth = track.querySelector(".demo-card").offsetWidth;
    const gap = 30;
    track.scrollBy({
      left: -(cardWidth + gap),
      behavior: "smooth"
    });
  });

}
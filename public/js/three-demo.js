import * as THREE from "/vendor/three/three.module.js";
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
  controls.minDistance = 2;
  controls.maxDistance = 4;

  const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath("/vendor/three/draco/");
  loader.setDRACOLoader(dracoLoader);

  loader.load(canvas.dataset.model, (gltf) => {
    scene.add(gltf.scene);
  });

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  resize();

  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }

  animate();
});
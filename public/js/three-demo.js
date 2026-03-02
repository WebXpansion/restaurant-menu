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
  controls.minDistance = 2;
  controls.maxDistance = 4;

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

  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }

  animate();
});
const arButtons = document.querySelectorAll(".ar-btn");

function isIOS() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function isAndroid() {
  return /Android/i.test(navigator.userAgent);
}

function updateButtonText() {
  arButtons.forEach(button => {
    if (window.innerWidth > 1024) {
      button.textContent = "Voir en réalité augmentée sur téléphone";
    } else {
      button.textContent = "Voir sur ma table";
    }
  });
}

updateButtonText();
window.addEventListener("resize", updateButtonText);

arButtons.forEach(button => {

  button.addEventListener("click", () => {

    const usdz = button.dataset.usdz;
    const glb = button.dataset.glb;

    if (isIOS()) {

      const anchor = document.createElement("a");
      anchor.rel = "ar";
      anchor.href = usdz;

      const img = document.createElement("img");
      anchor.appendChild(img);

      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);

    } else if (isAndroid()) {

      const sceneViewerUrl =
        `https://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(glb)}&mode=ar_only&resizable=true`;

      window.location.href = sceneViewerUrl;

    } else {

      alert("Veuillez ouvrir cette page sur votre téléphone pour utiliser la réalité augmentée.");

    }

  });

});
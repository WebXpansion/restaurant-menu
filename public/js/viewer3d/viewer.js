import * as THREE from "/vendor/three/three.module.js";
import { OrbitControls } from "/vendor/three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";



let currentViewer = null;

export function createViewer(canvas, loaderEl, modelUrl, scale = 1) {
  // 🔥 Nettoie l'ancien viewer
  if (currentViewer) {
    currentViewer.dispose();
    currentViewer = null;
  }

  const scene = new THREE.Scene();
  scene.background = null;


  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(0, 1, 3);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setClearColor(0x000000, 0);

  const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1.5);
  scene.add(light);

  const controls = new OrbitControls(camera, canvas);

controls.minDistance = 1.5;  
controls.maxDistance = 5;    


  const loader = new GLTFLoader();

  let animationId;

  loader.load(modelUrl, (gltf) => {
    const model = gltf.scene;
    model.scale.setScalar(scale);
    scene.add(model);
    loaderEl.style.display = "none";
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
    animationId = requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }

  animate();

  // 🔥 Dispose propre de CETTE instance
  currentViewer = {
    dispose() {
      cancelAnimationFrame(animationId);
      controls.dispose();
      renderer.dispose();

      scene.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach(m => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
    }
  };
}


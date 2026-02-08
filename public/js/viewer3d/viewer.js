import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";




let renderer, scene, camera, controls, animationId;

export function createViewer(canvas, loaderEl, modelUrl, scale = 1) {

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf5f5f5);

  camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(0, 1, 3);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

  const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1.5);
  scene.add(light);

  controls = new OrbitControls(camera, canvas);


  const loader = new GLTFLoader();


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
}

export function disposeViewer() {
  cancelAnimationFrame(animationId);
  renderer?.dispose();
}

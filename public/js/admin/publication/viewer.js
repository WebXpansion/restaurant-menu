import * as THREE from "/vendor/three/three.module.js";
import { GLTFLoader } from "/vendor/three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "/vendor/three/examples/jsm/loaders/DRACOLoader.js";
import { state } from "./editor/state.js";


let scene, camera, renderer;
let modelGroup;
let currentModel = null;


let modelRotation = {
    x: 0,
    y: 0
  };

export function initViewer(canvas) {

    scene = new THREE.Scene();
    scene.background = new THREE.Color("#000000");
  
    camera = new THREE.PerspectiveCamera(
      50,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 3);
  
    renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
        preserveDrawingBuffer: true 
      });
  
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
  
    // 🔥 IMPORTANT
    state.scene = scene;
    state.camera = camera;
    state.renderer = renderer;
  
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(2, 2, 2);
    scene.add(light);
  
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);
  
    modelGroup = new THREE.Group(); 
    scene.add(modelGroup);


  
    window.addEventListener("resize", onResize);
  
    animate();
}

export function setModelRotation(x, y) {

    if (!modelGroup) return;
  
    modelRotation.x = x;
    modelRotation.y = y;
  
    modelGroup.rotation.x = x;
    modelGroup.rotation.y = y;
  }

  function onResize() {

    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
  
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  
    // 🔥 Recalcule le background cover
    if (scene.background && scene.background.isTexture) {
      applyBackgroundCover(scene.background);
    }
  }

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

/* =========================
   LOAD MODEL
========================= */

export function loadModel(url, scale = 1) {

  if (!url) return;

  const loader = new GLTFLoader();
  const draco = new DRACOLoader();
  draco.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.6/");
  loader.setDRACOLoader(draco);

  loader.load(url, (gltf) => {

    // dispose ancien modèle
    if (currentModel) {
      modelGroup.remove(currentModel);
      currentModel.traverse(obj => {
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

    currentModel = gltf.scene;
    currentModel.scale.setScalar(scale);

    modelGroup.add(currentModel);
  });
}

export function setModelPosition(position) {

    if (!modelGroup) return;
  
    const offset = 0.6;
  
    switch (position) {
      case "top":
        modelGroup.position.set(0, offset, 0);
        break;
      case "bottom":
        modelGroup.position.set(0, -offset, 0);
        break;
      case "left":
        modelGroup.position.set(-offset, 0, 0);
        break;
      case "right":
        modelGroup.position.set(offset, 0, 0);
        break;
      default:
        modelGroup.position.set(0, 0, 0);
    }
  }


  export function setBackgroundColor(color) {

    state.background.type = "color";
    state.background.color = color;
    state.background.image = null;
  
    scene.background = new THREE.Color(color);
  }
  
  export function setBackgroundImage(imageUrl) {

    state.background.type = "image";
    state.background.image = imageUrl;
  
    const loader = new THREE.TextureLoader();
  
    loader.load(imageUrl, (texture) => {
  
      texture.colorSpace = THREE.SRGBColorSpace;
  
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
  
      scene.background = texture;
  
      applyBackgroundCover(texture);
    });
  }

  function applyBackgroundCover(texture) {

    const canvas = renderer.domElement;
  
    const canvasRatio = canvas.clientWidth / canvas.clientHeight;
    const imageRatio = texture.image.width / texture.image.height;
  
    let repeatX = 1;
    let repeatY = 1;
  
    if (canvasRatio > imageRatio) {
      repeatY = imageRatio / canvasRatio;
    } else {
      repeatX = canvasRatio / imageRatio;
    }
  
    texture.repeat.set(repeatX, repeatY);
  
    texture.offset.set(
      (1 - repeatX) / 2,
      (1 - repeatY) / 2
    );
  }

  export function removeBackgroundImage() {

    state.background.type = "color";
    state.background.image = null;
    state.background.source = null;
  
    scene.background = new THREE.Color(state.background.color);
  }

  export function setModelXY(x, y) {
    if (!modelGroup) return;
  
    const maxOffset = 1;
  
    modelGroup.position.set(
      x * maxOffset,
      y * maxOffset,
      0
    );
  }
  
  export function setModelScale(scale) {
    if (!modelGroup) return;
  
    modelGroup.scale.setScalar(scale);
  }
  
  export function resetModelPosition() {
    if (!modelGroup) return;
  
    modelGroup.position.set(0, 0, 0);
  }
import * as THREE from "/vendor/three/three.module.js";
import { state } from "./state.js";

export function exportHD() {

  const baseSize = 1080;

  const width = baseSize;
  const height = state.format === "9:16"
    ? Math.round(baseSize * 16 / 9)
    : baseSize;

  /* =========================
     CREATE OFFSCREEN RENDERER
  ========================== */

  const exportRenderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    preserveDrawingBuffer: true
  });

  exportRenderer.setSize(width, height);
  exportRenderer.setPixelRatio(1);
  exportRenderer.outputColorSpace = THREE.SRGBColorSpace;

  const exportCamera = state.camera.clone();
  exportCamera.aspect = width / height;
  exportCamera.updateProjectionMatrix();

  /* =========================
     RENDER 3D
  ========================== */

  exportRenderer.render(state.scene, exportCamera);

  /* =========================
     CREATE FINAL CANVAS
  ========================== */

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");

  ctx.drawImage(exportRenderer.domElement, 0, 0);

  const previewWidth = state.renderer.domElement.clientWidth;
  const ratioX = width / previewWidth;

  /* =========================
     DRAW LAYERS
  ========================== */

  state.layers.forEach(layer => {

    const x = layer.xPercent * width;
    const y = layer.yPercent * height;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((layer.style.rotation || 0) * Math.PI / 180);
    ctx.scale(layer.style.scale || 1, layer.style.scale || 1);

    if (layer.type === "text") {

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      ctx.font = `
      ${layer.style.fontStyle || "normal"}
      ${layer.style.fontWeight || 400}
      ${layer.style.fontSize}px
      "${layer.style.fontFamily}"
      `;

      if (layer.style.textStrokeWidth > 0) {
        ctx.lineJoin = "round";
        ctx.lineWidth = layer.style.textStrokeWidth * 2 * ratioX;
        ctx.strokeStyle = layer.style.textStrokeColor;
        ctx.strokeText(layer.content, 0, 0);
      }

      if (layer.style.gradient) {
        const g = layer.style.gradient;
        const gradient = ctx.createLinearGradient(-200, 0, 200, 0);
        gradient.addColorStop(0, g.from);
        gradient.addColorStop(1, g.to);
        ctx.fillStyle = gradient;
      } else {
        ctx.fillStyle = layer.style.color || "#ffffff";
      }

      ctx.fillText(layer.content, 0, 0);
    }

    if (layer.type === "sticker") {

      if (!layer._img) {
        layer._img = new Image();
        layer._img.src = layer.src;
      }

      const size = 300 * ratioX;

      ctx.drawImage(
        layer._img,
        -size / 2,
        -size / 2,
        size,
        size
      );
    }

    ctx.restore();
  });

  /* =========================
     DOWNLOAD
  ========================== */

  const link = document.createElement("a");
  link.download = "post.png";
  link.href = canvas.toDataURL("image/png");
  link.click();

  exportRenderer.dispose();
}
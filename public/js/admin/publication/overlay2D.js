import { state } from "./editor/state.js";
import { openInspector } from "./editor/inspector.js";
let canvas;
let ctx;
let isDragging = false;
let draggedLayer = null;

export function initOverlay() {

  canvas = document.getElementById("overlayCanvas");

  if (!canvas) {
    console.error("overlayCanvas not found");
    return;
  }

  ctx = canvas.getContext("2d");

  resize();
  window.addEventListener("resize", resize);

  // 🔥 POINTER DOWN
  canvas.addEventListener("pointerdown", (e) => {

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const hit = [...state.layers]
    .reverse()
    .find(layer => {
  
      const lx = layer.xPercent * canvas.width;
      const ly = layer.yPercent * canvas.height;
  
      const dx = x - lx;
      const dy = y - ly;
  
      return Math.abs(dx) < 150 && Math.abs(dy) < 100;
    });
    if (hit) {

      state.selectedLayerId = hit.id;
      draggedLayer = hit;
      isDragging = true;
    
      openInspector(hit); // 🔥 OUVRE L’INSPECTOR
    
      canvas.setPointerCapture(e.pointerId);
    
    } else {
    
      state.selectedLayerId = null;
      openInspector(null); // 🔥 FERME INSPECTOR
    
    }

    renderOverlay();
  });

  // 🔥 POINTER MOVE
  canvas.addEventListener("pointermove", (e) => {

    if (!isDragging || !draggedLayer) return;

    const rect = canvas.getBoundingClientRect();

    let x = (e.clientX - rect.left) / canvas.width;
    let y = (e.clientY - rect.top) / canvas.height;

    x = Math.max(0.05, Math.min(0.95, x));
    y = Math.max(0.05, Math.min(0.95, y));

    draggedLayer.xPercent = x;
    draggedLayer.yPercent = y;

    renderOverlay();
  });

  document.fonts.ready.then(() => {
    renderOverlay();
  });

  // 🔥 POINTER UP
  canvas.addEventListener("pointerup", () => {
    isDragging = false;
    draggedLayer = null;
  });
}

function resize() {
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
  renderOverlay();
}

export function renderOverlay() {
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  state.layers.forEach(layer => {

    const x = layer.xPercent * canvas.width;
    const y = layer.yPercent * canvas.height;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((layer.style.rotation || 0) * Math.PI / 180);
    ctx.scale(layer.style.scale || 1, layer.style.scale || 1);

    if (layer.type === "text") drawText(layer);
    if (layer.type === "sticker") drawSticker(layer);

    ctx.restore();
  });
}

function drawText(layer) {

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.font = `400 ${layer.style.fontSize}px "${layer.style.fontFamily}"`;

  const text = layer.content;

  /* =========================
     STROKE
  ========================= */

  if (layer.style.textStrokeWidth > 0) {
    ctx.lineJoin = "round";
    ctx.lineWidth = layer.style.textStrokeWidth * 2;
    ctx.strokeStyle = layer.style.textStrokeColor;
    ctx.strokeText(text, 0, 0);
  }

  /* =========================
     GRADIENT
  ========================= */

  if (layer.style.gradient) {

    const g = layer.style.gradient;

    // largeur réelle du texte
    const metrics = ctx.measureText(text);
    const textWidth = metrics.width;

    const gradient = ctx.createLinearGradient(
      -textWidth / 2,
      0,
      textWidth / 2,
      0
    );

    gradient.addColorStop(0, g.from);
    gradient.addColorStop(1, g.to);

    ctx.fillStyle = gradient;

  } else {

    ctx.fillStyle = layer.style.color || "#fff";
  }

  ctx.fillText(text, 0, 0);
}

function drawSticker(layer) {

  if (!layer._img) {
    layer._img = new Image();
    layer._img.src = layer.src;
  }

  const size = 300;

  ctx.drawImage(layer._img, -size / 2, -size / 2, size, size);
}
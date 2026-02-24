import { initViewer, loadModel } from "./viewer.js";
import { TEXT_PRESETS } from "./editor/textPresets.js";
import { createTextLayer, createStickerLayer } from "./editor/layers.js";
import { BACKGROUND_PRESETS } from "./editor/backgroundPresets.js";

import { exportHD } from "./editor/export.js";
import { state } from "./editor/state.js";
import { 
    setBackgroundColor, 
    setBackgroundImage,
    removeBackgroundImage
  } from "./viewer.js";
import { setFormat } from "./layout.js";
import { STICKER_PRESETS } from "./editor/stickerPresets.js";

import { 
    setModelXY, 
    setModelScale, 
    resetModelPosition,
    setModelRotation
  } from "./viewer.js";

  import { initOverlay, renderOverlay } from "./overlay2D.js";

  import { setPanelChangeHandler } from "./editor/selection.js";
  import { deleteLayer } from "./editor/layers.js";


// ===========================
// INIT VIEWER
// ===========================

const canvas = document.getElementById("publicationCanvas");
initViewer(canvas);

const toolPanel = document.getElementById("toolPanel");
const inspectorPanel = document.getElementById("inspectorPanel");


function openTool(tool) {

    inspectorPanel.classList.remove("hidden");

    if (tool !== "text") {
      state.selectedLayerId = null;
    }
  
    if (tool !== "model") {
      inspectorPanel.innerHTML = `
        <div class="empty-inspector">
          Sélectionnez un élément à modifier
        </div>
      `;
    }

    if (tool === "stickers") {

        const presetsHTML = Object.entries(STICKER_PRESETS)
          .map(([key, sticker]) => `
            <div class="sticker-card" data-key="${key}">
              <img src="${sticker.preview}" />
            </div>
          `)
          .join("");
      
        toolPanel.innerHTML = `
          <div class="panel-title">Stickers</div>
      
          <div class="sticker-grid">
            ${presetsHTML}
          </div>
        `;
      
        document.querySelectorAll(".sticker-card")
          .forEach(card => {
      
            card.addEventListener("click", () => {
      
              const sticker = STICKER_PRESETS[card.dataset.key];
      
              createStickerLayer(sticker.src);
              renderOverlay();
      
            });
      
          });
      }
  
    if (tool === "model") {

        toolPanel.innerHTML = `
          <div class="panel-title">Modèle</div>
          <div id="dishSelector"></div>
        `;

        if (state.selectedModelId && state._dishesCache) {

            const activeDish = state._dishesCache.find(
              d => d.id === state.selectedModelId
            );
          
            if (activeDish) {
              openModelInspector(activeDish);
            }
          
          }
      
        loadDishes();
      }
  
    if (tool === "text") {
  
      toolPanel.innerHTML = `
        <div class="panel-title">Texte</div>
  
        <button id="addTextBtn" class="primary">
          Ajouter un texte
        </button>

      `;

      if (tool === "text") {

        const presetsHTML = Object.entries(TEXT_PRESETS)
          .map(([key, preset]) => `
            <div class="preset-card" data-key="${key}">
            <img src="${preset.preview}" />
            </div>
          `)
          .join("");
      
        toolPanel.innerHTML = `
          <div class="panel-title">Texte</div>
      
          <button id="addTextBtn" class="primary">
            Ajouter un texte
          </button>
      
          <p>Template</p>
          <div class="preset-grid">
            ${presetsHTML}
          </div>
        `;
      
        document
          .getElementById("addTextBtn")
          .addEventListener("click", createTextLayer);
      
        document.querySelectorAll(".preset-card")
          .forEach(card => {
      
            card.addEventListener("click", () => {
      
              const preset = TEXT_PRESETS[card.dataset.key];
      
              createTextLayer();
      
              const layer = state.layers[state.layers.length - 1];
      
              layer.style = {
                ...layer.style,
                ...preset.style
              };
      
              renderOverlay();
            });
      
          });
      }
  
      document
        .getElementById("addTextBtn")
        .addEventListener("click", createTextLayer);
  
    }
  
    if (tool === "background") {

        const hasImage = state.background.type === "image";
      
        toolPanel.innerHTML = `
          <div class="panel-title">Fond</div>
      
          <div class="ratio-box">
            <div class="ratio-option ${state.format === "1:1" ? "active" : ""}" data-format="1:1">1:1</div>
            <div class="ratio-option ${state.format === "9:16" ? "active" : ""}" data-format="9:16">9:16</div>
          </div>
      
          <div class="main-property-block">
      
            <!-- COULEUR -->
            <div class="property-block">
              <div class="property-label">Couleur</div>
      
              <div class="color-line ${hasImage ? "disabled-color" : ""}" id="bgColorBlock">
                <div class="color-preview-wrapper">
                  <div class="color-preview"></div>
                  <input type="color" class="hidden-color-input" ${hasImage ? "disabled" : ""}/>
                </div>
                <input type="text" id="bgHex" ${hasImage ? "disabled" : ""}/>
              </div>
      
              ${hasImage ? `
                <div class="bg-warning">
                  Veuillez supprimer l'image pour avoir un fond
                </div>
              ` : ""}
            </div>
      
            <!-- IMAGE UPLOAD -->
            <div class="property-block">
              <div class="property-label">Image</div>
      
              ${
                state.background.source === "upload"
                  ? `
                    <div class="bg-image-preview">
                      <span>Image active</span>
                      <button id="removeBgImage" class="remove-bg-btn">✕</button>
                    </div>
                  `
                  : `
                    <input type="file" id="bgImageInput" accept="image/*"/>
                  `
              }
            </div>
      
            <!-- PRESETS -->
            <div class="property-block">
              <div class="property-label">Presets</div>
      
              <div class="bg-preset-grid">
                ${BACKGROUND_PRESETS.map(preset => `
                  <div class="bg-preset ${
                    state.background.source === "preset" &&
                    state.background.image === preset.src
                      ? "active"
                      : ""
                  }"
                  data-src="${preset.src}">
                    <img src="${preset.src}" />
                  </div>
                `).join("")}
              </div>
            </div>
      
          </div>
        `;
      
        const bgHex = toolPanel.querySelector("#bgHex");
        const bgPreview = toolPanel.querySelector("#bgColorBlock .color-preview");
        const bgColorInput = toolPanel.querySelector("#bgColorBlock .hidden-color-input");
        const bgImageInput = toolPanel.querySelector("#bgImageInput");
        const removeBtn = toolPanel.querySelector("#removeBgImage");
      
        // INIT COLOR
        if (bgPreview) bgPreview.style.background = state.background.color;
        if (bgHex) bgHex.value = state.background.color;
        if (bgColorInput) bgColorInput.value = state.background.color;
      
        // COLOR EVENTS
        bgColorInput?.addEventListener("input", e => {
          const color = e.target.value;
          bgHex.value = color;
          bgPreview.style.background = color;
          setBackgroundColor(color);
        });
      
        bgHex?.addEventListener("input", e => {
          const color = e.target.value;
          bgPreview.style.background = color;
          bgColorInput.value = color;
          setBackgroundColor(color);
        });
      
        // RATIO
        toolPanel.querySelectorAll(".ratio-option").forEach(btn => {
          btn.addEventListener("click", () => {
            toolPanel.querySelectorAll(".ratio-option")
              .forEach(b => b.classList.remove("active"));
      
            btn.classList.add("active");
      
            state.format = btn.dataset.format;
            setFormat(state.format);
          });
        });
      
        // UPLOAD
        bgImageInput?.addEventListener("change", e => {
      
          const file = e.target.files[0];
          if (!file) return;
      
          const reader = new FileReader();
      
          reader.onload = () => {
      
            setBackgroundImage(reader.result);
      
            state.background.type = "image";
            state.background.image = reader.result;
            state.background.source = "upload";
      
            openTool("background");
          };
      
          reader.readAsDataURL(file);
          bgImageInput.value = "";
        });
      
        // REMOVE UPLOAD
        removeBtn?.addEventListener("click", () => {
      
          removeBackgroundImage();
      
          state.background.source = null;
      
          openTool("background");
        });
      
        // PRESETS
        toolPanel.querySelectorAll(".bg-preset").forEach(card => {
      
          card.addEventListener("click", () => {
      
            const src = card.dataset.src;
      
            if (
              state.background.source === "preset" &&
              state.background.image === src
            ) {
              removeBackgroundImage();
              state.background.source = null;
              openTool("background");
              return;
            }
      
            setBackgroundImage(src);
      
            state.background.type = "image";
            state.background.image = src;
            state.background.source = "preset";
      
            openTool("background");
          });
      
        });
      
      }
  
  }



  function setActivePanel(panel) {

    state.activePanel = panel;
  
    document.querySelectorAll(".sidebar button")
      .forEach(b => b.classList.remove("active"));
  
    const btn = document.querySelector(
      `.sidebar button[data-panel="${panel}"]`
    );
  
    if (btn) btn.classList.add("active");
  
    openTool(panel);
  }

  setPanelChangeHandler(setActivePanel);

  function openModelInspector(dish) {

    const inspector = document.getElementById("inspectorPanel");
  
    inspector.classList.remove("hidden");
  
    inspector.innerHTML = `
    <div class="panel-title">Propriétés modèle</div>
  
    <div class="model-controls">
  
      <div class="control-label">Position</div>
  
      <div class="position-pad" id="positionPad">
        <div class="pad-dot" id="padDot"></div>
      </div>
  
      <button id="resetPosition" class="reset-btn">
        Centrer
      </button>
  
      <div class="control-label">Scale</div>
  
      <input type="range"
             id="modelScale"
             min="0.5"
             max="2"
             step="0.01"
             value="${state.modelTransform.scale}" />
  
      <div class="control-label">Rotation X</div>
  
      <input type="range"
             id="rotateX"
             min="-3.14"
             max="3.14"
             step="0.01"
             value="${state.modelTransform.x}" />
  
      <div class="control-label">Rotation Y</div>
  
      <input type="range"
             id="rotateY"
             min="-3.14"
             max="3.14"
             step="0.01"
             value="${state.modelTransform.y}" />
  
    </div>
  `;
  
    initModelControls();
  }

  function initModelControls() {

    const pad = document.getElementById("positionPad");
    const dot = document.getElementById("padDot");
    const scaleInput = document.getElementById("modelScale");
    const resetBtn = document.getElementById("resetPosition");

    const rotateX = document.getElementById("rotateX");
const rotateY = document.getElementById("rotateY");

rotateX.addEventListener("input", e => {

  const value = parseFloat(e.target.value);

  state.modelTransform.x = value;

  setModelRotation(value, state.modelTransform.y);
});

rotateY.addEventListener("input", e => {

  const value = parseFloat(e.target.value);

  state.modelTransform.y = value;

  setModelRotation(state.modelTransform.x, value);
});
  
    if (!pad) return;
  
    let isDragging = false;
  
    pad.addEventListener("pointerdown", (e) => {
      isDragging = true;
      moveDot(e);
    });
  
    window.addEventListener("pointermove", (e) => {
      if (!isDragging) return;
      moveDot(e);
    });
  
    window.addEventListener("pointerup", () => {
      isDragging = false;
    });
  
    function moveDot(e) {
  
      const rect = pad.getBoundingClientRect();
  
      let x = (e.clientX - rect.left) / rect.width;
      let y = (e.clientY - rect.top) / rect.height;
  
      x = Math.max(0, Math.min(1, x));
      y = Math.max(0, Math.min(1, y));
  
      dot.style.left = x * 100 + "%";
      dot.style.top = y * 100 + "%";
  
      const normalizedX = (x - 0.5) * 2;
      const normalizedY = (0.5 - y) * 2;
  
      setModelXY(normalizedX, normalizedY);
    }
  
    scaleInput.addEventListener("input", e => {

        const value = parseFloat(e.target.value);
      
        state.modelTransform.scale = value;
      
        setModelScale(value);
      });
  
      resetBtn.addEventListener("click", () => {

        dot.style.left = "50%";
        dot.style.top = "50%";
      
        scaleInput.value = 1;
        rotateX.value = 0;
        rotateY.value = 0;
      
        state.modelTransform = {
          x: 0,
          y: 0,
          scale: 1,
          posX: 0,
          posY: 0
        };
      
        resetModelPosition();
        setModelScale(1);
        setModelRotation(0, 0);
      });
  }

  function loadDishes() {

    const container = document.getElementById("dishSelector");
    if (!container) return;
  
    container.innerHTML = "";
  
    fetch("/admin/publication/api/dishes")
      .then(res => res.json())
      .then(dishes => {
  
        // 🔥 on met le cache ici (au bon endroit)
        state._dishesCache = dishes;
  
        dishes.forEach(dish => {
  
          const card = document.createElement("div");
          card.className = "dish-card";
          card.dataset.id = dish.id;
  
          card.innerHTML = `
            <img src="${dish.image_url}" />
            <div>${dish.title || ""}</div>
          `;
  
          card.addEventListener("click", () => {

            setActivePanel("model");
  
            loadModel(dish.glb_url, dish.scale || 1);
  
            state.selectedModelId = dish.id;
  
            highlightActiveModel();
  
            openModelInspector(dish);
          });
  
          container.appendChild(card);
  
        });
  
        // 🔥 re-highlight après création
        highlightActiveModel();
  
      });
  
  }




  
function highlightActiveModel() {

    document.querySelectorAll(".dish-card")
      .forEach(card => {
  
        if (card.dataset.id === String(state.selectedModelId)) {
          card.classList.add("active");
        } else {
          card.classList.remove("active");
        }
  
      });
  }

// ===========================
// SIDEBAR LISTENER
// ===========================

document.querySelectorAll(".sidebar button").forEach(btn => {

    btn.addEventListener("click", () => {
      setActivePanel(btn.dataset.panel);
    });
  
  });



// ===========================
// EXPORT
// ===========================

const exportBtn = document.getElementById("exportBtn");

if (exportBtn) {
  exportBtn.addEventListener("click", exportHD);
}



document.addEventListener("keydown", (e) => {

    // si on est en train d'éditer un texte contenteditable → ne rien faire
    const active = document.activeElement;
    if (active && active.isContentEditable) return;
  
    if (!state.selectedLayerId) return;
  
    if (e.key === "Delete" || e.key === "Backspace") {
  
      deleteLayer(state.selectedLayerId);
  
      renderOverlay();
  
      inspectorPanel.innerHTML = `
        <div class="empty-inspector">
          Sélectionnez un élément à modifier
        </div>
      `;
    }
  
  });

// ===========================
// INITIAL LOADa
// ===========================

document.addEventListener("DOMContentLoaded", () => {

    initOverlay();      // 🔥 d'abord
  
    renderOverlay();    // ensuite
  
    const defaultToolBtn = document.querySelector('.sidebar button.active');
  
    if (defaultToolBtn) {
      openTool(defaultToolBtn.dataset.panel);
    }
  
  });


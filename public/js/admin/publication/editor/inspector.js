import { state } from "./state.js";

import { createColorPicker } from "./colorPicker.js";
import { renderOverlay } from "../overlay2D.js";

export function openInspector(layer) {

  const inspector = document.getElementById("inspectorPanel");

  if (!layer) {
    inspector.innerHTML = `
      <div class="empty-inspector">
        Sélectionnez un élément à modifier
      </div>
    `;
    return;
  }

  /* =====================
     STICKER
  ===================== */
  if (layer.type === "sticker") {

    inspector.innerHTML = `
      <div class="panel-title">Propriétés Sticker</div>

      <label>Taille</label>
      <input type="range"
        id="stickerScale"
        min="0.2"
        max="3"
        step="0.01"
        value="${layer.style.scale}" />

      <label>Rotation</label>
      <input type="range"
        id="stickerRotate"
        min="-180"
        max="180"
        step="1"
        value="${layer.style.rotation}" />
    `;

   

    document.getElementById("stickerScale")
      .addEventListener("input", e => {
        layer.style.scale = parseFloat(e.target.value);
        renderOverlay();
      });

    document.getElementById("stickerRotate")
      .addEventListener("input", e => {
        layer.style.rotation = parseFloat(e.target.value);
        renderOverlay();
      });

    return;
  }

  /* =====================
     TEXT
  ===================== */
  if (layer.type === "text") {

    inspector.innerHTML = `
      <div class="panel-title">Propriété</div>
    
      <textarea id="inspectorContent" class="text-input">
  ${layer.content}
      </textarea>
    
      <div class="font-row">
        <select id="fontFamily">

        <!-- Modern -->
        <option value="Inter">Inter</option>
        <option value="Poppins">Poppins</option>
        <option value="Montserrat">Montserrat</option>
        <option value="Roboto">Roboto</option>

        <!-- Luxury / Editorial -->
        <option value="Playfair Display">Playfair Display</option>
        <option value="DM Serif Display">DM Serif Display</option>
        <option value="Cinzel">Cinzel</option>
        <option value="Cormorant Garamond">Cormorant Garamond (Italic)</option>

        <!-- Bold Impact -->
        <option value="Anton">Anton</option>
        <option value="Oswald">Oswald</option>
        <option value="Bebas Neue">Bebas Neue</option>
        <option value="Abril Fatface">Abril Fatface</option>
        <option value="Black Ops One">Black Ops One</option>

        <!-- Script / Handwritten -->
        <option value="Lobster">Lobster</option>
        <option value="Pacifico">Pacifico</option>
        <option value="Great Vibes">Great Vibes</option>
        <option value="Permanent Marker">Permanent Marker</option>

        <!-- Vintage / Retro -->
        <option value="Righteous">Righteous</option>
        <option value="UnifrakturCook">UnifrakturCook</option>

        <!-- WTF / Stylé -->
        <option value="Rubik Glitch">Rubik Glitch</option>
        <option value="Press Start 2P">Press Start 2P (Pixel)</option>

        <!-- System -->
        <option value="Arial">Arial</option>

        </select>
            
        <input type="number" id="fontSize" value="${layer.style.fontSize}" />
      </div>
    
      <div class="divider"></div>
    
      <div class="property-block">
        <div class="property-label">Couleur</div>
    
        <div class="color-line" id="textColorBlock">
        <div class="color-preview-wrapper">
        <div class="color-preview"></div>
        <input type="color" class="hidden-color-input" />
        </div>
          <input type="text" id="textHex" />
          <div class="opacity-block">
            <input type="number" id="textOpacity" min="0" max="100" />
            <span>%</span>
          </div>
        </div>
      </div>
    
      <div class="divider"></div>
    
      <div class="property-block">
        <div class="property-label">Contour</div>
    
        <div class="color-line" id="strokeColorBlock">
            <div class="color-preview-wrapper">
            <div class="color-preview"></div>
            <input type="color" class="hidden-color-input" />
            </div>
          <input type="text" id="strokeHex" />
          <div class="px-block">
            <input type="number" id="strokeWidth" min="0" max="20" />
            <span>px</span>
          </div>

        </div>
      </div>
    `;
  
    /* ===== ELEMENTS ===== */
  
    const content = document.getElementById("inspectorContent");
    const fontSize = document.getElementById("fontSize");
    const fontFamily = document.getElementById("fontFamily");
  
    const textHex = document.getElementById("textHex");
    const textOpacity = document.getElementById("textOpacity");
    const textPreview = document.querySelector("#textColorBlock .color-preview");
  
    const strokeHex = document.getElementById("strokeHex");
    const strokeWidth = document.getElementById("strokeWidth");
    const strokePreview = document.querySelector("#strokeColorBlock .color-preview");

    /* INIT VALUES */

textHex.value = layer.style.color || "#ff6d6d";
textOpacity.value = Math.round((layer.style.textOpacity ?? 1) * 100);
textPreview.style.background = layer.style.color;

strokeHex.value = layer.style.textStrokeColor || "#000000";
strokeWidth.value = layer.style.textStrokeWidth || 0;
strokePreview.style.background = layer.style.textStrokeColor;


/* ========= ICI TU COLLES LE JS ========= */

const textColorInput = document.querySelector("#textColorBlock .hidden-color-input");
const strokeColorInput = document.querySelector("#strokeColorBlock .hidden-color-input");

textColorInput.value = layer.style.color || "#ff6d6d";
strokeColorInput.value = layer.style.textStrokeColor || "#000000";

textColorInput.addEventListener("input", e => {
  layer.style.color = e.target.value;
  textHex.value = e.target.value;
  textPreview.style.background = e.target.value;
  renderOverlay();
});

strokeColorInput.addEventListener("input", e => {
  layer.style.textStrokeColor = e.target.value;
  strokeHex.value = e.target.value;
  strokePreview.style.background = e.target.value;
  renderOverlay();
});
  

fontFamily.addEventListener("change", async e => {

    layer.style.fontFamily = e.target.value;
  
    await document.fonts.load(`16px "${layer.style.fontFamily}"`);
  
    renderOverlay();
  });
    /* ===== INIT ===== */
  
    textHex.value = layer.style.color || "#ff6d6d";
    textOpacity.value = Math.round((layer.style.textOpacity ?? 1) * 100);
    textPreview.style.background = layer.style.color || "#ff6d6d";
    
    strokeHex.value = layer.style.textStrokeColor || "#000000";
    strokeWidth.value = layer.style.textStrokeWidth || 0;

    strokePreview.style.background = layer.style.textStrokeColor || "#000000";
  
    fontFamily.value = layer.style.fontFamily || "Roboto";
  
    /* ===== EVENTS ===== */
  
    content.addEventListener("input", e => {
      layer.content = e.target.value;
      renderOverlay();
    });
  
    fontSize.addEventListener("input", e => {
      layer.style.fontSize = parseInt(e.target.value);
      renderOverlay();
    });
  

  
    textHex.addEventListener("input", e => {
      layer.style.color = e.target.value;
      textPreview.style.background = e.target.value;
      renderOverlay();
    });
  
    textOpacity.addEventListener("input", e => {
        layer.style.textOpacity = e.target.value / 100;
        renderOverlay();
      });
  
    strokeHex.addEventListener("input", e => {
      layer.style.textStrokeColor = e.target.value;
      strokePreview.style.background = e.target.value;
      renderOverlay();
    });
  
    strokeWidth.addEventListener("input", e => {
      layer.style.textStrokeWidth = parseInt(e.target.value);
      renderOverlay();
    });
  
    return;
  }
}
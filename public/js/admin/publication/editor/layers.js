import { state } from "./state.js";

import { openInspector } from "./inspector.js";
import { selectLayer } from "./selection.js";
import { renderOverlay } from "../overlay2D.js";


export function createTextLayer() {

    const id = "layer_" + Date.now();
  
    const layer = {
      id,
      type: "text",
      xPercent: 0.5,
      yPercent: 0.5,
      content: "Texte",
      style: {
        fontSize: 48,
        fontFamily: "Roboto",
        color: "#ffffff",
        textOpacity: 1,
        textAlign: "center",
        textStrokeColor: "#000000",
        textStrokeWidth: 0
      }
    };
  
    state.layers.push(layer);
  
    renderOverlay();
    selectLayer(id); 
  }

export function deleteLayer(id) {

    const index = state.layers.findIndex(l => l.id === id);
  
    if (index === -1) return;
  
    state.layers.splice(index, 1);
  
    state.selectedLayerId = null;
  }

  export function createStickerLayer(src) {

    const id = "layer_" + Date.now();
  
    const layer = {
      id,
      type: "sticker",
      xPercent: 0.5,
      yPercent: 0.5,
      src,
      style: {
        scale: 1,
        rotation: 0
      }
    };
  
    state.layers.push(layer);
    state.selectedLayerId = id;
    renderOverlay();
    openInspector(layer);
  }
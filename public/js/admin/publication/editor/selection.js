import { state } from "./state.js";
import { openInspector } from "./inspector.js";
import { renderOverlay } from "../overlay2D.js";



let panelChangeHandler = null;

export function setPanelChangeHandler(handler) {
  panelChangeHandler = handler;
}

export function selectLayer(id) {

  state.selectedLayerId = id;

  if (panelChangeHandler) {
    panelChangeHandler("text");
  }

  renderOverlay();
  const layer = state.layers.find(l => l.id === id);
  openInspector(layer);
}
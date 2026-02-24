export const state = {

    format: "1:1",
  
    scene: null,
    camera: null,
    renderer: null,
  
    layers: [],
    selectedLayerId: null,
  
    selectedModelId: null,

    activePanel: "model",

    modelTransform: {
      x: 0,
      y: 0,
      scale: 1,
      posX: 0,
      posY: 0
    },

    
  
    background: {
      type: "color",
      color: "#000000",
      image: null,
      source: null 
    }
  
  };
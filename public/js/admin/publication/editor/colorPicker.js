export function createColorPicker(container, initialColor, onChange) {

    container.innerHTML = `
      <div class="native-color-wrapper">
        <input type="color" id="nativeColor" value="${initialColor || '#ff0000'}" />
        <input type="range" id="nativeOpacity" min="0" max="100" value="100" />
      </div>
    `;
  
    const colorInput = container.querySelector("#nativeColor");
    const opacityInput = container.querySelector("#nativeOpacity");
  
    function update() {
      const color = colorInput.value;
      const opacity = opacityInput.value / 100;
      onChange(color, opacity);
    }
  
    colorInput.addEventListener("input", update);
    opacityInput.addEventListener("input", update);
  }
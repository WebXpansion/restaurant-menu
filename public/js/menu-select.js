document.addEventListener("DOMContentLoaded", () => {
    const menuSelect = document.getElementById("menuToggle");
    if (!menuSelect) return;
  
    function adjustSelectWidth(select) {
      const temp = document.createElement("span");
      temp.style.visibility = "hidden";
      temp.style.position = "absolute";
      temp.style.whiteSpace = "nowrap";
      temp.style.fontSize = getComputedStyle(select).fontSize;
      temp.style.fontWeight = getComputedStyle(select).fontWeight;
      temp.textContent = select.options[select.selectedIndex].text;
      document.body.appendChild(temp);
  
      select.style.width = temp.offsetWidth + 30 + "px";
      document.body.removeChild(temp);
    }
  
    adjustSelectWidth(menuSelect);
  
    menuSelect.addEventListener("change", () => {
      adjustSelectWidth(menuSelect);
    });
  });
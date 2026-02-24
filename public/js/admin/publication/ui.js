// SIDEBAR MOBILE PANEL

document.addEventListener("DOMContentLoaded", () => {

    const sidebarButtons = document.querySelectorAll(".sidebar button");
    const panel = document.getElementById("toolPanel");
  
    sidebarButtons.forEach(btn => {
      btn.addEventListener("click", () => {
  
        const isMobile = window.innerWidth <= 900;
        const isAlreadyActive = btn.classList.contains("active");
  
        if (isMobile) {
          if (isAlreadyActive) {
            panel.classList.remove("open");
            btn.classList.remove("active");
            return;
          }
  
          panel.classList.add("open");
        }
  
        sidebarButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
      });
    });
  
    document.addEventListener("click", (e) => {
      if (
        window.innerWidth <= 900 &&
        !e.target.closest(".panel") &&
        !e.target.closest(".sidebar button")
      ) {
        panel.classList.remove("open");
      }
    });
  
    const toggle = document.querySelector(".mobile-inspector-toggle");
    const toggleHeader = document.querySelector(".toggle-header");
    const inspector = document.getElementById("inspectorPanel");
    const mobileContainer = document.getElementById("mobileInspectorContent");
  
    function moveInspector() {
      if (window.innerWidth <= 900) {
        if (!mobileContainer.contains(inspector)) {
          mobileContainer.appendChild(inspector);
        }
      } else {
        const publicationContainer = document.querySelector(".publication-container");
        if (!publicationContainer.contains(inspector)) {
          publicationContainer.appendChild(inspector);
        }
      }
  
      inspector.classList.remove("hidden");
    }
  
    window.addEventListener("resize", moveInspector);
    moveInspector();
  
    toggleHeader?.addEventListener("click", () => {
      toggle.classList.toggle("open");
    });
  
  });
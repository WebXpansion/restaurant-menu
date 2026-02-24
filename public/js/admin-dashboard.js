document.addEventListener("click", function (e) {
    const lockedCard = e.target.closest("[data-locked]");
    if (!lockedCard) return;
  
    e.preventDefault();
    e.stopPropagation();
  
    const modal = document.getElementById("upgrade-modal");
    if (modal) modal.classList.add("open");
  });
  
  document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("upgrade-modal");
    const closeBtn = document.getElementById("upgrade-close");
  
    if (!modal || !closeBtn) return;
  
    closeBtn.addEventListener("click", () => {
      modal.classList.remove("open");
    });
  
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.remove("open");
      }
    });
  });
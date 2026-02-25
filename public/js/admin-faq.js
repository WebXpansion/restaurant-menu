document.querySelectorAll(".faq-question").forEach(button => {

    button.addEventListener("click", () => {
  
      const item = button.closest(".faq-item");
  
      // Ferme tous les autres
      document.querySelectorAll(".faq-item").forEach(el => {
        if (el !== item) el.classList.remove("active");
      });
  
      // Toggle actuel
      item.classList.toggle("active");
  
    });
  
  });
document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("deleteModal");
    const cancelBtn = document.getElementById("cancelDelete");
    const form = document.getElementById("confirmDeleteForm");
  
    // DELETE MODAL
    document.addEventListener("click", function (e) {
      const deleteBtn = e.target.closest(".btn-delete");
      if (!deleteBtn) return;
  
      const dishId = deleteBtn.dataset.id;
  
      if (form) {
        form.action = `/admin/dishes/${dishId}/delete`;
      }
  
      if (modal) {
        modal.style.display = "flex";
      }
    });
  
    cancelBtn?.addEventListener("click", () => {
      if (modal) modal.style.display = "none";
    });
  
    modal?.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.style.display = "none";
      }
    });
  
    // FILTERS
    const categoryFilter = document.getElementById("categoryFilter");
    const sortSelect = document.getElementById("sortSelect");
    const availabilityFilter = document.getElementById("availabilityFilter");
    const grid = document.querySelector(".grid");
    const emptyMessage = document.getElementById("emptyMessage");
  
    function updateList() {
      if (!categoryFilter || !sortSelect || !availabilityFilter) return;
  
      const category = categoryFilter.value;
      const sort = sortSelect.value;
      const availability = availabilityFilter.value;
  
      const cards = Array.from(document.querySelectorAll(".card"));
  
      cards.forEach((card) => {
        const matchCategory =
          category === "all" || card.dataset.category === category;
  
        const matchAvailability =
          availability === "all" ||
          card.dataset.availability === availability ||
          card.dataset.availability === "both";
  
        const show = matchCategory && matchAvailability;
  
        card.style.display = show ? "flex" : "none";
      });
  
      const visibleCards = cards.filter(
        (c) => c.style.display !== "none"
      );
  
      if (emptyMessage) {
        emptyMessage.style.display =
          visibleCards.length === 0 ? "block" : "none";
      }
  
      visibleCards.sort((a, b) => {
        const aCreated = new Date(a.dataset.created);
        const bCreated = new Date(b.dataset.created);
  
        return sort === "recent"
          ? bCreated - aCreated
          : aCreated - bCreated;
      });
  
      visibleCards.forEach((card) => {
        grid?.appendChild(card);
      });
    }

    // ==============================
// ADD SUBCATEGORY
// ==============================

const addSubBtn = document.getElementById("addSubBtn");

addSubBtn?.addEventListener("click", async () => {
  const name = prompt("Nom de la sous-catégorie ?");
  if (!name) return;

  const categoryInput = document.querySelector('[name="category"]');
  if (!categoryInput) return;

  const category = categoryInput.value;

  await fetch(`/admin/subcategories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, category })
  });

  location.reload();
});

// ==============================
// WORD LIMIT
// ==============================

document.querySelectorAll(".desc-short").forEach((textarea) => {
  const maxWords = parseInt(textarea.dataset.maxWords, 10);

  textarea.addEventListener("input", () => {
    const words = textarea.value
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (words.length > maxWords) {
      textarea.value = words.slice(0, maxWords).join(" ");
    }
  });
});
  
    categoryFilter?.addEventListener("change", updateList);
    sortSelect?.addEventListener("change", updateList);
    availabilityFilter?.addEventListener("change", updateList);
  });

  
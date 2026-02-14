

export function getList() {
    return JSON.parse(localStorage.getItem("menuList") || "[]");
  }
  
  export function saveList(list) {
    localStorage.setItem("menuList", JSON.stringify(list));
  }
  
  export function updateButtons() {
    const list = getList();
  
    const btn = document.querySelector(".list-btn");
    if (!btn) return;
  
    const exists = list.find(p => p.id == btn.dataset.id);
  
    if (exists) {
      btn.textContent = "Enlever de ma liste";
      btn.style.background = "#F3F3F3";
      btn.style.color = "#000";
    } else {
      btn.textContent = "Ajouter dans ma liste";
      btn.style.color = "#000";
      btn.style.background = "#FFFFFF";
    }
  }
  
  document.addEventListener("click", function(e) {
    const btn = e.target.closest(".list-btn");
    if (!btn) return;
  
    const id = parseInt(btn.dataset.id);
    const title = btn.dataset.title;
    const price = parseInt(btn.dataset.price);
    const image = btn.dataset.image;
  
    let list = getList();
    const index = list.findIndex(item => item.id === id);
  
    if (index > -1) {
      list.splice(index, 1);
    } else {
        list.push({
            id,
            title,
            price,
            image,
            glb: btn.dataset.glb || "",
            usdz: btn.dataset.usdz || "",
            scale: btn.dataset.scale || "1",
            tags: btn.dataset.tags || "",
            shortFr: btn.dataset.shortFr || "",
            shortEn: btn.dataset.shortEn || "",
            longFr: btn.dataset.longFr || "",
            longEn: btn.dataset.longEn || "",
          });
    }
  
    saveList(list);
    updateButtons();
    renderListPage();
    updateListBadge();
  });


  

  
  function updateListBadge() {
    const badge = document.getElementById("list-badge");
    if (!badge) return;
  
    const list = getList();
    const count = list.length;
  
    if (count > 0) {
      badge.textContent = count;
      badge.style.display = "flex";
    } else {
      badge.style.display = "none";
    }
  }


  async function renderListPage() {
    const container = document.getElementById("listItems");
    if (!container) return;
  
    let list = getList();
    container.innerHTML = "";
  
    if (list.length === 0) {
      container.innerHTML = "<p>Votre liste est vide.</p>";
      updateListBadge();
      return;
    }
  
    // 🔒 Validation serveur des IDs encore publiés
    const ids = list.map(item => item.id);
  
    try {
      const response = await fetch("/api/validate-list", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ ids })
      });
  
      if (!response.ok) return;
  
      const validIds = await response.json();
  
      // Supprime automatiquement les plats draft / supprimés
      list = list.filter(item => validIds.includes(item.id));
      saveList(list);
  
    } catch (err) {
      console.error("Validation error:", err);
    }
  
    if (list.length === 0) {
      container.innerHTML = "<p>Votre liste est vide.</p>";
      updateListBadge();
      return;
    }
  
    list.forEach(item => {
      const div = document.createElement("div");
      div.className = "card";
    
      div.dataset.id = item.id;
      div.dataset.titleFr = item.title;
      div.dataset.titleEn = item.title;
      div.dataset.priceCents = item.price;
      div.dataset.image = item.image;
      div.dataset.glb = item.glb || "";
      div.dataset.usdz = item.usdz || "";
      div.dataset.scale = item.scale || "1";
      div.dataset.tags = item.tags || "";
      div.dataset.shortFr = item.shortFr || "";
      div.dataset.shortEn = item.shortEn || "";
      div.dataset.longFr = item.longFr || "";
      div.dataset.longEn = item.longEn || "";
    
      div.innerHTML = `
        <div class="card-image">
          <img src="${item.image}" />
        </div>
    
        <div class="card-content">
          <strong class="card-title">${item.title}</strong>
          <p class="desc-short">${item.shortFr || ""}</p>
          <div class="card-price">
            ${(item.price / 100).toFixed(2)} €
          </div>
        </div>
      `;
    
      container.appendChild(div);
    });
  
    updateListBadge();
    updateButtons();
  }


  document.addEventListener("DOMContentLoaded", () => {
    updateButtons();
    renderListPage();
    updateListBadge(); 
  });

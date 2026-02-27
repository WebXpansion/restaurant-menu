const uiData = document.getElementById("ui-data");
const UI = uiData ? JSON.parse(uiData.textContent) : {};

export function getList() {
    return JSON.parse(localStorage.getItem("menuList") || "[]");
  }
  
  export function saveList(list) {
    localStorage.setItem("menuList", JSON.stringify(list));
  }
  
  export function updateButtons() {
    const list = getList();
  
    const btn = document.querySelector("#sheet .list-btn");
    if (!btn) return;
  
    const exists = list.find(p => p.id == btn.dataset.id);
  
    const addText =
    UI?.buttons?.add_to_list || "Ajouter dans ma liste";
  
    const removeText =
    UI?.buttons?.remove_from_list || "Enlever de ma liste";
  
    if (exists) {
      btn.textContent = removeText;
      btn.style.background = "#F3F3F3";
      btn.style.color = "#000";
    } else {
      btn.textContent = addText;
      btn.style.color = "#000";
      btn.style.background = "#FFFFFF";
    }
  }
  
  document.addEventListener("click", function(e) {
    const btn = e.target.closest(".list-btn");
    if (!btn) return;
  
    const id = btn.dataset.id;
    const title = btn.dataset.title;
    const price = parseInt(btn.dataset.price);
    const image = btn.dataset.image;
  
    let list = getList();
    const index = list.findIndex(item => item.id == id);
  
    if (index > -1) {
      list.splice(index, 1);
    } else {
      list.push({
        id,
        price,
        image,
        glb: btn.dataset.glb || "",
        usdz: btn.dataset.usdz || "",
        scale: btn.dataset.scale || "1",
        tags: btn.dataset.tags || ""
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
      container.innerHTML = `<p>${UI?.list_page?.empty || ""}</p>`;
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
      container.innerHTML = `<p>${UI?.list_page?.empty || ""}</p>`;
      updateListBadge();
      return;
    }
  
    // 🔥 Charger données dynamiques selon langue
let freshData = [];

try {
  const response = await fetch("/api/list-data", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ ids: list.map(i => i.id) })
  });

  if (!response.ok) return;

  freshData = await response.json();

} catch (err) {
  console.error("List data error:", err);
  return;
}

freshData.forEach(item => {

  const div = document.createElement("div");
  div.className = "card";

  const hasAR = item.has_ar === true;

  div.dataset.id = item.id;
  div.dataset.title = item.title || "";
  div.dataset.desc = item.desc_short || "";
  div.dataset.price = (item.price_cents / 100).toFixed(2) + " €";
  div.dataset.priceCents = item.price_cents;
  div.dataset.image = item.image_url || "";
  div.dataset.glb = item.glb_url || "";
  div.dataset.usdz = item.usdz_url || "";
  div.dataset.scale = item.scale || "1";

  div.innerHTML = `
    <div class="card-image">
    ${hasAR ? `<div class="badge-3d">3D</div>` : ""}
      <img src="${item.image_url || ""}" />
    </div>

    <div class="card-content">
      <strong class="card-title">${item.title || ""}</strong>
      <p class="desc-short">${item.desc_short || ""}</p>
      <div class="card-price">
        ${(item.price_cents / 100).toFixed(2)} €
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

import { updateButtons } from "./list.js";
import { createViewer } from "./viewer3d/viewer.js";

const sheet = document.getElementById("sheet");
const sheetTitle = document.getElementById("sheet-title");
const sheetPrice = document.getElementById("sheet-price");
const sheetDesc = document.getElementById("sheet-desc");
const closeBtn = document.getElementById("sheet-close");
const arBtn = document.getElementById("ar-btn");
const shareBtn = document.getElementById("sheet-share");
const canvas = document.getElementById("three-canvas");
const loaderEl = document.getElementById("loader");
const fallbackImg = document.getElementById("fallback-image");
const viewerBg = document.querySelector(".viewer-bg");

let currentLang = document.getElementById("langToggle")?.value || "fr";
let currentMenu = "lunch";
let currentFilter = "all";


// ==============================
// 🔥 FONCTION DE FERMETURE UNIQUE
// ==============================
function closeSheet() {
  sheet.classList.remove("open");

  if (canvas) {
    canvas.innerHTML = "";
    canvas.style.display = "none";
  }
  if (loaderEl) loaderEl.style.display = "none";
  if (fallbackImg) fallbackImg.style.display = "none";

  viewerBg.style.opacity = "0";
  if (viewerBg) {
    viewerBg.style.opacity = "0";
    viewerBg.style.backgroundImage = "";
  }

  arBtn.onclick = null;
  history.pushState(null, "", window.location.pathname);
}


if (shareBtn) {
  shareBtn.addEventListener("click", async () => {

    const id = shareBtn.dataset.id;
    const title = sheetTitle.textContent;

    const url = `${window.location.origin}/?dish=${id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: `Découvre ce plat : ${title}`,
          url
        });
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      await navigator.clipboard.writeText(url);
      alert("Lien copié !");
    }
  });
}

// ==============================
// 🔥 LISTENERS GLOBAUX (UNE FOIS)
// ==============================
if (closeBtn) {
  closeBtn.addEventListener("click", closeSheet);
}

if (arBtn) {
  arBtn.addEventListener("click", () => {
    const dishId = arBtn.dataset.id;
    if (!dishId) return;

    fetch(`/stats/ar/${dishId}`, {
      method: "POST"
    });
  });
}

if (sheet) {
  sheet.addEventListener("click", (e) => {
    if (e.target === sheet) {
      closeSheet();
    }
  });
}


// ==============================
// 🔥 OUVERTURE CARTE
// ==============================
document.addEventListener("click", function(e) {

  const card = e.target.closest(".card");
  if (!card) return;

  if (e.target.closest(".list-btn")) return;

  // 🔥 si pas d’overlay sur la page → on ne fait rien
  if (!sheet || !sheetTitle || !sheetDesc) return;

  const langKey =
    currentLang.charAt(0).toUpperCase() + currentLang.slice(1);

  const glb = card.dataset.glb;
  const image = card.dataset.image;
  const scale = parseFloat(card.dataset.scale || 1);

  if (canvas) {
    canvas.innerHTML = "";
    canvas.style.display = "none";
  }
  if (loaderEl) loaderEl.style.display = "none";
  if (fallbackImg) fallbackImg.style.display = "none";

  sheetTitle.textContent = card.dataset.title || "";
  sheetDesc.textContent = card.dataset.desc || "";

  sheetPrice.textContent = card.dataset.price;

  sheet.classList.add("open");
  if (arBtn) {

    const usdz = card.dataset.usdz;
    const arImg = document.getElementById("ar-img");
  
    if (usdz && usdz.trim() !== "") {
      arBtn.style.display = "inline-flex";
  

      arBtn.setAttribute("href", usdz);
  

      if (arImg) {
        arImg.src = usdz;
      }
  
    } else {
      arBtn.style.display = "none";
      arBtn.removeAttribute("href");
  
      if (arImg) {
        arImg.removeAttribute("src");
      }
    }
  
  }

  history.pushState(
    { dish: card.dataset.id },
    "",
    `?dish=${card.dataset.id}`
  );

  fetch(`/stats/dish/${card.dataset.id}/view`, {
    method: "POST"
  });

  const tagContainer = document.querySelector(".sheet-tags");
  if (tagContainer) {
    tagContainer.innerHTML = "";
  
    const rawTags = card.dataset.tags;
    if (rawTags) {
      rawTags.split("|").forEach(tag => {
        const span = document.createElement("span");
        span.className = "sheet-tag";
        span.textContent = tag;
        tagContainer.appendChild(span);
      });
    }
  }

  if (viewerBg && image) {
    viewerBg.style.backgroundImage = `url(${image})`;
  }

  if (glb && glb.trim() !== "") {
    canvas.style.display = "block";
    loaderEl.style.display = "flex";
    viewerBg.style.opacity = "1";
    createViewer(canvas, loaderEl, glb, scale);
  } else {
    viewerBg.style.opacity = "0";
    if (image && image.trim() !== "") {
      fallbackImg.src = image;
      fallbackImg.style.display = "block";
    }
  }

  const listBtn = document.querySelector("#sheet .list-btn");
  if (listBtn) {
    listBtn.dataset.id = card.dataset.id;
    arBtn.dataset.id = card.dataset.id;
    listBtn.dataset.title = sheetTitle.textContent;
    listBtn.dataset.desc = sheetDesc.textContent;
    listBtn.dataset.price = card.dataset.priceCents || "0";
    listBtn.dataset.image = card.dataset.image || "";
    listBtn.dataset.glb = card.dataset.glb || "";
listBtn.dataset.usdz = card.dataset.usdz || "";
listBtn.dataset.scale = card.dataset.scale || "1";
listBtn.dataset.tags = card.dataset.tags || "";
if (shareBtn) {
  shareBtn.dataset.id = card.dataset.id;
}



    updateButtons();
  }

});




  


const filters = document.querySelectorAll(".filter");




function applyFilter(filter) {
  currentFilter = filter;
  updateCards();
}

  

filters.forEach(btn => {
    btn.addEventListener("click", () => {
  
      filters.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
  
      applyFilter(btn.dataset.filter);
  
    });
  });
  

// 🔥 IMPORTANT → applique au chargement
const activeBtn = document.querySelector(".filter.active");
if (activeBtn) {
  applyFilter(activeBtn.dataset.filter);
}

const menuToggle = document.getElementById("menuToggle");
const menuIcon = document.getElementById("menuIcon");

function updateMenuIcon(value) {
  if (!menuIcon) return;

  switch (value) {
    case "lunch":
      menuIcon.textContent = "☀️";
      break;

    case "dinner":
      menuIcon.textContent = "🌙";
      break;

    case "events":
      menuIcon.textContent = "🎉";
      break;

    case "seasonal":
      menuIcon.textContent = "🍂";
      break;

    default:
      menuIcon.textContent = "☀️";
  }
}
const langToggle = document.getElementById("langToggle");

const configEl = document.getElementById("app-config");

if (configEl) {
  window.RESTAURANT_SLUG = configEl.dataset.slug;
}

function updateCards() {

    const cards = document.querySelectorAll(".card");
    const groups = document.querySelectorAll(".group");
  
    const langKey =
      currentLang.charAt(0).toUpperCase() + currentLang.slice(1);
  
    /* ======================
       1. UPDATE CARDS
    ====================== */
    cards.forEach(card => {
  
      const availability = card.dataset.availability;
      const category = (card.dataset.category || "").trim().toLowerCase();
      const filter = (currentFilter || "").trim().toLowerCase();
  
      const matchMenu =
        availability === "both" ||
        availability === currentMenu;
  
        const matchFilter =
        filter === "all" ||
        category === filter;
  
      const show = matchMenu && matchFilter;
  
      card.classList.toggle("hidden", !show);

  
      const title = card.querySelector("strong");
      const short = card.querySelector(".card-desc");
  
      if (title) {
        title.textContent = card.dataset.title || "";
      }
      
      if (short) {
        short.textContent = card.dataset.desc || "";
      }
    });
  
    /* ======================
       2. UPDATE GROUPS
    ====================== */
    groups.forEach(group => {

      const groupCards = group.querySelectorAll(".card");
    
      const anyVisible =
        [...groupCards].some(c => !c.classList.contains("hidden"));
    
      if (anyVisible) {
        group.style.display = "block";
      } else {
        group.style.display = "none";
      }
    
    });
      
  
  }
  
  window.addEventListener("popstate", () => {
    const params = new URLSearchParams(window.location.search);
    const dishId = params.get("dish");
  
    if (!dishId) {
      closeSheet();
    }
  });


  document.addEventListener("DOMContentLoaded", () => {

    const params = new URLSearchParams(window.location.search);
    const dishId = params.get("dish");
  
    if (!dishId) return;
  
    const card = document.querySelector(`.card[data-id="${dishId}"]`);
    if (card) {
      card.click();
    }
  
  });
  

  if (menuToggle) {

    // 🔥 au chargement
    updateMenuIcon(menuToggle.value);
  
    menuToggle.addEventListener("change", e => {
      currentMenu = e.target.value;
      updateMenuIcon(currentMenu);
      updateCards();
    });
  }
  
  if (langToggle) {
    langToggle.addEventListener("change", e => {
  
      const newLang = e.target.value;
  
      // 🔥 recharge la page avec param lang
      const url = new URL(window.location.href);
      url.searchParams.set("lang", newLang);
      window.location.href = url.toString();
  
    });
  }

// 🔥 au chargement
updateCards();


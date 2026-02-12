import { createViewer } from "./viewer3d/viewer.js";

const sheet = document.getElementById("sheet");
const sheetTitle = document.getElementById("sheet-title");
const sheetPrice = document.getElementById("sheet-price");
const sheetDesc = document.getElementById("sheet-desc");
const closeBtn = document.getElementById("sheet-close");
const arBtn = document.getElementById("ar-btn");

const canvas = document.getElementById("three-canvas");
const loaderEl = document.getElementById("loader");
const fallbackImg = document.getElementById("fallback-image");
const viewerBg = document.querySelector(".viewer-bg");

let currentLang = "fr";
let currentMenu = "lunch";
let currentFilter = "all";


// ==============================
// 🔥 FONCTION DE FERMETURE UNIQUE
// ==============================
function closeSheet() {
  sheet.classList.remove("open");

  canvas.innerHTML = "";
  canvas.style.display = "none";
  loaderEl.style.display = "none";
  fallbackImg.style.display = "none";

  viewerBg.style.opacity = "0";
  viewerBg.style.backgroundImage = "";

  arBtn.style.display = "none";
  arBtn.onclick = null;
}


// ==============================
// 🔥 LISTENERS GLOBAUX (UNE FOIS)
// ==============================
closeBtn.addEventListener("click", closeSheet);

sheet.addEventListener("click", (e) => {
  if (e.target === sheet) {
    closeSheet();
  }
});


// ==============================
// 🔥 OUVERTURE CARTE
// ==============================
document.querySelectorAll(".card").forEach(card => {

  card.addEventListener("click", () => {

    const langKey =
      currentLang.charAt(0).toUpperCase() + currentLang.slice(1);

    const glb = card.dataset.glb;
    const usdz = card.dataset.usdz;
    const image = card.dataset.image;
    const scale = parseFloat(card.dataset.scale || 1);

    // Reset état
    canvas.innerHTML = "";
    canvas.style.display = "none";
    loaderEl.style.display = "none";
    fallbackImg.style.display = "none";

    // Contenu texte
    sheetTitle.textContent =
      card.dataset[`title${langKey}`] || card.dataset.titleFr || "";

    sheetDesc.textContent =
      card.dataset[`long${langKey}`] || card.dataset.longFr || "";

    sheetPrice.textContent = card.dataset.price;

    sheet.classList.add("open");

    // ==========================
    // BADGES
    // ==========================

    const tagContainer = document.querySelector(".sheet-tags");
    tagContainer.innerHTML = "";

    const rawTags = card.dataset.tags;

    if (rawTags) {
      const tags = rawTags.split("|");

      tags.forEach(tag => {
        const span = document.createElement("span");
        span.className = "sheet-tag";
        span.textContent = tag;
        tagContainer.appendChild(span);
      });
    }


    // Stat vue
    fetch(`/stats/dish/${card.dataset.id}/view`, {
      method: "POST"
    });

    // Background blur
    if (image) {
      viewerBg.style.backgroundImage = `url(${image})`;
    }

    // ==========================
    // CAS 1 — AR ACTIVÉE
    // ==========================
    if (glb && glb !== "") {

      canvas.style.display = "block";
      loaderEl.style.display = "flex";
      loaderEl.textContent = "Chargement…";

      viewerBg.style.opacity = "1";

      createViewer(canvas, loaderEl, glb, scale);

      arBtn.style.display = "block";
      arBtn.href = usdz || "#";

      arBtn.onclick = () => {
        fetch(`/stats/dish/${card.dataset.id}/ar`, {
          method: "POST"
        });
      };

    }

    // ==========================
    // CAS 2 — PAS D’AR
    // ==========================
    else {

      viewerBg.style.opacity = "0";

      if (image) {
        fallbackImg.src = image;
        fallbackImg.style.display = "block";
      }

      arBtn.style.display = "none";
    }

  });

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
const langToggle = document.getElementById("langToggle");



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
      const category = card.dataset.category;
  
      const matchMenu =
        availability === "both" ||
        availability === currentMenu;
  
      const matchFilter =
        currentFilter === "all" ||
        category === currentFilter;
  
      const show = matchMenu && matchFilter;
  
      card.classList.toggle("hidden", !show);

  
      const title = card.querySelector("strong");
      const short = card.querySelector(".desc-short");
  
      if (title) {
        title.textContent =
          card.dataset[`title${langKey}`] ||
          card.dataset.titleFr ||
          "";
      }
  
      if (short) {
        short.textContent =
          card.dataset[`short${langKey}`] ||
          card.dataset.shortFr ||
          "";
      }
    });
  
    /* ======================
       2. UPDATE GROUPS
    ====================== */
    groups.forEach(group => {
        const groupCards = group.querySelectorAll(".group-cards .card");
      
        const anyVisible =
          [...groupCards].some(c => !c.classList.contains("hidden"));
      
        group.classList.toggle("show", anyVisible);
      });
      
  
  }
  
  

  

menuToggle.addEventListener("change", e => {
  currentMenu = e.target.value;
  updateCards();
});

langToggle.addEventListener("change", e => {
    currentLang = e.target.value;
    console.log("LANG CHANGED →", currentLang);
    updateCards();
  });
  

// 🔥 au chargement
updateCards();


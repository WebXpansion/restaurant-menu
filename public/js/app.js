import { createViewer, disposeViewer } from "./viewer3d/viewer.js";


const sheet = document.getElementById("sheet");
const sheetTitle = document.getElementById("sheet-title");
const sheetPrice = document.getElementById("sheet-price");
const closeBtn = document.getElementById("sheet-close");
const sheetDesc = document.getElementById("sheet-desc");
let currentLang = "fr";
let currentMenu = "lunch";
let currentFilter = "all";
const canvas = document.getElementById("three-canvas");
const loaderEl = document.getElementById("loader");

document.querySelectorAll(".card").forEach(card => {
  card.addEventListener("click", () => {
    const arBtn = document.getElementById("ar-btn");


    const titleEl = card.querySelector("strong");

    const langKey =
      currentLang.charAt(0).toUpperCase() + currentLang.slice(1);
    
    sheetTitle.textContent = titleEl?.textContent || "";
    
    sheetDesc.textContent =
      card.dataset[`long${langKey}`] ||
      card.dataset.longFr ||
      "";
    
    
  
  
    sheetPrice.textContent = card.dataset.price;

    sheet.classList.add("open");


      

    const glb = card.dataset.glb;
    const scale = parseFloat(card.dataset.scale || 1);

    if (glb) {
        loaderEl.style.display = "flex";
        createViewer(canvas, loaderEl, glb, scale);
      } else {
        loaderEl.textContent = "Aucun modèle 3D disponible";
      }
    arBtn.href = card.dataset.usdz || "#";

  });
});

closeBtn.addEventListener("click", () => {
  sheet.classList.remove("open");
  disposeViewer();
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

    document.querySelectorAll(".card").forEach(card => {
  
      const availability = card.dataset.availability;
      const category = card.dataset.category;
  
      const matchMenu =
        availability === "both" ||
        availability === currentMenu;
  
      const matchFilter =
        currentFilter === "all" ||
        category === currentFilter;
  
      const show = matchMenu && matchFilter;
  
      card.style.display = show ? "" : "none";
  
      const title = card.querySelector("strong");
      const short = card.querySelector(".desc-short");
  
      const langKey =
      currentLang.charAt(0).toUpperCase() + currentLang.slice(1);
    
    if (title) {
      const t =
        card.dataset[`title${langKey}`] ||
        card.dataset.titleFr;
    
      title.textContent = t || "";
    }
    
    if (short) {
      const s =
        card.dataset[`short${langKey}`] ||
        card.dataset.shortFr;
    
      short.textContent = s || "";
    }
    
  
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

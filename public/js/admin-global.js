const featureContent = {
  stats: {
    title: "Débloquez les Statistiques",
    description: "Analysez les vues de vos plats, les scans QR et les interactions en réalité augmentée.",
    video: "/videos/stats-preview.mp4"
  },
  publication: {
    title: "Débloquez les Publications",
    description: "Créez des stories Instagram avec vos plats en 3D et exportez-les en HD.",
    video: "/videos/publication-preview.mp4"
  },
  reviews: {
    title: "Débloquez les Avis",
    description: "Collectez et modérez les avis clients pour renforcer votre crédibilité.",
    video: "/videos/reviews-preview.mp4"
  }
};

document.addEventListener("click", function (e) {

  const link = e.target.closest("a[data-locked]");
  if (!link) return;

  e.preventDefault();

  const feature = link.dataset.locked;
  const modal = document.getElementById("upgrade-modal");
  if (!modal) return;

  const titleEl = document.getElementById("upgrade-title");
  const descEl = document.getElementById("upgrade-description");
  const videoEl = document.getElementById("upgrade-video");

  const content = featureContent[feature];

  if (content) {
    titleEl.textContent = content.title;
    descEl.textContent = content.description;
    videoEl.src = content.video;
  }

  modal.classList.add("open");

});

document.addEventListener("click", function (e) {

  const modal = document.getElementById("upgrade-modal");
  if (!modal) return;

  // 🔹 Clic sur bouton close
  if (e.target.closest("#upgrade-close")) {
    modal.classList.remove("open");
    return;
  }

  // 🔹 Clic sur overlay
  if (e.target === modal) {
    modal.classList.remove("open");
  }

});

document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    const modal = document.getElementById("upgrade-modal");
    modal?.classList.remove("open");
  }
});


//___________

document.addEventListener("DOMContentLoaded", () => {
  const hamburger = document.getElementById("hamburgerBtn");
  const mobileMenu = document.getElementById("mobileMenu");
  const mobileCloseBtn = document.getElementById("mobileCloseBtn");

  hamburger?.addEventListener("click", () => {
    mobileMenu?.classList.add("open");
  });

  mobileCloseBtn?.addEventListener("click", () => {
    mobileMenu?.classList.remove("open");
  });
});
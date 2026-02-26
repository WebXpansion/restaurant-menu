const form = document.getElementById("dishForm");
if (!form) {
  console.warn("dishForm not found");
} else {

  const arToggle = document.getElementById("hasArToggle");
  const arFields = document.getElementById("arFields");
  const glbInput = document.getElementById("glbInput");
  const usdzInput = document.getElementById("usdzInput");
  const submitBtn = form.querySelector("button[type='submit']");
  const requiredMarks = document.querySelectorAll(".required-ar");

  const overlay = document.getElementById("arLimitOverlay");
  const overlayText = document.getElementById("arLimitText");
  const closeBtn = document.getElementById("closeOverlay");

  /* ======================
     STATE
  ====================== */
  function updateARState() {
    const arEnabled = arToggle.checked;

    arFields.style.display = arEnabled ? "block" : "none";

    requiredMarks.forEach(el => {
      el.style.display = arEnabled ? "inline" : "none";
    });

    glbInput.required = false;
    usdzInput.required = false;

    validateForm();
  }

  function validateForm() {
    if (!arToggle.checked) {
      submitBtn.disabled = false;
      return;
    }

    const hasGLB =
      glbInput.files.length > 0 ||
      glbInput.dataset.existing === "1";

    const hasUSDZ =
      usdzInput.files.length > 0 ||
      usdzInput.dataset.existing === "1";

    submitBtn.disabled = !(hasGLB && hasUSDZ);
  }

  /* ======================
     SUBMIT
  ====================== */
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
  
    if (submitBtn.disabled) return;
  
    const formData = new FormData(form);
  
    try {
      const res = await fetch(form.getAttribute("action"), {
        method: form.method || "POST",
        body: formData
      });
  
      const contentType = res.headers.get("content-type");
  
      if (!res.ok) {
        console.error("Server error:", res.status);
        return;
      }
  
      // Si le backend renvoie JSON
      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
  
        if (data.success) {
          window.location.href = "/admin/dishes";
          return;
        }
      }
  
      // fallback sécurité
      window.location.href = "/admin/dishes";
  
    } catch (err) {
      console.error("Fetch error:", err);
    }
  });

  /* ======================
     OVERLAY
  ====================== */
  function openUpgradeOverlay(maxAR) {
    overlayText.textContent =
      `Vous avez atteint la limite de ${maxAR} plats en réalité augmentée.\n\n` +
      `Désactivez l’AR sur un plat existant ou passez à une offre supérieure.`;

    overlay.classList.remove("hidden");
  }

  closeBtn?.addEventListener("click", () => {
    overlay.classList.add("hidden");
  });

  /* ======================
     EVENTS
  ====================== */
  arToggle.addEventListener("change", updateARState);
  glbInput.addEventListener("change", validateForm);
  usdzInput.addEventListener("change", validateForm);

  /* ======================
     INIT
  ====================== */
  updateARState();


/* ======================
   IMAGE PREVIEW
====================== */
const imageInput = document.getElementById("imageInput");
const imagePreview = document.getElementById("imagePreview");

if (imageInput && imagePreview) {
  imageInput.addEventListener("change", () => {
    const file = imageInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      imagePreview.src = e.target.result;
      imagePreview.style.display = "block";
    };
    reader.readAsDataURL(file);
  });
}


}

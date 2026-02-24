const loader = document.getElementById("siteLoader");
      
if (!sessionStorage.getItem("loaderShown")) {

  window.addEventListener("load", () => {
    setTimeout(() => {
      loader.classList.add("hide");

      setTimeout(() => {
        loader.style.display = "none";
      }, 800);

      sessionStorage.setItem("loaderShown", "true");
    }, 2000);
  });

} else {
  loader.style.display = "none";
}
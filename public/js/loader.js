const loader = document.getElementById("siteLoader");

window.addEventListener("load", () => {

  if (!sessionStorage.getItem("loaderShown")) {

    setTimeout(() => {
      loader.classList.add("hide");

      setTimeout(() => {
        loader.style.display = "none";
        document.body.classList.remove("loading");
      }, 800);

      sessionStorage.setItem("loaderShown", "true");

    }, 2000);

  } else {
    loader.style.display = "none";
    document.body.classList.remove("loading");
  }

});
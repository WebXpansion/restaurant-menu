export function setFormat(format) {

    const wrapper = document.querySelector(".viewer-wrapper");
  
    if (format === "1:1") {
      wrapper.style.aspectRatio = "1 / 1";
    }
  
    if (format === "9:16") {
      wrapper.style.aspectRatio = "9 / 16";
    }
  
    window.dispatchEvent(new Event("resize"));
  }
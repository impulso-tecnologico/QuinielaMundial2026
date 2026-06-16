(function () {
  const loader = document.getElementById("pageLoader");
  let hideTimeoutId = null;

  function show() {
    if (!loader) return;

    window.clearTimeout(hideTimeoutId);
    loader.hidden = false;
    window.requestAnimationFrame(() => loader.classList.remove("is-hidden"));
  }

  function hide() {
    if (!loader) return;

    loader.classList.add("is-hidden");
    window.clearTimeout(hideTimeoutId);
    hideTimeoutId = window.setTimeout(() => {
      loader.hidden = true;
    }, 220);
  }

  window.QuinielaLoader = { show, hide };

  if (!document.body?.dataset.loaderManual) {
    window.addEventListener("load", hide, { once: true });
  }
})();

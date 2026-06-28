(function () {
  const config = window.QUINIELA_CONFIG || {};
  if (!config.maintenanceMode) return;

  document.title = config.maintenanceTitle || "Quiniela en mantenimiento";
  document.body.classList.add("maintenance-active");

  const overlay = document.createElement("main");
  overlay.className = "maintenance-screen";
  overlay.setAttribute("role", "main");
  overlay.setAttribute("tabindex", "-1");
  overlay.innerHTML = `
    <section class="maintenance-card" aria-labelledby="maintenanceTitle">
      <div class="maintenance-badge">Mantenimiento</div>
      <h1 id="maintenanceTitle">${escapeHtml(config.maintenanceTitle || "Quiniela en mantenimiento")}</h1>
      <p>${escapeHtml(config.maintenanceMessage || "Estamos preparando la siguiente fase de la quiniela.")}</p>
      <div class="maintenance-status" aria-label="Estado de la quiniela">
        <span></span>
        <strong>Fases finales en preparación</strong>
      </div>
    </section>
  `;

  [...document.body.children].forEach(child => {
    child.setAttribute("aria-hidden", "true");
    if ("inert" in child) child.inert = true;
  });

  document.body.appendChild(overlay);
  overlay.focus();

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;"
    }[character]));
  }
})();

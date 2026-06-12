const API_BASE = (window.QUINIELA_CONFIG?.apiBaseUrl || "").replace(/\/$/, "");

const $ = (selector) => document.querySelector(selector);
const rankingPodium = $("#rankingPodium");
const rankingTabla = $("#rankingTabla");
const rankingEstado = $("#rankingEstado");

async function apiJson(url, options = {}) {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Error HTTP ${response.status}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

async function cargarRanking() {
  try {
    rankingEstado.textContent = "Cargando ranking...";
    const ranking = await apiJson("/api/ranking");
    renderizarRanking(ranking);
    rankingEstado.textContent = `${ranking.length} participantes`;
  } catch (error) {
    rankingEstado.textContent = "No se pudo cargar el ranking";
    rankingPodium.innerHTML = `<div class="placeholder" style="grid-column: 1 / -1;">${error.message}</div>`;
    rankingTabla.innerHTML = "";
  }
}

function renderizarRanking(ranking) {
  if (ranking.length === 0) {
    rankingPodium.innerHTML = `<div class="ranking-empty" style="grid-column: 1 / -1;">Todavía no hay participantes con pronósticos evaluados.</div>`;
  } else {
    rankingPodium.innerHTML = [1, 2, 3].map(posicion => {
      const participantes = ranking.filter(participanteRanking => Number(participanteRanking.position) === posicion);
      return renderizarCardPodio(posicion, participantes);
    }).join("");
  }

  if (ranking.length === 0) {
    rankingTabla.innerHTML = `<tr><td colspan="6" class="ranking-empty">Sin datos para mostrar.</td></tr>`;
    return;
  }

  rankingTabla.innerHTML = ranking.map(participanteRanking => `
    <tr>
      <td>${participanteRanking.position}</td>
      <td><span class="participant-with-move">${participanteRanking.name}${renderizarCambioRanking(participanteRanking)}</span></td>
      <td>${participanteRanking.points}</td>
      <td>${participanteRanking.exactScores}</td>
      <td>${participanteRanking.correctResults}</td>
      <td>${participanteRanking.predictionsScored}</td>
    </tr>
  `).join("");
}

function renderizarCardPodio(posicion, participantes) {
  const principal = participantes[0];
  const estadoVacio = participantes.length === 0 ? " podium-card-empty" : "";

  return `
    <article class="podium-card podium-card-position-${posicion}${estadoVacio}">
      <div class="podium-position-wrap">
        <div class="podium-position">${posicion}</div>
        ${renderizarMedallaPodio(posicion)}
      </div>
      ${principal ? `
        <div class="podium-points">${principal.points} pts</div>
        <div class="podium-participants">
          ${participantes.map(participanteRanking => `
            <div class="podium-name"><span class="participant-with-move">${participanteRanking.name}${renderizarCambioRanking(participanteRanking)}</span></div>
          `).join("")}
        </div>
        <div class="podium-meta">${renderizarMetaPodio(participantes)}</div>
      ` : `
        <div class="podium-empty-place">Sin participantes en este lugar</div>
      `}
    </article>
  `;
}

function renderizarMetaPodio(participantes) {
  if (participantes.length > 1) {
    return `${participantes.length} participantes empatados por puntos`;
  }

  const participanteRanking = participantes[0];
  return `${participanteRanking.exactScores} exactos · ${participanteRanking.correctResults} ganador/empate`;
}

function renderizarMedallaPodio(posicion) {
  const medallas = {
    1: { src: "assets/medal-gold.svg", alt: "Medalla de oro" },
    2: { src: "assets/medal-silver.svg", alt: "Medalla de plata" },
    3: { src: "assets/medal-bronze.svg", alt: "Medalla de bronce" }
  };
  const medalla = medallas[posicion];

  if (!medalla) return "";

  return `<img class="podium-medal" src="${medalla.src}" alt="${medalla.alt}" title="${medalla.alt}" />`;
}

function renderizarCambioRanking(participanteRanking) {
  const cambio = Number(participanteRanking.positionChange || 0);

  if (cambio > 0) {
    const texto = `Subió ${cambio} ${cambio === 1 ? "posición" : "posiciones"}`;
    return `<span class="rank-move rank-move-up" title="${texto}" aria-label="${texto}"><span class="rank-move-icon" aria-hidden="true"></span><span>+${cambio}</span></span>`;
  }

  if (cambio < 0) {
    const posiciones = Math.abs(cambio);
    const texto = `Bajó ${posiciones} ${posiciones === 1 ? "posición" : "posiciones"}`;
    return `<span class="rank-move rank-move-down" title="${texto}" aria-label="${texto}"><span class="rank-move-icon" aria-hidden="true"></span><span>${cambio}</span></span>`;
  }

  return `<span class="rank-move rank-move-same" title="Sin cambio" aria-label="Sin cambio">-</span>`;
}

$("#btnActualizarRanking").addEventListener("click", cargarRanking);
cargarRanking();

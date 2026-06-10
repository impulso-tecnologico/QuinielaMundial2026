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
  const topTres = ranking.slice(0, 3);
  const podiumOrdenado = topTres.length === 3 ? [topTres[1], topTres[0], topTres[2]] : topTres;

  if (topTres.length === 0) {
    rankingPodium.innerHTML = `<div class="ranking-empty" style="grid-column: 1 / -1;">Todavía no hay participantes con pronósticos evaluados.</div>`;
  } else {
    rankingPodium.innerHTML = podiumOrdenado.map(participanteRanking => `
      <article class="podium-card">
        <div class="podium-position">${participanteRanking.position}</div>
        <div class="podium-name">${participanteRanking.name}</div>
        <div class="podium-points">${participanteRanking.points} pts</div>
        <div class="podium-meta">${participanteRanking.exactScores} exactos · ${participanteRanking.correctResults} ganador/empate</div>
      </article>
    `).join("");
  }

  if (ranking.length === 0) {
    rankingTabla.innerHTML = `<tr><td colspan="6" class="ranking-empty">Sin datos para mostrar.</td></tr>`;
    return;
  }

  rankingTabla.innerHTML = ranking.map(participanteRanking => `
    <tr>
      <td>${participanteRanking.position}</td>
      <td>${participanteRanking.name}</td>
      <td>${participanteRanking.points}</td>
      <td>${participanteRanking.exactScores}</td>
      <td>${participanteRanking.correctResults}</td>
      <td>${participanteRanking.predictionsScored}</td>
    </tr>
  `).join("");
}

$("#btnActualizarRanking").addEventListener("click", cargarRanking);
cargarRanking();

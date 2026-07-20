const API_BASE = (window.QUINIELA_CONFIG?.apiBaseUrl || "").replace(/\/$/, "");

const $ = (selector) => document.querySelector(selector);

const winnerName = $("#winnerName");
const winnerSummary = $("#winnerSummary");
const winnerPoints = $("#winnerPoints");
const winnerAwardPoints = $("#winnerAwardPoints");
const winnerExactScores = $("#winnerExactScores");
const awardSummary = $("#awardSummary");
const awardResultsList = $("#awardResultsList");
const awardParticipantScores = $("#awardParticipantScores");
const premiosFinalesEstado = $("#premiosFinalesEstado");
const finalRankingTable = $("#finalRankingTable");
const rankingStatus = $("#rankingStatus");

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

function escaparHtml(valor) {
  return String(valor ?? "").replace(/[&<>"']/g, caracter => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  }[caracter]));
}

function pluralizar(total, singular, plural) {
  return `${total} ${total === 1 ? singular : plural}`;
}

function obtenerMedallaRanking(posicion) {
  const medallas = {
    1: { src: "assets/medal-gold.svg", alt: "Medalla de oro" },
    2: { src: "assets/medal-silver.svg", alt: "Medalla de plata" },
    3: { src: "assets/medal-bronze.svg", alt: "Medalla de bronce" }
  };

  return medallas[Number(posicion)] || null;
}

function renderizarGanador(ranking) {
  if (!winnerName || !winnerSummary || !winnerPoints || !winnerAwardPoints || !winnerExactScores) return;

  const ganadores = ranking.filter(participante => Number(participante.position) === 1);
  if (ganadores.length === 0) {
    winnerName.textContent = "Sin ganador definido";
    winnerSummary.textContent = "Aún no hay ranking final disponible.";
    winnerPoints.textContent = "0";
    winnerAwardPoints.textContent = "0";
    winnerExactScores.textContent = "0";
    return;
  }

  const principal = ganadores[0];
  winnerName.textContent = ganadores.map(participante => participante.name).join(", ");
  winnerSummary.textContent = ganadores.length === 1
    ? "Primer lugar del ranking final con partidos y premios individuales sumados."
    : `${pluralizar(ganadores.length, "participante empatado", "participantes empatados")} en el primer lugar final.`;
  winnerPoints.textContent = principal.points ?? 0;
  winnerAwardPoints.textContent = principal.awardPoints ?? 0;
  winnerExactScores.textContent = principal.exactScores ?? 0;
}

function renderizarPremios(scoreboard) {
  if (!awardResultsList || !awardParticipantScores || !awardSummary) return;

  const awards = scoreboard?.awards || [];
  const participantScores = scoreboard?.participantScores || [];
  const maxPoints = Number(scoreboard?.maxPoints) || 0;

  awardSummary.textContent = maxPoints > 0
    ? `Cada premio suma 5 puntos. Máximo posible por participante: ${maxPoints} puntos.`
    : "Configura los ganadores oficiales para sumar los puntos de premios individuales.";
  if (premiosFinalesEstado) {
    premiosFinalesEstado.textContent = maxPoints > 0 ? `${maxPoints} puntos posibles` : "Sin ganadores oficiales";
  }

  if (awards.length === 0) {
    awardResultsList.innerHTML = `<div class="placeholder">Aún no hay ganadores oficiales capturados en AwardResults.</div>`;
  } else {
    awardResultsList.innerHTML = awards.map(award => `
      <article class="voto-card voto-card-ballon premio-final-card">
        <span class="voto-label">${escaparHtml(award.awardName)}</span>
        <strong>${escaparHtml(award.winnerName)}</strong>
        <small>${escaparHtml(award.points)} pts · ${pluralizar(Number(award.correctPredictions) || 0, "acierto", "aciertos")}</small>
      </article>
    `).join("");
  }

  if (participantScores.length === 0) {
    awardParticipantScores.innerHTML = `<div class="placeholder">Ningún participante sumó puntos por premios todavía.</div>`;
    return;
  }

  const filas = participantScores.slice(0, 8).map(participante => `
    <tr>
      <td>${escaparHtml(participante.name)}</td>
      <td>${escaparHtml(participante.awardPoints)} pts</td>
      <td>${pluralizar(Number(participante.correctAwards) || 0, "premio", "premios")}</td>
    </tr>
  `).join("");

  awardParticipantScores.innerHTML = `
    <div class="ranking-table-wrap ranking-compact-wrap premios-finales-tabla">
      <table class="ranking-table ranking-compact">
        <thead>
          <tr>
            <th>Participante</th>
            <th>Puntos</th>
            <th>Aciertos</th>
          </tr>
        </thead>
        <tbody>${filas}</tbody>
      </table>
    </div>
  `;
}

function renderizarRanking(ranking) {
  if (!finalRankingTable || !rankingStatus) return;

  rankingStatus.textContent = ranking.length > 0
    ? `${pluralizar(ranking.length, "participante", "participantes")}`
    : "Sin datos";

  if (ranking.length === 0) {
    finalRankingTable.innerHTML = `<tr><td colspan="5" class="ranking-empty">Sin ranking final para mostrar.</td></tr>`;
    return;
  }

  finalRankingTable.innerHTML = ranking.map(participante => {
    const medalla = obtenerMedallaRanking(participante.position);

    return `
      <tr>
        <td>
          <span class="ranking-medal-wrap">
            ${medalla ? `<img class="ranking-medal" src="${medalla.src}" alt="${medalla.alt}">` : ""}
            <span>${escaparHtml(participante.position)}</span>
          </span>
        </td>
        <td>${escaparHtml(participante.name)}</td>
        <td>${escaparHtml(participante.points)}</td>
        <td>${escaparHtml(participante.awardPoints ?? 0)}</td>
        <td>${escaparHtml(participante.exactScores)}</td>
      </tr>
    `;
  }).join("");
}

function renderizarError(error) {
  const mensaje = escaparHtml(error.message);
  if (winnerName) winnerName.textContent = "No disponible";
  if (winnerSummary) winnerSummary.textContent = `No se pudo cargar el resultado final. ${mensaje}`;
  if (premiosFinalesEstado) premiosFinalesEstado.textContent = "Error al cargar";
  if (awardResultsList) awardResultsList.innerHTML = `<div class="placeholder">No se pudieron cargar los premios. ${mensaje}</div>`;
  if (awardParticipantScores) awardParticipantScores.innerHTML = `<div class="placeholder">No se pudieron calcular los puntos por premios.</div>`;
  if (rankingStatus) rankingStatus.textContent = "Error al cargar";
  if (finalRankingTable) finalRankingTable.innerHTML = `<tr><td colspan="5" class="ranking-empty">No se pudo cargar el ranking final.</td></tr>`;
}

async function iniciar() {
  window.QuinielaLoader?.show();

  try {
    const [ranking, awardScoreboard] = await Promise.all([
      apiJson("/api/ranking"),
      apiJson("/api/awards/final-scoreboard")
    ]);

    renderizarGanador(ranking || []);
    renderizarPremios(awardScoreboard);
    renderizarRanking(ranking || []);
  } catch (error) {
    renderizarError(error);
  } finally {
    window.QuinielaLoader?.hide();
  }
}

iniciar();

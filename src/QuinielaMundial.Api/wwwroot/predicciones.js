const API_BASE = (window.QUINIELA_CONFIG?.apiBaseUrl || "").replace(/\/$/, "");

const $ = (selector) => document.querySelector(selector);
const participanteFiltro = $("#participanteFiltro");
const prediccionesListado = $("#prediccionesListado");
const prediccionesEstado = $("#prediccionesEstado");
const contadorPredicciones = $("#contadorPredicciones");
const tituloOriginal = document.title;

let matches = [];
let participantesDetalle = [];

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

function formatearMarcador(local, visitante) {
  if (local === null || local === undefined || visitante === null || visitante === undefined) return "Sin marcador";
  return `${local} - ${visitante}`;
}

function contarPremios(awards) {
  if (!awards) return 0;
  return [awards.ballonDOr, awards.goldenBoot, awards.goldenGlove].filter(Boolean).length;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function llenarSelector(participants) {
  participanteFiltro.innerHTML = `<option value="TODOS">Todos los participantes</option>`;
  participants.forEach(participant => {
    const option = document.createElement("option");
    option.value = String(participant.id);
    option.textContent = participant.name;
    participanteFiltro.appendChild(option);
  });
}

async function cargarDetalleParticipante(participant) {
  const [predictions, brackets, knockoutPredictions, awards] = await Promise.all([
    apiJson(`/api/participants/${participant.id}/predictions`),
    apiJson(`/api/participants/${participant.id}/knockout-brackets`),
    apiJson(`/api/participants/${participant.id}/knockout-predictions`),
    apiJson(`/api/participants/${participant.id}/award-predictions`)
  ]);

  return { participant, predictions, brackets, knockoutPredictions, awards };
}

async function cargarPredicciones() {
  try {
    prediccionesEstado.textContent = "Cargando predicciones...";
    contadorPredicciones.textContent = "";
    prediccionesListado.innerHTML = `<div class="placeholder">Cargando información guardada.</div>`;

    const [matchesData, participants] = await Promise.all([
      apiJson("/api/matches"),
      apiJson("/api/participants")
    ]);

    matches = matchesData;
    llenarSelector(participants);

    if (participants.length === 0) {
      participantesDetalle = [];
      prediccionesEstado.textContent = "Sin participantes registrados";
      prediccionesListado.innerHTML = `<div class="placeholder">Sin participantes registrados.</div>`;
      return;
    }

    participantesDetalle = await Promise.all(participants.map(cargarDetalleParticipante));
    prediccionesEstado.textContent = "Predicciones cargadas";
    renderizarPredicciones();
  } catch (error) {
    prediccionesEstado.textContent = "No se pudieron cargar las predicciones";
    contadorPredicciones.textContent = "";
    prediccionesListado.innerHTML = `<div class="placeholder">${escapeHtml(error.message)}</div>`;
  }
}

function obtenerDetallesFiltrados() {
  const filtro = participanteFiltro.value;
  if (filtro === "TODOS") return participantesDetalle;
  return participantesDetalle.filter(detalle => String(detalle.participant.id) === filtro);
}

function renderizarPredicciones() {
  const detalles = obtenerDetallesFiltrados();
  contadorPredicciones.textContent = `${detalles.length} participante${detalles.length === 1 ? "" : "s"}`;

  if (detalles.length === 0) {
    prediccionesListado.innerHTML = `<div class="placeholder">No hay participantes para mostrar.</div>`;
    return;
  }

  prediccionesListado.innerHTML = detalles.map(renderizarParticipante).join("");
}

function renderizarParticipante(detalle) {
  const groupPredictions = detalle.predictions
    .map(prediction => ({ prediction, match: matches.find(match => match.id === prediction.matchId) }))
    .filter(item => item.match?.group)
    .sort((a, b) => a.match.matchNumber - b.match.matchNumber);

  const knockoutByNumber = new Map(detalle.knockoutPredictions.map(prediction => [prediction.bracketMatchNumber, prediction]));
  const knockoutRows = [...detalle.brackets]
    .sort((a, b) => a.bracketMatchNumber - b.bracketMatchNumber)
    .map(bracket => ({ bracket, prediction: knockoutByNumber.get(bracket.bracketMatchNumber) }));

  const premiosCapturados = contarPremios(detalle.awards);

  return `
    <article class="podium-card predicciones-participante" data-participant-id="${detalle.participant.id}">
      <div class="section-title" style="margin-top: 0;">
        <h2>${escapeHtml(detalle.participant.name)}</h2>
        <small>${groupPredictions.length} grupos · ${knockoutRows.length} cruces</small>
      </div>

      <div class="resumen predicciones-resumen" style="display: grid;">
        <div class="stat">
          <span>Grupos</span>
          <strong>${groupPredictions.length}</strong>
        </div>
        <div class="stat">
          <span>Cruces</span>
          <strong>${knockoutRows.length}</strong>
        </div>
        <div class="stat">
          <span>Marcadores KO</span>
          <strong>${detalle.knockoutPredictions.length}</strong>
        </div>
        <div class="stat">
          <span>Premios</span>
          <strong>${premiosCapturados}</strong>
        </div>
      </div>

      ${renderizarTablaGrupos(groupPredictions)}
      ${renderizarTablaKnockout(knockoutRows)}
      ${renderizarPremios(detalle.awards)}
    </article>
  `;
}

function imprimirParticipanteSeleccionado() {
  if (participanteFiltro.value === "TODOS") {
    prediccionesEstado.textContent = "Selecciona un participante para imprimir sus predicciones.";
    participanteFiltro.focus();
    alert("Selecciona un participante para imprimir sus predicciones.");
    return;
  }

  const detalle = participantesDetalle.find(item => String(item.participant.id) === participanteFiltro.value);
  if (!detalle) {
    prediccionesEstado.textContent = "No se encontró el participante seleccionado.";
    return;
  }

  document.title = `Predicciones - ${detalle.participant.name}`;
  window.print();
}

function renderizarTablaGrupos(groupPredictions) {
  if (groupPredictions.length === 0) {
    return `<div class="placeholder">Sin predicciones de fase de grupos.</div>`;
  }

  return `
    <div class="section-title">
      <h2>Fase de grupos</h2>
      <small>${groupPredictions.length} partidos</small>
    </div>
    <div class="ranking-table-wrap">
      <table class="ranking-table">
        <thead>
          <tr>
            <th>Partido</th>
            <th>Grupo</th>
            <th>Local</th>
            <th>Pronóstico</th>
            <th>Visitante</th>
          </tr>
        </thead>
        <tbody>
          ${groupPredictions.map(({ prediction, match }) => `
            <tr>
              <td>${match.matchNumber}</td>
              <td>Grupo ${escapeHtml(match.group)}</td>
              <td>${escapeHtml(match.homeTeam)}</td>
              <td>${formatearMarcador(prediction.homeScore, prediction.awayScore)}</td>
              <td>${escapeHtml(match.awayTeam)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderizarTablaKnockout(knockoutRows) {
  if (knockoutRows.length === 0) {
    return `<div class="placeholder">Sin cruces de eliminación directa guardados.</div>`;
  }

  return `
    <div class="section-title">
      <h2>Fases finales</h2>
      <small>${knockoutRows.length} cruces</small>
    </div>
    <div class="ranking-table-wrap">
      <table class="ranking-table">
        <thead>
          <tr>
            <th>Partido llave</th>
            <th>Ronda</th>
            <th>Local</th>
            <th>Pronóstico</th>
            <th>Visitante</th>
          </tr>
        </thead>
        <tbody>
          ${knockoutRows.map(({ bracket, prediction }) => `
            <tr>
              <td>${bracket.bracketMatchNumber}</td>
              <td>${escapeHtml(bracket.roundName)}</td>
              <td>${escapeHtml(bracket.homeTeamName)}<br><small>${escapeHtml(bracket.homeSource || "")}</small></td>
              <td>${prediction ? formatearMarcador(prediction.homeScore, prediction.awayScore) : "Sin marcador"}</td>
              <td>${escapeHtml(bracket.awayTeamName)}<br><small>${escapeHtml(bracket.awaySource || "")}</small></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderizarPremios(awards) {
  const balon = awards?.ballonDOr || "Sin capturar";
  const bota = awards?.goldenBoot || "Sin capturar";
  const guante = awards?.goldenGlove || "Sin capturar";

  if (!awards || contarPremios(awards) === 0) {
    return `<div class="placeholder">Sin premios individuales capturados.</div>`;
  }

  return `
    <div class="section-title">
      <h2>Premios individuales</h2>
      <small>${contarPremios(awards)} capturados</small>
    </div>
    <div class="premios-grid">
      <div>
        <label>Balón de oro</label>
        <strong>${escapeHtml(balon)}</strong>
      </div>
      <div>
        <label>Bota de oro</label>
        <strong>${escapeHtml(bota)}</strong>
      </div>
      <div>
        <label>Guante de oro</label>
        <strong>${escapeHtml(guante)}</strong>
      </div>
    </div>
  `;
}

participanteFiltro.addEventListener("change", renderizarPredicciones);
$("#btnActualizarPredicciones").addEventListener("click", cargarPredicciones);
$("#btnImprimirParticipante").addEventListener("click", imprimirParticipanteSeleccionado);
window.addEventListener("afterprint", () => {
  document.title = tituloOriginal;
});
cargarPredicciones();

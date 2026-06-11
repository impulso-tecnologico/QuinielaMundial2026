const API_BASE = (window.QUINIELA_CONFIG?.apiBaseUrl || "").replace(/\/$/, "");

const $ = (selector) => document.querySelector(selector);
const registradorResultado = $("#registradorResultado");
const adminGrupoFiltro = $("#adminGrupoFiltro");
const adminBuscar = $("#adminBuscar");
const adminResultadosEstado = $("#adminResultadosEstado");
const adminResultadosContador = $("#adminResultadosContador");
const adminResultadosListado = $("#adminResultadosListado");

let partidos = [];
let participantes = [];

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

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizarTexto(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function formatearFecha(valor) {
  const fecha = new Date(valor);
  return fecha.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" }).replace(/\./g, "");
}

function formatearHora(valor) {
  return String(valor || "").slice(0, 5);
}

function etiquetaPartido(partido) {
  return partido.group ? `Grupo ${partido.group}` : partido.stageName;
}

function llenarParticipantes() {
  registradorResultado.innerHTML = "";

  if (participantes.length === 0) {
    registradorResultado.innerHTML = `<option value="">Sin participantes disponibles</option>`;
    return;
  }

  participantes.forEach(participante => {
    const option = document.createElement("option");
    option.value = String(participante.id);
    option.textContent = participante.name;
    registradorResultado.appendChild(option);
  });
}

function llenarFiltroGrupo() {
  const valorActual = adminGrupoFiltro.value;
  const opciones = new Map();

  partidos.forEach(partido => {
    if (partido.group) opciones.set(`GRUPO:${partido.group}`, `Grupo ${partido.group}`);
    else opciones.set(`ETAPA:${partido.stageName}`, partido.stageName);
  });

  adminGrupoFiltro.innerHTML = `<option value="TODOS">Todos los partidos</option>`;
  [...opciones.entries()].sort((a, b) => a[1].localeCompare(b[1], "es")).forEach(([value, label]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    adminGrupoFiltro.appendChild(option);
  });

  if ([...adminGrupoFiltro.options].some(option => option.value === valorActual)) {
    adminGrupoFiltro.value = valorActual;
  }
}

function obtenerPartidosFiltrados() {
  const filtroGrupo = adminGrupoFiltro.value;
  const texto = normalizarTexto(adminBuscar.value.trim());

  return partidos.filter(partido => {
    const coincideGrupo = filtroGrupo === "TODOS"
      || (filtroGrupo.startsWith("GRUPO:") && partido.group === filtroGrupo.replace("GRUPO:", ""))
      || (filtroGrupo.startsWith("ETAPA:") && partido.stageName === filtroGrupo.replace("ETAPA:", ""));
    const textoPartido = normalizarTexto(`${partido.homeTeam} ${partido.awayTeam} ${partido.stadium} ${partido.city} ${partido.matchNumber}`);
    return coincideGrupo && (!texto || textoPartido.includes(texto));
  });
}

function renderizarResultados() {
  const filtrados = obtenerPartidosFiltrados();
  adminResultadosContador.textContent = `${filtrados.length} de ${partidos.length} partidos`;

  if (filtrados.length === 0) {
    adminResultadosListado.innerHTML = `<div class="placeholder">No hay partidos con esos filtros.</div>`;
    return;
  }

  adminResultadosListado.innerHTML = filtrados.map(partido => `
    <article class="resultado-card" data-match-id="${partido.id}">
      <div class="partido-header">
        <span class="match-id">Partido ${escapeHtml(partido.matchNumber)}</span>
        <span class="grupo">${escapeHtml(etiquetaPartido(partido))}</span>
      </div>
      <div class="fecha">
        <strong>${escapeHtml(formatearFecha(partido.matchDate))}</strong> · ${escapeHtml(formatearHora(partido.matchTime))} hrs · ${escapeHtml(partido.stadium)} · ${escapeHtml(partido.city)}
      </div>
      <div class="resultado-captura">
        <div class="resultado-equipo-local">${escapeHtml(partido.homeTeam)}</div>
        <input type="number" min="0" inputmode="numeric" data-score="home" value="${partido.homeScore ?? ""}" aria-label="Goles de ${escapeHtml(partido.homeTeam)}">
        <span class="separador">-</span>
        <input type="number" min="0" inputmode="numeric" data-score="away" value="${partido.awayScore ?? ""}" aria-label="Goles de ${escapeHtml(partido.awayTeam)}">
        <div class="resultado-equipo-visitante">${escapeHtml(partido.awayTeam)}</div>
        <button class="btn-primary" data-guardar-resultado>Guardar</button>
      </div>
    </article>
  `).join("");
}

async function guardarResultado(card, boton) {
  const participantId = Number(registradorResultado.value);
  if (!participantId) {
    alert("Selecciona quién registra el resultado.");
    registradorResultado.focus();
    return;
  }

  const matchId = Number(card.dataset.matchId);
  const partido = partidos.find(item => item.id === matchId);
  const homeScore = Number(card.querySelector('[data-score="home"]').value);
  const awayScore = Number(card.querySelector('[data-score="away"]').value);

  if (!Number.isInteger(homeScore) || homeScore < 0 || !Number.isInteger(awayScore) || awayScore < 0) {
    alert("Captura marcadores válidos para ambos equipos.");
    return;
  }

  boton.disabled = true;
  adminResultadosEstado.textContent = `Guardando resultado del Partido ${partido.matchNumber}...`;

  try {
    await apiJson(`/api/matches/${matchId}/result`, {
      method: "PUT",
      body: JSON.stringify({ homeScore, awayScore, registeredByParticipantId: participantId })
    });

    partido.homeScore = homeScore;
    partido.awayScore = awayScore;
    adminResultadosEstado.textContent = `Resultado guardado para Partido ${partido.matchNumber}.`;
    adminResultadosEstado.className = "guardar-estado ok";
  } catch (error) {
    adminResultadosEstado.textContent = `No se pudo guardar. ${error.message}`;
    adminResultadosEstado.className = "guardar-estado error";
  } finally {
    boton.disabled = false;
  }
}

async function cargarDatos() {
  try {
    adminResultadosEstado.className = "guardar-estado";
    adminResultadosEstado.textContent = "Cargando partidos...";
    adminResultadosListado.innerHTML = `<div class="placeholder">Cargando partidos.</div>`;

    const [matchesData, participantsData] = await Promise.all([
      apiJson("/api/matches"),
      apiJson("/api/participants")
    ]);

    partidos = matchesData;
    participantes = participantsData;
    llenarParticipantes();
    llenarFiltroGrupo();
    renderizarResultados();
    adminResultadosEstado.textContent = "Partidos cargados.";
  } catch (error) {
    adminResultadosEstado.className = "guardar-estado error";
    adminResultadosEstado.textContent = "No se pudieron cargar los datos.";
    adminResultadosListado.innerHTML = `<div class="placeholder">${escapeHtml(error.message)}</div>`;
  }
}

adminResultadosListado.addEventListener("click", (event) => {
  const boton = event.target.closest("[data-guardar-resultado]");
  if (!boton) return;

  const card = boton.closest(".resultado-card");
  if (card) guardarResultado(card, boton);
});

adminGrupoFiltro.addEventListener("change", renderizarResultados);
adminBuscar.addEventListener("input", renderizarResultados);
$("#btnActualizarResultados").addEventListener("click", cargarDatos);
cargarDatos();

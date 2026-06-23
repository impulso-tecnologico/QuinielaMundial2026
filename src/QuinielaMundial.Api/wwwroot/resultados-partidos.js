const API_BASE = (window.QUINIELA_CONFIG?.apiBaseUrl || "").replace(/\/$/, "");

const $ = (selector) => document.querySelector(selector);
const resultadosPartidos = $("#resultadosPartidos");
const resultadosPartidosEstado = $("#resultadosPartidosEstado");
const contadorResultadosPartidos = $("#contadorResultadosPartidos");
const btnActualizarResultadosPartidos = $("#btnActualizarResultadosPartidos");
const resultadosParticipantesModal = $("#resultadosParticipantesModal");
const resultadosModalTitulo = $("#resultadosModalTitulo");
const resultadosModalDetalle = $("#resultadosModalDetalle");
const resultadosModalContenido = $("#resultadosModalContenido");
const cerrarResultadosModal = $("#cerrarResultadosModal");
const grupoResultadoFiltro = $("#grupoResultadoFiltro");
const equipoResultadoFiltro = $("#equipoResultadoFiltro");

let partidos = [];
const resultadosPorPartido = new Map();
let partidoModalActual = null;

const CODIGOS_BANDERA_EQUIPOS = {
  "alemania": "de",
  "arabia saudita": "sa",
  "argelia": "dz",
  "argentina": "ar",
  "australia": "au",
  "austria": "at",
  "belgica": "be",
  "bosnia y herzegovina": "ba",
  "brasil": "br",
  "cabo verde": "cv",
  "canada": "ca",
  "chequia": "cz",
  "colombia": "co",
  "corea del sur": "kr",
  "costa de marfil": "ci",
  "croacia": "hr",
  "curazao": "cw",
  "ecuador": "ec",
  "egipto": "eg",
  "escocia": "gb-sct",
  "espana": "es",
  "estados unidos": "us",
  "francia": "fr",
  "ghana": "gh",
  "haiti": "ht",
  "inglaterra": "gb-eng",
  "irak": "iq",
  "iran": "ir",
  "japon": "jp",
  "jordania": "jo",
  "marruecos": "ma",
  "mexico": "mx",
  "noruega": "no",
  "nueva zelanda": "nz",
  "paises bajos": "nl",
  "panama": "pa",
  "paraguay": "py",
  "portugal": "pt",
  "qatar": "qa",
  "rd congo": "cd",
  "republica democratica del congo": "cd",
  "senegal": "sn",
  "sudafrica": "za",
  "suecia": "se",
  "suiza": "ch",
  "tunez": "tn",
  "turquia": "tr",
  "uruguay": "uy",
  "uzbekistan": "uz"
};

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

function normalizarNombreEquipo(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function obtenerRutaBandera(nombreEquipo) {
  const codigo = CODIGOS_BANDERA_EQUIPOS[normalizarNombreEquipo(nombreEquipo)];
  return codigo ? `assets/flags/4x3/${codigo}.svg` : "";
}

function renderizarBanderaEquipo(nombreEquipo) {
  const ruta = obtenerRutaBandera(nombreEquipo);
  if (!ruta) return "";

  return `<img class="flag-equipo resultado-flag" src="${ruta}" alt="Bandera de ${escaparHtml(nombreEquipo)}" loading="lazy">`;
}

function renderizarEquipoConBandera(nombreEquipo, lado) {
  const claseLado = lado ? ` resultado-equipo-${lado}` : "";

  return `
    <span class="resultado-equipo-con-bandera${claseLado}">
      ${renderizarBanderaEquipo(nombreEquipo)}
      <span>${escaparHtml(nombreEquipo)}</span>
    </span>
  `;
}

function setOptions(select, defaultLabel, options) {
  if (!select) return;

  const valorActual = select.value;
  select.innerHTML = `<option value="TODOS">${defaultLabel}</option>`;

  options.forEach(optionData => {
    const option = document.createElement("option");
    option.value = optionData.value;
    option.textContent = optionData.label;
    select.appendChild(option);
  });

  if ([...select.options].some(option => option.value === valorActual)) {
    select.value = valorActual;
  }
}

function llenarFiltros() {
  const grupos = [...new Set(partidos.map(partido => partido.group).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "es"))
    .map(grupo => ({ value: grupo, label: `Grupo ${grupo}` }));

  const equipos = new Set();
  partidos.forEach(partido => {
    if (partido.homeTeam) equipos.add(partido.homeTeam);
    if (partido.awayTeam) equipos.add(partido.awayTeam);
  });

  setOptions(grupoResultadoFiltro, "Todos los grupos", grupos);
  setOptions(equipoResultadoFiltro, "Todos los equipos", [...equipos]
    .sort((a, b) => a.localeCompare(b, "es"))
    .map(equipo => ({ value: equipo, label: equipo })));
}

function obtenerPartidosFiltrados() {
  const grupo = grupoResultadoFiltro?.value || "TODOS";
  const equipo = equipoResultadoFiltro?.value || "TODOS";

  return partidos.filter(partido => {
    if (grupo !== "TODOS" && partido.group !== grupo) return false;
    if (equipo !== "TODOS" && normalizarNombreEquipo(partido.homeTeam) !== normalizarNombreEquipo(equipo) && normalizarNombreEquipo(partido.awayTeam) !== normalizarNombreEquipo(equipo)) return false;
    return true;
  });
}

function formatearMarcador(local, visitante) {
  if (local === null || local === undefined || visitante === null || visitante === undefined) return "Sin resultado";
  return `${local} - ${visitante}`;
}

function obtenerClaveFechaPartido(valor) {
  const match = String(valor || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : "";
}

function formatearFecha(valor) {
  const clave = obtenerClaveFechaPartido(valor);
  if (!clave) return "Fecha por definir";

  const [year, month, day] = clave.split("-").map(Number);
  return new Date(year, month - 1, day)
    .toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })
    .replace(/\./g, "");
}

function formatearHora(valor) {
  return String(valor || "").slice(0, 5);
}

function obtenerEtiquetaEtapa(partido) {
  if (partido.group) return `Grupo ${partido.group}`;
  return partido.stageName || "Etapa por definir";
}

function tieneResultado(partido) {
  return partido.homeScore !== null && partido.homeScore !== undefined && partido.awayScore !== null && partido.awayScore !== undefined;
}

function obtenerSignoMarcador(local, visitante) {
  return Math.sign(Number(local) - Number(visitante));
}

function obtenerClaseResultadoParticipante(resultado, partido) {
  if (!partido || !tieneResultado(partido)) return "";

  const marcadorExacto = resultado.homeScore === partido.homeScore && resultado.awayScore === partido.awayScore;
  if (marcadorExacto) return "resultado-participante-exacto";

  const acertoGanador = obtenerSignoMarcador(resultado.homeScore, resultado.awayScore) === obtenerSignoMarcador(partido.homeScore, partido.awayScore);
  return acertoGanador ? "resultado-participante-correcto" : "";
}

function renderizarTablaParticipantes(resultados, partido) {
  if (!resultados.length) {
    return `<div class="placeholder resultados-participantes-empty">Sin resultados guardados por participantes para este partido.</div>`;
  }

  const filas = resultados.map(resultado => `
    <tr class="${obtenerClaseResultadoParticipante(resultado, partido)}">
      <td>${escaparHtml(resultado.participantName)}</td>
      <td>${escaparHtml(formatearMarcador(resultado.homeScore, resultado.awayScore))}</td>
    </tr>
  `).join("");

  return `
    <div class="ranking-table-wrap resultados-participantes-wrap">
      <table class="ranking-table resultados-participantes-table">
        <thead>
          <tr>
            <th>Participante</th>
            <th>Resultado</th>
          </tr>
        </thead>
        <tbody>${filas}</tbody>
      </table>
    </div>
  `;
}

function renderizarPartido(partido) {
  const marcador = formatearMarcador(partido.homeScore, partido.awayScore);
  const resultadoClase = tieneResultado(partido) ? "" : " resultado-partido-pendiente";

  return `
    <article class="resultado-partido-card${resultadoClase}" data-match-id="${partido.id}">
      <div class="resultado-partido-head">
        <span>Partido ${escaparHtml(partido.matchNumber)}</span>
        <span>${escaparHtml(obtenerEtiquetaEtapa(partido))}</span>
      </div>

      <div class="resultado-partido-main">
        <strong>${renderizarEquipoConBandera(partido.homeTeam, "local")}</strong>
        <div class="resultado-partido-marcador">${escaparHtml(marcador)}</div>
        <strong>${renderizarEquipoConBandera(partido.awayTeam, "visitante")}</strong>
      </div>

      <p class="resultado-partido-meta">
        ${escaparHtml(formatearFecha(partido.matchDate))} · ${escaparHtml(formatearHora(partido.matchTime))} hrs · ${escaparHtml(partido.stadium)} · ${escaparHtml(partido.city)}
      </p>

      <button class="btn-secondary resultado-participantes-btn" type="button" data-match-results="${partido.id}">
        Ver resultados de participantes
      </button>
    </article>
  `;
}

function renderizarPartidos() {
  const partidosFiltrados = obtenerPartidosFiltrados();
  const total = partidosFiltrados.length;
  const conResultado = partidosFiltrados.filter(tieneResultado).length;
  contadorResultadosPartidos.textContent = `${conResultado} con resultado de ${total} partido${total === 1 ? "" : "s"}`;

  if (!total) {
    resultadosPartidos.innerHTML = `<div class="placeholder">No hay partidos para mostrar con esos filtros.</div>`;
    return;
  }

  resultadosPartidos.innerHTML = partidosFiltrados.map(renderizarPartido).join("");
}

function abrirModalResultados(partido) {
  if (!resultadosParticipantesModal || !resultadosModalTitulo || !resultadosModalDetalle || !resultadosModalContenido) return;

  partidoModalActual = partido;
  resultadosModalTitulo.textContent = `Partido ${partido.matchNumber}: ${partido.homeTeam} vs ${partido.awayTeam}`;
  resultadosModalDetalle.textContent = `${formatearFecha(partido.matchDate)} · ${formatearMarcador(partido.homeScore, partido.awayScore)}`;
  resultadosModalContenido.innerHTML = `<div class="placeholder resultados-participantes-empty">Cargando resultados de participantes...</div>`;
  resultadosParticipantesModal.hidden = false;
  document.body.classList.add("modal-open");
  cerrarResultadosModal?.focus();
}

function cerrarModalResultados() {
  if (!resultadosParticipantesModal) return;

  resultadosParticipantesModal.hidden = true;
  document.body.classList.remove("modal-open");
  partidoModalActual = null;
}

async function mostrarResultadosParticipantes(boton) {
  const partidoId = Number(boton.dataset.matchResults);
  const partido = partidos.find(item => item.id === partidoId);
  if (!partido) return;

  abrirModalResultados(partido);
  if (resultadosPorPartido.has(partidoId)) {
    resultadosModalContenido.innerHTML = renderizarTablaParticipantes(resultadosPorPartido.get(partidoId), partido);
    return;
  }

  try {
    const resultados = await apiJson(`/api/matches/${partidoId}/participant-results`);
    resultadosPorPartido.set(partidoId, resultados);
    if (partidoModalActual?.id === partidoId) {
      resultadosModalContenido.innerHTML = renderizarTablaParticipantes(resultados, partido);
    }
  } catch (error) {
    if (partidoModalActual?.id === partidoId) {
      resultadosModalContenido.innerHTML = `<div class="placeholder resultados-participantes-empty">${escaparHtml(error.message)}</div>`;
    }
  }
}

async function cargarPartidos() {
  window.QuinielaLoader?.show();

  try {
    resultadosPartidosEstado.textContent = "Cargando partidos...";
    contadorResultadosPartidos.textContent = "";
    resultadosPartidos.innerHTML = `<div class="placeholder">Cargando resultados.</div>`;
    resultadosPorPartido.clear();

    partidos = await apiJson("/api/matches");
    llenarFiltros();
    resultadosPartidosEstado.textContent = "Resultados cargados";
    renderizarPartidos();
  } catch (error) {
    resultadosPartidosEstado.textContent = "No se pudieron cargar los resultados";
    contadorResultadosPartidos.textContent = "";
    resultadosPartidos.innerHTML = `<div class="placeholder">${escaparHtml(error.message)}</div>`;
  } finally {
    window.QuinielaLoader?.hide();
  }
}

resultadosPartidos?.addEventListener("click", event => {
  const boton = event.target.closest("[data-match-results]");
  if (!boton) return;
  mostrarResultadosParticipantes(boton);
});

btnActualizarResultadosPartidos?.addEventListener("click", cargarPartidos);
grupoResultadoFiltro?.addEventListener("change", renderizarPartidos);
equipoResultadoFiltro?.addEventListener("change", renderizarPartidos);
cerrarResultadosModal?.addEventListener("click", cerrarModalResultados);
resultadosParticipantesModal?.addEventListener("click", event => {
  if (event.target === resultadosParticipantesModal) cerrarModalResultados();
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !resultadosParticipantesModal?.hidden) cerrarModalResultados();
});

cargarPartidos();

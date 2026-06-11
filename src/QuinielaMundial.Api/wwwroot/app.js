const API_BASE = (window.QUINIELA_CONFIG?.apiBaseUrl || "").replace(/\/$/, "");

const $ = (selector) => document.querySelector(selector);
const contenedorPartidos = $("#partidos");
const contadorVista = $("#contadorVista");
const fechaPartidosTitulo = $("#fechaPartidosTitulo");
const fechaPartidosDetalle = $("#fechaPartidosDetalle");
const topRankingTabla = $("#topRankingTabla");
const topRankingEstado = $("#topRankingEstado");
const finalWinnerName = $("#finalWinnerName");
const finalWinnerVotes = $("#finalWinnerVotes");
const ballonDOrName = $("#ballonDOrName");
const ballonDOrVotes = $("#ballonDOrVotes");

let partidos = [];

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

function renderizarBanderaEquipo(nombreEquipo, className = "") {
  const ruta = obtenerRutaBandera(nombreEquipo);
  if (!ruta) return "";

  return `<img class="flag-equipo ${className}" src="${ruta}" alt="Bandera de ${escaparHtml(nombreEquipo)}" loading="lazy">`;
}

function renderizarEquipoConBandera(nombreEquipo, modificador = "") {
  const clase = modificador ? ` equipo-bandera-${modificador}` : "";

  return `
    <span class="equipo-con-bandera${clase}">
      ${renderizarBanderaEquipo(nombreEquipo)}
      <span>${escaparHtml(nombreEquipo)}</span>
    </span>
  `;
}

function obtenerClaveFechaLocal(fecha) {
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, "0");
  const day = String(fecha.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function obtenerClaveFechaPartido(valor) {
  if (!valor) return "";

  const texto = String(valor);
  const match = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;

  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return "";
  return obtenerClaveFechaLocal(fecha);
}

function crearFechaDesdeClave(clave) {
  const [year, month, day] = clave.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatearFechaClave(clave) {
  if (!clave) return "Fecha por definir";

  return crearFechaDesdeClave(clave)
    .toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })
    .replace(/\./g, "");
}

function formatearHora(valor) {
  return String(valor || "").slice(0, 5);
}

function valorMarcador(valor) {
  if (valor === null || valor === undefined || valor === "") return null;
  const numero = Number(valor);
  return Number.isInteger(numero) && numero >= 0 ? numero : null;
}

function mapearPartido(apiMatch) {
  const fechaClave = obtenerClaveFechaPartido(apiMatch.matchDate);

  return {
    id: apiMatch.id,
    numero: apiMatch.matchNumber,
    fechaClave,
    fecha: formatearFechaClave(fechaClave),
    hora: formatearHora(apiMatch.matchTime),
    grupo: apiMatch.group || "",
    etapa: apiMatch.stageName || "",
    local: apiMatch.homeTeam || "Por definir",
    visitante: apiMatch.awayTeam || "Por definir",
    estadio: apiMatch.stadium || "Sede por definir",
    ciudad: apiMatch.city || "Ciudad por definir",
    realLocal: apiMatch.homeScore,
    realVisitante: apiMatch.awayScore
  };
}

function seleccionarPartidosPorFecha(partidosDisponibles) {
  const fechas = [...new Set(partidosDisponibles.map(partido => partido.fechaClave).filter(Boolean))].sort();
  const hoy = obtenerClaveFechaLocal(new Date());

  if (fechas.length === 0) {
    return { fecha: "", tipo: "sin-fechas", partidos: [] };
  }

  if (fechas.includes(hoy)) {
    return { fecha: hoy, tipo: "hoy", partidos: partidosDisponibles.filter(partido => partido.fechaClave === hoy) };
  }

  const proximaFecha = fechas.find(fecha => fecha > hoy);
  if (proximaFecha) {
    return { fecha: proximaFecha, tipo: "proxima", partidos: partidosDisponibles.filter(partido => partido.fechaClave === proximaFecha) };
  }

  const ultimaFecha = fechas[fechas.length - 1];
  return { fecha: ultimaFecha, tipo: "ultima", partidos: partidosDisponibles.filter(partido => partido.fechaClave === ultimaFecha) };
}

function describirSeleccionFecha(seleccion) {
  if (seleccion.tipo === "hoy") return "Partidos de hoy";
  if (seleccion.tipo === "proxima") return `Próximos partidos: ${formatearFechaClave(seleccion.fecha)}`;
  if (seleccion.tipo === "ultima") return `Últimos partidos disponibles: ${formatearFechaClave(seleccion.fecha)}`;
  return "Partidos";
}

function renderizarPartido(partido) {
  const marcadorLocal = valorMarcador(partido.realLocal);
  const marcadorVisitante = valorMarcador(partido.realVisitante);
  const tieneResultado = marcadorLocal !== null && marcadorVisitante !== null;
  const centro = tieneResultado ? `${marcadorLocal} - ${marcadorVisitante}` : "VS";

  return `
    <article class="partido partido-publico">
      <div class="partido-header">
        <span class="match-id">Partido ${escaparHtml(partido.numero)}</span>
        <span class="grupo">${escaparHtml(partido.grupo ? `Grupo ${partido.grupo}` : partido.etapa)}</span>
      </div>

      <div class="fecha">
        <strong>${escaparHtml(partido.fecha)}</strong> · ${escaparHtml(partido.hora)} hrs · Hora local del estadio
      </div>

      <div class="equipos equipos-publicos">
        <div class="equipo-local">${renderizarEquipoConBandera(partido.local, "local")}</div>
        <div class="vs ${tieneResultado ? "marcador-real" : ""}">${escaparHtml(centro)}</div>
        <div>${renderizarEquipoConBandera(partido.visitante)}</div>
      </div>

      <div class="partido-header">
        <div class="sede">${escaparHtml(partido.estadio)}<br>${escaparHtml(partido.ciudad)}</div>
      </div>
    </article>
  `;
}

async function cargarPartidos() {
  if (!contenedorPartidos) return;

  const data = await apiJson("/api/matches");
  partidos = data.map(mapearPartido);
  const seleccion = seleccionarPartidosPorFecha(partidos);

  fechaPartidosTitulo.textContent = describirSeleccionFecha(seleccion);
  fechaPartidosDetalle.textContent = seleccion.fecha
    ? `${formatearFechaClave(seleccion.fecha)} · ${seleccion.partidos.length} partido${seleccion.partidos.length === 1 ? "" : "s"}`
    : "Sin partidos programados.";
  contadorVista.textContent = `${seleccion.partidos.length} de ${partidos.length} partidos`;

  if (seleccion.partidos.length === 0) {
    contenedorPartidos.innerHTML = `<div class="placeholder" style="grid-column: 1 / -1;">No hay partidos disponibles para mostrar.</div>`;
    return;
  }

  contenedorPartidos.innerHTML = seleccion.partidos.map(renderizarPartido).join("");
}

function renderizarTopRanking(ranking) {
  if (!topRankingTabla) return;

  const topTres = ranking.slice(0, 3);
  topRankingEstado.textContent = ranking.length > 0 ? "Ranking general" : "Sin datos";

  if (topTres.length === 0) {
    topRankingTabla.innerHTML = `<tr><td colspan="3" class="ranking-empty">Todavía no hay ranking disponible.</td></tr>`;
    return;
  }

  topRankingTabla.innerHTML = topTres.map(participanteRanking => {
    const medalla = obtenerMedallaRanking(participanteRanking.position);

    return `
    <tr>
      <td>
        <span class="ranking-medal-wrap">
          ${medalla ? `<img class="ranking-medal" src="${medalla.src}" alt="${medalla.alt}">` : ""}
          <span>${escaparHtml(participanteRanking.position)}</span>
        </span>
      </td>
      <td>${escaparHtml(participanteRanking.name)}</td>
      <td>${escaparHtml(participanteRanking.points)}</td>
    </tr>
  `;
  }).join("");
}

function obtenerMedallaRanking(posicion) {
  const medallas = {
    1: { src: "assets/medal-gold.svg", alt: "Medalla de oro" },
    2: { src: "assets/medal-silver.svg", alt: "Medalla de plata" },
    3: { src: "assets/medal-bronze.svg", alt: "Medalla de bronce" }
  };

  return medallas[Number(posicion)] || null;
}

async function cargarTopRanking() {
  if (!topRankingTabla) return;

  try {
    topRankingEstado.textContent = "Cargando ranking...";
    const ranking = await apiJson("/api/ranking");
    renderizarTopRanking(ranking);
  } catch (error) {
    topRankingEstado.textContent = "No se pudo cargar el ranking";
    topRankingTabla.innerHTML = `<tr><td colspan="3" class="ranking-empty">No se pudo cargar el Top 3. ${escaparHtml(error.message)}</td></tr>`;
  }
}

function formatearVotos(votos) {
  const total = Number(votos) || 0;
  return `${total} voto${total === 1 ? "" : "s"}`;
}

function pintarHighlight(nombreElemento, votosElemento, dato, etiquetaSinDatos, mostrarBandera = false) {
  if (!nombreElemento || !votosElemento) return;

  if (!dato?.name) {
    nombreElemento.textContent = etiquetaSinDatos;
    votosElemento.textContent = "Sin votos registrados";
    return;
  }

  if (mostrarBandera) {
    nombreElemento.innerHTML = renderizarEquipoConBandera(dato.name, "highlight");
  } else {
    nombreElemento.textContent = dato.name;
  }
  votosElemento.textContent = formatearVotos(dato.votes);
}

async function cargarHighlights() {
  if (!finalWinnerName && !ballonDOrName) return;

  try {
    const highlights = await apiJson("/api/highlights");
    pintarHighlight(finalWinnerName, finalWinnerVotes, highlights.finalWinner, "Sin favorito definido", true);
    pintarHighlight(ballonDOrName, ballonDOrVotes, highlights.ballonDOr, "Sin favorito definido");
  } catch (error) {
    if (finalWinnerName) finalWinnerName.textContent = "No disponible";
    if (finalWinnerVotes) finalWinnerVotes.textContent = "No se pudieron cargar los votos";
    if (ballonDOrName) ballonDOrName.textContent = "No disponible";
    if (ballonDOrVotes) ballonDOrVotes.textContent = "No se pudieron cargar los votos";
  }
}

async function iniciar() {
  cargarTopRanking();
  cargarHighlights();

  try {
    await cargarPartidos();
  } catch (error) {
    if (fechaPartidosTitulo) fechaPartidosTitulo.textContent = "Partidos";
    if (fechaPartidosDetalle) fechaPartidosDetalle.textContent = "No se pudieron cargar los partidos.";
    if (contadorVista) contadorVista.textContent = "";
    if (contenedorPartidos) {
      contenedorPartidos.innerHTML = `<div class="placeholder" style="grid-column: 1 / -1;">No se pudieron cargar los partidos desde la API. ${escaparHtml(error.message)}</div>`;
    }
  }
}

iniciar();

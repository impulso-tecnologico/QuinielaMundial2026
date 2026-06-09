const API_BASE = "";

const $ = (selector) => document.querySelector(selector);
const contenedor = $("#partidos");
const eliminatorias = $("#eliminatorias");
const grupoFiltro = $("#grupoFiltro");
const buscar = $("#buscar");
const participante = $("#participante");
const guardarEstado = $("#guardarEstado");
const balonOro = $("#balonOro");
const botaOro = $("#botaOro");
const guanteOro = $("#guanteOro");

let partidos = [];
let estado = {
  participante: "",
  participantId: null,
  pronosticos: {},
  eliminatorias: {},
  eliminatoriasGeneradas: false,
  premios: {
    balonOro: "",
    botaOro: "",
    guanteOro: ""
  }
};

const llavesRonda32 = [
  { id: 1, ronda: "Dieciseisavos", equipo1: "1E", equipo2: "3 ABCDF" },
  { id: 2, ronda: "Dieciseisavos", equipo1: "1I", equipo2: "3 CDFGH" },
  { id: 3, ronda: "Dieciseisavos", equipo1: "2A", equipo2: "2B" },
  { id: 4, ronda: "Dieciseisavos", equipo1: "1F", equipo2: "2C" },
  { id: 5, ronda: "Dieciseisavos", equipo1: "2K", equipo2: "2L" },
  { id: 6, ronda: "Dieciseisavos", equipo1: "1H", equipo2: "2J" },
  { id: 7, ronda: "Dieciseisavos", equipo1: "1D", equipo2: "3 BEFIJ" },
  { id: 8, ronda: "Dieciseisavos", equipo1: "1G", equipo2: "3 AEHIJ" },
  { id: 9, ronda: "Dieciseisavos", equipo1: "1C", equipo2: "2F" },
  { id: 10, ronda: "Dieciseisavos", equipo1: "2E", equipo2: "2I" },
  { id: 11, ronda: "Dieciseisavos", equipo1: "1A", equipo2: "3 CEFH" },
  { id: 12, ronda: "Dieciseisavos", equipo1: "1L", equipo2: "3 EHIJK" },
  { id: 13, ronda: "Dieciseisavos", equipo1: "1J", equipo2: "2H" },
  { id: 14, ronda: "Dieciseisavos", equipo1: "2D", equipo2: "2G" },
  { id: 15, ronda: "Dieciseisavos", equipo1: "1B", equipo2: "3 EFGIJ" },
  { id: 16, ronda: "Dieciseisavos", equipo1: "1K", equipo2: "3 DEIJ" }
];

const avanceLlaves = [
  { ronda: "Octavos", partido: 17, equipo1: "Ganador 1", equipo2: "Ganador 2" },
  { ronda: "Octavos", partido: 18, equipo1: "Ganador 3", equipo2: "Ganador 4" },
  { ronda: "Octavos", partido: 19, equipo1: "Ganador 5", equipo2: "Ganador 6" },
  { ronda: "Octavos", partido: 20, equipo1: "Ganador 7", equipo2: "Ganador 8" },
  { ronda: "Octavos", partido: 21, equipo1: "Ganador 9", equipo2: "Ganador 10" },
  { ronda: "Octavos", partido: 22, equipo1: "Ganador 11", equipo2: "Ganador 12" },
  { ronda: "Octavos", partido: 23, equipo1: "Ganador 13", equipo2: "Ganador 14" },
  { ronda: "Octavos", partido: 24, equipo1: "Ganador 15", equipo2: "Ganador 16" },
  { ronda: "Cuartos", partido: 25, equipo1: "Ganador 17", equipo2: "Ganador 18" },
  { ronda: "Cuartos", partido: 26, equipo1: "Ganador 19", equipo2: "Ganador 20" },
  { ronda: "Cuartos", partido: 27, equipo1: "Ganador 21", equipo2: "Ganador 22" },
  { ronda: "Cuartos", partido: 28, equipo1: "Ganador 23", equipo2: "Ganador 24" },
  { ronda: "Semifinal", partido: 29, equipo1: "Ganador 25", equipo2: "Ganador 26" },
  { ronda: "Semifinal", partido: 30, equipo1: "Ganador 27", equipo2: "Ganador 28" },
  { ronda: "Tercer lugar", partido: 31, equipo1: "Perdedor 29", equipo2: "Perdedor 30" },
  { ronda: "Final", partido: 32, equipo1: "Ganador 29", equipo2: "Ganador 30" }
];

function reiniciarEstadoSesion() {
  estado = { participante: "", participantId: null, pronosticos: {}, eliminatorias: {}, eliminatoriasGeneradas: false, premios: { balonOro: "", botaOro: "", guanteOro: "" } };
  actualizarInputsPremios();
}

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

function formatearFecha(valor) {
  const fecha = new Date(valor);
  return fecha.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "2-digit" }).replace(/\./g, "");
}

function formatearHora(valor) {
  return String(valor || "").slice(0, 5);
}

function mapearPartido(apiMatch) {
  return {
    id: apiMatch.id,
    numero: apiMatch.matchNumber,
    fecha: formatearFecha(apiMatch.matchDate),
    hora: formatearHora(apiMatch.matchTime),
    grupo: apiMatch.group || "",
    etapa: apiMatch.stageName,
    local: apiMatch.homeTeam,
    visitante: apiMatch.awayTeam,
    estadio: apiMatch.stadium,
    ciudad: apiMatch.city,
    realLocal: apiMatch.homeScore,
    realVisitante: apiMatch.awayScore
  };
}

async function cargarPartidos() {
  const data = await apiJson("/api/matches");
  partidos = data.map(mapearPartido);

  partidos.forEach(partido => {
    const p = obtenerPronostico(partido.id);
    p.realLocal = normalizarMarcador(partido.realLocal);
    p.realVisitante = normalizarMarcador(partido.realVisitante);
  });
}

function mostrarEstadoGuardado(mensaje, tipo = "") {
  guardarEstado.textContent = mensaje;
  guardarEstado.className = `guardar-estado ${tipo}`.trim();
}

async function asegurarParticipante(cargarDatos = true) {
  const nombre = participante.value.trim();
  if (!nombre) {
    alert("Captura el nombre del participante antes de guardar.");
    participante.focus();
    return null;
  }

  if (estado.participantId && estado.participante === nombre) return estado.participantId;

  const creado = await apiJson("/api/participants/ensure", {
    method: "POST",
    body: JSON.stringify({ name: nombre, email: null })
  });

  estado.participantId = creado.id;
  estado.participante = creado.name;
  participante.value = creado.name;
  if (cargarDatos) await cargarPronosticos();
  return estado.participantId;
}

async function cargarPronosticos() {
  if (!estado.participantId) return;

  const data = await apiJson(`/api/participants/${estado.participantId}/predictions`);
  data.forEach(prediccion => {
    const p = obtenerPronostico(prediccion.matchId);
    p.predLocal = normalizarMarcador(prediccion.homeScore);
    p.predVisitante = normalizarMarcador(prediccion.awayScore);
  });

  await cargarPronosticosEliminatorias();
  await cargarPronosticosPremios();
}

async function cargarPronosticosEliminatorias() {
  if (!estado.participantId) return;

  estado.eliminatorias = {};
  const data = await apiJson(`/api/participants/${estado.participantId}/knockout-predictions`);
  data.forEach(prediccion => {
    estado.eliminatorias[prediccion.bracketMatchNumber] = {
      local: normalizarMarcador(prediccion.homeScore),
      visitante: normalizarMarcador(prediccion.awayScore)
    };
  });
}

async function cargarPronosticosPremios() {
  if (!estado.participantId) return;

  const data = await apiJson(`/api/participants/${estado.participantId}/award-predictions`);
  estado.premios = {
    balonOro: data?.ballonDOr || "",
    botaOro: data?.goldenBoot || "",
    guanteOro: data?.goldenGlove || ""
  };
  actualizarInputsPremios();
}

function actualizarInputsPremios() {
  balonOro.value = estado.premios?.balonOro || "";
  botaOro.value = estado.premios?.botaOro || "";
  guanteOro.value = estado.premios?.guanteOro || "";
}

function llenarGrupos() {
  grupoFiltro.querySelectorAll("option:not([value='TODOS'])").forEach(option => option.remove());
  const grupos = [...new Set(partidos.map(p => p.grupo).filter(Boolean))].sort();
  grupos.forEach(g => {
    const option = document.createElement("option");
    option.value = g;
    option.textContent = `Grupo ${g}`;
    grupoFiltro.appendChild(option);
  });
}

function valorNumero(valor) {
  if (valor === "" || valor === null || valor === undefined) return null;
  const numero = Number(valor);
  return Number.isInteger(numero) && numero >= 0 ? numero : null;
}

function normalizarTexto(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function normalizarMarcador(valor) {
  const numero = valorNumero(valor);
  return numero === null ? "" : String(numero);
}

function obtenerPronostico(id) {
  if (!estado.pronosticos || typeof estado.pronosticos !== "object") estado.pronosticos = {};

  if (!estado.pronosticos[id]) {
    estado.pronosticos[id] = {
      predLocal: "",
      predVisitante: "",
      realLocal: "",
      realVisitante: ""
    };
  }

  return estado.pronosticos[id];
}

function resultadoTipo(golesLocal, golesVisitante) {
  if (golesLocal > golesVisitante) return "L";
  if (golesVisitante > golesLocal) return "V";
  return "E";
}

function calcularPuntos(id) {
  const p = obtenerPronostico(id);
  const predLocal = valorNumero(p.predLocal);
  const predVisitante = valorNumero(p.predVisitante);
  const realLocal = valorNumero(p.realLocal);
  const realVisitante = valorNumero(p.realVisitante);

  if ([predLocal, predVisitante, realLocal, realVisitante].some(v => v === null)) return null;
  if (predLocal === realLocal && predVisitante === realVisitante) return 3;

  return resultadoTipo(predLocal, predVisitante) === resultadoTipo(realLocal, realVisitante) ? 1 : 0;
}

function renderizarPartidos() {
  const grupo = grupoFiltro.value;
  const texto = normalizarTexto(buscar.value.trim());

  const filtrados = partidos.filter(p => {
    const coincideGrupo = grupo === "TODOS" || p.grupo === grupo;
    const textoPartido = normalizarTexto(`${p.local} ${p.visitante} ${p.estadio} ${p.ciudad} ${p.fecha}`);
    return coincideGrupo && (texto === "" || textoPartido.includes(texto));
  });

  contenedor.innerHTML = "";

  filtrados.forEach(partido => {
    const p = obtenerPronostico(partido.id);
    const card = document.createElement("article");
    card.className = "partido";
    card.innerHTML = `
      <div class="partido-header">
        <span class="match-id">Partido ${partido.numero}</span>
        <span class="grupo">${partido.grupo ? `Grupo ${partido.grupo}` : partido.etapa}</span>
      </div>

      <div class="fecha">
        <strong>${partido.fecha}</strong> · ${partido.hora} hrs · Hora local del estadio
      </div>

      <div class="equipos">
        <div class="equipo-local">${partido.local}</div>
        <div class="vs">VS</div>
        <div>${partido.visitante}</div>
      </div>

      <div>
        <div class="caption">Tu pronóstico</div>
        <div class="pronostico">
          <span class="caption">${partido.local}</span>
          <input type="number" min="0" inputmode="numeric" data-id="${partido.id}" data-campo="predLocal" value="${p.predLocal}" placeholder="0">
          <span class="separador">-</span>
          <input type="number" min="0" inputmode="numeric" data-id="${partido.id}" data-campo="predVisitante" value="${p.predVisitante}" placeholder="0">
          <span class="caption">${partido.visitante}</span>
        </div>
      </div>

      <div class="partido-header">
        <div class="sede">${partido.estadio}<br>${partido.ciudad}</div>
      </div>
    `;

    contenedor.appendChild(card);
  });

  $("#contadorVista").textContent = `${filtrados.length} de ${partidos.length} partidos`;
  activarEventosInputs();
  actualizarResumen();
  renderizarEliminatorias();
}

function activarEventosInputs() {
  document.querySelectorAll("[data-id][data-campo]").forEach(input => {
    input.addEventListener("input", (e) => {
      if (e.target.value !== "" && Number(e.target.value) < 0) e.target.value = 0;

      const id = e.target.dataset.id;
      const campo = e.target.dataset.campo;
      obtenerPronostico(id)[campo] = e.target.value;
      if (campo === "predLocal" || campo === "predVisitante") estado.eliminatoriasGeneradas = false;
      actualizarResumen();
      renderizarEliminatorias();
    });

  });
}

function actualizarResumen() {
  let pronosticados = 0;
  let conResultado = 0;
  let puntosTotales = 0;

  partidos.forEach(partido => {
    const p = obtenerPronostico(partido.id);
    const tienePrediccion = valorNumero(p.predLocal) !== null && valorNumero(p.predVisitante) !== null;
    const tieneResultado = valorNumero(p.realLocal) !== null && valorNumero(p.realVisitante) !== null;
    const puntos = calcularPuntos(partido.id);

    if (tienePrediccion) pronosticados++;
    if (tieneResultado) conResultado++;
    if (puntos !== null) puntosTotales += puntos;
  });

  $("#totalPartidos").textContent = partidos.length;
  $("#pronosticados").textContent = pronosticados;
  $("#conResultado").textContent = conResultado;
  $("#puntosTotales").textContent = puntosTotales;
}

function crearTablaGrupos() {
  const grupos = {};
  let partidosConPronostico = 0;

  partidos.filter(partido => partido.grupo).forEach(partido => {
    if (!grupos[partido.grupo]) grupos[partido.grupo] = {};
    [partido.local, partido.visitante].forEach(equipo => {
      if (!grupos[partido.grupo][equipo]) {
        grupos[partido.grupo][equipo] = {
          equipo,
          grupo: partido.grupo,
          pj: 0,
          pts: 0,
          gf: 0,
          gc: 0,
          dg: 0,
          fairPlay: 0,
          rankingFifa: 999,
          partidos: []
        };
      }
    });

    const p = obtenerPronostico(partido.id);
    const predLocal = valorNumero(p.predLocal);
    const predVisitante = valorNumero(p.predVisitante);
    if (predLocal === null || predVisitante === null) return;

    partidosConPronostico++;
    const local = grupos[partido.grupo][partido.local];
    const visitante = grupos[partido.grupo][partido.visitante];

    local.pj++;
    visitante.pj++;
    local.gf += predLocal;
    local.gc += predVisitante;
    visitante.gf += predVisitante;
    visitante.gc += predLocal;

    if (predLocal > predVisitante) local.pts += 3;
    else if (predVisitante > predLocal) visitante.pts += 3;
    else {
      local.pts++;
      visitante.pts++;
    }

    local.partidos.push({ rival: partido.visitante, gf: predLocal, gc: predVisitante, pts: predLocal > predVisitante ? 3 : predLocal === predVisitante ? 1 : 0 });
    visitante.partidos.push({ rival: partido.local, gf: predVisitante, gc: predLocal, pts: predVisitante > predLocal ? 3 : predLocal === predVisitante ? 1 : 0 });
  });

  Object.values(grupos).forEach(grupo => {
    Object.values(grupo).forEach(equipo => {
      equipo.dg = equipo.gf - equipo.gc;
    });
  });

  return { grupos, partidosConPronostico };
}

function estadisticaEntreEquipos(equipo, rivales) {
  return equipo.partidos
    .filter(partido => rivales.has(partido.rival))
    .reduce((total, partido) => ({
      pts: total.pts + partido.pts,
      gf: total.gf + partido.gf,
      gc: total.gc + partido.gc,
      dg: total.dg + partido.gf - partido.gc
    }), { pts: 0, gf: 0, gc: 0, dg: 0 });
}

function compararDesempateGrupo(a, b, empatados = []) {
  const rivales = new Set(empatados.map(equipo => equipo.equipo));
  rivales.delete(a.equipo);
  rivales.delete(b.equipo);

  if (empatados.length > 1) {
    const h2hA = estadisticaEntreEquipos(a, new Set(empatados.filter(e => e.equipo !== a.equipo).map(e => e.equipo)));
    const h2hB = estadisticaEntreEquipos(b, new Set(empatados.filter(e => e.equipo !== b.equipo).map(e => e.equipo)));
    const h2h = btoaSafe(h2hB.pts - h2hA.pts || h2hB.dg - h2hA.dg || h2hB.gf - h2hA.gf);
    if (h2h !== 0) return h2h;
  }

  return b.dg - a.dg || b.gf - a.gf || a.fairPlay - b.fairPlay || a.rankingFifa - b.rankingFifa || a.equipo.localeCompare(b.equipo, "es");
}

function btoaSafe(valor) {
  return Number.isFinite(valor) ? valor : 0;
}

function ordenarTablaGrupo(equipos) {
  return [...equipos].sort((a, b) => {
    const puntos = b.pts - a.pts;
    if (puntos !== 0) return puntos;

    const empatados = equipos.filter(equipo => equipo.pts === a.pts);
    return compararDesempateGrupo(a, b, empatados);
  });
}

function compararMejoresTerceros(a, b) {
  return b.pts - a.pts || b.dg - a.dg || b.gf - a.gf || a.fairPlay - b.fairPlay || a.rankingFifa - b.rankingFifa || a.equipo.localeCompare(b.equipo, "es");
}

function obtenerClasificados() {
  const { grupos, partidosConPronostico } = crearTablaGrupos();
  const ganadores = [];
  const segundos = [];
  const terceros = [];
  const tablas = {};

  Object.keys(grupos).sort().forEach(grupo => {
    const tabla = ordenarTablaGrupo(Object.values(grupos[grupo]));
    tablas[grupo] = tabla;
    if (tabla[0]) ganadores.push({ ...tabla[0], origen: `1 Grupo ${grupo}` });
    if (tabla[1]) segundos.push({ ...tabla[1], origen: `2 Grupo ${grupo}` });
    if (tabla[2]) terceros.push({ ...tabla[2], origen: `3 Grupo ${grupo}` });
  });

  const mejoresTerceros = terceros.sort(compararMejoresTerceros).slice(0, 8);

  return {
    tablas,
    ganadores,
    segundos,
    mejoresTerceros,
    partidosConPronostico
  };
}

function resolverClasificado(referencia, clasificados, tercerosAsignados) {
  const partes = referencia.split(" ");
  const posicion = Number(partes[0][0]);

  if (posicion === 1 || posicion === 2) {
    const grupo = partes[0][1];
    const equipo = clasificados.tablas[grupo]?.[posicion - 1];
    return equipo ? { ...equipo, origen: `${posicion} Grupo ${grupo}` } : { equipo: referencia, origen: "Por definir" };
  }

  const gruposPermitidos = new Set((partes[1] || "").split(""));
  const elegido = clasificados.mejoresTerceros.find(equipo => gruposPermitidos.has(equipo.grupo) && !tercerosAsignados.has(equipo.equipo));
  if (!elegido) return { equipo: referencia, origen: "Tercer lugar por definir" };

  tercerosAsignados.add(elegido.equipo);
  return { ...elegido, origen: `3 Grupo ${elegido.grupo}` };
}

function obtenerPartidoEliminacion(numero) {
  return partidos.find(partido => !partido.grupo && partido.numero === numero);
}

function obtenerMarcadorEliminacion(numero) {
  const marcadorLocal = estado.eliminatorias?.[numero];
  if (marcadorLocal) {
    const local = valorNumero(marcadorLocal.local);
    const visitante = valorNumero(marcadorLocal.visitante);
    if (local !== null && visitante !== null && local !== visitante) return { local, visitante };
  }

  return null;
}

function resolverResultadoLlave(llave, resultados) {
  const marcador = obtenerMarcadorEliminacion(llave.partido || llave.id);
  if (!marcador) return;

  resultados[llave.partido || llave.id] = {
    ganador: marcador.local > marcador.visitante ? llave.equipos[0] : llave.equipos[1],
    perdedor: marcador.local > marcador.visitante ? llave.equipos[1] : llave.equipos[0]
  };
}

function llaveTieneGanador(llave) {
  return obtenerMarcadorEliminacion(llave.partido || llave.id) !== null;
}

function resolverReferenciaAvance(referencia, resultados) {
  const [tipo, numeroTexto] = referencia.split(" ");
  const resultado = resultados[Number(numeroTexto)];
  if (!resultado) return { equipo: referencia, origen: "Por definir" };
  return tipo === "Perdedor" ? resultado.perdedor : resultado.ganador;
}

function crearRondasEliminatorias(clasificados) {
  const tercerosAsignados = new Set();
  const resultados = {};

  const dieciseisavos = llavesRonda32.map(llave => ({
    id: llave.id,
    partido: llave.id,
    ronda: llave.ronda,
    equipos: [
      resolverClasificado(llave.equipo1, clasificados, tercerosAsignados),
      resolverClasificado(llave.equipo2, clasificados, tercerosAsignados)
    ]
  }));

  dieciseisavos.forEach(llave => resolverResultadoLlave(llave, resultados));

  const rondas = [{ nombre: "Dieciseisavos", cruces: dieciseisavos }];
  if (!dieciseisavos.every(llaveTieneGanador)) return rondas;

  const crearCrucesAvance = (ronda) => avanceLlaves.filter(llave => llave.ronda === ronda).map(llave => {
    const cruce = {
      id: llave.partido,
      partido: llave.partido,
      ronda: llave.ronda,
      equipos: [resolverReferenciaAvance(llave.equipo1, resultados), resolverReferenciaAvance(llave.equipo2, resultados)]
    };
    resolverResultadoLlave(cruce, resultados);
    return cruce;
  });

  const octavos = crearCrucesAvance("Octavos");
  rondas.push({ nombre: "Octavos", cruces: octavos });
  if (!octavos.every(llaveTieneGanador)) return rondas;

  const cuartos = crearCrucesAvance("Cuartos");
  rondas.push({ nombre: "Cuartos", cruces: cuartos });
  if (!cuartos.every(llaveTieneGanador)) return rondas;

  const semifinal = crearCrucesAvance("Semifinal");
  rondas.push({ nombre: "Semifinal", cruces: semifinal });
  if (!semifinal.every(llaveTieneGanador)) return rondas;

  rondas.push({ nombre: "Tercer lugar", cruces: crearCrucesAvance("Tercer lugar") });
  rondas.push({ nombre: "Final", cruces: crearCrucesAvance("Final") });
  return rondas;
}

function renderizarEliminatorias() {
  const clasificados = obtenerClasificados();
  const { partidosConPronostico } = clasificados;
  const estadoTexto = $("#estadoEliminatorias");
  const totalGrupos = partidos.filter(partido => partido.grupo).length;

  if (!estado.eliminatoriasGeneradas) {
    estadoTexto.textContent = `${partidosConPronostico} de ${totalGrupos} pronósticos capturados`;
    eliminatorias.innerHTML = `
      <div class="placeholder" style="grid-column: 1 / -1;">
        Captura todos los marcadores de fase de grupos y presiona Generar fases finales.
      </div>
    `;
    return;
  }

  if (partidosConPronostico < totalGrupos) {
    estadoTexto.textContent = `${partidosConPronostico} de ${totalGrupos} pronósticos capturados`;
    eliminatorias.innerHTML = `
      <div class="placeholder" style="grid-column: 1 / -1;">
        Captura todos los pronósticos de fase de grupos para generar tu llave de 32 clasificados.
        Se usan puntos, diferencia de goles, goles a favor y goles en contra como criterios de desempate.
      </div>
    `;
    return;
  }

  const rondasEliminatorias = crearRondasEliminatorias(clasificados);
  const ultimaRonda = rondasEliminatorias[rondasEliminatorias.length - 1]?.nombre || "Dieciseisavos";
  estadoTexto.textContent = ultimaRonda === "Final" ? "Final y tercer lugar abiertos" : `Ronda activa: ${ultimaRonda}`;
  eliminatorias.innerHTML = "";

  rondasEliminatorias.forEach(ronda => {
    const columna = document.createElement("section");
    columna.className = "ronda";
    columna.innerHTML = `<h3>${ronda.nombre}</h3>`;

    ronda.cruces.forEach(cruce => {
      const card = document.createElement("div");
      card.className = "cruce";
      const marcador = estado.eliminatorias?.[cruce.partido] || { local: "", visitante: "" };
      card.innerHTML = `
        <div class="cruce-id">Partido ${cruce.partido}</div>
        ${cruce.equipos.map((equipo, index) => `
          <div class="cruce-equipo">
            <span>${equipo.equipo}</span>
            <div class="cruce-marcador">
              <small>${equipo.origen}</small>
              <input type="number" min="0" inputmode="numeric" data-llave="${cruce.partido}" data-pos="${index === 0 ? "local" : "visitante"}" value="${index === 0 ? marcador.local : marcador.visitante}" placeholder="0">
            </div>
          </div>
        `).join("")}
      `;
      columna.appendChild(card);
    });

    eliminatorias.appendChild(columna);
  });

  activarEventosEliminatorias();
}

function activarEventosEliminatorias() {
  document.querySelectorAll("[data-llave][data-pos]").forEach(input => {
    input.addEventListener("input", (e) => {
      if (e.target.value !== "" && Number(e.target.value) < 0) e.target.value = 0;

      const llave = e.target.dataset.llave;
      const pos = e.target.dataset.pos;
      if (!estado.eliminatorias[llave]) estado.eliminatorias[llave] = { local: "", visitante: "" };
      estado.eliminatorias[llave][pos] = e.target.value;
    });

    input.addEventListener("change", () => {
      renderizarEliminatorias();
    });
  });
}

function generarFasesFinales() {
  const { partidosConPronostico } = obtenerClasificados();
  const totalGrupos = partidos.filter(partido => partido.grupo).length;

  if (partidosConPronostico < totalGrupos) {
    alert(`Faltan ${totalGrupos - partidosConPronostico} pronósticos de fase de grupos.`);
    return;
  }

  estado.eliminatoriasGeneradas = true;
  renderizarEliminatorias();
}

function obtenerPronosticosGrupoCompletos() {
  return partidos
    .filter(partido => partido.grupo)
    .map(partido => ({ partido, pronostico: obtenerPronostico(partido.id) }))
    .filter(({ pronostico }) => valorNumero(pronostico.predLocal) !== null && valorNumero(pronostico.predVisitante) !== null);
}

function obtenerPronosticosEliminatoriaCompletos() {
  return Object.entries(estado.eliminatorias || {})
    .map(([llave, marcador]) => ({ llave, marcador }))
    .filter(({ marcador }) => valorNumero(marcador.local) !== null && valorNumero(marcador.visitante) !== null);
}

function sincronizarPremiosDesdeInputs() {
  estado.premios = {
    balonOro: balonOro.value.trim(),
    botaOro: botaOro.value.trim(),
    guanteOro: guanteOro.value.trim()
  };
}

async function guardarPredicciones() {
  try {
    mostrarEstadoGuardado("Guardando predicciones...");
    const boton = $("#btnGuardarPredicciones");
    boton.disabled = true;

    const participantId = await asegurarParticipante(false);
    if (!participantId) return;

    const grupos = obtenerPronosticosGrupoCompletos();
    const eliminatoriasGuardables = obtenerPronosticosEliminatoriaCompletos();
    sincronizarPremiosDesdeInputs();

    await Promise.all(grupos.map(({ partido, pronostico }) => apiJson(`/api/participants/${participantId}/predictions/${partido.id}`, {
      method: "PUT",
      body: JSON.stringify({
        homeScore: valorNumero(pronostico.predLocal),
        awayScore: valorNumero(pronostico.predVisitante)
      })
    })));

    await Promise.all(eliminatoriasGuardables.map(({ llave, marcador }) => apiJson(`/api/participants/${participantId}/knockout-predictions/${llave}`, {
      method: "PUT",
      body: JSON.stringify({
        homeScore: valorNumero(marcador.local),
        awayScore: valorNumero(marcador.visitante)
      })
    })));

    await apiJson(`/api/participants/${participantId}/award-predictions`, {
      method: "PUT",
      body: JSON.stringify({
        ballonDOr: estado.premios.balonOro,
        goldenBoot: estado.premios.botaOro,
        goldenGlove: estado.premios.guanteOro
      })
    });

    mostrarEstadoGuardado(`Guardado: ${grupos.length} pronósticos de grupos, ${eliminatoriasGuardables.length} de eliminatoria y premios individuales.`, "ok");
  } catch (error) {
    mostrarEstadoGuardado(`No se pudo guardar. ${error.message}`, "error");
  } finally {
    $("#btnGuardarPredicciones").disabled = false;
  }
}

participante.addEventListener("input", () => {
  estado.participantId = null;
  estado.pronosticos = {};
  estado.eliminatorias = {};
  estado.eliminatoriasGeneradas = false;
  estado.premios = { balonOro: "", botaOro: "", guanteOro: "" };
  actualizarInputsPremios();
});
participante.addEventListener("change", async () => {
  try {
    await asegurarParticipante();
    renderizarPartidos();
  } catch (error) {
    alert(`No se pudo preparar el participante. ${error.message}`);
  }
});
grupoFiltro.addEventListener("change", renderizarPartidos);
buscar.addEventListener("input", renderizarPartidos);
$("#btnGenerarFasesFinales").addEventListener("click", generarFasesFinales);
balonOro.addEventListener("input", sincronizarPremiosDesdeInputs);
botaOro.addEventListener("input", sincronizarPremiosDesdeInputs);
guanteOro.addEventListener("input", sincronizarPremiosDesdeInputs);

$("#btnGuardarPredicciones").addEventListener("click", guardarPredicciones);

$("#btnLimpiar").addEventListener("click", () => {
  if (!confirm("¿Seguro que deseas limpiar los datos de esta ventana?")) return;
  reiniciarEstadoSesion();
  participante.value = "";
  renderizarPartidos();
});

async function iniciar() {
  try {
    await cargarPartidos();
    llenarGrupos();
    renderizarPartidos();
  } catch (error) {
    contenedor.innerHTML = `<div class="placeholder" style="grid-column: 1 / -1;">No se pudieron cargar los datos desde la API. ${error.message}</div>`;
  }
}

iniciar();

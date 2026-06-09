const API_BASE = "";
const STORAGE_KEY = "quiniela_mundial_2026_frontend";

const $ = (selector) => document.querySelector(selector);
const contenedor = $("#partidos");
const eliminatorias = $("#eliminatorias");
const grupoFiltro = $("#grupoFiltro");
const buscar = $("#buscar");
const participante = $("#participante");

let partidos = [];
let estado = {
  participante: "",
  participantId: null,
  pronosticos: {},
  eliminatorias: {}
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

function cargarEstadoLocal() {
  try {
    const guardado = localStorage.getItem(STORAGE_KEY);
    if (guardado) estado = { ...estado, ...JSON.parse(guardado) };
  } catch {
    estado = { participante: "", participantId: null, pronosticos: {} };
  }

  if (!estado.eliminatorias || typeof estado.eliminatorias !== "object") estado.eliminatorias = {};

  participante.value = estado.participante || "";
}

function guardarEstadoLocal() {
  estado.participante = participante.value.trim();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
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

async function asegurarParticipante() {
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
  guardarEstadoLocal();
  await cargarPronosticos();
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

  guardarEstadoLocal();
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
    const puntos = calcularPuntos(partido.id);
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

      <div>
        <div class="caption">Resultado real</div>
        <div class="resultado-real">
          <span class="caption">${partido.local}</span>
          <input type="number" min="0" inputmode="numeric" data-id="${partido.id}" data-campo="realLocal" value="${p.realLocal}" placeholder="0">
          <span class="separador">-</span>
          <input type="number" min="0" inputmode="numeric" data-id="${partido.id}" data-campo="realVisitante" value="${p.realVisitante}" placeholder="0">
          <span class="caption">${partido.visitante}</span>
        </div>
      </div>

      <div class="partido-header">
        <div class="sede">${partido.estadio}<br>${partido.ciudad}</div>
        <div class="puntos"><span class="puntos-badge">${puntos === null ? "Sin puntos" : puntos + " pts"}</span></div>
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
      guardarEstadoLocal();
      actualizarResumen();
      renderizarEliminatorias();

      const puntos = calcularPuntos(id);
      const badge = e.target.closest(".partido").querySelector(".puntos-badge");
      badge.textContent = puntos === null ? "Sin puntos" : `${puntos} pts`;
    });

    input.addEventListener("change", guardarMarcadorEnApi);
  });
}

async function guardarMarcadorEnApi(e) {
  const id = e.target.dataset.id;
  const campo = e.target.dataset.campo;
  const p = obtenerPronostico(id);

  try {
    const participantId = await asegurarParticipante();
    if (!participantId) return;

    if (campo.startsWith("pred")) {
      await apiJson(`/api/participants/${participantId}/predictions/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          homeScore: valorNumero(p.predLocal),
          awayScore: valorNumero(p.predVisitante)
        })
      });
      return;
    }

    await apiJson(`/api/matches/${id}/result`, {
      method: "PUT",
      body: JSON.stringify({
        homeScore: valorNumero(p.realLocal),
        awayScore: valorNumero(p.realVisitante),
        registeredByParticipantId: participantId
      })
    });
  } catch (error) {
    alert(`No se pudo guardar en la base de datos. ${error.message}`);
  }
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
  let partidosConResultado = 0;

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
    const realLocal = valorNumero(p.realLocal);
    const realVisitante = valorNumero(p.realVisitante);
    if (realLocal === null || realVisitante === null) return;

    partidosConResultado++;
    const local = grupos[partido.grupo][partido.local];
    const visitante = grupos[partido.grupo][partido.visitante];

    local.pj++;
    visitante.pj++;
    local.gf += realLocal;
    local.gc += realVisitante;
    visitante.gf += realVisitante;
    visitante.gc += realLocal;

    if (realLocal > realVisitante) local.pts += 3;
    else if (realVisitante > realLocal) visitante.pts += 3;
    else {
      local.pts++;
      visitante.pts++;
    }

    local.partidos.push({ rival: partido.visitante, gf: realLocal, gc: realVisitante, pts: realLocal > realVisitante ? 3 : realLocal === realVisitante ? 1 : 0 });
    visitante.partidos.push({ rival: partido.local, gf: realVisitante, gc: realLocal, pts: realVisitante > realLocal ? 3 : realLocal === realVisitante ? 1 : 0 });
  });

  Object.values(grupos).forEach(grupo => {
    Object.values(grupo).forEach(equipo => {
      equipo.dg = equipo.gf - equipo.gc;
    });
  });

  return { grupos, partidosConResultado };
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
  const { grupos, partidosConResultado } = crearTablaGrupos();
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
    partidosConResultado
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

  const partido = obtenerPartidoEliminacion(numero);
  if (!partido) return null;

  const p = obtenerPronostico(partido.id);
  const local = valorNumero(p.realLocal);
  const visitante = valorNumero(p.realVisitante);
  return local === null || visitante === null || local === visitante ? null : { local, visitante };
}

function resolverResultadoLlave(llave, resultados) {
  const marcador = obtenerMarcadorEliminacion(llave.partido || llave.id);
  if (!marcador) return;

  resultados[llave.partido || llave.id] = {
    ganador: marcador.local > marcador.visitante ? llave.equipos[0] : llave.equipos[1],
    perdedor: marcador.local > marcador.visitante ? llave.equipos[1] : llave.equipos[0]
  };
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

  const avances = avanceLlaves.map(llave => {
    const cruce = {
      id: llave.partido,
      partido: llave.partido,
      ronda: llave.ronda,
      equipos: [resolverReferenciaAvance(llave.equipo1, resultados), resolverReferenciaAvance(llave.equipo2, resultados)]
    };
    resolverResultadoLlave(cruce, resultados);
    return cruce;
  });

  const rondas = ["Dieciseisavos", "Octavos", "Cuartos", "Semifinal", "Tercer lugar", "Final"];
  return rondas.map(nombre => ({
    nombre,
    cruces: [...dieciseisavos, ...avances].filter(llave => llave.ronda === nombre)
  })).filter(ronda => ronda.cruces.length > 0);
}

function renderizarEliminatorias() {
  const clasificados = obtenerClasificados();
  const { partidosConResultado } = clasificados;
  const estadoTexto = $("#estadoEliminatorias");
  const totalGrupos = partidos.filter(partido => partido.grupo).length;

  if (partidosConResultado < totalGrupos) {
    estadoTexto.textContent = `${partidosConResultado} de ${totalGrupos} resultados capturados`;
    eliminatorias.innerHTML = `
      <div class="placeholder" style="grid-column: 1 / -1;">
        Captura todos los resultados reales de la fase de grupos para generar la llave de 32 clasificados.
        Se usan puntos, diferencia de goles, goles a favor y goles en contra como criterios de desempate.
      </div>
    `;
    return;
  }

  estadoTexto.textContent = "Matriz oficial";
  eliminatorias.innerHTML = "";

  crearRondasEliminatorias(clasificados).forEach(ronda => {
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
      guardarEstadoLocal();
      renderizarEliminatorias();
    });
  });
}

function exportarQuiniela() {
  guardarEstadoLocal();
  const datos = { torneo: "Mundial 2026", etapa: "Fase de grupos", exportado: new Date().toISOString(), ...estado };
  const blob = new Blob([JSON.stringify(datos, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const nombre = estado.participante ? estado.participante.replace(/\s+/g, "_") : "participante";
  link.href = url;
  link.download = `quiniela_mundial_2026_${nombre}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function importarQuiniela(file) {
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const datos = JSON.parse(reader.result);
      estado = { ...estado, ...datos, pronosticos: datos.pronosticos || {} };
      participante.value = estado.participante || "";
      guardarEstadoLocal();
      renderizarPartidos();
      alert("Quiniela importada correctamente.");
    } catch {
      alert("El archivo no tiene un formato válido.");
    }
  };
  reader.readAsText(file);
}

participante.addEventListener("input", () => {
  estado.participantId = null;
  guardarEstadoLocal();
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

$("#btnResultados").addEventListener("click", () => {
  document.body.classList.toggle("modo-resultados");
  $("#btnResultados").textContent = document.body.classList.contains("modo-resultados")
    ? "Ocultar resultados"
    : "Modo resultados";
});

$("#btnExportar").addEventListener("click", exportarQuiniela);
$("#btnImportar").addEventListener("click", () => $("#archivoImportar").click());
$("#archivoImportar").addEventListener("change", (e) => {
  importarQuiniela(e.target.files[0]);
  e.target.value = "";
});

$("#btnLimpiar").addEventListener("click", () => {
  if (!confirm("¿Seguro que deseas borrar los datos locales de esta quiniela?")) return;
  localStorage.removeItem(STORAGE_KEY);
  estado = { participante: "", participantId: null, pronosticos: {}, eliminatorias: {} };
  participante.value = "";
  renderizarPartidos();
});

async function iniciar() {
  try {
    cargarEstadoLocal();
    await cargarPartidos();
    if (estado.participantId) await cargarPronosticos();
    llenarGrupos();
    renderizarPartidos();
  } catch (error) {
    contenedor.innerHTML = `<div class="placeholder" style="grid-column: 1 / -1;">No se pudieron cargar los datos desde la API. ${error.message}</div>`;
  }
}

iniciar();

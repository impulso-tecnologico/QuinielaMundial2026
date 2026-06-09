const partidos = [
  { id: 1, fecha: "11-Jun-26", hora: "13:00", grupo: "A", local: "México", visitante: "Sudáfrica", estadio: "Estadio Azteca", ciudad: "Ciudad de México" },
  { id: 2, fecha: "11-Jun-26", hora: "20:00", grupo: "A", local: "Corea del Sur", visitante: "Chequia", estadio: "Estadio Akron", ciudad: "Guadalajara" },
  { id: 3, fecha: "12-Jun-26", hora: "15:00", grupo: "B", local: "Canadá", visitante: "Bosnia y Herzegovina", estadio: "BMO Field", ciudad: "Toronto" },
  { id: 4, fecha: "12-Jun-26", hora: "18:00", grupo: "D", local: "Estados Unidos", visitante: "Paraguay", estadio: "SoFi Stadium", ciudad: "Los Ángeles" },
  { id: 5, fecha: "13-Jun-26", hora: "21:00", grupo: "C", local: "Haití", visitante: "Escocia", estadio: "Gillette Stadium", ciudad: "Boston" },
  { id: 6, fecha: "13-Jun-26", hora: "21:00", grupo: "D", local: "Australia", visitante: "Turquía", estadio: "BC Place", ciudad: "Vancouver" },
  { id: 7, fecha: "13-Jun-26", hora: "18:00", grupo: "C", local: "Brasil", visitante: "Marruecos", estadio: "MetLife Stadium", ciudad: "Nueva York/Nueva Jersey" },
  { id: 8, fecha: "13-Jun-26", hora: "12:00", grupo: "B", local: "Qatar", visitante: "Suiza", estadio: "Levi's Stadium", ciudad: "San Francisco Bay Area" },
  { id: 9, fecha: "14-Jun-26", hora: "19:00", grupo: "E", local: "Costa de Marfil", visitante: "Ecuador", estadio: "Lincoln Financial Field", ciudad: "Filadelfia" },
  { id: 10, fecha: "14-Jun-26", hora: "12:00", grupo: "E", local: "Alemania", visitante: "Curazao", estadio: "NRG Stadium", ciudad: "Houston" },
  { id: 11, fecha: "14-Jun-26", hora: "15:00", grupo: "F", local: "Países Bajos", visitante: "Japón", estadio: "AT&T Stadium", ciudad: "Dallas" },
  { id: 12, fecha: "14-Jun-26", hora: "20:00", grupo: "F", local: "Suecia", visitante: "Túnez", estadio: "Estadio BBVA", ciudad: "Monterrey" },
  { id: 13, fecha: "15-Jun-26", hora: "18:00", grupo: "H", local: "Arabia Saudita", visitante: "Uruguay", estadio: "Hard Rock Stadium", ciudad: "Miami" },
  { id: 14, fecha: "15-Jun-26", hora: "12:00", grupo: "H", local: "España", visitante: "Cabo Verde", estadio: "Mercedes-Benz Stadium", ciudad: "Atlanta" },
  { id: 15, fecha: "15-Jun-26", hora: "18:00", grupo: "G", local: "Irán", visitante: "Nueva Zelanda", estadio: "SoFi Stadium", ciudad: "Los Ángeles" },
  { id: 16, fecha: "15-Jun-26", hora: "12:00", grupo: "G", local: "Bélgica", visitante: "Egipto", estadio: "Lumen Field", ciudad: "Seattle" },
  { id: 17, fecha: "16-Jun-26", hora: "15:00", grupo: "I", local: "Francia", visitante: "Senegal", estadio: "MetLife Stadium", ciudad: "Nueva York/Nueva Jersey" },
  { id: 18, fecha: "16-Jun-26", hora: "18:00", grupo: "I", local: "Irak", visitante: "Noruega", estadio: "Gillette Stadium", ciudad: "Boston" },
  { id: 19, fecha: "16-Jun-26", hora: "20:00", grupo: "J", local: "Argentina", visitante: "Argelia", estadio: "Arrowhead Stadium", ciudad: "Kansas City" },
  { id: 20, fecha: "16-Jun-26", hora: "21:00", grupo: "J", local: "Austria", visitante: "Jordania", estadio: "Levi's Stadium", ciudad: "San Francisco Bay Area" },
  { id: 21, fecha: "17-Jun-26", hora: "19:00", grupo: "L", local: "Ghana", visitante: "Panamá", estadio: "BMO Field", ciudad: "Toronto" },
  { id: 22, fecha: "17-Jun-26", hora: "15:00", grupo: "L", local: "Inglaterra", visitante: "Croacia", estadio: "AT&T Stadium", ciudad: "Dallas" },
  { id: 23, fecha: "17-Jun-26", hora: "12:00", grupo: "K", local: "Portugal", visitante: "RD Congo", estadio: "NRG Stadium", ciudad: "Houston" },
  { id: 24, fecha: "17-Jun-26", hora: "20:00", grupo: "K", local: "Uzbekistán", visitante: "Colombia", estadio: "Estadio Azteca", ciudad: "Ciudad de México" },
  { id: 25, fecha: "18-Jun-26", hora: "12:00", grupo: "A", local: "Chequia", visitante: "Sudáfrica", estadio: "Mercedes-Benz Stadium", ciudad: "Atlanta" },
  { id: 26, fecha: "18-Jun-26", hora: "12:00", grupo: "B", local: "Suiza", visitante: "Bosnia y Herzegovina", estadio: "SoFi Stadium", ciudad: "Los Ángeles" },
  { id: 27, fecha: "18-Jun-26", hora: "15:00", grupo: "B", local: "Canadá", visitante: "Qatar", estadio: "BC Place", ciudad: "Vancouver" },
  { id: 28, fecha: "18-Jun-26", hora: "19:00", grupo: "A", local: "México", visitante: "Corea del Sur", estadio: "Estadio Akron", ciudad: "Guadalajara" },
  { id: 29, fecha: "19-Jun-26", hora: "21:00", grupo: "C", local: "Brasil", visitante: "Haití", estadio: "Lincoln Financial Field", ciudad: "Filadelfia" },
  { id: 30, fecha: "19-Jun-26", hora: "18:00", grupo: "C", local: "Escocia", visitante: "Marruecos", estadio: "Gillette Stadium", ciudad: "Boston" },
  { id: 31, fecha: "19-Jun-26", hora: "20:00", grupo: "D", local: "Turquía", visitante: "Paraguay", estadio: "Levi's Stadium", ciudad: "San Francisco Bay Area" },
  { id: 32, fecha: "19-Jun-26", hora: "12:00", grupo: "D", local: "Estados Unidos", visitante: "Australia", estadio: "Lumen Field", ciudad: "Seattle" },
  { id: 33, fecha: "20-Jun-26", hora: "16:00", grupo: "E", local: "Alemania", visitante: "Costa de Marfil", estadio: "BMO Field", ciudad: "Toronto" },
  { id: 34, fecha: "20-Jun-26", hora: "19:00", grupo: "E", local: "Ecuador", visitante: "Curazao", estadio: "Arrowhead Stadium", ciudad: "Kansas City" },
  { id: 35, fecha: "20-Jun-26", hora: "12:00", grupo: "F", local: "Países Bajos", visitante: "Suecia", estadio: "NRG Stadium", ciudad: "Houston" },
  { id: 36, fecha: "20-Jun-26", hora: "22:00", grupo: "F", local: "Túnez", visitante: "Japón", estadio: "Estadio BBVA", ciudad: "Monterrey" },
  { id: 37, fecha: "21-Jun-26", hora: "18:00", grupo: "H", local: "Uruguay", visitante: "Cabo Verde", estadio: "Hard Rock Stadium", ciudad: "Miami" },
  { id: 38, fecha: "21-Jun-26", hora: "12:00", grupo: "H", local: "España", visitante: "Arabia Saudita", estadio: "Mercedes-Benz Stadium", ciudad: "Atlanta" },
  { id: 39, fecha: "21-Jun-26", hora: "12:00", grupo: "G", local: "Bélgica", visitante: "Irán", estadio: "SoFi Stadium", ciudad: "Los Ángeles" },
  { id: 40, fecha: "21-Jun-26", hora: "18:00", grupo: "G", local: "Nueva Zelanda", visitante: "Egipto", estadio: "BC Place", ciudad: "Vancouver" },
  { id: 41, fecha: "22-Jun-26", hora: "20:00", grupo: "I", local: "Noruega", visitante: "Senegal", estadio: "MetLife Stadium", ciudad: "Nueva York/Nueva Jersey" },
  { id: 42, fecha: "22-Jun-26", hora: "17:00", grupo: "I", local: "Francia", visitante: "Irak", estadio: "Lincoln Financial Field", ciudad: "Filadelfia" },
  { id: 43, fecha: "22-Jun-26", hora: "12:00", grupo: "J", local: "Argentina", visitante: "Austria", estadio: "AT&T Stadium", ciudad: "Dallas" },
  { id: 44, fecha: "22-Jun-26", hora: "20:00", grupo: "J", local: "Jordania", visitante: "Argelia", estadio: "Levi's Stadium", ciudad: "San Francisco Bay Area" },
  { id: 45, fecha: "23-Jun-26", hora: "16:00", grupo: "L", local: "Inglaterra", visitante: "Ghana", estadio: "Gillette Stadium", ciudad: "Boston" },
  { id: 46, fecha: "23-Jun-26", hora: "19:00", grupo: "L", local: "Panamá", visitante: "Croacia", estadio: "BMO Field", ciudad: "Toronto" },
  { id: 47, fecha: "23-Jun-26", hora: "12:00", grupo: "K", local: "Portugal", visitante: "Uzbekistán", estadio: "NRG Stadium", ciudad: "Houston" },
  { id: 48, fecha: "23-Jun-26", hora: "20:00", grupo: "K", local: "Colombia", visitante: "RD Congo", estadio: "Estadio Akron", ciudad: "Guadalajara" },
  { id: 49, fecha: "24-Jun-26", hora: "18:00", grupo: "C", local: "Escocia", visitante: "Brasil", estadio: "Hard Rock Stadium", ciudad: "Miami" },
  { id: 50, fecha: "24-Jun-26", hora: "18:00", grupo: "C", local: "Marruecos", visitante: "Haití", estadio: "Mercedes-Benz Stadium", ciudad: "Atlanta" },
  { id: 51, fecha: "24-Jun-26", hora: "12:00", grupo: "B", local: "Suiza", visitante: "Canadá", estadio: "BC Place", ciudad: "Vancouver" },
  { id: 52, fecha: "24-Jun-26", hora: "12:00", grupo: "B", local: "Bosnia y Herzegovina", visitante: "Qatar", estadio: "Lumen Field", ciudad: "Seattle" },
  { id: 53, fecha: "24-Jun-26", hora: "19:00", grupo: "A", local: "Chequia", visitante: "México", estadio: "Estadio Azteca", ciudad: "Ciudad de México" },
  { id: 54, fecha: "24-Jun-26", hora: "19:00", grupo: "A", local: "Sudáfrica", visitante: "Corea del Sur", estadio: "Estadio BBVA", ciudad: "Monterrey" },
  { id: 55, fecha: "25-Jun-26", hora: "16:00", grupo: "E", local: "Curazao", visitante: "Costa de Marfil", estadio: "Lincoln Financial Field", ciudad: "Filadelfia" },
  { id: 56, fecha: "25-Jun-26", hora: "16:00", grupo: "E", local: "Ecuador", visitante: "Alemania", estadio: "MetLife Stadium", ciudad: "Nueva York/Nueva Jersey" },
  { id: 57, fecha: "25-Jun-26", hora: "18:00", grupo: "F", local: "Japón", visitante: "Suecia", estadio: "AT&T Stadium", ciudad: "Dallas" },
  { id: 58, fecha: "25-Jun-26", hora: "18:00", grupo: "F", local: "Túnez", visitante: "Países Bajos", estadio: "Arrowhead Stadium", ciudad: "Kansas City" },
  { id: 59, fecha: "25-Jun-26", hora: "19:00", grupo: "D", local: "Turquía", visitante: "Estados Unidos", estadio: "SoFi Stadium", ciudad: "Los Ángeles" },
  { id: 60, fecha: "25-Jun-26", hora: "19:00", grupo: "D", local: "Paraguay", visitante: "Australia", estadio: "Levi's Stadium", ciudad: "San Francisco Bay Area" },
  { id: 61, fecha: "26-Jun-26", hora: "15:00", grupo: "I", local: "Noruega", visitante: "Francia", estadio: "Gillette Stadium", ciudad: "Boston" },
  { id: 62, fecha: "26-Jun-26", hora: "15:00", grupo: "I", local: "Senegal", visitante: "Irak", estadio: "BMO Field", ciudad: "Toronto" },
  { id: 63, fecha: "26-Jun-26", hora: "20:00", grupo: "G", local: "Egipto", visitante: "Irán", estadio: "Lumen Field", ciudad: "Seattle" },
  { id: 64, fecha: "26-Jun-26", hora: "20:00", grupo: "G", local: "Nueva Zelanda", visitante: "Bélgica", estadio: "BC Place", ciudad: "Vancouver" },
  { id: 65, fecha: "26-Jun-26", hora: "19:00", grupo: "H", local: "Cabo Verde", visitante: "Arabia Saudita", estadio: "NRG Stadium", ciudad: "Houston" },
  { id: 66, fecha: "26-Jun-26", hora: "18:00", grupo: "H", local: "Uruguay", visitante: "España", estadio: "Estadio Akron", ciudad: "Guadalajara" },
  { id: 67, fecha: "27-Jun-26", hora: "17:00", grupo: "L", local: "Panamá", visitante: "Inglaterra", estadio: "MetLife Stadium", ciudad: "Nueva York/Nueva Jersey" },
  { id: 68, fecha: "27-Jun-26", hora: "17:00", grupo: "L", local: "Croacia", visitante: "Ghana", estadio: "Lincoln Financial Field", ciudad: "Filadelfia" },
  { id: 69, fecha: "27-Jun-26", hora: "21:00", grupo: "J", local: "Argelia", visitante: "Austria", estadio: "Arrowhead Stadium", ciudad: "Kansas City" },
  { id: 70, fecha: "27-Jun-26", hora: "21:00", grupo: "J", local: "Jordania", visitante: "Argentina", estadio: "AT&T Stadium", ciudad: "Dallas" },
  { id: 71, fecha: "27-Jun-26", hora: "19:30", grupo: "K", local: "Colombia", visitante: "Portugal", estadio: "Hard Rock Stadium", ciudad: "Miami" },
  { id: 72, fecha: "27-Jun-26", hora: "19:30", grupo: "K", local: "RD Congo", visitante: "Uzbekistán", estadio: "Mercedes-Benz Stadium", ciudad: "Atlanta" }
];

const STORAGE_KEY = "quiniela_mundial_2026_fase_grupos";

const $ = (selector) => document.querySelector(selector);
const contenedor = $("#partidos");
const eliminatorias = $("#eliminatorias");
const grupoFiltro = $("#grupoFiltro");
const buscar = $("#buscar");
const participante = $("#participante");

let estado = {
  participante: "",
  pronosticos: {}
};
let avisoGuardadoMostrado = false;

function cargarEstado() {
  try {
    const guardado = localStorage.getItem(STORAGE_KEY);
    if (guardado) {
      estado = normalizarEstado(JSON.parse(guardado));
    }
  } catch {
    estado = normalizarEstado();
  }
  participante.value = estado.participante || "";
}

function guardarEstado() {
  estado.participante = participante.value.trim();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
  } catch {
    if (!avisoGuardadoMostrado) {
      avisoGuardadoMostrado = true;
      alert("No se pudo guardar en este navegador. Puedes exportar la quiniela para conservarla.");
    }
  }
  actualizarResumen();
  renderizarEliminatorias();
}

function llenarGrupos() {
  const grupos = [...new Set(partidos.map(p => p.grupo))].sort();
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

function normalizarEstado(datos = {}) {
  const pronosticos = {};
  const origen = datos && typeof datos.pronosticos === "object" && datos.pronosticos !== null
    ? datos.pronosticos
    : {};

  partidos.forEach(partido => {
    const p = origen[partido.id] || {};
    pronosticos[partido.id] = {
      predLocal: normalizarMarcador(p.predLocal),
      predVisitante: normalizarMarcador(p.predVisitante),
      realLocal: normalizarMarcador(p.realLocal),
      realVisitante: normalizarMarcador(p.realVisitante)
    };
  });

  return {
    participante: typeof datos.participante === "string" ? datos.participante : "",
    pronosticos
  };
}

function obtenerPronostico(id) {
  if (!estado.pronosticos || typeof estado.pronosticos !== "object") {
    estado.pronosticos = {};
  }

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

  if ([predLocal, predVisitante, realLocal, realVisitante].some(v => v === null)) {
    return null;
  }

  if (predLocal === realLocal && predVisitante === realVisitante) {
    return 3;
  }

  const tipoPrediccion = resultadoTipo(predLocal, predVisitante);
  const tipoReal = resultadoTipo(realLocal, realVisitante);

  return tipoPrediccion === tipoReal ? 1 : 0;
}

function renderizarPartidos() {
  const grupo = grupoFiltro.value;
  const texto = normalizarTexto(buscar.value.trim());

  const filtrados = partidos.filter(p => {
    const coincideGrupo = grupo === "TODOS" || p.grupo === grupo;
    const textoPartido = normalizarTexto(`${p.local} ${p.visitante} ${p.estadio} ${p.ciudad} ${p.fecha}`);
    const coincideTexto = texto === "" || textoPartido.includes(texto);
    return coincideGrupo && coincideTexto;
  });

  contenedor.innerHTML = "";

  filtrados.forEach(partido => {
    const p = obtenerPronostico(partido.id);
    const puntos = calcularPuntos(partido.id);

    const card = document.createElement("article");
    card.className = "partido";

    card.innerHTML = `
      <div class="partido-header">
        <span class="match-id">Partido ${partido.id}</span>
        <span class="grupo">Grupo ${partido.grupo}</span>
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
          <input type="number" min="0" inputmode="numeric"
                 data-id="${partido.id}" data-campo="predLocal"
                 value="${p.predLocal}" placeholder="0">
          <span class="separador">-</span>
          <input type="number" min="0" inputmode="numeric"
                 data-id="${partido.id}" data-campo="predVisitante"
                 value="${p.predVisitante}" placeholder="0">
          <span class="caption">${partido.visitante}</span>
        </div>
      </div>

      <div>
        <div class="caption">Resultado real</div>
        <div class="resultado-real">
          <span class="caption">${partido.local}</span>
          <input type="number" min="0" inputmode="numeric"
                 data-id="${partido.id}" data-campo="realLocal"
                 value="${p.realLocal}" placeholder="0">
          <span class="separador">-</span>
          <input type="number" min="0" inputmode="numeric"
                 data-id="${partido.id}" data-campo="realVisitante"
                 value="${p.realVisitante}" placeholder="0">
          <span class="caption">${partido.visitante}</span>
        </div>
      </div>

      <div class="partido-header">
        <div class="sede">${partido.estadio}<br>${partido.ciudad}</div>
        <div class="puntos">
          <span class="puntos-badge">${puntos === null ? "Sin puntos" : puntos + " pts"}</span>
        </div>
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
      const id = e.target.dataset.id;
      const campo = e.target.dataset.campo;
      const valor = e.target.value;

      if (valor !== "" && Number(valor) < 0) {
        e.target.value = 0;
      }

      obtenerPronostico(id)[campo] = e.target.value;
      guardarEstado();

      const puntos = calcularPuntos(id);
      const badge = e.target.closest(".partido").querySelector(".puntos-badge");
      badge.textContent = puntos === null ? "Sin puntos" : `${puntos} pts`;
    });
  });
}

function actualizarResumen() {
  let pronosticados = 0;
  let conResultado = 0;
  let puntosTotales = 0;

  partidos.forEach(partido => {
    const p = obtenerPronostico(partido.id);

    const tienePrediccion =
      valorNumero(p.predLocal) !== null &&
      valorNumero(p.predVisitante) !== null;

    const tieneResultado =
      valorNumero(p.realLocal) !== null &&
      valorNumero(p.realVisitante) !== null;

    if (tienePrediccion) pronosticados++;
    if (tieneResultado) conResultado++;

    const puntos = calcularPuntos(partido.id);
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

  partidos.forEach(partido => {
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
          dg: 0
        };
      }
    });

    const p = estado.pronosticos && estado.pronosticos[partido.id];
    const realLocal = valorNumero(p && p.realLocal);
    const realVisitante = valorNumero(p && p.realVisitante);

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

    if (realLocal > realVisitante) {
      local.pts += 3;
    } else if (realVisitante > realLocal) {
      visitante.pts += 3;
    } else {
      local.pts++;
      visitante.pts++;
    }
  });

  Object.values(grupos).forEach(grupo => {
    Object.values(grupo).forEach(equipo => {
      equipo.dg = equipo.gf - equipo.gc;
    });
  });

  return { grupos, partidosConResultado };
}

function ordenarEquipos(a, b) {
  return b.pts - a.pts || b.dg - a.dg || b.gf - a.gf || a.gc - b.gc || a.equipo.localeCompare(b.equipo, "es");
}

function obtenerClasificados() {
  const { grupos, partidosConResultado } = crearTablaGrupos();
  const ganadores = [];
  const segundos = [];
  const terceros = [];

  Object.keys(grupos).sort().forEach(grupo => {
    const tabla = Object.values(grupos[grupo]).sort(ordenarEquipos);
    if (tabla[0]) ganadores.push({ ...tabla[0], origen: `1 Grupo ${grupo}` });
    if (tabla[1]) segundos.push({ ...tabla[1], origen: `2 Grupo ${grupo}` });
    if (tabla[2]) terceros.push({ ...tabla[2], origen: `3 Grupo ${grupo}` });
  });

  const rankingGlobal = (a, b) => ordenarEquipos(a, b) || a.grupo.localeCompare(b.grupo, "es");
  const semillas = [
    ...ganadores.sort(rankingGlobal),
    ...segundos.sort(rankingGlobal),
    ...terceros.sort(rankingGlobal).slice(0, 8)
  ];

  return { semillas, partidosConResultado };
}

function crearRondasEliminatorias(semillas) {
  const ordenCruces = [
    [1, 32], [16, 17], [8, 25], [9, 24],
    [4, 29], [13, 20], [5, 28], [12, 21],
    [2, 31], [15, 18], [7, 26], [10, 23],
    [3, 30], [14, 19], [6, 27], [11, 22]
  ];

  const dieciseisavos = ordenCruces.map(([a, b], index) => ({
    id: `D${index + 1}`,
    equipos: [semillas[a - 1], semillas[b - 1]]
  }));

  const crearPlaceholder = (prefijo, cantidad, rondaAnterior) => Array.from({ length: cantidad }, (_, index) => ({
    id: `${prefijo}${index + 1}`,
    equipos: [
      { equipo: `Ganador ${rondaAnterior}${index * 2 + 1}`, origen: "Por definir" },
      { equipo: `Ganador ${rondaAnterior}${index * 2 + 2}`, origen: "Por definir" }
    ]
  }));

  return [
    { nombre: "Dieciseisavos", cruces: dieciseisavos },
    { nombre: "Octavos", cruces: crearPlaceholder("O", 8, "D") },
    { nombre: "Cuartos", cruces: crearPlaceholder("C", 4, "O") },
    { nombre: "Semifinales", cruces: crearPlaceholder("S", 2, "C") },
    { nombre: "Final", cruces: crearPlaceholder("F", 1, "S") }
  ];
}

function renderizarEliminatorias() {
  const { semillas, partidosConResultado } = obtenerClasificados();
  const estadoTexto = $("#estadoEliminatorias");

  if (partidosConResultado < partidos.length) {
    estadoTexto.textContent = `${partidosConResultado} de ${partidos.length} resultados capturados`;
    eliminatorias.innerHTML = `
      <div class="placeholder" style="grid-column: 1 / -1;">
        Captura todos los resultados reales de la fase de grupos para generar la llave de 32 clasificados.
        Se usan puntos, diferencia de goles, goles a favor y goles en contra como criterios de desempate.
      </div>
    `;
    return;
  }

  estadoTexto.textContent = "Proyección automática";
  eliminatorias.innerHTML = "";

  crearRondasEliminatorias(semillas).forEach(ronda => {
    const columna = document.createElement("section");
    columna.className = "ronda";
    columna.innerHTML = `<h3>${ronda.nombre}</h3>`;

    ronda.cruces.forEach(cruce => {
      const card = document.createElement("div");
      card.className = "cruce";
      card.innerHTML = `
        <div class="cruce-id">${cruce.id}</div>
        ${cruce.equipos.map(equipo => `
          <div class="cruce-equipo">
            <span>${equipo.equipo}</span>
            <small>${equipo.origen}</small>
          </div>
        `).join("")}
      `;
      columna.appendChild(card);
    });

    eliminatorias.appendChild(columna);
  });
}

function exportarQuiniela() {
  guardarEstado();

  const datos = {
    torneo: "Mundial 2026",
    etapa: "Fase de grupos",
    exportado: new Date().toISOString(),
    ...estado
  };

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
      estado = normalizarEstado(datos);

      participante.value = estado.participante;
      guardarEstado();
      renderizarPartidos();
      alert("Quiniela importada correctamente.");
    } catch {
      alert("El archivo no tiene un formato válido.");
    }
  };

  reader.readAsText(file);
}

participante.addEventListener("input", guardarEstado);
grupoFiltro.addEventListener("change", renderizarPartidos);
buscar.addEventListener("input", renderizarPartidos);

$("#btnResultados").addEventListener("click", () => {
  document.body.classList.toggle("modo-resultados");
  $("#btnResultados").textContent = document.body.classList.contains("modo-resultados")
    ? "Ocultar resultados"
    : "Modo resultados";
});

$("#btnExportar").addEventListener("click", exportarQuiniela);

$("#btnImportar").addEventListener("click", () => {
  $("#archivoImportar").click();
});

$("#archivoImportar").addEventListener("change", (e) => {
  importarQuiniela(e.target.files[0]);
  e.target.value = "";
});

$("#btnLimpiar").addEventListener("click", () => {
  if (!confirm("¿Seguro que deseas borrar la quiniela guardada?")) return;

  localStorage.removeItem(STORAGE_KEY);
  estado = { participante: "", pronosticos: {} };
  participante.value = "";
  renderizarPartidos();
});

cargarEstado();
llenarGrupos();
renderizarPartidos();

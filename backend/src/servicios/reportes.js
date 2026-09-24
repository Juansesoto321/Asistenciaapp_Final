const modelo = require("../modelos/reportes");
const { error } = require("../utilidades/errores");
const { celdaCsv, fechaIso } = require("../utilidades/formato");

const BOM = String.fromCharCode(0xfeff); // Excel lo necesita para mostrar bien las tildes

// Regla CU-17: el instructor solo consulta sus fichas
function conAlcanceDeRol(filtros, usuario) {
  return usuario.rol === "instructor" ? { ...filtros, id_instructor: usuario.id } : filtros;
}

async function buscar(filtros, usuario) {
  return modelo.buscarAsistencias(conAlcanceDeRol(filtros, usuario));
}

// CU-18: exportar CSV (abre en Excel)
async function exportarCSV(filtros, usuario) {
  const filas = await modelo.buscarAsistencias(conAlcanceDeRol(filtros, usuario));
  const encabezado = "Fecha;Aprendiz;Documento;Ficha;Estado;Hora;Método;Observación";
  const cuerpo = filas.map((f) =>
    [fechaIso(f.fecha), f.aprendiz, f.documento, f.numero_ficha, f.estado, f.hora, f.metodo, f.observacion]
      .map(celdaCsv)
      .join(";")
  );
  return BOM + [encabezado, ...cuerpo].join("\r\n");
}

async function listarBusquedasGuardadas(idUsuario) {
  return modelo.listarBusquedasGuardadas(idUsuario);
}

async function guardarBusqueda(idUsuario, nombre, filtros) {
  if (!nombre?.trim()) throw error("Ponle un nombre a la búsqueda", "validacion");
  return modelo.guardarBusqueda(idUsuario, nombre, filtros);
}

// CU-19: historial del aprendiz (solo sus datos)
async function historialAprendiz(idAprendiz, idFichaSolicitada) {
  const fichas = await modelo.fichasDelAprendiz(idAprendiz);
  const idFicha = idFichaSolicitada || fichas[0]?.id_ficha;
  let detalle = [];
  let resumen = null;
  if (idFicha) {
    detalle = await modelo.historialFicha(idAprendiz, idFicha);
    const total = detalle.length;
    const asistidas = detalle.filter((d) => ["presente", "tardanza", "justificada"].includes(d.estado)).length;
    resumen = {
      total,
      presentes: detalle.filter((d) => d.estado === "presente").length,
      tardanzas: detalle.filter((d) => d.estado === "tardanza").length,
      ausencias: detalle.filter((d) => d.estado === "ausente").length,
      justificadas: detalle.filter((d) => d.estado === "justificada").length,
      porcentaje: total ? Math.round((asistidas / total) * 100) : 100,
      minimo: await modelo.porcentajeMinimo(), // regla CU-19: resaltar bajo el minimo
    };
  }
  return { fichas, id_ficha: idFicha ? Number(idFicha) : null, detalle, resumen };
}

async function obtenerEstadisticas(usuario) {
  return modelo.estadisticas(usuario);
}

module.exports = { buscar, exportarCSV, listarBusquedasGuardadas, guardarBusqueda, historialAprendiz, obtenerEstadisticas };

const servicio = require("../servicios/reportes");

function responderError(res, error, mensaje) {
  if (error.tipo === "validacion") return res.status(400).json({ mensaje: error.message });
  console.error(error);
  return res.status(500).json({ mensaje });
}

// CU-17
async function buscar(req, res) {
  try {
    res.json(await servicio.buscar(req.query, req.usuario));
  } catch (error) {
    responderError(res, error, "Error en la búsqueda");
  }
}

// CU-18
async function exportar(req, res) {
  try {
    const csv = await servicio.exportarCSV(req.query, req.usuario);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=reporte_asistencia.csv");
    res.send(csv);
  } catch (error) {
    responderError(res, error, "Error al exportar");
  }
}

async function listarBusquedasGuardadas(req, res) {
  try {
    res.json(await servicio.listarBusquedasGuardadas(req.usuario.id));
  } catch (error) {
    responderError(res, error, "Error al listar las búsquedas guardadas");
  }
}

async function guardarBusqueda(req, res) {
  try {
    const guardada = await servicio.guardarBusqueda(req.usuario.id, req.body.nombre, req.body.filtros);
    res.status(201).json(guardada);
  } catch (error) {
    responderError(res, error, "Error al guardar la búsqueda");
  }
}

// CU-19
async function miHistorial(req, res) {
  try {
    res.json(await servicio.historialAprendiz(req.usuario.id, req.query.id_ficha));
  } catch (error) {
    responderError(res, error, "Error al obtener el historial");
  }
}

async function estadisticas(req, res) {
  try {
    res.json(await servicio.obtenerEstadisticas(req.usuario));
  } catch (error) {
    responderError(res, error, "Error al obtener las estadísticas");
  }
}

module.exports = { buscar, exportar, listarBusquedasGuardadas, guardarBusqueda, miHistorial, estadisticas };

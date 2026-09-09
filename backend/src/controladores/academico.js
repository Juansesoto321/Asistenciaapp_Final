const servicio = require("../servicios/academico");

function responderError(res, error, mensaje) {
  if (error.code === "23505") return res.status(400).json({ mensaje: "El registro ya existe" });
  if (error.code === "23514") return res.status(400).json({ mensaje: "La fecha fin debe ser posterior a la fecha inicio" });
  if (error.tipo === "conflicto_horario") return res.status(400).json({ mensaje: error.message });
  console.error(error);
  return res.status(500).json({ mensaje });
}

async function listarPeriodos(_req, res) {
  try {
    res.json(await servicio.obtenerPeriodos());
  } catch (error) {
    responderError(res, error, "Error al listar los periodos");
  }
}

async function listarInstructores(_req, res) {
  try {
    res.json(await servicio.obtenerInstructores());
  } catch (error) {
    responderError(res, error, "Error al listar los instructores");
  }
}

async function crearPeriodo(req, res) {
  try {
    res.status(201).json(await servicio.crearPeriodo(req.body));
  } catch (error) {
    responderError(res, error, "Error al crear el periodo");
  }
}

async function listarFichas(req, res) {
  try {
    res.json(await servicio.obtenerFichas(req.usuario));
  } catch (error) {
    responderError(res, error, "Error al listar las fichas");
  }
}

async function crearFicha(req, res) {
  try {
    res.status(201).json(await servicio.crearFicha(req.body, req.usuario));
  } catch (error) {
    responderError(res, error, "Error al crear la ficha");
  }
}

async function listarHorarios(req, res) {
  try {
    res.json(await servicio.obtenerHorarios(req.usuario));
  } catch (error) {
    responderError(res, error, "Error al listar los horarios");
  }
}

async function crearHorario(req, res) {
  try {
    res.status(201).json(await servicio.crearHorario(req.body, req.usuario));
  } catch (error) {
    responderError(res, error, "Error al crear el horario");
  }
}

async function eliminarHorario(req, res) {
  try {
    await servicio.eliminarHorario(req.params.id, req.usuario);
    res.json({ mensaje: "Horario eliminado" });
  } catch (error) {
    if (error.code === "23503") return res.status(400).json({ mensaje: "No se puede eliminar: ya existen sesiones de clase registradas para este horario" });
    responderError(res, error, "Error al eliminar el horario");
  }
}

module.exports = {
  listarPeriodos,
  listarInstructores,
  crearPeriodo,
  listarFichas,
  crearFicha,
  listarHorarios,
  crearHorario,
  eliminarHorario,
};

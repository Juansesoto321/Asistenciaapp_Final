const servicio = require("../servicios/sesiones");

const ESTADOS_HTTP = { no_encontrado: 404, prohibido: 403, validacion: 400 };

function responderError(res, error, mensaje) {
  if (!error.tipo) {
    console.error(error);
    return res.status(500).json({ mensaje });
  }
  res.status(ESTADOS_HTTP[error.tipo] || 500).json({ mensaje: error.message });
}

async function horariosDeHoy(req, res) {
  try {
    res.json(await servicio.horariosDeHoy(req.usuario));
  } catch (e) {
    responderError(res, e, "Error al consultar los horarios de hoy");
  }
}

async function iniciarSesion(req, res) {
  try {
    res.json(await servicio.iniciarSesion(req.body.id_horario, req.usuario));
  } catch (e) {
    responderError(res, e, "Error al iniciar la sesión");
  }
}

async function verDetalle(req, res) {
  try {
    res.json(await servicio.verDetalle(req.params.id));
  } catch (e) {
    responderError(res, e, "Error al consultar la sesión");
  }
}

async function registrarAsistenciaManual(req, res) {
  try {
    res.json(await servicio.registrarAsistenciaManual(req.params.id, req.usuario, req.body));
  } catch (e) {
    responderError(res, e, "Error en el registro manual");
  }
}

async function cerrarSesion(req, res) {
  try {
    res.json(await servicio.cerrarSesion(req.params.id, req.usuario));
  } catch (e) {
    responderError(res, e, "Error al cerrar la sesión");
  }
}

async function eliminarSesion(req, res) {
  try {
    res.json(await servicio.eliminarSesion(req.params.id, req.usuario));
  } catch (e) {
    responderError(res, e, "Error al eliminar la sesión");
  }
}

module.exports = { horariosDeHoy, iniciarSesion, verDetalle, registrarAsistenciaManual, cerrarSesion, eliminarSesion };

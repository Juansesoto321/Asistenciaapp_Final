const servicio = require("../servicios/justificaciones");

// --- PUBLICO (acceso por token del correo, sin login) ---
async function verPorToken(req, res, next) {
  try {
    res.json(await servicio.verPorToken(req.params.token));
  } catch (error) {
    next(error);
  }
}

async function enviarPorToken(req, res, next) {
  try {
    await servicio.enviarPorToken(req.params.token, req.body);
    res.json({ mensaje: "Justificación enviada. El instructor la revisará" });
  } catch (error) {
    next(error);
  }
}

// --- AUTENTICADO ---
async function listarBandeja(req, res, next) {
  try {
    res.json(await servicio.listarBandeja(req.usuario));
  } catch (error) {
    next(error);
  }
}

async function contarPendientes(req, res, next) {
  try {
    res.json(await servicio.contarPendientes(req.usuario));
  } catch (error) {
    next(error);
  }
}

async function verArchivo(req, res, next) {
  try {
    res.json(await servicio.obtenerArchivo(req.params.id, req.usuario));
  } catch (error) {
    next(error);
  }
}

async function validar(req, res, next) {
  try {
    res.json(await servicio.validarJustificacion(req.params.id, req.usuario, req.body));
  } catch (error) {
    next(error);
  }
}

module.exports = { verPorToken, enviarPorToken, listarBandeja, contarPendientes, verArchivo, validar };

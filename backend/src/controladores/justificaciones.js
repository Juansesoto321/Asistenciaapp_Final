const servicio = require("../servicios/justificaciones");

const ESTADOS_HTTP = { no_encontrado: 404, vencida: 410, validacion: 400, prohibido: 403 };

function responderError(res, error, mensaje) {
  if (!error.tipo) console.error(error);
  const cuerpo = { mensaje: error.tipo ? error.message : mensaje };
  if (error.vencida) cuerpo.vencida = true;
  res.status(ESTADOS_HTTP[error.tipo] || 500).json(cuerpo);
}

// --- PUBLICO (acceso por token del correo, sin login) ---
async function verPorToken(req, res) {
  try {
    res.json(await servicio.verPorToken(req.params.token));
  } catch (e) {
    responderError(res, e);
  }
}

async function enviarPorToken(req, res) {
  try {
    await servicio.enviarPorToken(req.params.token, req.body);
    res.json({ mensaje: "Justificación enviada. El instructor la revisará" });
  } catch (e) {
    responderError(res, e, "Error al enviar la justificación");
  }
}

// --- AUTENTICADO ---
async function listarBandeja(req, res) {
  res.json(await servicio.listarBandeja(req.usuario));
}

async function contarPendientes(req, res) {
  res.json(await servicio.contarPendientes(req.usuario));
}

async function verArchivo(req, res) {
  try {
    res.json(await servicio.obtenerArchivo(req.params.id, req.usuario));
  } catch (e) {
    responderError(res, e);
  }
}

async function validar(req, res) {
  try {
    res.json(await servicio.validarJustificacion(req.params.id, req.usuario, req.body));
  } catch (e) {
    responderError(res, e, "Error al validar la justificación");
  }
}

module.exports = { verPorToken, enviarPorToken, listarBandeja, contarPendientes, verArchivo, validar };

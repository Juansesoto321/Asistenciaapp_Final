const dispositivos = require("../servicios/dispositivos");

/** Autentica al lector simulado por serial + clave de API (contrato /api/lector). */
async function autenticarDispositivo(req, _res, next) {
  try {
    req.dispositivo = await dispositivos.autenticar(req.headers["x-serial"], req.headers["x-clave-api"]);
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = { autenticarDispositivo };

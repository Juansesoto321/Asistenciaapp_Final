const pool = require("../config/db");

/** Autentica al lector simulado por serial + clave de API (contrato /api/lector). */
async function autenticarDispositivo(req, res, next) {
  try {
    const serial = req.headers["x-serial"];
    const clave = req.headers["x-clave-api"];
    const r = await pool.query("SELECT * FROM dispositivo WHERE serial = $1 AND clave_api = $2", [serial, clave]);
    if (!r.rows[0]) return res.status(401).json({ mensaje: "Dispositivo no autorizado" });
    req.dispositivo = r.rows[0];
    next();
  } catch (e) {
    console.error(e);
    res.status(500).json({ mensaje: "Error autenticando el dispositivo" });
  }
}

module.exports = { autenticarDispositivo };

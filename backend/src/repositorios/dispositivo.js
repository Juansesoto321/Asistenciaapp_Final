const pool = require("../config/db");

// Busqueda solo por serial: la usa el protocolo ADMS real, que no maneja
// clave de API (limitacion del protocolo de fabrica, no del backend).
async function buscarPorSerial(serial) {
  const r = await pool.query("SELECT * FROM dispositivo WHERE serial = $1", [serial]);
  return r.rows[0] || null;
}

async function marcarEnLinea(idDispositivo) {
  await pool.query(
    "UPDATE dispositivo SET estado = 'en_linea', ultimo_heartbeat = NOW() WHERE id_dispositivo = $1",
    [idDispositivo]
  );
}

module.exports = { buscarPorSerial, marcarEnLinea };

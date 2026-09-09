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

/** Tarea programada CU-09: sin heartbeat en 3 minutos, el lector se da por caido. */
async function marcarFueraDeLineaSinHeartbeat() {
  const r = await pool.query(
    `UPDATE dispositivo SET estado = 'fuera_de_linea'
     WHERE estado = 'en_linea' AND ultimo_heartbeat < NOW() - INTERVAL '3 minutes'`
  );
  return r.rowCount;
}

module.exports = { buscarPorSerial, marcarEnLinea, marcarFueraDeLineaSinHeartbeat };

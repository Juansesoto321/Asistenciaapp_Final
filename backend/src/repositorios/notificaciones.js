const pool = require("../config/db");

async function listarPorUsuario(idUsuario) {
  const r = await pool.query(
    "SELECT * FROM notificacion WHERE id_usuario = $1 ORDER BY creado_en DESC LIMIT 50",
    [idUsuario]
  );
  return r.rows;
}

async function contarPendientes(idUsuario) {
  const r = await pool.query(
    "SELECT COUNT(*)::int AS pendientes FROM notificacion WHERE id_usuario = $1 AND leida = FALSE",
    [idUsuario]
  );
  return r.rows[0].pendientes;
}

async function marcarLeida(idNotificacion, idUsuario) {
  await pool.query(
    "UPDATE notificacion SET leida = TRUE WHERE id_notificacion = $1 AND id_usuario = $2",
    [idNotificacion, idUsuario]
  );
}

module.exports = { listarPorUsuario, contarPendientes, marcarLeida };

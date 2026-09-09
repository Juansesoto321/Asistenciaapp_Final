const pool = require("../config/db");

async function insertar({ nivel, mensaje, metodo, ruta, idUsuario, traza }) {
  const r = await pool.query(
    `INSERT INTO log_error (nivel, mensaje, metodo, ruta, id_usuario, traza)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING id_log`,
    [nivel, mensaje, metodo || null, ruta || null, idUsuario || null, traza || null]
  );
  return r.rows[0].id_log;
}

async function listar({ nivel, desde, hasta, limite }) {
  const condiciones = [];
  const valores = [];
  const agregar = (sql, valor) => {
    valores.push(valor);
    condiciones.push(sql.replace("?", `$${valores.length}`));
  };

  if (nivel) agregar("l.nivel = ?", nivel);
  if (desde) agregar("l.creado_en >= ?", desde);
  if (hasta) agregar("l.creado_en <= ?", hasta);

  const where = condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : "";
  valores.push(limite);

  const r = await pool.query(
    `SELECT l.id_log, l.nivel, l.mensaje, l.metodo, l.ruta, l.traza, l.creado_en,
            u.nombres || ' ' || u.apellidos AS usuario
     FROM log_error l
     LEFT JOIN usuario u ON u.id_usuario = l.id_usuario
     ${where}
     ORDER BY l.creado_en DESC
     LIMIT $${valores.length}`,
    valores
  );
  return r.rows;
}

module.exports = { insertar, listar };

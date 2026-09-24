const pool = require("../config/db");

async function insertar({ idUsuario, accion, entidad, idEntidad, detalle }) {
  await pool.query(
    `INSERT INTO auditoria (id_usuario, accion, entidad, id_entidad, detalle)
     VALUES ($1,$2,$3,$4,$5)`,
    [idUsuario, accion, entidad, idEntidad, detalle ? JSON.stringify(detalle) : null]
  );
}

module.exports = { insertar };

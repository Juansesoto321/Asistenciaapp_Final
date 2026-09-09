const pool = require("../config/db");

async function listar({ rol, estado, buscar }) {
  const condiciones = [];
  const valores = [];
  if (rol) { valores.push(rol); condiciones.push(`rol = $${valores.length}`); }
  if (estado) { valores.push(estado); condiciones.push(`estado = $${valores.length}`); }
  if (buscar) {
    valores.push(`%${buscar}%`);
    condiciones.push(`(nombres ILIKE $${valores.length} OR apellidos ILIKE $${valores.length} OR documento ILIKE $${valores.length} OR correo ILIKE $${valores.length})`);
  }
  const where = condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : "";
  const r = await pool.query(
    `SELECT id_usuario, nombres, apellidos, tipo_documento, documento, correo, telefono, rol, estado, creado_en
     FROM usuario ${where} ORDER BY creado_en DESC`,
    valores
  );
  return r.rows;
}

async function crear({ nombres, apellidos, tipoDocumento, documento, correo, telefono, hash, rol, estado = "activo" }) {
  const r = await pool.query(
    `INSERT INTO usuario (nombres, apellidos, tipo_documento, documento, correo, telefono, contrasena_hash, rol, estado)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id_usuario`,
    [nombres, apellidos, tipoDocumento || "CC", documento, correo, telefono, hash, rol, estado]
  );
  return r.rows[0].id_usuario;
}

async function editar(idUsuario, { nombres, apellidos, telefono, rol }) {
  await pool.query(
    `UPDATE usuario SET nombres = COALESCE($1,nombres), apellidos = COALESCE($2,apellidos),
      telefono = COALESCE($3,telefono), rol = COALESCE($4,rol), actualizado_en = NOW()
     WHERE id_usuario = $5`,
    [nombres, apellidos, telefono, rol, idUsuario]
  );
}

async function cambiarEstado(idUsuario, estado) {
  const r = await pool.query(
    "UPDATE usuario SET estado = $1, actualizado_en = NOW() WHERE id_usuario = $2 RETURNING correo, nombres, estado",
    [estado, idUsuario]
  );
  return r.rows[0] || null;
}

module.exports = { listar, crear, editar, cambiarEstado };

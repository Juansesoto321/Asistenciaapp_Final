const pool = require("../config/db");

async function crearTicket({ idUsuario, tipo, descripcion }) {
  const r = await pool.query(
    "INSERT INTO ticket_soporte (id_usuario, tipo, descripcion) VALUES ($1,$2,$3) RETURNING id_ticket",
    [idUsuario, tipo, descripcion]
  );
  return r.rows[0].id_ticket;
}

async function notificarAdministradores(idTicket, tipo) {
  await pool.query(
    `INSERT INTO notificacion (id_usuario, tipo, titulo, mensaje)
     SELECT id_usuario, 'soporte', 'Nuevo ticket de soporte', 'Ticket #' || $1 || ': ' || $2
     FROM usuario WHERE rol = 'administrador' AND estado = 'activo'`,
    [idTicket, tipo]
  );
}

async function listar(idUsuario, esAdministrador) {
  const r = await pool.query(
    `SELECT t.*, u.nombres || ' ' || u.apellidos AS usuario
     FROM ticket_soporte t JOIN usuario u ON u.id_usuario = t.id_usuario
     ${esAdministrador ? "" : "WHERE t.id_usuario = $1"} ORDER BY t.creado_en DESC`,
    esAdministrador ? [] : [idUsuario]
  );
  return r.rows;
}

async function actualizarEstado(idTicket, estado) {
  await pool.query("UPDATE ticket_soporte SET estado = $1 WHERE id_ticket = $2", [estado, idTicket]);
}

module.exports = { crearTicket, notificarAdministradores, listar, actualizarEstado };

const pool = require("../config/db");

function construirCondiciones(filtros) {
  const condiciones = [];
  const valores = [];
  const add = (sql, val) => { valores.push(val); condiciones.push(sql.replace("?", `$${valores.length}`)); };

  if (filtros.nombre) add("(u.nombres ILIKE ? OR u.apellidos ILIKE ? OR u.documento ILIKE ?)".replaceAll("?", `$${valores.length + 1}`), `%${filtros.nombre}%`);
  if (filtros.id_ficha) add("f.id_ficha = ?", filtros.id_ficha);
  if (filtros.id_instructor) add("h.id_instructor = ?", filtros.id_instructor);
  if (filtros.estado) add("a.estado = ?", filtros.estado);
  if (filtros.fecha_inicio) add("s.fecha >= ?", filtros.fecha_inicio);
  if (filtros.fecha_fin) add("s.fecha <= ?", filtros.fecha_fin);

  const where = condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : "";
  return { where, valores };
}

async function buscarAsistencias(filtros) {
  const { where, valores } = construirCondiciones(filtros);
  const r = await pool.query(
    `SELECT a.id_asistencia, s.fecha, u.nombres || ' ' || u.apellidos AS aprendiz, u.documento,
            f.numero_ficha, a.estado, TO_CHAR(a.hora_marca AT TIME ZONE 'America/Bogota','HH24:MI') AS hora,
            a.metodo, a.observacion
     FROM asistencia a
     JOIN sesion_clase s ON s.id_sesion = a.id_sesion
     JOIN horario h ON h.id_horario = s.id_horario
     JOIN ficha f ON f.id_ficha = h.id_ficha
     JOIN usuario u ON u.id_usuario = a.id_aprendiz
     ${where}
     ORDER BY s.fecha DESC, u.apellidos`,
    valores
  );
  return r.rows;
}

async function listarBusquedasGuardadas(idUsuario) {
  const r = await pool.query("SELECT * FROM busqueda_guardada WHERE id_usuario = $1 ORDER BY creado_en DESC", [idUsuario]);
  return r.rows;
}

async function guardarBusqueda(idUsuario, nombre, filtros) {
  const r = await pool.query(
    "INSERT INTO busqueda_guardada (id_usuario, nombre, filtros) VALUES ($1,$2,$3) RETURNING *",
    [idUsuario, nombre, JSON.stringify(filtros)]
  );
  return r.rows[0];
}

async function fichasDelAprendiz(idAprendiz) {
  const r = await pool.query(
    `SELECT f.id_ficha, f.numero_ficha, f.programa, m.estado AS estado_matricula
     FROM matricula m JOIN ficha f ON f.id_ficha = m.id_ficha
     WHERE m.id_aprendiz = $1 ORDER BY m.fecha_matricula DESC`,
    [idAprendiz]
  );
  return r.rows;
}

async function historialFicha(idAprendiz, idFicha) {
  const r = await pool.query(
    `SELECT s.fecha, a.estado, TO_CHAR(a.hora_marca AT TIME ZONE 'America/Bogota','HH24:MI') AS hora,
            a.metodo, a.observacion,
            j.estado AS estado_soporte, j.token AS token_soporte, j.expira_en AS soporte_expira,
            j.nombre_archivo AS soporte_archivo, j.tipo AS soporte_tipo, j.descripcion AS soporte_descripcion,
            j.observacion_validacion AS soporte_observacion
     FROM asistencia a
     JOIN sesion_clase s ON s.id_sesion = a.id_sesion
     JOIN horario h ON h.id_horario = s.id_horario
     LEFT JOIN justificacion j ON j.id_asistencia = a.id_asistencia
     WHERE a.id_aprendiz = $1 AND h.id_ficha = $2
     ORDER BY s.fecha DESC`,
    [idAprendiz, idFicha]
  );
  return r.rows;
}

async function porcentajeMinimo() {
  const r = await pool.query("SELECT valor FROM configuracion WHERE clave = 'porcentaje_minimo'");
  return Number(r.rows[0]?.valor || 80);
}

// Requiere el usuario completo (no solo filtros) porque la condicion de
// instructor se repite dentro de varias subconsultas de la misma sentencia.
async function estadisticas(usuario) {
  const filtro = usuario.rol === "instructor" ? "AND h.id_instructor = $1" : "";
  const valores = usuario.rol === "instructor" ? [usuario.id] : [];
  const r = await pool.query(
    `SELECT
      (SELECT COUNT(*) FROM ficha WHERE estado = 'activa' ${usuario.rol === "instructor" ? "AND id_instructor = $1" : ""}) AS fichas_activas,
      (SELECT COUNT(DISTINCT m.id_aprendiz) FROM matricula m JOIN ficha f ON f.id_ficha = m.id_ficha
        WHERE m.estado = 'activa' ${usuario.rol === "instructor" ? "AND f.id_instructor = $1" : ""}) AS aprendices_activos,
      (SELECT COUNT(*) FROM sesion_clase s JOIN horario h ON h.id_horario = s.id_horario
        WHERE s.fecha = CURRENT_DATE ${filtro}) AS sesiones_hoy,
      COALESCE((SELECT ROUND(AVG(CASE WHEN a.estado IN ('presente','tardanza','justificada') THEN 100 ELSE 0 END))
        FROM asistencia a JOIN sesion_clase s ON s.id_sesion = a.id_sesion
        JOIN horario h ON h.id_horario = s.id_horario WHERE TRUE ${filtro}), 0) AS promedio_asistencia`,
    valores
  );
  return r.rows[0];
}

module.exports = {
  buscarAsistencias,
  listarBusquedasGuardadas,
  guardarBusqueda,
  fichasDelAprendiz,
  historialFicha,
  porcentajeMinimo,
  estadisticas,
};

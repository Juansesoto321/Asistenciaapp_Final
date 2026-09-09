const pool = require("../config/db");

async function finalizarFichasVencidas() {
  await pool.query(
    `WITH fichas_finalizadas AS (
       UPDATE ficha SET estado = 'finalizada'
       WHERE estado = 'activa' AND fecha_fin < CURRENT_DATE
       RETURNING id_ficha
     )
     UPDATE matricula SET estado = 'finalizada'
     WHERE estado = 'activa' AND id_ficha IN (SELECT id_ficha FROM fichas_finalizadas)`
  );
}

async function listarPeriodos() {
  const resultado = await pool.query("SELECT * FROM periodo ORDER BY fecha_inicio DESC");
  return resultado.rows;
}

async function listarInstructores() {
  const resultado = await pool.query(
    "SELECT id_usuario, nombres, apellidos FROM usuario WHERE rol = 'instructor' AND estado = 'activo' ORDER BY apellidos, nombres"
  );
  return resultado.rows;
}

async function listarFichas(usuario) {
  await finalizarFichasVencidas();
  const filtro = usuario.rol === "instructor" ? "WHERE f.id_instructor = $1" : "";
  const valores = usuario.rol === "instructor" ? [usuario.id] : [];
  const resultado = await pool.query(
    `SELECT f.*, p.nombre AS periodo,
            u.nombres || ' ' || u.apellidos AS instructor,
            (SELECT COUNT(*) FROM matricula m WHERE m.id_ficha = f.id_ficha AND m.estado = 'activa') AS total_aprendices
     FROM ficha f
     JOIN periodo p ON p.id_periodo = f.id_periodo
     JOIN usuario u ON u.id_usuario = f.id_instructor
     ${filtro}
     ORDER BY f.id_ficha DESC`,
    valores
  );
  return resultado.rows;
}

async function crearPeriodo(datos) {
  const resultado = await pool.query(
    "INSERT INTO periodo (nombre, fecha_inicio, fecha_fin) VALUES ($1,$2,$3) RETURNING *",
    [datos.nombre, datos.fecha_inicio, datos.fecha_fin]
  );
  return resultado.rows[0];
}

async function crearFicha(datos) {
  const resultado = await pool.query(
    `INSERT INTO ficha (numero_ficha, programa, jornada, fecha_inicio, fecha_fin, id_periodo, id_instructor)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [datos.numero_ficha, datos.programa, datos.jornada, datos.fecha_inicio, datos.fecha_fin, datos.id_periodo, datos.id_instructor]
  );
  return resultado.rows[0];
}

async function listarHorarios(usuario) {
  const filtro = usuario.rol === "instructor" ? "WHERE h.id_instructor = $1" : "";
  const valores = usuario.rol === "instructor" ? [usuario.id] : [];
  const resultado = await pool.query(
    `SELECT h.*, f.numero_ficha, f.programa, a.numero_ambiente,
            u.nombres || ' ' || u.apellidos AS instructor
     FROM horario h
     JOIN ficha f ON f.id_ficha = h.id_ficha
     JOIN ambiente a ON a.id_ambiente = h.id_ambiente
     JOIN usuario u ON u.id_usuario = h.id_instructor
     ${filtro}
     ORDER BY h.dia_semana, h.hora_inicio`,
    valores
  );
  return resultado.rows;
}

async function buscarConflictoHorario(datos) {
  const resultado = await pool.query(
    `SELECT h.id_horario, f.numero_ficha,
            CASE WHEN h.id_instructor = $1 THEN 'instructor' ELSE 'ambiente' END AS tipo
     FROM horario h JOIN ficha f ON f.id_ficha = h.id_ficha
     WHERE h.dia_semana = $3
       AND (h.id_instructor = $1 OR h.id_ambiente = $2)
       AND (h.hora_inicio, h.hora_fin) OVERLAPS ($4::time, $5::time)
     LIMIT 1`,
    [datos.id_instructor, datos.id_ambiente, datos.dia_semana, datos.hora_inicio, datos.hora_fin]
  );
  return resultado.rows[0];
}

async function crearHorario(datos) {
  const resultado = await pool.query(
    `INSERT INTO horario (id_ficha, id_ambiente, id_instructor, id_periodo, dia_semana, hora_inicio, hora_fin)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [datos.id_ficha, datos.id_ambiente, datos.id_instructor, datos.id_periodo, datos.dia_semana, datos.hora_inicio, datos.hora_fin]
  );
  return resultado.rows[0];
}

async function eliminarHorario(id) {
  await pool.query("DELETE FROM horario WHERE id_horario = $1", [id]);
}

// ---------- MATRICULAS (CU-06) ----------
async function listarMatriculasDeFicha(idFicha) {
  const resultado = await pool.query(
    `SELECT m.id_matricula, m.estado, m.fecha_matricula,
            u.id_usuario, u.nombres, u.apellidos, u.documento, u.correo,
            (pb.id_plantilla IS NOT NULL) AS tiene_huella
     FROM matricula m
     JOIN usuario u ON u.id_usuario = m.id_aprendiz
     LEFT JOIN plantilla_biometrica pb ON pb.id_aprendiz = u.id_usuario
     WHERE m.id_ficha = $1 ORDER BY u.apellidos`,
    [idFicha]
  );
  return resultado.rows;
}

async function matricularAprendiz(idAprendiz, idFicha) {
  await pool.query("INSERT INTO matricula (id_aprendiz, id_ficha) VALUES ($1,$2)", [idAprendiz, idFicha]);
}

async function cambiarEstadoMatricula(id, estado) {
  await pool.query("UPDATE matricula SET estado = $1 WHERE id_matricula = $2", [estado, id]);
}

// ---------- AMBIENTES Y DISPOSITIVOS (CU-07, CU-09) ----------
async function listarAmbientes() {
  const resultado = await pool.query(
    `SELECT a.*, d.id_dispositivo, d.serial, d.modelo, d.estado AS estado_dispositivo, d.ultimo_heartbeat
     FROM ambiente a LEFT JOIN dispositivo d ON d.id_ambiente = a.id_ambiente
     ORDER BY a.numero_ambiente`
  );
  return resultado.rows;
}

async function crearAmbiente({ numero_ambiente, sede_centro, id_periodo }) {
  const resultado = await pool.query(
    "INSERT INTO ambiente (numero_ambiente, sede_centro, id_periodo) VALUES ($1,$2,$3) RETURNING *",
    [numero_ambiente, sede_centro, id_periodo || null]
  );
  return resultado.rows[0];
}

async function crearDispositivo({ idAmbiente, serial, modelo, claveApi }) {
  const resultado = await pool.query(
    `INSERT INTO dispositivo (serial, modelo, id_ambiente, clave_api, estado)
     VALUES ($1,$2,$3,$4,'no_verificado') RETURNING id_dispositivo, serial, modelo, estado`,
    [serial, modelo || "ZKTeco SenseFace 2A (simulado)", idAmbiente, claveApi]
  );
  return resultado.rows[0];
}

async function listarDispositivos() {
  const resultado = await pool.query(
    `SELECT d.id_dispositivo, d.serial, d.modelo, d.estado, d.ultimo_heartbeat,
            a.numero_ambiente, a.sede_centro
     FROM dispositivo d LEFT JOIN ambiente a ON a.id_ambiente = d.id_ambiente
     ORDER BY d.serial`
  );
  return resultado.rows;
}

module.exports = {
  listarPeriodos,
  listarInstructores,
  listarFichas,
  crearPeriodo,
  crearFicha,
  listarHorarios,
  buscarConflictoHorario,
  crearHorario,
  eliminarHorario,
  listarMatriculasDeFicha,
  matricularAprendiz,
  cambiarEstadoMatricula,
  listarAmbientes,
  crearAmbiente,
  crearDispositivo,
  listarDispositivos,
};

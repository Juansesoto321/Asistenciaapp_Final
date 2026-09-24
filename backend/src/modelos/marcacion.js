const pool = require("../config/db");

async function buscarSesionActivaEnAmbiente(idAmbiente) {
  const r = await pool.query(
    `SELECT s.id_sesion, s.hora_apertura, h.id_ficha, h.hora_inicio
     FROM sesion_clase s
     JOIN horario h ON h.id_horario = s.id_horario
     WHERE h.id_ambiente = $1 AND s.fecha = CURRENT_DATE AND s.estado = 'activa'
     ORDER BY s.hora_apertura DESC LIMIT 1`,
    [idAmbiente]
  );
  return r.rows[0] || null;
}

// Para el protocolo simulado (/api/lector): matching 1:N contra las plantillas cifradas
async function buscarPlantillasDeFicha(idFicha) {
  const r = await pool.query(
    `SELECT pb.*, u.id_usuario, u.nombres, u.apellidos
     FROM plantilla_biometrica pb
     JOIN usuario u ON u.id_usuario = pb.id_aprendiz
     JOIN matricula m ON m.id_aprendiz = u.id_usuario AND m.estado = 'activa'
     WHERE m.id_ficha = $1`,
    [idFicha]
  );
  return r.rows;
}

// Para el protocolo real ADMS: el dispositivo ya identifico, llega el PIN=documento
async function buscarAprendizPorDocumentoEnFicha(documento, idFicha) {
  const r = await pool.query(
    `SELECT u.id_usuario, u.nombres, u.apellidos
     FROM usuario u
     JOIN matricula m ON m.id_aprendiz = u.id_usuario AND m.estado = 'activa'
     WHERE u.documento = $1 AND m.id_ficha = $2`,
    [documento, idFicha]
  );
  return r.rows[0] || null;
}

async function obtenerTolerancia() {
  const r = await pool.query("SELECT valor FROM configuracion WHERE clave = 'minutos_tolerancia'");
  return Number(r.rows[0]?.valor || 15);
}

// UNIQUE (id_sesion, id_aprendiz) evita duplicados - regla CU-13 A2
async function insertarAsistencia(idSesion, idAprendiz, estado) {
  const r = await pool.query(
    `INSERT INTO asistencia (id_sesion, id_aprendiz, estado, hora_marca, metodo)
     VALUES ($1,$2,$3,NOW(),'huella')
     ON CONFLICT (id_sesion, id_aprendiz) DO NOTHING
     RETURNING id_asistencia`,
    [idSesion, idAprendiz, estado]
  );
  return r.rows[0]?.id_asistencia || null;
}

module.exports = {
  buscarSesionActivaEnAmbiente,
  buscarPlantillasDeFicha,
  buscarAprendizPorDocumentoEnFicha,
  obtenerTolerancia,
  insertarAsistencia,
};

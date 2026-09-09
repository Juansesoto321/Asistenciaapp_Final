const pool = require("../config/db");

async function obtenerEstado(idAprendiz) {
  const r = await pool.query(
    `SELECT (pb.id_plantilla IS NOT NULL) AS enrolado, pb.creado_en,
            c.aceptado, c.fecha_aceptacion
     FROM usuario u
     LEFT JOIN plantilla_biometrica pb ON pb.id_aprendiz = u.id_usuario
     LEFT JOIN consentimiento c ON c.id_consentimiento = pb.id_consentimiento
     WHERE u.id_usuario = $1`,
    [idAprendiz]
  );
  return r.rows[0] || { enrolado: false };
}

async function existePlantilla(idAprendiz) {
  const r = await pool.query("SELECT 1 FROM plantilla_biometrica WHERE id_aprendiz = $1", [idAprendiz]);
  return !!r.rows[0];
}

async function insertarConsentimiento(cliente, idAprendiz) {
  const r = await cliente.query(
    `INSERT INTO consentimiento (id_aprendiz, version_texto, aceptado)
     VALUES ($1,'v1.0',TRUE) RETURNING id_consentimiento`,
    [idAprendiz]
  );
  return r.rows[0].id_consentimiento;
}

async function insertarPlantilla(cliente, { idAprendiz, cifrado, idConsentimiento }) {
  await cliente.query(
    `INSERT INTO plantilla_biometrica (id_aprendiz, plantilla_cifrada, iv, etiqueta_auth, id_consentimiento)
     VALUES ($1,$2,$3,$4,$5)`,
    [idAprendiz, cifrado.plantilla_cifrada, cifrado.iv, cifrado.etiqueta_auth, idConsentimiento]
  );
}

async function eliminarPlantilla(idAprendiz) {
  const r = await pool.query(
    "DELETE FROM plantilla_biometrica WHERE id_aprendiz = $1 RETURNING id_consentimiento",
    [idAprendiz]
  );
  return r.rows[0]?.id_consentimiento || null;
}

async function revocarConsentimiento(idConsentimiento) {
  await pool.query("UPDATE consentimiento SET revocado_en = NOW() WHERE id_consentimiento = $1", [idConsentimiento]);
}

async function notificarBorrado(idAprendiz) {
  await pool.query(
    `INSERT INTO notificacion (id_usuario, tipo, titulo, mensaje)
     VALUES ($1,'biometria','Datos biométricos eliminados',
             'Tu plantilla biométrica fue eliminada permanentemente según tu solicitud (Ley 1581/2012). Tus registros históricos de asistencia se conservan.')`,
    [idAprendiz]
  );
}

module.exports = {
  obtenerEstado,
  existePlantilla,
  insertarConsentimiento,
  insertarPlantilla,
  eliminarPlantilla,
  revocarConsentimiento,
  notificarBorrado,
};

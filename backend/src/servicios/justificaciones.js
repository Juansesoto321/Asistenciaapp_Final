/**
 * CU-23 Cargar justificacion (aprendiz, via enlace de 72 horas)
 * CU-24 Validar justificacion (instructor aprueba/rechaza)
 */
const pool = require("../config/db");
const repo = require("../repositorios/justificaciones");
const { auditar } = require("./auditoria");
const { enviarCorreo } = require("./correo");
const { emitirJustificacionesActualizadas, emitirNotificacionNueva } = require("./tiempoReal");

const TIPOS_VALIDOS = ["cita_medica", "incapacidad_medica", "calamidad_domestica", "diligencia_legal", "duelo", "otro"];
const TIPOS_SIN_FOTO_OBLIGATORIA = ["calamidad_domestica", "duelo"];
const FORMATOS_ADJUNTO = /^data:(image\/(jpeg|png|webp)|application\/pdf);base64,/i;

function error(mensaje, tipo) {
  return Object.assign(new Error(mensaje), { tipo });
}

// Texto legible del plazo configurado (ej. "5 días" o "18 horas")
async function textoPlazo() {
  const horas = await repo.obtenerHorasPlazo();
  return horas % 24 === 0 ? `${horas / 24} día(s)` : `${horas} horas`;
}

async function verPorToken(token) {
  const j = await repo.buscarPorToken(token);
  if (!j) throw error("Enlace de justificación no válido", "no_encontrado");
  if (new Date(j.expira_en) < new Date() && j.estado === "pendiente")
    throw Object.assign(error(`El plazo de ${await textoPlazo()} para justificar venció`, "vencida"), { vencida: true });
  return j;
}

async function enviarPorToken(token, { tipo, descripcion, nombre_archivo, archivo_datos }) {
  if (!TIPOS_VALIDOS.includes(tipo)) throw error("Selecciona un tipo de justificación válido", "validacion");
  if (!descripcion?.trim()) throw error("Describe el motivo de tu inasistencia", "validacion");
  const fotoObligatoria = !TIPOS_SIN_FOTO_OBLIGATORIA.includes(tipo);
  if (fotoObligatoria && !archivo_datos) throw error("Adjunta un soporte para este tipo de justificación", "validacion");
  if (archivo_datos && !FORMATOS_ADJUNTO.test(archivo_datos)) throw error("El soporte debe ser JPG, PNG, WEBP o PDF", "validacion");

  const r = await repo.enviarPorToken(token, { tipo, descripcion, nombre_archivo, archivo_datos });
  if (!r) throw error(`El enlace ya fue usado o el plazo de ${await textoPlazo()} venció`, "vencida");

  const instr = await repo.buscarInstructorDeAsistencia(r.id_asistencia);
  if (instr) {
    await repo.crearNotificacion(
      pool,
      instr.id_instructor,
      "justificacion",
      "Nueva justificación por revisar",
      `${instr.nombres} ${instr.apellidos} cargó una justificación de inasistencia.`
    );
    // CU-24: refleja al instante el nuevo pendiente en el contador del panel del instructor (y del admin)
    emitirJustificacionesActualizadas(instr.id_instructor);
    emitirNotificacionNueva(instr.id_instructor);
  }
}

async function listarBandeja(usuario) {
  return repo.listarBandeja(usuario);
}

async function contarPendientes(usuario) {
  return { pendientes: await repo.contarPendientes(usuario) };
}

async function obtenerArchivo(idJustificacion, usuario) {
  if (!(await repo.esPropietario(idJustificacion, usuario)))
    throw error("No tienes permisos para ver este archivo", "prohibido");
  const j = await repo.obtenerArchivo(idJustificacion);
  if (!j?.archivo_datos) throw error("Sin adjunto", "no_encontrado");
  return j;
}

async function validarJustificacion(idJustificacion, usuario, { estado, observacion }) {
  if (!(await repo.esPropietario(idJustificacion, usuario)))
    throw error("No tienes permisos para validar esta justificación", "prohibido");
  if (!["aprobada", "rechazada"].includes(estado)) throw error("Estado inválido", "validacion");
  if (estado === "rechazada" && !observacion?.trim()) throw error("Explica por qué se rechaza la justificación", "validacion");

  const cliente = await pool.connect();
  let idAsistencia, aprendiz;
  try {
    await cliente.query("BEGIN");
    const r = await repo.validar(cliente, idJustificacion, {
      estado,
      validadaPor: usuario.id,
      observacion: observacion?.trim() || null,
    });
    if (!r) {
      await cliente.query("ROLLBACK");
      throw error("La justificación no está pendiente de revisión", "validacion");
    }
    idAsistencia = r.id_asistencia;

    if (estado === "aprobada") {
      aprendiz = await repo.marcarAsistenciaJustificada(cliente, idAsistencia);
      await repo.registrarCambioAsistencia(cliente, idAsistencia, usuario.id);
      await repo.crearNotificacion(
        cliente, aprendiz, "justificacion", "Justificación aprobada",
        "Tu inasistencia quedó marcada como justificada."
      );
    } else {
      aprendiz = await repo.obtenerAprendizDeAsistencia(cliente, idAsistencia);
      await repo.crearNotificacion(
        cliente, aprendiz, "justificacion", "Justificación rechazada",
        `Tu justificación fue rechazada. Motivo: ${observacion.trim()}`
      );
    }
    await cliente.query("COMMIT");
  } catch (e) {
    if (!e.tipo) await cliente.query("ROLLBACK");
    throw e;
  } finally {
    cliente.release();
  }

  emitirNotificacionNueva(aprendiz);
  await auditar(usuario.id, `justificacion_${estado}`, "justificacion", Number(idJustificacion));

  // Ya se resolvió: baja el contador de pendientes en el panel del instructor (y del admin)
  const idInstructor = await repo.buscarInstructorDeJustificacion(idAsistencia);
  emitirJustificacionesActualizadas(idInstructor);

  // Correo con el resultado (y el motivo, si fue rechazada)
  const u = await repo.buscarUsuarioParaCorreo(aprendiz);
  if (estado === "aprobada") {
    await enviarCorreo({
      para: u.correo,
      asunto: "AsistenciaApp · Justificación aprobada",
      html: `<p>Hola ${u.nombres},</p><p>Tu justificación fue <b>aprobada</b>. La inasistencia quedó marcada como "justificada".</p>`,
    });
  } else {
    await enviarCorreo({
      para: u.correo,
      asunto: "AsistenciaApp · Justificación rechazada",
      html: `<p>Hola ${u.nombres},</p>
             <p>Tu justificación fue <b>rechazada</b>.</p>
             <p><b>Motivo:</b> ${observacion.trim()}</p>
             <p>Puedes ver el detalle desde "Mi asistencia" en la plataforma.</p>`,
    });
  }

  return { mensaje: `Justificación ${estado}` };
}

module.exports = { verPorToken, enviarPorToken, listarBandeja, contarPendientes, obtenerArchivo, validarJustificacion };

/**
 * CU-12 Iniciar sesion de clase · CU-14 Supervisar en tiempo real
 * CU-15 Asistencia manual/override · cierre con generacion de justificaciones (72h)
 */
const crypto = require("crypto");
const repo = require("../repositorios/sesiones");
const { enTransaccion } = require("../repositorios/transaccion");
const { enviarCorreo } = require("./correo");
const { auditar } = require("./auditoria");
const { emitirASesion, emitirNotificacionNueva } = require("./tiempoReal");

const ESTADOS_VALIDOS = ["presente", "tardanza", "ausente", "justificada"];

function error(mensaje, tipo) {
  return Object.assign(new Error(mensaje), { tipo });
}

// Genera el enlace de justificacion (si no existe ya) + correo + notificacion.
// Se usa tanto al cerrar sesion (ausentes automaticos) como al marcar "ausente" manualmente.
async function generarJustificacionYNotificar(cliente, { idAsistencia, idAprendiz, numeroFicha }) {
  const horas = await repo.obtenerHorasJustificacion(cliente);
  const token = crypto.randomBytes(24).toString("hex");

  const ins = await repo.insertarJustificacion(cliente, idAsistencia, token, horas);
  if (!ins) return;

  const u = await repo.buscarUsuarioParaCorreo(cliente, idAprendiz);
  const enlace = `${process.env.URL_FRONTEND}/justificar/${token}`;

  await enviarCorreo({
    para: u.correo,
    asunto: `AsistenciaApp · Inasistencia registrada (ficha ${numeroFicha})`,
    html: `<p>Hola ${u.nombres},</p>
           <p>Se registró tu <b>inasistencia</b> a la clase de hoy de la ficha ${numeroFicha}.</p>
           <p>Si tienes una excusa (por ejemplo, cita médica), cárgala en el siguiente enlace.
           <b>Disponible solo por ${horas} horas</b>; después quedará como "sin justificación":</p>
           <p><a href="${enlace}">${enlace}</a></p>`,
  });

  await repo.insertarNotificacionInasistencia(cliente, idAprendiz, horas);
  emitirNotificacionNueva(idAprendiz);
}

async function horariosDeHoy(usuario) {
  return repo.horariosDeHoy(new Date().getDay(), usuario);
}

// CU-12: iniciar (o reanudar) la sesion de hoy
async function iniciarSesion(idHorario, usuario) {
  const h = await repo.buscarHorarioConLector(idHorario);
  if (!h) throw error("Horario no encontrado", "no_encontrado");

  // Regla CU-12: solo el instructor titular (o un administrador)
  if (usuario.rol === "instructor" && h.id_instructor !== usuario.id)
    throw error("Solo el instructor titular puede iniciar esta sesión", "prohibido");

  const sesion = await repo.crearOReanudarSesion(idHorario);
  if (sesion.estado === "cerrada") throw error("La sesión de hoy ya fue cerrada", "validacion");

  await auditar(usuario.id, "iniciar_sesion_clase", "sesion_clase", sesion.id_sesion);

  return {
    id_sesion: sesion.id_sesion,
    lector: h.estado_lector || "sin_lector",
    mensaje: h.estado_lector === "en_linea"
      ? "Sesión activa. Lector en línea, listo para capturar huellas"
      : "Sesión activa. El lector no está en línea: puedes usar registro manual",
  };
}

// CU-14: detalle de la sesion (lista completa con estados)
async function verDetalle(idSesion) {
  const sesion = await repo.buscarDetalle(idSesion);
  if (!sesion) throw error("Sesión no encontrada", "no_encontrado");
  const aprendices = await repo.buscarAprendicesDeSesion(idSesion);
  return { ...sesion, aprendices };
}

// CU-15: registro manual / override. Permite modificar asistencia incluso
// despues del cierre; todo cambio requiere motivo y queda en cambio_asistencia.
async function registrarAsistenciaManual(idSesion, usuario, { id_aprendiz, estado, motivo }) {
  if (!motivo?.trim()) throw error("Todo registro manual requiere una justificación (regla CU-15)", "validacion");
  if (!ESTADOS_VALIDOS.includes(estado)) throw error("Estado inválido", "validacion");

  const sesion = await repo.buscarEstadoSesion(idSesion);
  if (!sesion) throw error("Sesión no encontrada", "no_encontrado");

  const idAsistencia = await enTransaccion(async (cliente) => {
    const upsert = await repo.upsertAsistenciaManual(cliente, {
      idSesion, idAprendiz: id_aprendiz, estado, motivo, registradoPor: usuario.id,
    });

    await repo.insertarCambioAsistencia(cliente, {
      idAsistencia: upsert.id_asistencia, estadoAnterior: upsert.estado_anterior,
      estadoNuevo: estado, motivo, cambiadoPor: usuario.id,
    });

    // Si queda "ausente", genera el enlace de justificación, correo y notificación,
    // igual que al cerrar la sesión.
    if (estado === "ausente") {
      const f = await repo.buscarFichaDeSesion(cliente, idSesion);
      if (f) await generarJustificacionYNotificar(cliente, {
        idAsistencia: upsert.id_asistencia, idAprendiz: id_aprendiz, numeroFicha: f.numero_ficha,
      });
    }

    return upsert.id_asistencia;
  });

  const u = await repo.buscarNombreUsuario(id_aprendiz);
  if (u) {
    emitirASesion(idSesion, "marcacion", {
      id_aprendiz, nombres: u.nombres, apellidos: u.apellidos, estado, hora_marca: new Date(), metodo: "manual",
    });
  }

  await auditar(usuario.id, "asistencia_manual", "asistencia", idAsistencia, {
    estado, motivo, sesion_cerrada: sesion.estado === "cerrada",
  });

  return { mensaje: "Asistencia registrada manualmente" };
}

// Cierre de sesion: marca ausentes + genera enlaces de justificacion (72h) + notifica
async function cerrarSesion(idSesion, usuario) {
  const s = await repo.buscarSesionParaCerrar(idSesion);
  if (!s) throw error("Sesión no encontrada", "no_encontrado");
  if (s.estado === "cerrada") throw error("La sesión ya está cerrada", "validacion");
  if (usuario.rol === "instructor" && s.id_instructor !== usuario.id)
    throw error("Solo el instructor titular puede cerrar la sesión", "prohibido");

  const ausentes = await enTransaccion(async (cliente) => {
    const sinRegistro = await repo.marcarAusentesSinRegistro(cliente, idSesion, s.id_ficha);
    await repo.cerrarSesion(cliente, idSesion, usuario.id);

    // Por cada ausente: enlace de justificacion + correo + notificacion
    for (const a of sinRegistro) {
      await generarJustificacionYNotificar(cliente, { idAsistencia: a.id_asistencia, idAprendiz: a.id_aprendiz, numeroFicha: s.numero_ficha });
    }

    return sinRegistro;
  });

  await auditar(usuario.id, "cerrar_sesion_clase", "sesion_clase", Number(idSesion), { ausentes: ausentes.length });

  return { mensaje: `Sesión cerrada. ${ausentes.length} aprendiz(es) marcados como ausentes y notificados` };
}

// Elimina permanentemente una sesion y su asistencia/justificaciones asociadas.
// Solo administrador: es destructivo e irreversible, pensado para limpiar
// sesiones de prueba (no para corregir asistencia real - para eso esta CU-15).
async function eliminarSesion(idSesion, usuario) {
  await enTransaccion(async (cliente) => {
    const eliminada = await repo.eliminarSesion(cliente, idSesion);
    if (!eliminada) throw error("Sesión no encontrada", "no_encontrado");
  });

  await auditar(usuario.id, "eliminar_sesion_clase", "sesion_clase", Number(idSesion));
  return { mensaje: "Sesión eliminada permanentemente, junto con su asistencia y justificaciones" };
}

module.exports = { horariosDeHoy, iniciarSesion, verDetalle, registrarAsistenciaManual, cerrarSesion, eliminarSesion };

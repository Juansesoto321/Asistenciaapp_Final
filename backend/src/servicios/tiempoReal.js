/**
 * Socket.IO: canal en tiempo real para la vista de supervision del
 * instructor (CU-14). Cada sesion de clase es una "sala".
 *
 * Toda conexión debe traer el mismo token JWT que usa la API: el rol y el id
 * salen del token, nunca de lo que diga el cliente. Sin esto cualquiera podía
 * unirse a la sala de una clase y ver en vivo quién marcaba asistencia.
 */
const jwt = require("jsonwebtoken");
const { origenesPermitidos } = require("../config/entorno");
const sesionesModelo = require("../modelos/sesiones");

const ROLES_GESTION = ["coordinador", "programador"];
const ROLES_SUPERVISION = ["instructor", ...ROLES_GESTION];

let io = null;

function autenticarSocket(socket, next) {
  try {
    socket.usuario = jwt.verify(socket.handshake.auth?.token, process.env.JWT_SECRETO);
    next();
  } catch {
    next(new Error("No autenticado"));
  }
}

async function puedeSupervisar(usuario, idSesion) {
  if (ROLES_GESTION.includes(usuario.rol)) return true;
  if (usuario.rol !== "instructor") return false;
  return sesionesModelo.esInstructorDeSesion(idSesion, usuario.id);
}

function inicializar(servidorHttp) {
  const { Server } = require("socket.io");
  io = new Server(servidorHttp, { cors: { origin: origenesPermitidos } });
  io.use(autenticarSocket);

  io.on("connection", (socket) => {
    const { id, rol } = socket.usuario;
    // Sala personal (badge de notificaciones) y, para quienes gestionan,
    // las salas del contador de justificaciones.
    socket.join(`usuario_${id}`);
    if (rol === "instructor") socket.join(`instructor_${id}`);
    if (ROLES_GESTION.includes(rol)) {
      socket.join("justificaciones_admin");
      socket.join("coordinadores");
    }

    socket.on("unirse_sesion", async (idSesion) => {
      if (!ROLES_SUPERVISION.includes(rol) || !Number.isInteger(Number(idSesion))) return;
      try {
        if (await puedeSupervisar(socket.usuario, Number(idSesion))) socket.join(`sesion_${idSesion}`);
      } catch (e) {
        console.error("No se pudo verificar el acceso a la sesión en vivo:", e.message);
      }
    });
    socket.on("salir_sesion", (idSesion) => socket.leave(`sesion_${idSesion}`));
  });
  return io;
}

function emitirASesion(idSesion, evento, datos) {
  if (io) io.to(`sesion_${idSesion}`).emit(evento, datos);
}

// Avisa que cambió el conteo de justificaciones pendientes (nueva enviada, o aprobada/rechazada).
// No manda el numero: el cliente vuelve a pedirlo por REST, asi siempre queda consistente con la BD.
function emitirJustificacionesActualizadas(idInstructor) {
  if (!io) return;
  if (idInstructor) io.to(`instructor_${idInstructor}`).emit("justificaciones:actualizadas");
  io.to("justificaciones_admin").emit("justificaciones:actualizadas");
}

// Avisa a un usuario puntual que le llegó una notificación nueva (badge del menú).
function emitirNotificacionNueva(idUsuario) {
  if (io && idUsuario) io.to(`usuario_${idUsuario}`).emit("notificaciones:actualizadas");
}

// Avisa a todos los coordinadores conectados (para notificaciones sin un solo destinatario, ej. soporte, registro).
function emitirNotificacionAdmins() {
  if (io) io.to("coordinadores").emit("notificaciones:actualizadas");
}

module.exports = {
  inicializar,
  emitirASesion,
  emitirJustificacionesActualizadas,
  emitirNotificacionNueva,
  emitirNotificacionAdmins,
};

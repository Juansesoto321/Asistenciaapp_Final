/**
 * Socket.IO: canal en tiempo real para la vista de supervision del
 * instructor (CU-14). Cada sesion de clase es una "sala".
 */
let io = null;

function inicializar(servidorHttp) {
  const { Server } = require("socket.io");
  io = new Server(servidorHttp, { cors: { origin: "*" } });
  io.on("connection", (socket) => {
    socket.on("unirse_sesion", (idSesion) => socket.join(`sesion_${idSesion}`));
    socket.on("salir_sesion", (idSesion) => socket.leave(`sesion_${idSesion}`));
    // Panel de cualquier rol: sala personal (badge de notificaciones) y, para
    // instructor/administrador, ademas las salas del contador de justificaciones.
    socket.on("unirse_panel", ({ rol, id }) => {
      socket.join(`usuario_${id}`);
      if (rol === "instructor") socket.join(`instructor_${id}`);
      else if (rol === "administrador") socket.join("justificaciones_admin");
      if (rol === "administrador") socket.join("administradores");
    });
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

// Avisa a todos los administradores conectados (para notificaciones sin un solo destinatario, ej. soporte, registro).
function emitirNotificacionAdmins() {
  if (io) io.to("administradores").emit("notificaciones:actualizadas");
}

module.exports = {
  inicializar,
  emitirASesion,
  emitirJustificacionesActualizadas,
  emitirNotificacionNueva,
  emitirNotificacionAdmins,
};

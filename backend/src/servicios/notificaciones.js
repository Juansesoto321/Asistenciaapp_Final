const repositorio = require("../repositorios/notificaciones");
const { emitirNotificacionNueva } = require("./tiempoReal");

async function obtenerNotificaciones(idUsuario) {
  return repositorio.listarPorUsuario(idUsuario);
}

async function obtenerContador(idUsuario) {
  return repositorio.contarPendientes(idUsuario);
}

async function marcarComoLeida(idNotificacion, idUsuario) {
  await repositorio.marcarLeida(idNotificacion, idUsuario);
  emitirNotificacionNueva(idUsuario);
}

module.exports = { obtenerNotificaciones, obtenerContador, marcarComoLeida };

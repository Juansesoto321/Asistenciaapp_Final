const modelo = require("../modelos/notificaciones");
const { emitirNotificacionNueva } = require("./tiempoReal");

async function obtenerNotificaciones(idUsuario) {
  return modelo.listarPorUsuario(idUsuario);
}

async function obtenerContador(idUsuario) {
  return modelo.contarPendientes(idUsuario);
}

async function marcarComoLeida(idNotificacion, idUsuario) {
  await modelo.marcarLeida(idNotificacion, idUsuario);
  emitirNotificacionNueva(idUsuario);
}

async function marcarTodasComoLeidas(idUsuario) {
  const marcadas = await modelo.marcarTodasLeidas(idUsuario);
  if (marcadas) emitirNotificacionNueva(idUsuario); // baja el numerito del menu al instante
  return marcadas;
}

module.exports = { obtenerNotificaciones, obtenerContador, marcarComoLeida, marcarTodasComoLeidas };

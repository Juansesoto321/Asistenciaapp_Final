const modelo = require("../modelos/soporte");
const { emitirNotificacionAdmins } = require("./tiempoReal");
const { error } = require("../utilidades/errores");

const TIPOS_VALIDOS = ["huella", "error_asistencia", "cuenta", "otro"];
const ESTADOS_VALIDOS = ["abierto", "en_proceso", "resuelto"];

async function crear({ idUsuario, tipo, descripcion }) {
  if (!TIPOS_VALIDOS.includes(tipo) || !descripcion?.trim())
    throw error("Selecciona un tipo y describe el problema", "validacion");
  const idTicket = await modelo.crearTicket({ idUsuario, tipo, descripcion: descripcion.trim() });
  await modelo.notificarCoordinadores(idTicket, tipo);
  emitirNotificacionAdmins();
  return idTicket;
}

async function obtenerListado(usuario) {
  const gestiona = usuario.rol === "coordinador" || usuario.rol === "programador";
  return modelo.listar(usuario.id, gestiona);
}

async function cambiarEstado(idTicket, estado) {
  if (!ESTADOS_VALIDOS.includes(estado)) throw error("Estado inválido", "validacion");
  const actualizado = await modelo.actualizarEstado(idTicket, estado);
  if (!actualizado) throw error("Ticket no encontrado", "no_encontrado");
}

module.exports = { crear, obtenerListado, cambiarEstado };

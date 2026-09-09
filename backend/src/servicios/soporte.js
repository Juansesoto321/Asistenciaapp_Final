const repositorio = require("../repositorios/soporte");
const { emitirNotificacionAdmins } = require("./tiempoReal");

const ESTADOS_VALIDOS = ["abierto", "en_proceso", "resuelto"];

async function crear({ idUsuario, tipo, descripcion }) {
  if (!tipo || !descripcion?.trim())
    throw Object.assign(new Error("Selecciona un tipo y describe el problema"), { tipo: "validacion" });
  const idTicket = await repositorio.crearTicket({ idUsuario, tipo, descripcion });
  await repositorio.notificarAdministradores(idTicket, tipo);
  emitirNotificacionAdmins();
  return idTicket;
}

async function obtenerListado(usuario) {
  return repositorio.listar(usuario.id, usuario.rol === "administrador");
}

async function cambiarEstado(idTicket, estado) {
  if (!ESTADOS_VALIDOS.includes(estado))
    throw Object.assign(new Error("Estado inválido"), { tipo: "validacion" });
  await repositorio.actualizarEstado(idTicket, estado);
}

module.exports = { crear, obtenerListado, cambiarEstado };

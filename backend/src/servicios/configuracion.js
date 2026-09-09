const repositorio = require("../repositorios/configuracion");
const { auditar } = require("./auditoria");

async function obtener() {
  return repositorio.obtenerTodo();
}

async function actualizar(cambios, idUsuario) {
  for (const [clave, valor] of Object.entries(cambios)) {
    await repositorio.guardar(clave, valor);
  }
  await auditar(idUsuario, "actualizar_configuracion", "configuracion", null, cambios);
}

module.exports = { obtener, actualizar };

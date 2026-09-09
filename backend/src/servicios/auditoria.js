const repo = require("../repositorios/auditoria");

/**
 * Registra toda accion sensible (requisito transversal de los CU).
 * Nunca lanza: un fallo al auditar no puede tumbar la operacion del usuario.
 */
async function auditar(idUsuario, accion, entidad = null, idEntidad = null, detalle = null) {
  try {
    await repo.insertar({ idUsuario, accion, entidad, idEntidad, detalle });
  } catch (e) {
    console.error("Error registrando auditoria:", e.message);
  }
}

module.exports = { auditar };

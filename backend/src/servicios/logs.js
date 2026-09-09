/**
 * Registro de errores del backend. Permite responder "ayer a tal hora le fallo
 * a este usuario" sin depender de la consola, que se pierde al reiniciar.
 */
const repo = require("../repositorios/logs");

const LIMITE_POR_DEFECTO = 100;
const LIMITE_MAXIMO = 500;

/**
 * Nunca lanza: si el propio registro del log falla, se reporta por consola y
 * la peticion original sigue su curso (un fallo al loguear no puede tumbar
 * la respuesta al usuario).
 */
async function registrar({ nivel = "error", mensaje, metodo, ruta, idUsuario, traza }) {
  try {
    await repo.insertar({ nivel, mensaje, metodo, ruta, idUsuario, traza });
  } catch (e) {
    console.error("No se pudo guardar el log de error:", e.message);
  }
}

async function listar({ nivel, desde, hasta, limite } = {}) {
  const tope = Math.min(Number(limite) || LIMITE_POR_DEFECTO, LIMITE_MAXIMO);
  return repo.listar({ nivel, desde, hasta, limite: tope });
}

/** Vuelca los logs a texto plano para descargarlos. */
function aTextoPlano(registros) {
  return registros
    .map((l) => {
      const fecha = new Date(l.creado_en).toISOString();
      const quien = l.usuario ? ` | usuario: ${l.usuario}` : "";
      const donde = l.ruta ? ` | ${l.metodo} ${l.ruta}` : "";
      return `[${fecha}] ${l.nivel.toUpperCase()}${donde}${quien}\n  ${l.mensaje}\n${l.traza ? `  ${l.traza}\n` : ""}`;
    })
    .join("\n");
}

module.exports = { registrar, listar, aTextoPlano };

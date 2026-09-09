const pool = require("../config/db");

/**
 * Ejecuta `trabajo` dentro de una transaccion y le entrega el cliente activo.
 * Hace COMMIT si termina bien, ROLLBACK si algo lanza, y siempre libera la
 * conexion. Asi los servicios expresan la regla de negocio ("esto va junto o
 * no va") sin conocer el pool ni el manejo de conexiones.
 */
async function enTransaccion(trabajo) {
  const cliente = await pool.connect();
  try {
    await cliente.query("BEGIN");
    const resultado = await trabajo(cliente);
    await cliente.query("COMMIT");
    return resultado;
  } catch (e) {
    await cliente.query("ROLLBACK");
    throw e;
  } finally {
    cliente.release();
  }
}

module.exports = { enTransaccion };

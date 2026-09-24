/**
 * Trabajos periodicos del sistema. Se ejecutan cada minuto desde app.js.
 * Un fallo aqui se registra pero nunca detiene el ciclo.
 */
const justificacionesModelo = require("../modelos/justificaciones");
const dispositivoModelo = require("../modelos/dispositivo");
const academicoModelo = require("../modelos/academico");
const logs = require("./logs");

const INTERVALO_MS = 60_000;

async function ejecutar() {
  try {
    await justificacionesModelo.vencerExpiradas();           // justificaciones fuera de plazo
    await dispositivoModelo.marcarFueraDeLineaSinHeartbeat(); // CU-09: lectores caidos
    await academicoModelo.finalizarFichasVencidas();          // fichas que pasaron su fecha fin
  } catch (e) {
    console.error("Error en tareas programadas:", e.message);
    logs.registrar({
      mensaje: `Tareas programadas: ${e.message}`,
      ruta: "tareasProgramadas",
      traza: e.stack,
    });
  }
}

function iniciar() {
  setInterval(ejecutar, INTERVALO_MS);
}

module.exports = { iniciar, ejecutar };

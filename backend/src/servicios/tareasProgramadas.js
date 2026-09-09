/**
 * Trabajos periodicos del sistema. Se ejecutan cada minuto desde app.js.
 * Un fallo aqui se registra pero nunca detiene el ciclo.
 */
const justificacionesRepo = require("../repositorios/justificaciones");
const dispositivoRepo = require("../repositorios/dispositivo");
const academicoRepo = require("../repositorios/academico");
const logs = require("./logs");

const INTERVALO_MS = 60_000;

async function ejecutar() {
  try {
    await justificacionesRepo.vencerExpiradas();           // justificaciones fuera de plazo
    await dispositivoRepo.marcarFueraDeLineaSinHeartbeat(); // CU-09: lectores caidos
    await academicoRepo.finalizarFichasVencidas();          // fichas que pasaron su fecha fin
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

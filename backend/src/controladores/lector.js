const dispositivoRepo = require("../repositorios/dispositivo");
const marcacionServicio = require("../servicios/marcacion");

async function heartbeat(req, res, next) {
  try {
    await dispositivoRepo.marcarEnLinea(req.dispositivo.id_dispositivo);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
}

async function marcacion(req, res, next) {
  try {
    const { lectura } = req.body; // en produccion: template del SDK; simulado: identificador del dedo
    const resultado = await marcacionServicio.marcarPorHuella(req.dispositivo.id_ambiente, lectura);

    if (resultado.duplicada)
      return res.json({ resultado: "duplicada", mensaje: `${resultado.aprendiz.nombres}: asistencia ya registrada en esta sesión` });

    res.json({
      resultado: "ok",
      mensaje: `${resultado.aprendiz.nombres} ${resultado.aprendiz.apellidos}: ${resultado.estado.toUpperCase()}`,
      estado: resultado.estado,
    });
  } catch (error) {
    // El simulador y el lector esperan un campo `resultado` junto al mensaje
    if (error.tipo) error.resultado = error.tipo;
    next(error);
  }
}

module.exports = { heartbeat, marcacion };

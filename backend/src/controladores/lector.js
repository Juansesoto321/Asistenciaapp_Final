const dispositivoRepo = require("../repositorios/dispositivo");
const marcacionServicio = require("../servicios/marcacion");

const ESTADOS_HTTP = { sin_sesion: 409, no_reconocida: 404 };

function responderError(res, error) {
  if (!error.tipo) {
    console.error(error);
    return res.status(500).json({ mensaje: "Error procesando la marcación" });
  }
  res.status(ESTADOS_HTTP[error.tipo] || 500).json({
    resultado: error.tipo,
    mensaje: error.message,
  });
}

async function heartbeat(req, res) {
  try {
    await dispositivoRepo.marcarEnLinea(req.dispositivo.id_dispositivo);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ mensaje: "Error en el heartbeat" });
  }
}

async function marcacion(req, res) {
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
  } catch (e) {
    responderError(res, e);
  }
}

module.exports = { heartbeat, marcacion };

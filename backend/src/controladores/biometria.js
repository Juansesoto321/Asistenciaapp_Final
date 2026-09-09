const servicio = require("../servicios/biometria");

function responderError(res, error, mensaje) {
  if (error.tipo === "validacion") return res.status(400).json({ mensaje: error.message });
  if (error.tipo === "no_encontrado") return res.status(404).json({ mensaje: error.message });
  console.error(error);
  return res.status(500).json({ mensaje });
}

function textoConsentimiento(_req, res) {
  res.json(servicio.obtenerTextoConsentimiento());
}

async function estado(req, res) {
  try {
    res.json(await servicio.obtenerEstado(req.params.idAprendiz));
  } catch (error) {
    responderError(res, error, "Error al consultar el estado biométrico");
  }
}

async function enrolar(req, res) {
  try {
    await servicio.enrolar(
      {
        idAprendiz: req.body.id_aprendiz,
        aceptaConsentimiento: req.body.acepta_consentimiento,
        lectura1: req.body.lectura1,
        lectura2: req.body.lectura2,
      },
      req.usuario.id
    );
    res.status(201).json({ mensaje: "Huella registrada y cifrada correctamente (AES-256)" });
  } catch (error) {
    responderError(res, error, "Error en el enrollment");
  }
}

async function eliminar(req, res) {
  try {
    await servicio.eliminar(Number(req.params.idAprendiz), req.usuario.id);
    res.json({ mensaje: "Datos biométricos eliminados permanentemente. El registro queda en auditoría" });
  } catch (error) {
    responderError(res, error, "Error al eliminar los datos biométricos");
  }
}

module.exports = { textoConsentimiento, estado, enrolar, eliminar };

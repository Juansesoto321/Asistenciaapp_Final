const servicio = require("../servicios/biometria");

function textoConsentimiento(_req, res) {
  res.json(servicio.obtenerTextoConsentimiento());
}

async function estado(req, res, next) {
  try {
    res.json(await servicio.obtenerEstado(req.params.idAprendiz));
  } catch (error) {
    next(error);
  }
}

async function enrolar(req, res, next) {
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
    next(error);
  }
}

async function eliminar(req, res, next) {
  try {
    await servicio.eliminar(Number(req.params.idAprendiz), req.usuario.id);
    res.json({ mensaje: "Datos biométricos eliminados permanentemente. El registro queda en auditoría" });
  } catch (error) {
    next(error);
  }
}

module.exports = { textoConsentimiento, estado, enrolar, eliminar };

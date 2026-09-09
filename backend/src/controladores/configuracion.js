const servicio = require("../servicios/configuracion");

async function obtener(_req, res, next) {
  try {
    res.json(await servicio.obtener());
  } catch (error) {
    next(error);
  }
}

async function actualizar(req, res, next) {
  try {
    await servicio.actualizar(req.body, req.usuario.id);
    res.json({ mensaje: "Configuración guardada" });
  } catch (error) {
    next(error);
  }
}

module.exports = { obtener, actualizar };

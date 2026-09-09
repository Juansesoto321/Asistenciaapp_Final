const servicio = require("../servicios/configuracion");

async function obtener(_req, res) {
  try {
    res.json(await servicio.obtener());
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al obtener la configuración" });
  }
}

async function actualizar(req, res) {
  try {
    await servicio.actualizar(req.body, req.usuario.id);
    res.json({ mensaje: "Configuración guardada" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al guardar la configuración" });
  }
}

module.exports = { obtener, actualizar };

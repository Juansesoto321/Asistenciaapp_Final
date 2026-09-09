const servicio = require("../servicios/notificaciones");

async function listar(req, res) {
  try {
    res.json(await servicio.obtenerNotificaciones(req.usuario.id));
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al listar las notificaciones" });
  }
}

async function contador(req, res) {
  try {
    res.json({ pendientes: await servicio.obtenerContador(req.usuario.id) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al obtener el contador de notificaciones" });
  }
}

async function marcarLeida(req, res) {
  try {
    await servicio.marcarComoLeida(req.params.id, req.usuario.id);
    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al marcar la notificación" });
  }
}

module.exports = { listar, contador, marcarLeida };

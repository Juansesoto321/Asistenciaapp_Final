const servicio = require("../servicios/notificaciones");

async function listar(req, res, next) {
  try {
    res.json(await servicio.obtenerNotificaciones(req.usuario.id));
  } catch (error) {
    next(error);
  }
}

async function contador(req, res, next) {
  try {
    res.json({ pendientes: await servicio.obtenerContador(req.usuario.id) });
  } catch (error) {
    next(error);
  }
}

async function marcarLeida(req, res, next) {
  try {
    await servicio.marcarComoLeida(req.params.id, req.usuario.id);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
}

module.exports = { listar, contador, marcarLeida };

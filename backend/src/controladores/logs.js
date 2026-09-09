const servicio = require("../servicios/logs");

async function listar(req, res, next) {
  try {
    const { nivel, desde, hasta, limite } = req.query;
    res.json(await servicio.listar({ nivel, desde, hasta, limite }));
  } catch (error) {
    next(error);
  }
}

async function descargar(req, res, next) {
  try {
    const { nivel, desde, hasta, limite } = req.query;
    const registros = await servicio.listar({ nivel, desde, hasta, limite });
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=logs_asistenciaapp.txt");
    res.send(servicio.aTextoPlano(registros));
  } catch (error) {
    next(error);
  }
}

module.exports = { listar, descargar };

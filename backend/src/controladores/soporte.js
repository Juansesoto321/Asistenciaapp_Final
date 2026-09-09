const servicio = require("../servicios/soporte");

function responderError(res, error, mensaje) {
  if (error.tipo === "validacion") return res.status(400).json({ mensaje: error.message });
  console.error(error);
  return res.status(500).json({ mensaje });
}

async function crear(req, res) {
  try {
    const idTicket = await servicio.crear({
      idUsuario: req.usuario.id,
      tipo: req.body.tipo,
      descripcion: req.body.descripcion,
    });
    res.status(201).json({ mensaje: `Ticket #${idTicket} registrado. Te notificaremos la respuesta`, id_ticket: idTicket });
  } catch (error) {
    responderError(res, error, "Error al registrar el ticket");
  }
}

async function listar(req, res) {
  try {
    res.json(await servicio.obtenerListado(req.usuario));
  } catch (error) {
    responderError(res, error, "Error al listar los tickets");
  }
}

async function cambiarEstado(req, res) {
  try {
    await servicio.cambiarEstado(req.params.id, req.body.estado);
    res.json({ mensaje: "Ticket actualizado" });
  } catch (error) {
    responderError(res, error, "Error al actualizar el ticket");
  }
}

module.exports = { crear, listar, cambiarEstado };

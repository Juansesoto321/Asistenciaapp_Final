const servicio = require("../servicios/usuarios");

function responderError(res, error, mensaje) {
  if (error.code === "23505") return res.status(400).json({ mensaje: "El correo o documento ya existe" });
  if (error.tipo === "validacion") return res.status(400).json({ mensaje: error.message });
  if (error.tipo === "no_encontrado") return res.status(404).json({ mensaje: error.message });
  console.error(error);
  return res.status(500).json({ mensaje });
}

async function listar(req, res) {
  try {
    res.json(await servicio.listar(req.query));
  } catch (error) {
    responderError(res, error, "Error al listar los usuarios");
  }
}

async function crear(req, res) {
  try {
    const { nombres, apellidos, tipo_documento, documento, correo, telefono, rol } = req.body;
    const id = await servicio.crear(
      { nombres, apellidos, tipoDocumento: tipo_documento, documento, correo, telefono, rol },
      req.usuario.id
    );
    res.status(201).json({ mensaje: "Usuario creado. Se envió la contraseña temporal por correo", id });
  } catch (error) {
    responderError(res, error, "Error al crear el usuario");
  }
}

async function editar(req, res) {
  try {
    const { nombres, apellidos, telefono, rol } = req.body;
    await servicio.editar(req.params.id, { nombres, apellidos, telefono, rol }, req.usuario.id);
    res.json({ mensaje: "Usuario actualizado" });
  } catch (error) {
    responderError(res, error, "Error al actualizar");
  }
}

async function cambiarEstado(req, res) {
  try {
    await servicio.cambiarEstado(req.params.id, req.body.estado, req.usuario.id);
    res.json({ mensaje: `Usuario ${req.body.estado === "activo" ? "aprobado/activado" : "desactivado"}` });
  } catch (error) {
    responderError(res, error, "Error al cambiar el estado");
  }
}

async function cargaMasiva(req, res) {
  try {
    res.json(await servicio.cargaMasiva(req.body.filas, req.usuario.id));
  } catch (error) {
    responderError(res, error, "Error en la carga masiva");
  }
}

module.exports = { listar, crear, editar, cambiarEstado, cargaMasiva };

const servicio = require("../servicios/usuarios");
const { traducirCodigos } = require("../middleware/manejadorErrores");

const DUPLICADO = { 23505: "El correo o documento ya existe" };

async function listar(req, res, next) {
  try {
    res.json(await servicio.listar(req.query));
  } catch (error) {
    next(error);
  }
}

async function crear(req, res, next) {
  try {
    const { nombres, apellidos, tipo_documento, documento, correo, telefono, rol } = req.body;
    const id = await servicio.crear(
      { nombres, apellidos, tipoDocumento: tipo_documento, documento, correo, telefono, rol },
      req.usuario.id
    );
    res.status(201).json({ mensaje: "Usuario creado. Se envió la contraseña temporal por correo", id });
  } catch (error) {
    next(traducirCodigos(error, DUPLICADO));
  }
}

async function editar(req, res, next) {
  try {
    const { nombres, apellidos, telefono, rol } = req.body;
    await servicio.editar(req.params.id, { nombres, apellidos, telefono, rol }, req.usuario.id);
    res.json({ mensaje: "Usuario actualizado" });
  } catch (error) {
    next(traducirCodigos(error, DUPLICADO));
  }
}

async function cambiarEstado(req, res, next) {
  try {
    await servicio.cambiarEstado(req.params.id, req.body.estado, req.usuario.id);
    res.json({ mensaje: `Usuario ${req.body.estado === "activo" ? "aprobado/activado" : "desactivado"}` });
  } catch (error) {
    next(error);
  }
}

async function cargaMasiva(req, res, next) {
  try {
    res.json(await servicio.cargaMasiva(req.body.filas, req.usuario.id));
  } catch (error) {
    next(error);
  }
}

module.exports = { listar, crear, editar, cambiarEstado, cargaMasiva };

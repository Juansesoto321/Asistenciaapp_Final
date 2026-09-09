const servicio = require("../servicios/auth");

const ESTADOS_HTTP = {
  cuenta_pendiente: 403,
  cuenta_inactiva: 403,
  cuenta_bloqueada: 403,
  credenciales: 401,
  validacion: 400,
};

function responderError(res, error, mensaje) {
  const status = ESTADOS_HTTP[error.tipo];
  if (status) return res.status(status).json({ mensaje: error.message });
  if (error.code === "23505") return res.status(400).json({ mensaje: "El correo o documento ya está registrado" });
  console.error(error);
  return res.status(500).json({ mensaje });
}

async function login(req, res) {
  try {
    const datos = await servicio.login(req.body.correo, req.body.contrasena);
    res.json(datos);
  } catch (error) {
    responderError(res, error, "Error al iniciar sesión");
  }
}

async function registro(req, res) {
  try {
    const { nombres, apellidos, tipo_documento, documento, correo, telefono, contrasena, rol } = req.body;
    await servicio.registrar({ nombres, apellidos, tipoDocumento: tipo_documento, documento, correo, telefono, contrasena, rol });
    res.status(201).json({ mensaje: "Solicitud enviada. Un administrador aprobará tu cuenta" });
  } catch (error) {
    responderError(res, error, "Error al registrar");
  }
}

async function recuperar(req, res) {
  try {
    await servicio.solicitarRecuperacion(req.body.correo);
    res.json({ mensaje: "Si el correo existe, recibirás un enlace de recuperación" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al procesar la solicitud" });
  }
}

async function restablecer(req, res) {
  try {
    await servicio.restablecerContrasena(req.body.token, req.body.contrasena);
    res.json({ mensaje: "Contraseña actualizada. Ya puedes iniciar sesión" });
  } catch (error) {
    responderError(res, error, "Error al restablecer la contraseña");
  }
}

async function verPerfil(req, res) {
  try {
    res.json(await servicio.obtenerPerfil(req.usuario.id));
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al obtener el perfil" });
  }
}

async function actualizarPerfil(req, res) {
  try {
    const { telefono, contrasena_actual, contrasena_nueva } = req.body;
    await servicio.actualizarPerfil(req.usuario.id, { telefono, contrasenaActual: contrasena_actual, contrasenaNueva: contrasena_nueva });
    res.json({ mensaje: "Perfil actualizado" });
  } catch (error) {
    responderError(res, error, "Error al actualizar el perfil");
  }
}

module.exports = { login, registro, recuperar, restablecer, verPerfil, actualizarPerfil };

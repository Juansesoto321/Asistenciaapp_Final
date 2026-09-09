const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const repositorio = require("../repositorios/auth");
const { enviarCorreo } = require("./correo");
const { auditar } = require("./auditoria");
const { emitirNotificacionAdmins } = require("./tiempoReal");

const MAX_INTENTOS = 5; // regla CU-01: bloqueo tras 5 intentos fallidos
const ROLES_AUTOREGISTRO = ["aprendiz", "instructor", "programador"];

const validarContrasena = (c) =>
  typeof c === "string" && c.length >= 8 && /[A-Z]/.test(c) && /[a-z]/.test(c) && /\d/.test(c);

function error(mensaje, tipo) {
  return Object.assign(new Error(mensaje), { tipo });
}

// ---- CU-01: Login ----
async function login(correo, contrasena) {
  const u = await repositorio.buscarPorCorreo(correo);
  const credencialesInvalidas = () => error("Correo o contraseña incorrectos", "credenciales");
  if (!u) throw credencialesInvalidas();

  if (u.estado === "pendiente") throw error("Tu cuenta está pendiente de aprobación por el coordinador", "cuenta_pendiente");
  if (u.estado === "inactivo") throw error("Tu cuenta está desactivada. Contacta al coordinador", "cuenta_inactiva");
  if (u.estado === "bloqueado" && u.bloqueado_hasta && new Date(u.bloqueado_hasta) > new Date())
    throw error("Cuenta bloqueada por intentos fallidos. Intenta más tarde o recupera tu contraseña", "cuenta_bloqueada");

  const valida = await bcrypt.compare(contrasena || "", u.contrasena_hash);
  if (!valida) {
    const intentos = u.intentos_fallidos + 1;
    const bloquear = intentos >= MAX_INTENTOS;
    await repositorio.registrarIntentoFallido(u.id_usuario, intentos, bloquear);
    await auditar(u.id_usuario, "intento_login_fallido");
    if (bloquear) throw error("Cuenta bloqueada por 5 intentos fallidos (15 minutos)", "credenciales");
    throw credencialesInvalidas();
  }

  await repositorio.resetearIntentos(u.id_usuario);
  const token = jwt.sign(
    { id: u.id_usuario, rol: u.rol, nombres: u.nombres, apellidos: u.apellidos, correo: u.correo },
    process.env.JWT_SECRETO,
    { expiresIn: "8h" }
  );
  await auditar(u.id_usuario, "login");
  return {
    token,
    usuario: { id: u.id_usuario, nombres: u.nombres, apellidos: u.apellidos, correo: u.correo, rol: u.rol },
  };
}

// ---- CU-22: Auto-registro (queda pendiente de aprobacion) ----
async function registrar(datos) {
  if (!ROLES_AUTOREGISTRO.includes(datos.rol))
    throw error("Rol inválido: solo aprendiz, instructor o programador", "validacion");
  if (!validarContrasena(datos.contrasena))
    throw error("La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula y un número", "validacion");

  const hash = await bcrypt.hash(datos.contrasena, 10);
  const idUsuario = await repositorio.crearUsuarioPendiente({ ...datos, hash });
  await repositorio.notificarAdminsSolicitud(
    `${datos.nombres} ${datos.apellidos} (${datos.rol}) solicitó una cuenta y espera aprobación.`
  );
  emitirNotificacionAdmins();
  await auditar(idUsuario, "solicitud_registro", "usuario", idUsuario);
}

// ---- CU-02: Recuperar contrasena ----
// Respuesta siempre generica: no revelamos si el correo existe (regla CU-02 A1)
async function solicitarRecuperacion(correo) {
  const u = await repositorio.buscarPorCorreo(correo);
  if (!u) return;
  const token = crypto.randomBytes(32).toString("hex");
  await repositorio.crearTokenRecuperacion(u.id_usuario, token);
  const enlace = `${process.env.URL_FRONTEND}/restablecer/${token}`;
  await enviarCorreo({
    para: correo,
    asunto: "AsistenciaApp · Recupera tu contraseña",
    html: `<p>Hola ${u.nombres},</p>
           <p>Haz clic en el siguiente enlace para restablecer tu contraseña (válido por 1 hora):</p>
           <p><a href="${enlace}">${enlace}</a></p>`,
  });
}

// ---- CU-02: Restablecer con token ----
async function restablecerContrasena(token, contrasena) {
  if (!validarContrasena(contrasena))
    throw error("La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula y un número", "validacion");
  const registro = await repositorio.buscarTokenValido(token);
  if (!registro) throw error("Enlace inválido o expirado. Solicita uno nuevo", "validacion");
  const hash = await bcrypt.hash(contrasena, 10);
  await repositorio.restablecerContrasena(registro.id_usuario, hash);
  await repositorio.marcarTokenUsado(registro.id_token);
  await auditar(registro.id_usuario, "restablecer_contrasena");
}

// ---- CU-03: Ver y actualizar perfil ----
async function obtenerPerfil(idUsuario) {
  return repositorio.obtenerPerfil(idUsuario);
}

async function actualizarPerfil(idUsuario, { telefono, contrasenaActual, contrasenaNueva }) {
  if (contrasenaNueva) {
    const hashActual = await repositorio.obtenerHashContrasena(idUsuario);
    const ok = await bcrypt.compare(contrasenaActual || "", hashActual);
    if (!ok) throw error("La contraseña actual no es correcta", "validacion");
    if (!validarContrasena(contrasenaNueva))
      throw error("La contraseña nueva no cumple los requisitos de seguridad", "validacion");
    const hash = await bcrypt.hash(contrasenaNueva, 10);
    await repositorio.actualizarContrasena(idUsuario, hash);
  }
  if (telefono !== undefined) await repositorio.actualizarTelefono(idUsuario, telefono);
  await auditar(idUsuario, "actualizar_perfil");
}

module.exports = { login, registrar, solicitarRecuperacion, restablecerContrasena, obtenerPerfil, actualizarPerfil };

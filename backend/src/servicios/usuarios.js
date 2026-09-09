const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const repositorio = require("../repositorios/usuarios");
const { enviarCorreo } = require("./correo");
const { auditar } = require("./auditoria");

const ROLES_VALIDOS = ["administrador", "programador", "instructor", "aprendiz"];

function generarContrasenaTemporal() {
  return `Sena${crypto.randomBytes(3).toString("hex")}*1`;
}

async function listar(filtros) {
  return repositorio.listar(filtros);
}

// Crear usuario (contrasena temporal enviada por correo — CU-04)
async function crear(datos, idActor) {
  if (!ROLES_VALIDOS.includes(datos.rol))
    throw Object.assign(new Error("Rol inválido"), { tipo: "validacion" });
  const temporal = generarContrasenaTemporal();
  const hash = await bcrypt.hash(temporal, 10);
  const idUsuario = await repositorio.crear({ ...datos, hash });
  await enviarCorreo({
    para: datos.correo,
    asunto: "AsistenciaApp · Tu cuenta fue creada",
    html: `<p>Hola ${datos.nombres},</p><p>Tu cuenta en AsistenciaApp está lista.</p>
           <p><b>Usuario:</b> ${datos.correo}<br/><b>Contraseña temporal:</b> ${temporal}</p>
           <p>Cámbiala al ingresar por primera vez.</p>`,
  });
  await auditar(idActor, "crear_usuario", "usuario", idUsuario, { rol: datos.rol });
  return idUsuario;
}

async function editar(idUsuario, datos, idActor) {
  await repositorio.editar(idUsuario, datos);
  await auditar(idActor, "editar_usuario", "usuario", Number(idUsuario));
}

// Cambiar estado: aprobar (pendiente->activo), desactivar, reactivar.
// Regla CU-04: no se elimina, solo se desactiva.
async function cambiarEstado(idUsuario, estado, idActor) {
  if (!["activo", "inactivo"].includes(estado))
    throw Object.assign(new Error("Estado inválido"), { tipo: "validacion" });
  const usuario = await repositorio.cambiarEstado(idUsuario, estado);
  if (!usuario) throw Object.assign(new Error("Usuario no encontrado"), { tipo: "no_encontrado" });
  if (estado === "activo") {
    await enviarCorreo({
      para: usuario.correo,
      asunto: "AsistenciaApp · Cuenta aprobada",
      html: `<p>Hola ${usuario.nombres}, tu cuenta fue aprobada. Ya puedes iniciar sesión.</p>`,
    });
  }
  await auditar(idActor, `usuario_${estado}`, "usuario", Number(idUsuario));
}

// CU-06 A1: carga masiva de aprendices (filas JSON desde CSV/Excel del frontend)
async function cargaMasiva(filas, idActor) {
  if (!Array.isArray(filas) || !filas.length)
    throw Object.assign(new Error("No se recibieron filas"), { tipo: "validacion" });
  const resultados = { creados: 0, errores: [] };
  for (const [i, f] of filas.entries()) {
    try {
      if (!f.nombres || !f.apellidos || !f.documento || !f.correo)
        throw new Error("Faltan campos obligatorios (nombres, apellidos, documento, correo)");
      const temporal = generarContrasenaTemporal();
      const hash = await bcrypt.hash(temporal, 10);
      await repositorio.crear({
        nombres: f.nombres, apellidos: f.apellidos, tipoDocumento: "CC",
        documento: String(f.documento), correo: f.correo, telefono: f.telefono || null,
        hash, rol: "aprendiz",
      });
      await enviarCorreo({
        para: f.correo,
        asunto: "AsistenciaApp · Tu cuenta fue creada",
        html: `<p>Hola ${f.nombres}, tu cuenta está lista.<br/><b>Usuario:</b> ${f.correo}<br/><b>Contraseña temporal:</b> ${temporal}</p>`,
      });
      resultados.creados++;
    } catch (e) {
      resultados.errores.push({ fila: i + 1, documento: f.documento, error: e.code === "23505" ? "Correo o documento duplicado" : e.message });
    }
  }
  await auditar(idActor, "carga_masiva_aprendices", "usuario", null, resultados);
  return resultados;
}

module.exports = { listar, crear, editar, cambiarEstado, cargaMasiva };

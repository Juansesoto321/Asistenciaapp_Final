const crypto = require("crypto");
const repositorio = require("../repositorios/academico");
const { auditar } = require("./auditoria");

const ESTADOS_MATRICULA = ["activa", "retirada", "finalizada"];

function error(mensaje, tipo) {
  return Object.assign(new Error(mensaje), { tipo });
}

async function obtenerPeriodos() {
  return repositorio.listarPeriodos();
}

async function obtenerInstructores() {
  return repositorio.listarInstructores();
}

async function obtenerFichas(usuario) {
  return repositorio.listarFichas(usuario);
}

async function crearPeriodo(datos) {
  return repositorio.crearPeriodo(datos);
}

async function crearFicha(datos, usuario) {
  const ficha = await repositorio.crearFicha(datos);
  await auditar(usuario.id, "crear_ficha", "ficha", ficha.id_ficha);
  return ficha;
}

async function obtenerHorarios(usuario) {
  return repositorio.listarHorarios(usuario);
}

async function crearHorario(datos, usuario) {
  const conflicto = await repositorio.buscarConflictoHorario(datos);
  if (conflicto) {
    throw Object.assign(
      new Error(`Conflicto de ${conflicto.tipo}: se cruza con la ficha ${conflicto.numero_ficha} en ese horario`),
      { tipo: "conflicto_horario" }
    );
  }
  const horario = await repositorio.crearHorario(datos);
  await auditar(usuario.id, "crear_horario", "horario", horario.id_horario);
  return horario;
}

async function eliminarHorario(id, usuario) {
  await repositorio.eliminarHorario(id);
  await auditar(usuario.id, "eliminar_horario", "horario", Number(id));
}

// ---------- MATRICULAS (CU-06) ----------
async function obtenerMatriculasDeFicha(idFicha) {
  return repositorio.listarMatriculasDeFicha(idFicha);
}

async function matricularAprendices(idFicha, idsAprendices, usuario) {
  const resultados = { matriculados: 0, errores: [] };
  for (const id of idsAprendices || []) {
    try {
      await repositorio.matricularAprendiz(id, idFicha);
      resultados.matriculados++;
    } catch (e) {
      resultados.errores.push({
        id_aprendiz: id,
        error: e.constraint === "idx_matricula_activa_unica"
          ? "El aprendiz ya tiene una matrícula activa en otra ficha"
          : "Ya está matriculado en esta ficha",
      });
    }
  }
  await auditar(usuario.id, "matricular_aprendices", "ficha", Number(idFicha), resultados);
  return resultados;
}

async function cambiarEstadoMatricula(id, estado, usuario) {
  if (!ESTADOS_MATRICULA.includes(estado)) throw error("Estado inválido", "validacion");
  await repositorio.cambiarEstadoMatricula(id, estado);
  await auditar(usuario.id, "cambiar_matricula", "matricula", Number(id), { estado });
}

// ---------- AMBIENTES Y DISPOSITIVOS (CU-07, CU-09) ----------
async function obtenerAmbientes() {
  return repositorio.listarAmbientes();
}

async function crearAmbiente(datos, usuario) {
  const ambiente = await repositorio.crearAmbiente(datos);
  await auditar(usuario.id, "crear_ambiente", "ambiente", ambiente.id_ambiente);
  return ambiente;
}

// Asociar lector al ambiente: genera la clave API que usara el dispositivo
async function asociarDispositivo(idAmbiente, { serial, modelo }, usuario) {
  const claveApi = crypto.randomBytes(16).toString("hex");
  const dispositivo = await repositorio.crearDispositivo({ idAmbiente, serial, modelo, claveApi });
  await auditar(usuario.id, "registrar_dispositivo", "dispositivo", dispositivo.id_dispositivo);
  // La clave se muestra UNA sola vez, para configurar el lector/simulador
  return { ...dispositivo, clave_api: claveApi };
}

async function obtenerDispositivos() {
  return repositorio.listarDispositivos();
}

module.exports = {
  obtenerPeriodos,
  obtenerInstructores,
  obtenerFichas,
  crearPeriodo,
  crearFicha,
  obtenerHorarios,
  crearHorario,
  eliminarHorario,
  obtenerMatriculasDeFicha,
  matricularAprendices,
  cambiarEstadoMatricula,
  obtenerAmbientes,
  crearAmbiente,
  asociarDispositivo,
  obtenerDispositivos,
};

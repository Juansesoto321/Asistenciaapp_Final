const crypto = require("crypto");
const modelo = require("../modelos/academico");
const { auditar } = require("./auditoria");
const { error } = require("../utilidades/errores");

const ESTADOS_MATRICULA = ["activa", "retirada", "finalizada"];

async function obtenerPeriodos() {
  return modelo.listarPeriodos();
}

async function obtenerInstructores() {
  return modelo.listarInstructores();
}

async function obtenerFichas(usuario) {
  return modelo.listarFichas(usuario);
}

async function crearPeriodo(datos) {
  return modelo.crearPeriodo(datos);
}

async function crearFicha(datos, usuario) {
  const ficha = await modelo.crearFicha(datos);
  await auditar(usuario.id, "crear_ficha", "ficha", ficha.id_ficha);
  return ficha;
}

async function obtenerHorarios(usuario, filtros) {
  return modelo.listarHorarios(usuario, filtros);
}

/** Valida lo mínimo antes de ir a la base de datos, con mensajes claros. */
function validarHorario(h) {
  if (!h.id_ficha || !h.id_ambiente || !h.id_instructor || !h.id_periodo)
    throw error("Selecciona ficha, ambiente, instructor y periodo", "validacion");
  const dia = Number(h.dia_semana);
  if (h.dia_semana === "" || h.dia_semana === null || !Number.isInteger(dia) || dia < 0 || dia > 6)
    throw error("Selecciona un día de la semana válido", "validacion");
  if (!h.hora_inicio || !h.hora_fin) throw error("Indica la hora de inicio y la hora de fin", "validacion");
  // Formato HH:MM(:SS) con ceros a la izquierda: la comparación de texto sirve
  if (String(h.hora_fin) <= String(h.hora_inicio))
    throw error("La hora de fin debe ser posterior a la hora de inicio", "validacion");
}

function errorDeConflicto(conflicto) {
  return error(
    `Conflicto de ${conflicto.tipo}: se cruza con la ficha ${conflicto.numero_ficha} en ese horario`,
    "conflicto_horario"
  );
}

async function crearHorario(datos, usuario) {
  validarHorario(datos);
  const conflicto = await modelo.buscarConflictoHorario(datos);
  if (conflicto) throw errorDeConflicto(conflicto);
  const horario = await modelo.crearHorario(datos);
  await auditar(usuario.id, "crear_horario", "horario", horario.id_horario);
  return horario;
}

async function editarHorario(id, datos, usuario) {
  const actual = await modelo.buscarHorario(id);
  if (!actual) throw error("Horario no encontrado", "no_encontrado");

  // Campos no enviados conservan su valor actual
  const nuevo = {
    id_ficha: datos.id_ficha ?? actual.id_ficha,
    id_ambiente: datos.id_ambiente ?? actual.id_ambiente,
    id_instructor: datos.id_instructor ?? actual.id_instructor,
    id_periodo: datos.id_periodo ?? actual.id_periodo,
    dia_semana: datos.dia_semana ?? actual.dia_semana,
    hora_inicio: datos.hora_inicio ?? actual.hora_inicio,
    hora_fin: datos.hora_fin ?? actual.hora_fin,
    id_rap: datos.id_rap !== undefined ? datos.id_rap : actual.id_rap,
    id_tematica: datos.id_tematica !== undefined ? datos.id_tematica : actual.id_tematica,
  };

  validarHorario(nuevo);
  const conflicto = await modelo.buscarConflictoHorario(nuevo, Number(id));
  if (conflicto) throw errorDeConflicto(conflicto);

  const horario = await modelo.editarHorario(id, nuevo);
  await auditar(usuario.id, "editar_horario", "horario", Number(id), nuevo);
  return horario;
}

async function eliminarHorario(id, usuario) {
  const eliminado = await modelo.eliminarHorario(id);
  if (!eliminado) throw error("Horario no encontrado", "no_encontrado");
  await auditar(usuario.id, "eliminar_horario", "horario", Number(id));
}

// ---------- MATRICULAS (CU-06) ----------
// La lista trae documento y correo de cada aprendiz: el instructor solo ve
// las fichas donde es titular o dicta alguna clase (RNF-06).
async function obtenerMatriculasDeFicha(idFicha, usuario) {
  if (usuario.rol === "instructor" && !(await modelo.instructorDictaEnFicha(idFicha, usuario.id)))
    throw error("Solo puedes ver las fichas donde eres instructor", "prohibido");
  return modelo.listarMatriculasDeFicha(idFicha);
}

function motivoMatriculaFallida(e) {
  if (e.constraint === "idx_matricula_activa_unica") return "El aprendiz ya tiene una matrícula activa en otra ficha";
  if (e.code === "23505") return "Ya está matriculado en esta ficha";
  if (e.code === "23503") return "La ficha no existe";
  return null;
}

async function matricularAprendices(idFicha, idsAprendices, usuario) {
  if (!Array.isArray(idsAprendices) || !idsAprendices.length)
    throw error("Selecciona al menos un aprendiz", "validacion");
  const resultados = { matriculados: 0, errores: [] };
  for (const id of idsAprendices) {
    try {
      const matriculado = await modelo.matricularAprendiz(id, idFicha);
      if (!matriculado) {
        resultados.errores.push({ id_aprendiz: id, error: "El usuario no existe o no es aprendiz" });
        continue;
      }
      resultados.matriculados++;
    } catch (e) {
      const motivo = motivoMatriculaFallida(e);
      if (!motivo) throw e; // error inesperado: que lo registre el manejador central
      resultados.errores.push({ id_aprendiz: id, error: motivo });
    }
  }
  await auditar(usuario.id, "matricular_aprendices", "ficha", Number(idFicha), resultados);
  return resultados;
}

async function cambiarEstadoMatricula(id, estado, usuario) {
  if (!ESTADOS_MATRICULA.includes(estado)) throw error("Estado inválido", "validacion");
  const actualizada = await modelo.cambiarEstadoMatricula(id, estado);
  if (!actualizada) throw error("Matrícula no encontrada", "no_encontrado");
  await auditar(usuario.id, "cambiar_matricula", "matricula", Number(id), { estado });
}

// ---------- AMBIENTES Y DISPOSITIVOS (CU-07, CU-09) ----------
async function obtenerAmbientes() {
  return modelo.listarAmbientes();
}

async function crearAmbiente(datos, usuario) {
  const ambiente = await modelo.crearAmbiente(datos);
  await auditar(usuario.id, "crear_ambiente", "ambiente", ambiente.id_ambiente);
  return ambiente;
}

// Asociar lector al ambiente: genera la clave API que usara el dispositivo
async function asociarDispositivo(idAmbiente, { serial, modelo: modeloLector }, usuario) {
  const claveApi = crypto.randomBytes(16).toString("hex");
  const dispositivo = await modelo.crearDispositivo({ idAmbiente, serial, modelo: modeloLector, claveApi });
  await auditar(usuario.id, "registrar_dispositivo", "dispositivo", dispositivo.id_dispositivo);
  // La clave se muestra UNA sola vez, para configurar el lector/simulador
  return { ...dispositivo, clave_api: claveApi };
}

async function obtenerDispositivos() {
  return modelo.listarDispositivos();
}

module.exports = {
  obtenerPeriodos,
  obtenerInstructores,
  obtenerFichas,
  crearPeriodo,
  crearFicha,
  obtenerHorarios,
  crearHorario,
  editarHorario,
  eliminarHorario,
  obtenerMatriculasDeFicha,
  matricularAprendices,
  cambiarEstadoMatricula,
  obtenerAmbientes,
  crearAmbiente,
  asociarDispositivo,
  obtenerDispositivos,
};

const repositorio = require("../repositorios/academico");
const { auditar } = require("./auditoria");

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

module.exports = {
  obtenerPeriodos,
  obtenerInstructores,
  obtenerFichas,
  crearPeriodo,
  crearFicha,
  obtenerHorarios,
  crearHorario,
  eliminarHorario,
};

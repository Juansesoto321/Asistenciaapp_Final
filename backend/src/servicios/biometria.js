const modelo = require("../modelos/biometria");
const { enTransaccion } = require("../modelos/transaccion");
const { cifrar, generarTemplateSimulado } = require("./cifrado");
const { auditar } = require("./auditoria");
const { emitirNotificacionNueva } = require("./tiempoReal");
const { error } = require("../utilidades/errores");

const TEXTO_CONSENTIMIENTO = `Autorizo al SENA el tratamiento de mi huella dactilar con la única finalidad de
registrar mi asistencia a las actividades de formación, conforme a la Ley 1581 de 2012.
Entiendo que: (1) solo se almacena una plantilla matemática cifrada, nunca la imagen de mi huella;
(2) puedo revocar este consentimiento y solicitar la eliminación de mis datos biométricos en cualquier
momento; (3) mis registros de asistencia se conservarán con fines académicos.`;

function obtenerTextoConsentimiento() {
  return { version: "v1.0", texto: TEXTO_CONSENTIMIENTO };
}

// El estado biométrico es un dato sensible (Ley 1581): solo lo ve el propio
// aprendiz o el personal que gestiona la asistencia.
async function obtenerEstado(idAprendiz, usuario) {
  if (usuario.rol === "aprendiz" && usuario.id !== idAprendiz)
    throw error("No tienes permisos para consultar este dato", "prohibido");
  return modelo.obtenerEstado(idAprendiz);
}

/**
 * CU-10: Enrollment. Flujo: consentimiento -> doble captura -> template cifrado.
 * En modo simulado, "lectura1" y "lectura2" las produce el simulador de enrolador
 * (equivalen a las dos pasadas del dedo por el ZK9500).
 */
async function enrolar({ idAprendiz, aceptaConsentimiento, lectura1, lectura2 }, usuario) {
  if (!(await modelo.esAprendiz(idAprendiz))) throw error("Solo se registra la huella de aprendices", "validacion");
  if (usuario.rol === "instructor" && !(await modelo.esAprendizDeInstructor(idAprendiz, usuario.id)))
    throw error("Solo puedes registrar la huella de aprendices de tus fichas", "prohibido");
  if (!aceptaConsentimiento)
    throw error("El aprendiz no aceptó el consentimiento. Deberá usar registro manual", "validacion");
  if (!lectura1 || lectura1 !== lectura2)
    throw error("Las dos capturas no coinciden. Intenta nuevamente (máximo 3 intentos)", "validacion");
  if (await modelo.existePlantilla(idAprendiz))
    throw error("El aprendiz ya tiene una huella registrada. Elimínala primero para re-enrolar", "validacion");

  await enTransaccion(async (cliente) => {
    const idConsentimiento = await modelo.insertarConsentimiento(cliente, idAprendiz);
    const template = generarTemplateSimulado(lectura1);
    const cifrado = cifrar(template);
    await modelo.insertarPlantilla(cliente, { idAprendiz, cifrado, idConsentimiento });
  });
  await auditar(usuario.id, "enrollment_biometrico", "usuario", idAprendiz);
}

/**
 * CU-11: Derecho al borrado. Elimina la plantilla, conserva historial de asistencia.
 */
async function eliminar(idAprendiz, idUsuarioActor) {
  // Borrado, revocación y aviso van juntos: si algo falla no queda a medias
  await enTransaccion(async (cliente) => {
    const idConsentimiento = await modelo.eliminarPlantilla(cliente, idAprendiz);
    if (!idConsentimiento)
      throw error("El aprendiz no tiene datos biométricos", "no_encontrado");
    await modelo.revocarConsentimiento(cliente, idConsentimiento);
    await modelo.notificarBorrado(cliente, idAprendiz);
  });
  emitirNotificacionNueva(idAprendiz);
  await auditar(idUsuarioActor, "eliminar_datos_biometricos", "usuario", idAprendiz);
}

module.exports = { obtenerTextoConsentimiento, obtenerEstado, enrolar, eliminar };

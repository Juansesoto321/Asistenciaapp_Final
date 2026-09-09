const repositorio = require("../repositorios/biometria");
const { enTransaccion } = require("../repositorios/transaccion");
const { cifrar, generarTemplateSimulado } = require("./cifrado");
const { auditar } = require("./auditoria");
const { emitirNotificacionNueva } = require("./tiempoReal");

const TEXTO_CONSENTIMIENTO = `Autorizo al SENA el tratamiento de mi huella dactilar con la única finalidad de
registrar mi asistencia a las actividades de formación, conforme a la Ley 1581 de 2012.
Entiendo que: (1) solo se almacena una plantilla matemática cifrada, nunca la imagen de mi huella;
(2) puedo revocar este consentimiento y solicitar la eliminación de mis datos biométricos en cualquier
momento; (3) mis registros de asistencia se conservarán con fines académicos.`;

function obtenerTextoConsentimiento() {
  return { version: "v1.0", texto: TEXTO_CONSENTIMIENTO };
}

async function obtenerEstado(idAprendiz) {
  return repositorio.obtenerEstado(idAprendiz);
}

/**
 * CU-10: Enrollment. Flujo: consentimiento -> doble captura -> template cifrado.
 * En modo simulado, "lectura1" y "lectura2" las produce el simulador de enrolador
 * (equivalen a las dos pasadas del dedo por el ZK9500).
 */
async function enrolar({ idAprendiz, aceptaConsentimiento, lectura1, lectura2 }, idUsuarioActor) {
  if (!aceptaConsentimiento)
    throw Object.assign(new Error("El aprendiz no aceptó el consentimiento. Deberá usar registro manual"), { tipo: "validacion" });
  if (!lectura1 || lectura1 !== lectura2)
    throw Object.assign(new Error("Las dos capturas no coinciden. Intenta nuevamente (máximo 3 intentos)"), { tipo: "validacion" });
  if (await repositorio.existePlantilla(idAprendiz))
    throw Object.assign(new Error("El aprendiz ya tiene una huella registrada. Elimínala primero para re-enrolar"), { tipo: "validacion" });

  await enTransaccion(async (cliente) => {
    const idConsentimiento = await repositorio.insertarConsentimiento(cliente, idAprendiz);
    const template = generarTemplateSimulado(lectura1);
    const cifrado = cifrar(template);
    await repositorio.insertarPlantilla(cliente, { idAprendiz, cifrado, idConsentimiento });
  });
  await auditar(idUsuarioActor, "enrollment_biometrico", "usuario", idAprendiz);
}

/**
 * CU-11: Derecho al borrado. Elimina la plantilla, conserva historial de asistencia.
 */
async function eliminar(idAprendiz, idUsuarioActor) {
  const idConsentimiento = await repositorio.eliminarPlantilla(idAprendiz);
  if (!idConsentimiento)
    throw Object.assign(new Error("El aprendiz no tiene datos biométricos"), { tipo: "no_encontrado" });
  await repositorio.revocarConsentimiento(idConsentimiento);
  await repositorio.notificarBorrado(idAprendiz);
  emitirNotificacionNueva(idAprendiz);
  await auditar(idUsuarioActor, "eliminar_datos_biometricos", "usuario", idAprendiz);
}

module.exports = { obtenerTextoConsentimiento, obtenerEstado, enrolar, eliminar };
